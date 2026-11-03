-- Allow booking requests without a fixed end time. Existing records are unchanged.
-- Requires the prior booking migrations.
create or replace function public.submit_booking_request(submission_id uuid, form_data jsonb, proof_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  package_row public.packages%rowtype;
  event_day date;
  start_at time;
  end_at time;
  consent boolean;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and role = 'client') then raise exception 'A client account is required'; end if;
  if submission_id is null or form_data is null or jsonb_typeof(form_data) <> 'object' then raise exception 'Invalid request'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(submission_id::text, 0));
  if exists (select 1 from public.bookings where id = submission_id and client_id = actor and not is_test) then return submission_id; end if;
  if exists (select 1 from public.bookings where id = submission_id) then raise exception 'Invalid request ID'; end if;
  if proof_path is null or proof_path not in (
    'booking/' || actor::text || '/' || submission_id::text || '.jpg',
    'booking/' || actor::text || '/' || submission_id::text || '.png',
    'booking/' || actor::text || '/' || submission_id::text || '.pdf'
  ) or not exists (select 1 from storage.objects o where o.bucket_id = 'payment-proofs' and o.name = proof_path and o.owner_id = actor::text) then raise exception 'Payment proof not found'; end if;
  select * into package_row from public.packages where id = form_data->>'package_id' and is_active;
  if not found then raise exception 'Selected package is unavailable'; end if;
  if package_row.required_down_payment <= 0 then raise exception 'Package has no down payment configured; contact the administrator'; end if;
  if form_data->>'consent' is distinct from 'true' then raise exception 'Booking request acknowledgement is required'; end if;
  if length(trim(coalesce(form_data->>'client_name', ''))) not between 1 and 150
    or length(trim(coalesce(form_data->>'email', ''))) not between 3 and 254
    or length(trim(coalesce(form_data->>'phone', ''))) not between 1 and 40
    or length(trim(coalesce(form_data->>'event_location', ''))) not between 1 and 500
    or length(coalesce(form_data->>'address', '')) > 500
    or length(coalesce(form_data->>'notes', '')) > 2000
    or length(coalesce(form_data->>'theme_motif', '')) > 500
    or length(coalesce(form_data->>'bride_name', '')) > 150
    or length(coalesce(form_data->>'groom_name', '')) > 150
    or coalesce(form_data->>'event_type', '') not in ('Wedding','Birthday','Debut','Christening','Special Event')
    or coalesce(form_data->>'payment_method', '') not in ('GCash','Bank Transfer') then raise exception 'Invalid booking details'; end if;
  if form_data->>'event_type' = 'Wedding' and (length(trim(coalesce(form_data->>'bride_name',''))) = 0 or length(trim(coalesce(form_data->>'groom_name',''))) = 0) then raise exception 'Wedding names required'; end if;
  event_day := (form_data->>'event_date')::date;
  start_at := (form_data->>'start_time')::time;
  end_at := nullif(form_data->>'end_time', '')::time;
  if event_day is null or start_at is null or (end_at is not null and end_at <= start_at) then raise exception 'Invalid date or time'; end if;
  consent := coalesce((form_data->>'public_gallery_permission')::boolean, false);
  insert into public.bookings (id,client_id,client_name,client_email,client_phone,client_address,package_id,package_snapshot,event_type,event_date,start_time,end_time,event_location,theme_motif,bride_name,groom_name,notes,status,total_amount,required_down_payment,public_gallery_permission,is_test,request_notice,request_notice_accepted_at,marketing_choice_text,marketing_choice_at)
  values (submission_id,actor,trim(form_data->>'client_name'),trim(form_data->>'email'),trim(form_data->>'phone'),nullif(trim(form_data->>'address'),''),package_row.id,jsonb_build_object('name',package_row.name,'subtitle',package_row.subtitle,'inclusions',package_row.inclusions,'price',package_row.price),form_data->>'event_type',event_day,start_at,end_at,trim(form_data->>'event_location'),nullif(trim(form_data->>'theme_motif'),''),nullif(trim(form_data->>'bride_name'),''),nullif(trim(form_data->>'groom_name'),''),nullif(trim(form_data->>'notes'),''),'Awaiting Payment Verification',package_row.price,package_row.required_down_payment,consent,false,'I understand that this booking request is not confirmed until payment is verified.',now(),'Allow selected photos for portfolio, promotion, and marketing, online and offline.',now());
  -- This amount is the expected down payment, NOT a confirmed amount received.
  insert into public.payments (booking_id,amount,method,proof_path,status) values (submission_id,package_row.required_down_payment,form_data->>'payment_method',proof_path,'For Verification');
  insert into public.notifications (recipient_id,booking_id,title,message,type)
  select id,submission_id,'New booking payment proof','A booking request and payment proof are ready for review. Verify the actual payment separately.','payment' from public.profiles where role = 'admin';
  return submission_id;
end;
$$;
