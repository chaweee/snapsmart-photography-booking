-- IMPORTANT: Enable Supabase Auth email confirmation BEFORE enabling this flow.
-- email_confirmed_at is not proof of mailbox ownership if confirmation was disabled.
-- Requires migrations 00021, 00023 and 00024. Existing bookings are unchanged.
alter table public.bookings add column if not exists booking_source text not null default 'online';
alter table public.bookings add column if not exists walk_in_created_by uuid references public.profiles(id) on delete restrict;
-- This cutoff deliberately excludes accounts created before activation, whose
-- confirmed timestamp may have been set while email confirmation was disabled.
create table if not exists public.walk_in_linking_config (
  singleton boolean primary key default true check (singleton),
  activated_at timestamptz not null default now()
);
alter table public.walk_in_linking_config enable row level security;
insert into public.walk_in_linking_config (singleton) values (true) on conflict (singleton) do nothing;

create or replace function public.create_walk_in_booking(p_id uuid, p_form jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  pkg public.packages%rowtype;
  cash numeric;
  event_day date;
  start_at time;
  kind text;
  client_email text;
  church text;
  other_kind text;
  status_text text;
begin
  if actor is null or not public.is_admin() then raise exception 'Only an admin can create a walk-in booking'; end if;
  if p_id is null or p_form is null or jsonb_typeof(p_form) <> 'object' then raise exception 'Invalid request'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text, 0));
  if exists (select 1 from public.bookings where id = p_id and booking_source = 'walk_in' and walk_in_created_by = actor) then return p_id; end if;
  if exists (select 1 from public.bookings where id = p_id) then raise exception 'Invalid request ID'; end if;
  select * into pkg from public.packages where id = p_form->>'package_id' and is_active;
  if not found then raise exception 'Selected package is unavailable'; end if;
  client_email := lower(trim(coalesce(p_form->>'email', '')));
  kind := p_form->>'event_type';
  church := nullif(trim(coalesce(p_form->>'church_location', '')), '');
  other_kind := nullif(trim(coalesce(p_form->>'other_event_type', '')), '');
  if length(trim(coalesce(p_form->>'client_name', ''))) not between 1 and 150
    or length(client_email) not between 3 and 254 or client_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or length(trim(coalesce(p_form->>'phone', ''))) not between 1 and 40
    or length(coalesce(p_form->>'address', '')) > 500
    or length(trim(coalesce(p_form->>'event_location', ''))) not between 1 and 500
    or length(coalesce(p_form->>'notes', '')) > 2000 or length(coalesce(p_form->>'theme_motif', '')) > 500
    or length(coalesce(p_form->>'bride_name', '')) > 150 or length(coalesce(p_form->>'groom_name', '')) > 150
    or kind not in ('Wedding', 'Birthday', 'Debut', 'Christening', 'Special Event') then raise exception 'Invalid booking details'; end if;
  if kind = 'Wedding' and (church is null or length(church) > 500 or length(trim(coalesce(p_form->>'bride_name', ''))) = 0 or length(trim(coalesce(p_form->>'groom_name', ''))) = 0) then raise exception 'Wedding names and church location are required'; end if;
  if kind = 'Special Event' and (other_kind is null or length(other_kind) > 150) then raise exception 'Enter the type of event'; end if;
  event_day := nullif(p_form->>'event_date', '')::date;
  start_at := nullif(p_form->>'start_time', '')::time;
  cash := nullif(p_form->>'cash_received', '')::numeric;
  if event_day is null or start_at is null then raise exception 'Event date and start time are required'; end if;
  if cash is null or cash < 0 or cash > pkg.price or cash <> round(cash, 2) then raise exception 'Enter a valid cash amount no greater than the package price'; end if;
  if cash > 0 and p_form->>'cash_confirmed' is distinct from 'true' then raise exception 'Confirm cash received before recording it'; end if;
  status_text := case when pkg.required_down_payment > 0 and cash >= pkg.required_down_payment then 'Confirmed' when pkg.required_down_payment > 0 then 'Payment Insufficient' else 'Pending' end;
  insert into public.bookings (id, client_id, client_name, client_email, client_phone, client_address, package_id, package_snapshot, event_type, other_event_type, event_date, start_time, event_location, church_location, theme_motif, bride_name, groom_name, notes, status, total_amount, required_down_payment, public_gallery_permission, marketing_choice_text, marketing_choice_at, is_test, booking_source, walk_in_created_by)
  values (p_id, null, trim(p_form->>'client_name'), client_email, trim(p_form->>'phone'), nullif(trim(coalesce(p_form->>'address', '')), ''), pkg.id, jsonb_build_object('name', pkg.name, 'subtitle', pkg.subtitle, 'inclusions', pkg.inclusions, 'price', pkg.price), kind, case when kind = 'Special Event' then other_kind else null end, event_day, start_at, trim(p_form->>'event_location'), case when kind = 'Wedding' then church else null end, nullif(trim(coalesce(p_form->>'theme_motif', '')), ''), nullif(trim(coalesce(p_form->>'bride_name', '')), ''), nullif(trim(coalesce(p_form->>'groom_name', '')), ''), nullif(trim(coalesce(p_form->>'notes', '')), ''), status_text, pkg.price, pkg.required_down_payment, coalesce(p_form->>'public_gallery_permission' = 'true', false), 'Allow selected photos for portfolio, promotion, and marketing, online and offline.', now(), false, 'walk_in', actor);
  if cash > 0 then
    insert into public.payments (booking_id, amount, method, status, verified_by, verified_at) values (p_id, cash, 'Cash', 'Verified', actor, now());
  end if;
  return p_id;
end;
$$;
revoke all on function public.create_walk_in_booking(uuid,jsonb) from public;
grant execute on function public.create_walk_in_booking(uuid,jsonb) to authenticated;

-- Claim only explicitly marked walk-ins with no owner and matching confirmed email.
-- Never replace an existing client_id or link by name/phone.
create or replace function public.claim_walk_in_bookings() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  verified_email text;
  changed integer;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and role = 'client') then raise exception 'A client account is required'; end if;
  select lower(trim(u.email)) into verified_email from auth.users u
  join public.walk_in_linking_config cfg on cfg.singleton
  where u.id = actor and u.email is not null and u.created_at >= cfg.activated_at and u.email_confirmed_at >= cfg.activated_at;
  if verified_email is null then return 0; end if;
  update public.bookings set client_id = actor
  where booking_source = 'walk_in' and client_id is null and lower(trim(client_email)) = verified_email;
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function public.claim_walk_in_bookings() from public;
grant execute on function public.claim_walk_in_bookings() to authenticated;
