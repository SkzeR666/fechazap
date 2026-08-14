alter type public.quote_status add value if not exists 'partially_paid';
alter type public.quote_status add value if not exists 'scheduling_pending';
alter type public.quote_status add value if not exists 'in_progress';
alter type public.quote_status add value if not exists 'expired';
alter type public.quote_status add value if not exists 'declined';
alter type public.quote_status add value if not exists 'refunded';
