create policy owner_quote_events_insert on public.quote_events
for insert to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1 from public.quotes q
    where q.id = quote_id and q.user_id = auth.uid()
  )
);
