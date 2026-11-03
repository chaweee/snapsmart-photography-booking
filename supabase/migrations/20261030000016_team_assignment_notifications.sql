-- Install the existing assignment notification safely, including when 00005
-- has already been applied. Existing assignments and notifications remain intact.
create or replace function public.notify_team_assignment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (recipient_id, booking_id, title, message, type)
  select new.team_member_id, new.booking_id,
         case when b.is_test then 'Test event assignment' else 'New event assignment' end,
         case when b.is_test then 'You have been assigned to a simulated event, not a real booking. Open your calendar for details.'
              else 'You have been assigned to an event. Open your calendar to view the details.' end,
         'assignment'
  from public.bookings b where b.id = new.booking_id;
  return new;
end;
$$;

drop trigger if exists notify_team_assignment_created on public.booking_assignments;
create trigger notify_team_assignment_created
after insert on public.booking_assignments
for each row execute function public.notify_team_assignment();
