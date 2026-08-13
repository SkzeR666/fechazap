create extension if not exists pgcrypto;

create type public.plan_code as enum ('free', 'solo', 'pro');
create type public.quote_status as enum ('requested','draft','sent','viewed','accepted','contracted','awaiting_payment','paid','scheduled','completed','cancelled');
create type public.payment_status as enum ('pending','paid','cancelled','refunded');
create type public.appointment_status as enum ('offered','selected','confirmed','completed','cancelled');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,47}$'),
  business_name text not null check (char_length(business_name) between 2 and 120),
  bio text check (char_length(bio) <= 500),
  logo_url text,
  brand_color text check (brand_color is null or brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  whatsapp text,
  pix_key text,
  plan public.plan_code not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text check (char_length(description) <= 1000),
  price_cents integer check (price_cents is null or price_cents >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  unique (user_id, phone)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  public_token uuid not null unique default gen_random_uuid(),
  status public.quote_status not null default 'requested',
  title text,
  message text,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer generated always as (greatest(0, subtotal_cents - discount_cents)) stored,
  expires_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  sort_order integer not null default 0
);

create table public.acceptances (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null unique references public.quotes(id) on delete restrict,
  accepter_name text not null,
  cpf_ciphertext text not null,
  cpf_hash text not null,
  cpf_last4 char(4) not null,
  source_ip inet,
  source_user_agent text,
  accepted_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete restrict,
  status public.payment_status not null default 'pending',
  provider text not null default 'manual_pix' check (provider in ('manual_pix','mercado_pago')),
  provider_reference text,
  amount_cents integer not null check (amount_cents > 0),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  starts_at timestamptz not null,
  status public.appointment_status not null default 'offered',
  selected_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.quote_events (
  id bigint generated always as identity primary key,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status public.quote_status,
  to_status public.quote_status,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index services_user_active_idx on public.services(user_id, active, sort_order);
create index customers_user_created_idx on public.customers(user_id, created_at desc);
create index quotes_user_status_created_idx on public.quotes(user_id, status, created_at desc);
create index quote_events_quote_created_idx on public.quote_events(quote_id, created_at);
create index appointments_quote_starts_idx on public.appointments(quote_id, starts_at);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger services_updated before update on public.services for each row execute function public.set_updated_at();
create trigger quotes_updated before update on public.quotes for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.acceptances enable row level security;
alter table public.payments enable row level security;
alter table public.appointments enable row level security;
alter table public.quote_events enable row level security;

create policy owner_profiles on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_services on public.services for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_customers on public.customers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_quotes on public.quotes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy owner_quote_items on public.quote_items for all using (exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid())) with check (exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid()));
create policy owner_acceptances on public.acceptances for select using (exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid()));
create policy owner_payments on public.payments for all using (exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid())) with check (exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid()));
create policy owner_appointments on public.appointments for all using (exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid())) with check (exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid()));
create policy owner_quote_events on public.quote_events for select using (exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid()));

create or replace function public.get_public_profile(requested_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'slug', p.slug, 'businessName', p.business_name, 'bio', p.bio,
    'logoUrl', p.logo_url, 'brandColor', p.brand_color, 'whatsapp', p.whatsapp,
    'showBranding', p.plan = 'free',
    'services', coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'description',s.description,'priceCents',s.price_cents) order by s.sort_order) from public.services s where s.user_id=p.user_id and s.active), '[]'::jsonb)
  ) from public.profiles p where p.slug = lower(requested_slug);
$$;

