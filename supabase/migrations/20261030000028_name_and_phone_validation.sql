-- Person names must contain letters only (any language, including ñ and accents),
-- optionally separated by spaces, apostrophes, hyphens, or periods.
-- Booking phone numbers must be exactly 11 digits.
-- Mirrors src/lib/validation.ts so the rule can't be bypassed by calling the API directly.
--
-- Enforced with triggers that only check a value when it is inserted or changed,
-- so existing rows with older data don't block unrelated updates (e.g. status changes).

create or replace function public.is_valid_person_name(p_name text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_name is not null
    and char_length(btrim(p_name)) between 2 and 150
    -- no digits or symbols other than space ' ’ . -
    and translate(p_name, '0123456789!"#$%&()*+,/:;<=>?@[\]^_`{|}~', '') = p_name
    and p_name !~ '[[:cntrl:]]'
    -- must start with a letter (not a separator)
    and btrim(p_name) !~ '^[ ''’.-]'
    -- no doubled separators like "--" or "''"
    and p_name !~ '[''’-]{2,}'
$$;

revoke all on function public.is_valid_person_name(text) from public;
grant execute on function public.is_valid_person_name(text) to authenticated, service_role;

create or replace function public.validate_booking_contact()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.client_name is distinct from old.client_name)
     and not public.is_valid_person_name(new.client_name) then
    raise exception 'Full name must be 2–150 characters and contain letters only. Spaces, apostrophes, hyphens, and periods are allowed.'
      using errcode = 'check_violation';
  end if;

  if new.bride_name is not null
     and (tg_op = 'INSERT' or new.bride_name is distinct from old.bride_name)
     and not public.is_valid_person_name(new.bride_name) then
    raise exception 'Bride''s full name must contain letters only. Spaces, apostrophes, hyphens, and periods are allowed.'
      using errcode = 'check_violation';
  end if;

  if new.groom_name is not null
     and (tg_op = 'INSERT' or new.groom_name is distinct from old.groom_name)
     and not public.is_valid_person_name(new.groom_name) then
    raise exception 'Groom''s full name must contain letters only. Spaces, apostrophes, hyphens, and periods are allowed.'
      using errcode = 'check_violation';
  end if;

  if new.client_phone is not null
     and (tg_op = 'INSERT' or new.client_phone is distinct from old.client_phone)
     and new.client_phone !~ '^[0-9]{11}$' then
    raise exception 'Phone number must contain exactly 11 digits.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_booking_contact on public.bookings;
create trigger validate_booking_contact
  before insert or update of client_name, bride_name, groom_name, client_phone on public.bookings
  for each row execute function public.validate_booking_contact();

-- profiles.full_name defaults to '' for accounts created without a name
-- (e.g. from the Supabase dashboard), so an empty name stays allowed.
create or replace function public.validate_profile_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.full_name is distinct from old.full_name)
     and btrim(new.full_name) <> ''
     and not public.is_valid_person_name(new.full_name) then
    raise exception 'Full name must be 2–150 characters and contain letters only. Spaces, apostrophes, hyphens, and periods are allowed.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_profile_name on public.profiles;
create trigger validate_profile_name
  before insert or update of full_name on public.profiles
  for each row execute function public.validate_profile_name();
