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
    update public.quotes set title=service_row.name, subtotal_cents=coalesce(service_row.price_cents,0) where id=quote_row.id;
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
    viewed_at=case when next_status='viewed' then coalesce(viewed_at, now()) else viewed_at end,
    loss_reason=case
      when next_status in ('cancelled','declined') then coalesce(transition_reason, loss_reason)
      else loss_reason
    end
    where id=quote_id;
  insert into public.quote_events(quote_id,actor_id,event_type,from_status,to_status,metadata)
    values(quote_id,auth.uid(),'status_changed',current_row.status,next_status,jsonb_build_object('reason',transition_reason));
  return jsonb_build_object('id',quote_id,'status',next_status);
end $$;

revoke all on function public.create_quote_request(text,jsonb) from public;
revoke all on function public.transition_quote(uuid,public.quote_status,text) from public;
grant execute on function public.create_quote_request(text,jsonb) to service_role;
grant execute on function public.transition_quote(uuid,public.quote_status,text) to authenticated;
