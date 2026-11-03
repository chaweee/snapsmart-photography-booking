-- Notify the linked client when a private gallery becomes available.
-- Existing galleries and notifications are not modified or backfilled.
create or replace function public.notify_client_gallery_release() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (recipient_id, booking_id, title, message, type)
  select b.client_id, b.id,
    'Your photos are ready',
    'Your private gallery is available. Open My Galleries to view and download your photos.',
    'gallery'
  from public.bookings b
  where b.id = new.booking_id and b.client_id is not null;
  return new;
end;
$$;

drop trigger if exists gallery_release_notify_update on public.galleries;
create trigger gallery_release_notify_update
after update of is_available on public.galleries
for each row when (old.is_available is false and new.is_available is true)
execute function public.notify_client_gallery_release();

drop trigger if exists gallery_release_notify_insert on public.galleries;
create trigger gallery_release_notify_insert
after insert on public.galleries
for each row when (new.is_available is true)
execute function public.notify_client_gallery_release();
