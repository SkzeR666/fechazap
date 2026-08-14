drop policy if exists owner_payments on public.payments;

create policy owner_payments_select
on public.payments
for select
to authenticated
using (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_id
      and q.user_id = auth.uid()
  )
);

create or replace function public.confirm_manual_payment(p_quote_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.quotes;
  payment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  select * into q
  from public.quotes
  where id = p_quote_id
    and user_id = auth.uid()
    and status = 'awaiting_payment'
  for update;

  if q.id is null then
    raise exception 'payment_not_confirmable';
  end if;

  insert into public.payments(quote_id, status, provider, amount_cents, paid_at)
  values(q.id, 'paid', 'manual_pix', q.total_cents, now())
  returning id into payment_id;

  update public.quotes set status = 'paid' where id = q.id;
  insert into public.quote_events(quote_id, actor_id, event_type, from_status, to_status)
  values(q.id, auth.uid(), 'manual_payment_confirmed', 'awaiting_payment', 'paid');

  return jsonb_build_object('paymentId', payment_id, 'quoteId', q.id, 'status', 'paid');
end;
$$;

revoke all on function public.confirm_manual_payment(uuid) from public;
grant execute on function public.confirm_manual_payment(uuid) to authenticated;
