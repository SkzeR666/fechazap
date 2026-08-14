create or replace function public.get_public_quote(p_public_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare q public.quotes;
begin
  select * into q from public.quotes where public_token = p_public_token;
  if q.id is null then raise exception 'quote_not_found'; end if;
  if q.status = 'sent' then
    update public.quotes set status = 'viewed', viewed_at = now() where id = q.id;
    insert into public.quote_events(quote_id, event_type, from_status, to_status)
      values (q.id, 'quote_viewed', 'sent', 'viewed');
    q.status := 'viewed';
    q.viewed_at := now();
  end if;
  return jsonb_build_object(
    'id', q.id,
    'status', q.status,
    'title', q.title,
    'message', q.message,
    'subtotalCents', q.subtotal_cents,
    'discountCents', q.discount_cents,
    'totalCents', q.total_cents,
    'expiresAt', q.expires_at,
    'contractTerms', q.contract_terms,
    'provider', (
      select jsonb_build_object(
        'businessName', p.business_name,
        'slug', p.slug,
        'logoUrl', p.logo_url,
        'brandColor', p.brand_color,
        'pixKey', p.pix_key,
        'whatsapp', p.whatsapp
      ) from public.profiles p where p.user_id = q.user_id
    ),
    'customer', (
      select jsonb_build_object('name', c.name) from public.customers c where c.id = q.customer_id
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'description', i.description,
        'quantity', i.quantity,
        'unitPriceCents', i.unit_price_cents,
        'totalCents', i.total_cents
      ) order by i.sort_order)
      from public.quote_items i where i.quote_id = q.id
    ), '[]'::jsonb),
    'acceptance', (
      select jsonb_build_object(
        'acceptedAt', a.accepted_at,
        'accepterName', a.accepter_name
      ) from public.acceptances a where a.quote_id = q.id
    ),
    'appointments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ap.id,
        'startsAt', ap.starts_at,
        'status', ap.status
      ) order by ap.starts_at)
      from public.appointments ap where ap.quote_id = q.id
    ), '[]'::jsonb),
    'payment', (
      select jsonb_build_object(
        'status', pay.status,
        'provider', pay.provider,
        'paidAt', pay.paid_at
      )
      from public.payments pay
      where pay.quote_id = q.id
      order by pay.created_at desc
      limit 1
    )
  );
end $$;

create or replace function public.accept_public_contract(p_public_token uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare q public.quotes;
begin
  select * into q from public.quotes where public_token = p_public_token for update;
  if q.id is null then raise exception 'quote_not_found'; end if;
  if q.status <> 'accepted' then raise exception 'contract_not_acceptable'; end if;
  update public.quotes set
    status = 'awaiting_payment',
    contract_terms = coalesce(
      q.contract_terms,
      'O prestador executará os serviços descritos no orçamento aceito, conforme valores, prazos e condições acordados.'
    )
  where id = q.id;
  insert into public.quote_events(quote_id, event_type, from_status, to_status, metadata)
    values (q.id, 'contract_accepted', 'accepted', 'contracted', '{}'::jsonb);
  insert into public.quote_events(quote_id, event_type, from_status, to_status, metadata)
    values (q.id, 'status_changed', 'contracted', 'awaiting_payment', '{}'::jsonb);
  return jsonb_build_object('id', q.id, 'status', 'awaiting_payment');
end $$;

revoke all on function public.get_public_quote(uuid) from public;
revoke all on function public.accept_public_contract(uuid) from public;
grant execute on function public.get_public_quote(uuid) to service_role;
grant execute on function public.accept_public_contract(uuid) to service_role;
