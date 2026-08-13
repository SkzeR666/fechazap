alter table public.webhook_events
  add column if not exists processing_started_at timestamptz,
  add column if not exists attempts integer not null default 0,
  add column if not exists last_error text;

create or replace function public.claim_webhook_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_payload jsonb
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare claimed boolean := false;
begin
  insert into public.webhook_events(provider,event_id,event_type,payload)
  values(p_provider,p_event_id,p_event_type,p_payload)
  on conflict(provider,event_id) do nothing;

  update public.webhook_events
  set processing_started_at=now(), attempts=attempts+1, last_error=null
  where provider=p_provider and event_id=p_event_id and processed_at is null
    and (processing_started_at is null or processing_started_at < now()-interval '5 minutes')
  returning true into claimed;

  return coalesce(claimed,false);
end $$;

revoke all on function public.claim_webhook_event(text,text,text,jsonb) from public;
grant execute on function public.claim_webhook_event(text,text,text,jsonb) to service_role;