create or replace function public.create_quote_request(requested_slug text, payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare provider_id uuid; customer_row public.customers; quote_row public.quotes; service_row public.services; monthly_count integer;
begin
  select user_id into provider_id from public.profiles where slug=lower(requested_slug);
  if provider_id is null then raise exception 'profile_not_found'; end if;
  select count(*) into monthly_count from public.quotes where user_id=provider_id and created_at >= date_trunc('month', now());
  if (select plan='free' from public.profiles where user_id=provider_id) and monthly_count >= 3 then raise exception 'monthly_limit_reached'; end if;
  insert into public.customers(user_id,name,phone,email) values(provider_id,payload#>>'{customer,name}',payload#>>'{customer,phone}',payload#>>'{customer,email}')
    on conflict(user_id,phone) do update set name=excluded.name,email=coalesce(excluded.email,customers.email) returning * into customer_row;
  insert into public.quotes(user_id,customer_id,message) values(provider_id,customer_row.id,payload->>'message') returning * into quote_row;
  if payload->>'serviceId' is not null then
    select * into service_row from public.services where id=(payload->>'serviceId')::uuid and user_id=provider_id and active;
    if service_row.id is null then raise exception 'service_not_found'; end if;
    insert into public.quote_items(quote_id,service_id,description,unit_price_cents,total_cents) values(quote_row.id,service_row.id,service_row.name,coalesce(service_row.price_cents,0),coalesce(service_row.price_cents,0));
    update public.quotes set subtotal_cents=coalesce(service_row.price_cents,0) where id=quote_row.id;
  end if;
  insert into public.quote_events(quote_id,event_type,to_status) values(quote_row.id,'quote_requested','requested');
  return jsonb_build_object('id',quote_row.id,'publicToken',quote_row.public_token,'status',quote_row.status);
end $$;

create or replace function public.transition_quote(quote_id uuid, next_status public.quote_status, transition_reason text default null)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare current_row public.quotes; allowed boolean;
begin
  select * into current_row from public.quotes where id=quote_id and user_id=auth.uid() for update;
  if current_row.id is null then raise exception 'quote_not_found'; end if;
  allowed := case current_row.status
    when 'requested' then next_status in ('draft','cancelled') when 'draft' then next_status in ('sent','cancelled')
    when 'sent' then next_status in ('viewed','accepted','cancelled') when 'viewed' then next_status in ('accepted','cancelled')
    when 'accepted' then next_status in ('contracted','cancelled') when 'contracted' then next_status in ('awaiting_payment','cancelled')
    when 'awaiting_payment' then next_status in ('paid','cancelled') when 'paid' then next_status='scheduled'
    when 'scheduled' then next_status in ('completed','cancelled') else false end;
  if not allowed then raise exception 'transition_not_allowed'; end if;
  update public.quotes set status=next_status, sent_at=case when next_status='sent' then now() else sent_at end where id=quote_id;
  insert into public.quote_events(quote_id,actor_id,event_type,from_status,to_status,metadata) values(quote_id,auth.uid(),'status_changed',current_row.status,next_status,jsonb_build_object('reason',transition_reason));
  return jsonb_build_object('id',quote_id,'status',next_status);
end $$;

create or replace function public.accept_quote(p_public_token uuid, accepter_name text, cpf_ciphertext text, cpf_hash text, cpf_last4 text, source_ip inet, source_user_agent text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare quote_row public.quotes;
begin
  select * into quote_row from public.quotes where quotes.public_token=p_public_token for update;
  if quote_row.id is null then raise exception 'quote_not_found'; end if;
  if quote_row.status not in ('sent','viewed') then raise exception 'quote_not_acceptable'; end if;
  if quote_row.expires_at is not null and quote_row.expires_at < now() then raise exception 'quote_expired'; end if;
  insert into public.acceptances(quote_id,accepter_name,cpf_ciphertext,cpf_hash,cpf_last4,source_ip,source_user_agent) values(quote_row.id,accepter_name,cpf_ciphertext,cpf_hash,cpf_last4,source_ip,source_user_agent);
  update public.quotes set status='accepted' where id=quote_row.id;
  insert into public.quote_events(quote_id,event_type,from_status,to_status) values(quote_row.id,'quote_accepted',quote_row.status,'accepted');
  return jsonb_build_object('quoteId',quote_row.id,'status','accepted','acceptedAt',now());
end $$;

revoke all on function public.create_quote_request(text,jsonb) from public;
revoke all on function public.accept_quote(uuid,text,text,text,text,inet,text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated, service_role;
grant execute on function public.create_quote_request(text,jsonb) to service_role;
grant execute on function public.accept_quote(uuid,text,text,text,text,inet,text) to service_role;
grant execute on function public.transition_quote(uuid,public.quote_status,text) to authenticated;
