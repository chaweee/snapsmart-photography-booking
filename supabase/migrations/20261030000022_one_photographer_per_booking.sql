-- Block additional photographers without altering existing assignments.
-- A per-booking transaction lock prevents simultaneous inserts from bypassing the check.
create or replace function public.check_one_booking_photographer() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.assignment_role <> 'photographer' then return new; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.booking_id::text, 22901));
  if tg_op = 'UPDATE' then
    if exists (
      select 1 from public.booking_assignments a
      where a.booking_id = new.booking_id and a.assignment_role = 'photographer'
        and (a.booking_id, a.team_member_id, a.assignment_role)
          is distinct from (old.booking_id, old.team_member_id, old.assignment_role)
    ) then raise exception 'This booking already has a photographer. Remove the current photographer before assigning another.'; end if;
  else
    if exists (select 1 from public.booking_assignments a where a.booking_id = new.booking_id and a.assignment_role = 'photographer') then
      raise exception 'This booking already has a photographer. Remove the current photographer before assigning another.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists one_photographer_per_booking on public.booking_assignments;
create trigger one_photographer_per_booking
before insert or update of booking_id, team_member_id, assignment_role on public.booking_assignments
for each row execute function public.check_one_booking_photographer();
