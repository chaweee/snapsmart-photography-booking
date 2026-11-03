-- Notify only the assigned team member when an assignment is created.
create function public.notify_team_assignment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (recipient_id, booking_id, title, message, type)
  values (new.team_member_id, new.booking_id, 'New event assignment',
          'You have been assigned to an event. Open your schedule for details.', 'assignment');
  return new;
end;
$$;
create trigger notify_team_assignment_created
after insert on public.booking_assignments
for each row execute function public.notify_team_assignment();

-- Notify assigned members when key event details change. No client details are
-- included in the message; the current assignment controls access to the event.
create function public.notify_team_booking_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (recipient_id, booking_id, title, message, type)
  select distinct a.team_member_id, new.id, 'Assigned event updated',
    'An assigned event has changed. Open your schedule for the latest details.', 'assignment'
  from public.booking_assignments a where a.booking_id = new.id;
  return new;
end;
$$;
create trigger notify_team_event_changed
after update of event_date, start_time, end_time, event_location, status on public.bookings
for each row when (
  old.event_date is distinct from new.event_date or old.start_time is distinct from new.start_time
  or old.end_time is distinct from new.end_time or old.event_location is distinct from new.event_location
  or old.status is distinct from new.status
) execute function public.notify_team_booking_change();

-- Only the recipient may mark their own notification read; arbitrary fields
-- and other users' records cannot be changed through this function.
create function public.mark_notification_read(notification_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = coalesce(read_at, now())
  where id = notification_id and recipient_id = (select auth.uid());
$$;
revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;
