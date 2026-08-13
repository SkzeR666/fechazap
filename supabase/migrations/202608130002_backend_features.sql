create type public.subscription_status as enum ('pending','active','past_due','cancelled');
create type public.document_kind as enum ('logo','attachment','contract','quote_pdf');

alter table public.quotes add column if not exists contract_terms text;
alter table public.quotes add column if not exists contract_generated_at timestamptz;
alter table public.payments add column if not exists external_reference text;
alter table public.payments add column if not exists raw_status text;
alter table public.payments add column if not exists updated_at timestamptz not null default now();
alter table public.payments add constraint payments_provider_reference_unique unique(provider,provider_reference);

create table public.documents (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(user_id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete cascade, kind public.document_kind not null,
  object_key text not null unique, content_type text not null, size_bytes bigint check(size_bytes is null or size_bytes between 0 and 15728640),
  created_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(user_id) on delete cascade,
  provider text not null default 'mercado_pago', provider_reference text unique, plan public.plan_code not null,
  status public.subscription_status not null default 'pending', current_period_end timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.webhook_events (
  provider text not null, event_id text not null, event_type text not null, payload jsonb not null,
  processed_at timestamptz, created_at timestamptz not null default now(), primary key(provider,event_id)
);
create table public.reminders (
  id uuid primary key default gen_random_uuid(), quote_id uuid not null references public.quotes(id) on delete cascade,
  kind text not null check(kind in ('quote_expiring','payment_pending','appointment_upcoming')),
  due_at timestamptz not null, delivered_at timestamptz, attempts integer not null default 0,
  created_at timestamptz not null default now(), unique(quote_id,kind,due_at)
);
create table public.api_rate_limits (
  key text not null, window_start timestamptz not null, hits integer not null default 1,
  primary key(key,window_start)
);
create index reminders_due_idx on public.reminders(due_at) where delivered_at is null;

create or replace function public.enforce_monthly_quote_limit() returns trigger language plpgsql set search_path=public as $$
declare current_plan public.plan_code; monthly_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
  select plan into current_plan from public.profiles where user_id=new.user_id;
  if current_plan='free' then
    select count(*) into monthly_count from public.quotes where user_id=new.user_id and created_at>=date_trunc('month',now());
    if monthly_count>=3 then raise exception 'monthly_limit_reached' using errcode='P0001'; end if;
  end if;
  return new;
end $$;
create trigger quotes_monthly_limit before insert on public.quotes for each row execute function public.enforce_monthly_quote_limit();

create or replace function public.schedule_quote_reminders() returns trigger language plpgsql set search_path=public as $$
begin
  if new.status='sent' and old.status is distinct from new.status then
    insert into public.reminders(quote_id,kind,due_at) values(new.id,'quote_expiring',coalesce(new.expires_at,now()+interval '3 days')-interval '1 day') on conflict do nothing;
  elsif new.status='awaiting_payment' and old.status is distinct from new.status then
    insert into public.reminders(quote_id,kind,due_at) values(new.id,'payment_pending',now()+interval '1 day') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger quotes_schedule_reminders after update of status on public.quotes for each row execute function public.schedule_quote_reminders();

create or replace function public.schedule_appointment_reminder() returns trigger language plpgsql set search_path=public as $$
begin
  if new.status='selected' and old.status is distinct from new.status then
    insert into public.reminders(quote_id,kind,due_at) values(new.quote_id,'appointment_upcoming',new.starts_at-interval '1 day') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger appointments_schedule_reminder after update of status on public.appointments for each row execute function public.schedule_appointment_reminder();

alter table public.documents enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;
alter table public.reminders enable row level security;
alter table public.api_rate_limits enable row level security;
create policy owner_documents on public.documents for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy owner_subscriptions on public.subscriptions for select using(auth.uid()=user_id);
create policy owner_reminders on public.reminders for select using(exists(select 1 from public.quotes q where q.id=quote_id and q.user_id=auth.uid()));
create policy owner_reminders_update on public.reminders for update using(exists(select 1 from public.quotes q where q.id=quote_id and q.user_id=auth.uid())) with check(exists(select 1 from public.quotes q where q.id=quote_id and q.user_id=auth.uid()));

create or replace function public.consume_rate_limit(p_key text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare bucket timestamptz; current_hits integer;
begin
 bucket:=to_timestamp(floor(extract(epoch from now())/p_window_seconds)*p_window_seconds);
 insert into public.api_rate_limits(key,window_start,hits) values(p_key,bucket,1)
 on conflict(key,window_start) do update set hits=api_rate_limits.hits+1 returning hits into current_hits;
 delete from public.api_rate_limits where window_start<now()-interval '1 day';
 return coalesce(current_hits,1)<=p_limit;
end $$;

create or replace function public.recalculate_quote(p_quote_id uuid) returns public.quotes language plpgsql security invoker set search_path=public as $$
declare result public.quotes;
begin
  update public.quotes q set subtotal_cents=coalesce((select sum(round(i.quantity*i.unit_price_cents))::int from public.quote_items i where i.quote_id=q.id),0)
  where q.id=p_quote_id and q.user_id=auth.uid() and q.status in ('requested','draft') returning * into result;
  if result.id is null then raise exception 'quote_not_editable'; end if;
  return result;
end $$;

create or replace function public.replace_quote_items(p_quote_id uuid,p_title text,p_discount_cents integer,p_expires_at timestamptz,p_items jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare q public.quotes; item jsonb;
begin
  select * into q from public.quotes where id=p_quote_id and user_id=auth.uid() and status in ('requested','draft') for update;
  if q.id is null then raise exception 'quote_not_editable'; end if;
  delete from public.quote_items where quote_id=p_quote_id;
  for item in select * from jsonb_array_elements(p_items) loop
    insert into public.quote_items(quote_id,service_id,description,quantity,unit_price_cents,total_cents,sort_order)
    values(p_quote_id,nullif(item->>'serviceId','')::uuid,item->>'description',(item->>'quantity')::numeric,(item->>'unitPriceCents')::int,round((item->>'quantity')::numeric*(item->>'unitPriceCents')::int),(item->>'sortOrder')::int);
  end loop;
  update public.quotes set title=p_title,discount_cents=greatest(0,p_discount_cents),expires_at=p_expires_at,
    subtotal_cents=coalesce((select sum(total_cents) from public.quote_items where quote_id=p_quote_id),0),status='draft' where id=p_quote_id returning * into q;
  insert into public.quote_events(quote_id,actor_id,event_type,metadata) values(p_quote_id,auth.uid(),'quote_updated',jsonb_build_object('items',jsonb_array_length(p_items)));
  return to_jsonb(q);
end $$;

create or replace function public.confirm_manual_payment(p_quote_id uuid) returns jsonb language plpgsql security invoker set search_path=public as $$
declare q public.quotes; payment_id uuid;
begin
 select * into q from public.quotes where id=p_quote_id and user_id=auth.uid() and status='awaiting_payment' for update;
 if q.id is null then raise exception 'payment_not_confirmable'; end if;
 insert into public.payments(quote_id,status,provider,amount_cents,paid_at) values(q.id,'paid','manual_pix',q.total_cents,now()) returning id into payment_id;
 update public.quotes set status='paid' where id=q.id;
 insert into public.quote_events(quote_id,actor_id,event_type,from_status,to_status) values(q.id,auth.uid(),'manual_payment_confirmed','awaiting_payment','paid');
 return jsonb_build_object('paymentId',payment_id,'quoteId',q.id,'status','paid');
end $$;

create or replace function public.select_appointment(p_public_token uuid,p_appointment_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare q public.quotes; a public.appointments;
begin
 select * into q from public.quotes where public_token=p_public_token and status='paid' for update;
 select * into a from public.appointments where id=p_appointment_id and quote_id=q.id and status='offered' for update;
 if a.id is null then raise exception 'slot_unavailable'; end if;
 update public.appointments set status='cancelled' where quote_id=q.id and status='offered' and id<>a.id;
 update public.appointments set status='selected',selected_at=now() where id=a.id;
 update public.quotes set status='scheduled' where id=q.id;
 insert into public.quote_events(quote_id,event_type,from_status,to_status,metadata) values(q.id,'appointment_selected','paid','scheduled',jsonb_build_object('appointmentId',a.id));
 return jsonb_build_object('appointmentId',a.id,'startsAt',a.starts_at,'status','selected');
end $$;

grant execute on function public.replace_quote_items(uuid,text,integer,timestamptz,jsonb) to authenticated;
grant execute on function public.confirm_manual_payment(uuid) to authenticated;
grant execute on function public.select_appointment(uuid,uuid) to service_role;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
