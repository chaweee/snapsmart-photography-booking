-- Idempotently install recipient-only read marking and report missing rows.
create or replace function public.mark_notification_read(notification_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Please log in again'; end if;
  update public.notifications set read_at = coalesce(read_at, now())
  where id = notification_id and recipient_id = (select auth.uid());
  if not found then raise exception 'Notification not found'; end if;
end;
$$;
revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;
