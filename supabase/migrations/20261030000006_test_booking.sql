-- TEST submissions only. Do not use for real payments or signed agreements.
alter table public.bookings add column is_test boolean not null default false;
alter table public.bookings add column client_address text;
alter table public.bookings add column bride_name text;
alter table public.bookings add column groom_name text;
alter table public.bookings add column notes text;
alter table public.bookings add column test_consent_text text;

-- Restrict the private proof bucket to small image/PDF uploads.
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf']
where id = 'payment-proofs';

create policy test_proof_client_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = 'test'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 2
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'client')
);

-- Users may delete only their own unlinked test uploads; linked proofs are protected.
create policy test_proof_client_cleanup on storage.objects for delete to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = 'test'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and not exists (select 1 from public.payments p where p.proof_path = name)
);
create policy test_proof_client_staged_read on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = 'test'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create function public.submit_test_booking(submission_id uuid, form_data jsonb, proof_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  package_row public.packages%rowtype;
  event_day date;
  start_at time;
  end_at time;
  claimed_amount numeric;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and role = 'client') then
    raise exception 'A client account is required';
  end if;
  if submission_id is null or jsonb_typeof(form_data) <> 'object' then raise exception 'Invalid request'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(submission_id::text, 0));
  if exists (select 1 from public.bookings where id = submission_id and client_id = actor and is_test) then
    return submission_id;
  end if;
  if exists (select 1 from public.bookings where id = submission_id) then raise exception 'Invalid request ID'; end if;
  if proof_path is null or proof_path not in (
    'test/' || actor::text || '/' || submission_id::text || '.jpg',
    'test/' || actor::text || '/' || submission_id::text || '.png',
    'test/' || actor::text || '/' || submission_id::text || '.pdf'
  ) or not exists (select 1 from storage.objects o where o.bucket_id = 'payment-proofs' and o.name = proof_path and o.owner_id = actor::text) then
    raise exception 'Test proof not found';
  end if;
  select * into package_row from public.packages where id = form_data->>'package_id' and is_active;
  if not found then raise exception 'Selected package is unavailable'; end if;
  if form_data->>'consent' is distinct from 'true' then raise exception 'Test consent required'; end if;
  if length(trim(coalesce(form_data->>'client_name', ''))) not between 1 and 150
     or length(trim(coalesce(form_data->>'email', ''))) not between 3 and 254
     or length(trim(coalesce(form_data->>'phone', ''))) not between 1 and 40
     or length(trim(coalesce(form_data->>'event_location', ''))) not between 1 and 500
     or length(coalesce(form_data->>'address', '')) > 500
     or length(coalesce(form_data->>'notes', '')) > 2000
     or length(coalesce(form_data->>'theme_motif', '')) > 500
     or length(coalesce(form_data->>'bride_name', '')) > 150
     or length(coalesce(form_data->>'groom_name', '')) > 150
     or form_data->>'event_type' not in ('Wedding', 'Birthday', 'Debut', 'Christening', 'Special Event')
     or form_data->>'payment_method' not in ('GCash', 'Bank Transfer') then
    raise exception 'Invalid booking details';
  end if;
  if form_data->>'event_type' = 'Wedding' and (length(trim(coalesce(form_data->>'bride_name',''))) = 0 or length(trim(coalesce(form_data->>'groom_name',''))) = 0) then raise exception 'Wedding names required'; end if;
  event_day := (form_data->>'event_date')::date;
  start_at := (form_data->>'start_time')::time;
  end_at := (form_data->>'end_time')::time;
  claimed_amount := (form_data->>'amount')::numeric;
  if event_day is null or start_at is null or end_at is null or end_at <= start_at or claimed_amount is null or claimed_amount <= 0 or claimed_amount > 9999999999.99 then raise exception 'Invalid date, time, or test amount'; end if;

  insert into public.bookings (id, client_id, client_name, client_email, client_phone, client_address, package_id, package_snapshot, event_type, event_date, start_time, end_time, event_location, theme_motif, bride_name, groom_name, notes, status, total_amount, required_down_payment, public_gallery_permission, is_test, test_consent_text)
  values (submission_id, actor, trim(form_data->>'client_name'), trim(form_data->>'email'), trim(form_data->>'phone'), nullif(trim(form_data->>'address'), ''), package_row.id, jsonb_build_object('name', package_row.name, 'subtitle', package_row.subtitle, 'inclusions', package_row.inclusions, 'price', package_row.price), form_data->>'event_type', event_day, start_at, end_at, trim(form_data->>'event_location'), nullif(trim(form_data->>'theme_motif'), ''), nullif(trim(form_data->>'bride_name'), ''), nullif(trim(form_data->>'groom_name'), ''), nullif(trim(form_data->>'notes'), ''), 'Awaiting Payment Verification', package_row.price, package_row.required_down_payment, coalesce((form_data->>'public_gallery_permission')::boolean, false), true, 'Test booking only. No actual payment or signed agreement is created.');
  insert into public.payments (booking_id, amount, method, proof_path, status)
  values (submission_id, claimed_amount, form_data->>'payment_method', proof_path, 'For Verification');
  insert into public.notifications (recipient_id, booking_id, title, message, type)
  select id, submission_id, 'TEST: Booking and proof submitted', 'A test booking and dummy payment proof are ready for review. This is not a real payment.', 'payment'
  from public.profiles where role = 'admin';
  return submission_id;
end;
$$;
revoke all on function public.submit_test_booking(uuid, jsonb, text) from public;
grant execute on function public.submit_test_booking(uuid, jsonb, text) to authenticated;
