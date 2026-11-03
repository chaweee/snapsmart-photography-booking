-- Review real proofs and accept additional proofs. Requires 00008.
-- Admins must independently check receipt authenticity and actual funds received.
create function public.review_booking_payment(p_payment_id uuid, p_action text, p_received_amount numeric default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  b public.bookings%rowtype;
  p public.payments%rowtype;
  total_verified numeric;
  new_status text;
begin
  if (select auth.uid()) is null or not public.is_admin() then raise exception 'Only an admin can review payment'; end if;
  if p_action is null or p_action not in ('verify', 'reject') then raise exception 'Invalid review action'; end if;
  select b0.* into b from public.bookings b0 join public.payments p0 on p0.booking_id = b0.id where p0.id = p_payment_id for update of b0;
  if not found then raise exception 'Payment not found'; end if;
  if b.is_test or b.client_id is null then raise exception 'This review is only for client booking requests'; end if;
  select * into p from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if (p_action = 'verify' and p.status = 'Verified') or (p_action = 'reject' and p.status = 'Rejected') then return; end if;
  if p.status <> 'For Verification' or b.status not in ('Pending', 'Awaiting Payment Verification', 'Payment Insufficient') then raise exception 'Payment is not awaiting review'; end if;
  if p.proof_path is null or not exists (select 1 from storage.objects where bucket_id = 'payment-proofs' and name = p.proof_path) then raise exception 'Payment proof is missing'; end if;
  if p_action = 'verify' then
    if p_received_amount is null or p_received_amount <= 0 or p_received_amount > 9999999999.99 or p_received_amount <> round(p_received_amount, 2) then raise exception 'Enter a valid amount actually received'; end if;
    update public.payments set status = 'Verified', amount = p_received_amount, verified_by = (select auth.uid()), verified_at = now() where id = p_payment_id;
    select coalesce(sum(amount),0) into total_verified from public.payments where booking_id = b.id and status = 'Verified';
    new_status := case when total_verified >= b.required_down_payment then 'Confirmed' else 'Payment Insufficient' end;
    update public.bookings set status = new_status where id = b.id;
    insert into public.notifications (recipient_id,booking_id,title,message,type)
    values (b.client_id,b.id,case when new_status = 'Confirmed' then 'Payment verified' else 'Additional payment needed' end,
      case when new_status = 'Confirmed' then 'Your down payment has been verified and your booking is confirmed. The agreement must still be signed when available.' else 'Your payment was verified but the down payment is incomplete. Open My Bookings to submit another payment proof.' end,'payment');
  else
    update public.payments set status = 'Rejected', verified_by = (select auth.uid()), verified_at = now() where id = p_payment_id;
    update public.bookings set status = 'Payment Insufficient' where id = b.id;
    insert into public.notifications (recipient_id,booking_id,title,message,type)
    values (b.client_id,b.id,'Payment proof rejected','Your payment proof could not be verified. Open My Bookings to submit another payment proof.','payment');
  end if;
end;
$$;
revoke all on function public.review_booking_payment(uuid,text,numeric) from public;
grant execute on function public.review_booking_payment(uuid,text,numeric) to authenticated;

create function public.submit_additional_payment(p_payment_id uuid, p_booking_id uuid, p_method text, p_proof_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  b public.bookings%rowtype;
  verified numeric;
  remaining numeric;
begin
  if actor is null or not exists (select 1 from public.profiles where id = actor and role = 'client') then raise exception 'A client account is required'; end if;
  if p_payment_id is null or p_booking_id is null or p_method is null or p_method not in ('GCash','Bank Transfer') then raise exception 'Invalid request'; end if;
  select * into b from public.bookings where id = p_booking_id and client_id = actor for update;
  if not found or b.is_test then raise exception 'Booking not found'; end if;
  if exists (select 1 from public.payments where id = p_payment_id and booking_id = b.id and proof_path = p_proof_path) then return p_payment_id; end if;
  if exists (select 1 from public.payments where id = p_payment_id) then raise exception 'Invalid request ID'; end if;
  if b.status <> 'Payment Insufficient' then raise exception 'This booking is not awaiting another payment'; end if;
  if exists (select 1 from public.payments where booking_id = b.id and status = 'For Verification') then raise exception 'Another payment proof is already awaiting review'; end if;
  if p_proof_path is null or p_proof_path not in ('booking/' || actor::text || '/' || p_payment_id::text || '.jpg','booking/' || actor::text || '/' || p_payment_id::text || '.png','booking/' || actor::text || '/' || p_payment_id::text || '.pdf') or not exists (select 1 from storage.objects o where o.bucket_id = 'payment-proofs' and o.name = p_proof_path and o.owner_id = actor::text) then raise exception 'Payment proof not found'; end if;
  select coalesce(sum(amount),0) into verified from public.payments where booking_id = b.id and status = 'Verified';
  remaining := greatest(b.required_down_payment - verified, 0);
  if remaining <= 0 then raise exception 'No down payment is outstanding'; end if;
  insert into public.payments (id,booking_id,amount,method,proof_path,status) values (p_payment_id,b.id,remaining,p_method,p_proof_path,'For Verification');
  update public.bookings set status = 'Awaiting Payment Verification' where id = b.id;
  insert into public.notifications (recipient_id,booking_id,title,message,type)
  select id,b.id,'Additional payment proof','A client submitted another payment proof. Verify the actual payment separately.','payment' from public.profiles where role = 'admin';
  return p_payment_id;
end;
$$;
revoke all on function public.submit_additional_payment(uuid,uuid,text,text) from public;
grant execute on function public.submit_additional_payment(uuid,uuid,text,text) to authenticated;
