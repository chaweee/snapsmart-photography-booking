-- Existing bookings keep no preference; no historical assignments are changed.
alter table public.bookings add column preferred_photographer_id uuid references public.profiles(id) on delete set null;
alter table public.bookings add column preferred_videographer_id uuid references public.profiles(id) on delete set null;

-- Expose only names and roles, never profile phone numbers or emails.
create function public.list_booking_team()
returns table (id uuid, full_name text, role text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.full_name, p.role from public.profiles p
  where p.role in ('photographer', 'videographer') and length(trim(p.full_name)) > 0
  order by p.full_name, p.id;
$$;
revoke all on function public.list_booking_team() from public;
grant execute on function public.list_booking_team() to authenticated;

-- Add preferences atomically to a new booking; retries never overwrite them.
-- This is not a team assignment or a guarantee of availability.
create function public.submit_booking_with_preferences(submission_id uuid, form_data jsonb, proof_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  photographer uuid;
  videographer uuid;
  already_created boolean;
  result uuid;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and role = 'client') then raise exception 'A client account is required'; end if;
  if submission_id is null or form_data is null or jsonb_typeof(form_data) <> 'object' then raise exception 'Invalid request'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(submission_id::text, 0));
  already_created := exists (select 1 from public.bookings where id = submission_id and client_id = actor and not is_test);
  if already_created then return public.submit_booking_request(submission_id, form_data, proof_path); end if;
  photographer := nullif(form_data->>'preferred_photographer_id', '')::uuid;
  videographer := nullif(form_data->>'preferred_videographer_id', '')::uuid;
  if photographer is not null and not exists (select 1 from public.profiles where id = photographer and role = 'photographer') then raise exception 'Selected photographer is unavailable'; end if;
  if videographer is not null and not exists (select 1 from public.profiles where id = videographer and role = 'videographer') then raise exception 'Selected videographer is unavailable'; end if;
  result := public.submit_booking_request(submission_id, form_data, proof_path);
  update public.bookings set preferred_photographer_id = photographer, preferred_videographer_id = videographer
  where id = result and client_id = actor and not is_test;
  return result;
end;
$$;
revoke all on function public.submit_booking_with_preferences(uuid,jsonb,text) from public;
grant execute on function public.submit_booking_with_preferences(uuid,jsonb,text) to authenticated;
