-- Requires migration 00023. Existing booking records are unchanged.
alter table public.bookings add column if not exists other_event_type text;

create or replace function public.submit_booking_with_preferences(submission_id uuid, form_data jsonb, proof_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  photographer uuid;
  videographer uuid;
  already_created boolean;
  result uuid;
  church text;
  other_event text;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and role = 'client') then raise exception 'A client account is required'; end if;
  if submission_id is null or form_data is null or jsonb_typeof(form_data) <> 'object' then raise exception 'Invalid request'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(submission_id::text, 0));
  already_created := exists (select 1 from public.bookings where id = submission_id and client_id = actor and not is_test);
  if already_created then return public.submit_booking_request(submission_id, form_data, proof_path); end if;
  other_event := nullif(trim(coalesce(form_data->>'other_event_type', '')), '');
  if form_data->>'event_type' = 'Special Event' and (other_event is null or length(other_event) > 150) then raise exception 'Enter the type of event, up to 150 characters'; end if;
  if form_data->>'event_type' <> 'Special Event' then other_event := null; end if;
  church := nullif(trim(coalesce(form_data->>'church_location', '')), '');
  if form_data->>'event_type' = 'Wedding' and (church is null or length(church) > 500) then raise exception 'Enter a church location of up to 500 characters'; end if;
  if form_data->>'event_type' <> 'Wedding' then church := null; end if;
  photographer := nullif(form_data->>'preferred_photographer_id', '')::uuid;
  videographer := nullif(form_data->>'preferred_videographer_id', '')::uuid;
  if photographer is not null and not exists (select 1 from public.profiles where id = photographer and role = 'photographer') then raise exception 'Selected photographer is unavailable'; end if;
  if videographer is not null and not exists (select 1 from public.profiles where id = videographer and role = 'videographer') then raise exception 'Selected videographer is unavailable'; end if;
  result := public.submit_booking_request(submission_id, form_data, proof_path);
  update public.bookings set preferred_photographer_id = photographer, preferred_videographer_id = videographer, church_location = church, other_event_type = other_event
  where id = result and client_id = actor and not is_test;
  return result;
end;
$$;
