-- Booking agreements: immutable term, booking, signature and consent snapshots.
-- Requires migrations 00008 and 00010. This does not create a signed PDF.
alter table public.agreements add column admin_signature_data text;

create policy agreement_signature_upload on storage.objects for insert to authenticated
with check (bucket_id = 'agreement-files' and (storage.foldername(name))[1] = 'signature'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and array_length(storage.foldername(name), 1) = 3
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'client'));
create policy agreement_signature_staged_read on storage.objects for select to authenticated
using (bucket_id = 'agreement-files' and (storage.foldername(name))[1] = 'signature'
  and (storage.foldername(name))[2] = (select auth.uid())::text);
create policy agreement_signature_staged_cleanup on storage.objects for delete to authenticated
using (bucket_id = 'agreement-files' and (storage.foldername(name))[1] = 'signature'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and not exists (select 1 from public.agreements a where a.client_signature_path = name));

-- The server, not the browser, supplies the exact version and terms.
create function public.agreement_signing_material(p_booking_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
  terms constant text := $terms$1. The deposit paid upon booking is non-refundable and serves to secure the photographer’s availability for the agreed event date.

2. If the client selects the public option and gives permission, the photographer may use selected images for portfolio, promotional, and marketing purposes, both online and offline. If the client does not give permission, the event photos will remain private and will not be used for these purposes.

3. The photographer is not responsible for circumstances beyond their control that may affect coverage, including but not limited to weather conditions, venue restrictions, or client-related delays.

4. Soft copies of the edited photos will be delivered within 2 weeks after the event date. Final delivery of the completed photo album and video will be provided within 2 to 3 months, depending on the volume and complexity of the project.$terms$;
  snapshot jsonb;
begin
  if not exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'client') then raise exception 'A client account is required'; end if;
  select * into b from public.bookings where id = p_booking_id and client_id = (select auth.uid());
  if not found or b.is_test or b.status = 'Cancelled' then raise exception 'Agreement is not available for this booking'; end if;
  snapshot := jsonb_build_object('booking_id', b.id, 'client_name', b.client_name,
    'client_email', b.client_email, 'client_phone', b.client_phone, 'client_address', b.client_address,
    'package', b.package_snapshot, 'event_type', b.event_type, 'event_date', b.event_date,
    'start_time', b.start_time, 'end_time', b.end_time, 'event_location', b.event_location,
    'theme_motif', b.theme_motif, 'bride_name', b.bride_name, 'groom_name', b.groom_name,
    'notes', b.notes, 'total_amount', b.total_amount, 'required_down_payment', b.required_down_payment,
    'public_marketing_permission', (b.public_gallery_permission and b.marketing_choice_at is not null and b.marketing_choice_text = 'Allow selected photos for portfolio, promotion, and marketing, online and offline.'));
  return jsonb_build_object('version', '2026-01', 'terms', terms, 'booking_snapshot', snapshot,
    'consent_text', 'I have reviewed the agreement and booking details and agree to sign electronically.');
end;
$$;
revoke all on function public.agreement_signing_material(uuid) from public;
grant execute on function public.agreement_signing_material(uuid) to authenticated;

create function public.sign_booking_agreement(p_booking_id uuid, p_version text, p_terms text, p_snapshot jsonb, p_signature_path text, p_admin_png_base64 text, p_consent boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  material jsonb;
  result uuid;
  signature_prefix text;
begin
  if actor is null or p_consent is distinct from true or not exists (select 1 from public.profiles where id = actor and role = 'client') then raise exception 'Client consent is required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_booking_id::text, 1));
  perform 1 from public.bookings where id = p_booking_id and client_id = actor and not is_test and status <> 'Cancelled' for update;
  if not found then raise exception 'Agreement is not available for this booking'; end if;
  select id into result from public.agreements where booking_id = p_booking_id order by signed_at desc limit 1;
  if found then return result; end if;
  material := public.agreement_signing_material(p_booking_id);
  if p_version is distinct from material->>'version' or p_terms is distinct from material->>'terms' or p_snapshot is distinct from material->'booking_snapshot' then raise exception 'Booking details or terms changed. Refresh and review the agreement again.'; end if;
  signature_prefix := 'signature/' || actor::text || '/' || p_booking_id::text || '/';
  if p_signature_path is null or left(p_signature_path, length(signature_prefix)) <> signature_prefix
    or substring(p_signature_path from length(signature_prefix) + 1) !~ '^[0-9a-f-]{36}\.png$'
    or not exists (select 1 from storage.objects o where o.bucket_id = 'agreement-files' and o.name = p_signature_path and o.owner_id = actor::text and (o.metadata->>'mimetype') = 'image/png' and (o.metadata->>'size')::bigint between 1 and 1048576)
    then raise exception 'Client signature file is missing or invalid'; end if;
  if p_admin_png_base64 is null or length(p_admin_png_base64) > 150000 or pg_catalog.encode(pg_catalog.sha256(pg_catalog.decode(p_admin_png_base64, 'base64')), 'hex') <> '983335fa4ca8e6b7c9ac29aad39b0666d84001c2aa407417a5e59a128053603a' then raise exception 'Admin signature image does not match the approved version'; end if;
  insert into public.agreements (booking_id, version, agreement_snapshot, booking_snapshot, client_name, client_signature_path, admin_name, admin_signature_snapshot, admin_signature_data, consent_text)
  values (p_booking_id, material->>'version', material->>'terms', material->'booking_snapshot', material->'booking_snapshot'->>'client_name', p_signature_path, 'Toni Photography', 'embedded/983335fa4ca8e6b7c9ac29aad39b0666d84001c2aa407417a5e59a128053603a', p_admin_png_base64, material->>'consent_text') returning id into result;
  insert into public.notifications (recipient_id, booking_id, title, message, type)
  select id, p_booking_id, 'Agreement signed', 'A client signed the booking agreement. Open Bookings to review it.', 'booking' from public.profiles where role = 'admin';
  return result;
end;
$$;
revoke all on function public.sign_booking_agreement(uuid,text,text,jsonb,text,text,boolean) from public;
grant execute on function public.sign_booking_agreement(uuid,text,text,jsonb,text,text,boolean) to authenticated;
