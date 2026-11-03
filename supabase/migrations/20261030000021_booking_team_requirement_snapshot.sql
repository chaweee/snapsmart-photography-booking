-- Preserve the team requirement at booking creation; existing bookings are unchanged.
create or replace function public.snapshot_booking_team_requirements() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  package_row public.packages%rowtype;
begin
  if new.package_id is null then return new; end if;
  select * into package_row from public.packages where id = new.package_id;
  if found then
    new.package_snapshot := coalesce(new.package_snapshot, '{}'::jsonb) || jsonb_build_object(
      'requires_photographer', package_row.requires_photographer,
      'requires_videographer', package_row.requires_videographer
    );
  end if;
  return new;
end;
$$;
drop trigger if exists booking_team_requirement_snapshot on public.bookings;
create trigger booking_team_requirement_snapshot before insert on public.bookings
for each row execute function public.snapshot_booking_team_requirements();
