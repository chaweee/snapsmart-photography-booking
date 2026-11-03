-- Ensure users can mark only their own notifications as read.
-- Safe to run whether the earlier team-notification migration exists or not.
create or replace function public.mark_notification_read(notification_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = coalesce(read_at, now())
  where id = notification_id and recipient_id = (select auth.uid());
$$;
revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;
