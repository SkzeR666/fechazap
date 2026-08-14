create table public.mercado_pago_connections (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  mercado_pago_user_id text not null,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text not null,
  expires_at timestamptz not null,
  scope text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mercado_pago_oauth_states (
  state_hash text primary key,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  code_verifier_ciphertext text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.mercado_pago_connections enable row level security;
alter table public.mercado_pago_oauth_states enable row level security;

alter table public.payments
  add column if not exists pix_code text,
  add column if not exists ticket_url text;

create index mercado_pago_oauth_states_expiry_idx
  on public.mercado_pago_oauth_states(expires_at);

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
      'brandColor', p.brand_color, 'pixKey', p.pix_key, 'whatsapp', p.whatsapp
    ) from public.profiles p where p.user_id = q.user_id),
    'customer', (select jsonb_build_object('name', c.name) from public.customers c where c.id = q.customer_id),
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
