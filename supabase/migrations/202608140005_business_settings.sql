alter table public.profiles
  add column if not exists display_name text,
  add column if not exists instagram text,
  add column if not exists document text,
  add column if not exists address text,
  add column if not exists service_modes text[] not null default '{}'::text[],
  add column if not exists cancellation_policy text;

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
    'id', q.id, 'status', q.status, 'title', q.title, 'message', q.message,
    'subtotalCents', q.subtotal_cents, 'discountCents', q.discount_cents,
    'totalCents', q.total_cents, 'expiresAt', q.expires_at,
    'contractTerms', q.contract_terms,
    'provider', (select jsonb_build_object(
      'businessName', p.business_name, 'slug', p.slug, 'logoUrl', p.logo_url,
      'brandColor', p.brand_color, 'pixKey', p.pix_key, 'whatsapp', p.whatsapp,
      'cancellationPolicy', p.cancellation_policy
    ) from public.profiles p where p.user_id = q.user_id),
    'customer', (select jsonb_build_object('name', c.name, 'phone', c.phone)
      from public.customers c where c.id = q.customer_id),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', i.id, 'description', i.description, 'quantity', i.quantity,
      'unitPriceCents', i.unit_price_cents, 'totalCents', i.total_cents
    ) order by i.sort_order) from public.quote_items i where i.quote_id = q.id), '[]'::jsonb),
    'acceptance', (select jsonb_build_object('acceptedAt', a.accepted_at, 'accepterName', a.accepter_name)
      from public.acceptances a where a.quote_id = q.id),
    'appointments', coalesce((select jsonb_agg(jsonb_build_object(
      'id', ap.id, 'startsAt', ap.starts_at, 'status', ap.status
    ) order by ap.starts_at) from public.appointments ap where ap.quote_id = q.id), '[]'::jsonb),
    'payment', (select jsonb_build_object(
      'status', pay.status, 'provider', pay.provider, 'paidAt', pay.paid_at,
      'pixCode', pay.pix_code, 'ticketUrl', pay.ticket_url
    ) from public.payments pay where pay.quote_id = q.id order by pay.created_at desc limit 1)
  );
end $$;

revoke all on function public.get_public_quote(uuid) from public;
grant execute on function public.get_public_quote(uuid) to service_role;
