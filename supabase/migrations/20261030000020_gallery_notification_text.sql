-- Update future gallery notifications if migration 00019 was already applied.
-- Existing notifications and bookings are unchanged.
create or replace function public.notify_client_gallery_release() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (recipient_id, booking_id, title, message, type)
  select b.client_id, b.id, 'Your photos are ready',
    'Your private gallery is available. Open My Galleries to view and download your photos.',
    'gallery'
  from public.bookings b
  where b.id = new.booking_id and b.client_id is not null;
  return new;
end;
$$;
