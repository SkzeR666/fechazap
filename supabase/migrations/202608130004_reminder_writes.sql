create policy owner_reminders_insert on public.reminders
for insert to authenticated
with check (
  exists (
    select 1 from public.quotes q
    where q.id = quote_id and q.user_id = auth.uid()
  )
);
