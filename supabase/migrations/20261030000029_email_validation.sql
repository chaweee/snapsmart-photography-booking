-- Booking emails must look like name@domain.tld, where the ending (.com, .ph,
-- .com.ph, …) has at least 2 letters. Mirrors isValidEmail() in src/lib/validation.ts.
-- Covers client bookings (submit_booking_with_preferences) and walk-in bookings,
-- since both insert into public.bookings. Sign-up emails are validated by Supabase Auth.
--
-- Checked only when the email is inserted or changed, so older rows don't block
-- unrelated updates such as status changes.

create or replace function public.is_valid_email(p_email text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_email is not null
    and char_length(p_email) <= 254
    and p_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$'
    and position('..' in p_email) = 0
    and left(p_email, 1) <> '.'
    and position('.@' in p_email) = 0
$$;

revoke all on function public.is_valid_email(text) from public;
grant execute on function public.is_valid_email(text) to authenticated, service_role;

create or replace function public.validate_booking_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.client_email is not null
     and (tg_op = 'INSERT' or new.client_email is distinct from old.client_email)
     and not public.is_valid_email(new.client_email) then
    raise exception 'Enter a valid email address with @ and a domain ending, like juan@gmail.com or ana@yahoo.com.ph.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_booking_email on public.bookings;
create trigger validate_booking_email
  before insert or update of client_email on public.bookings
  for each row execute function public.validate_booking_email();
