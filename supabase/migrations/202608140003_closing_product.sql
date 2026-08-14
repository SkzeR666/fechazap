alter table public.quotes
  add column if not exists payment_mode text not null default 'full'
    check (payment_mode in ('none','deposit','full')),
  add column if not exists deposit_cents integer not null default 0 check (deposit_cents >= 0),
  add column if not exists scheduling_mode text not null default 'client_picks'
    check (scheduling_mode in ('client_picks','now','later')),
  add column if not exists loss_reason text;

alter table public.services
  add column if not exists duration_minutes integer,
  add column if not exists default_deposit_cents integer;

create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time,
  end_time time,
  enabled boolean not null default true
);

create table if not exists public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text
);

create table if not exists public.closing_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  kind text not null,
  body text not null,
  unique (user_id, kind)
);

create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  body text,
  quote_id uuid references public.quotes(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.closing_templates enable row level security;
alter table public.message_templates enable row level security;
alter table public.in_app_notifications enable row level security;

create policy "own availability_rules" on public.availability_rules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own availability_exceptions" on public.availability_exceptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own closing_templates" on public.closing_templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own message_templates" on public.message_templates
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own in_app_notifications" on public.in_app_notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.transition_quote(quote_id uuid, next_status public.quote_status, transition_reason text default null)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare current_row public.quotes; allowed boolean;
begin
  select * into current_row from public.quotes where id=quote_id and user_id=auth.uid() for update;
  if current_row.id is null then raise exception 'quote_not_found'; end if;
  allowed := case current_row.status
    when 'requested' then next_status in ('draft','sent','cancelled','declined')
    when 'draft' then next_status in ('sent','cancelled')
    when 'sent' then next_status in ('viewed','accepted','cancelled','expired','declined')
    when 'viewed' then next_status in ('accepted','cancelled','expired','declined')
    when 'accepted' then next_status in ('contracted','awaiting_payment','scheduling_pending','cancelled')
    when 'contracted' then next_status in ('awaiting_payment','scheduling_pending','cancelled')
    when 'awaiting_payment' then next_status in ('partially_paid','paid','cancelled','expired')
    when 'partially_paid' then next_status in ('paid','cancelled','refunded')
    when 'paid' then next_status in ('scheduling_pending','scheduled','refunded')
    when 'scheduling_pending' then next_status in ('scheduled','cancelled')
    when 'scheduled' then next_status in ('in_progress','completed','cancelled')
    when 'in_progress' then next_status in ('completed','cancelled')
    else false end;
  if not allowed then raise exception 'transition_not_allowed'; end if;
  update public.quotes set
    status=next_status,
    sent_at=case when next_status='sent' then now() else sent_at end,
    viewed_at=case when next_status='viewed' then coalesce(viewed_at, now()) else viewed_at end
    where id=quote_id;
  insert into public.quote_events(quote_id,actor_id,event_type,from_status,to_status,metadata)
    values(quote_id,auth.uid(),'status_changed',current_row.status,next_status,jsonb_build_object('reason',transition_reason));
  return jsonb_build_object('id',quote_id,'status',next_status);
end $$;
