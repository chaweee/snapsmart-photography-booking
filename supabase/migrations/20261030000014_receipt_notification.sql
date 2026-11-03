-- Requires 00009. Preserve payment review behavior and update future notifications.
create or replace function public.review_booking_payment(p_payment_id uuid, p_action text, p_received_amount numeric default null)
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
      case when new_status = 'Confirmed' then 'Your down payment has been verified and your booking is confirmed. Your contract receipt is available in My Bookings.' else 'Your payment was verified but the down payment is incomplete. Open My Bookings to submit another payment proof.' end,'payment');
  else
    update public.payments set status = 'Rejected', verified_by = (select auth.uid()), verified_at = now() where id = p_payment_id;
    update public.bookings set status = 'Payment Insufficient' where id = b.id;
    insert into public.notifications (recipient_id,booking_id,title,message,type)
    values (b.client_id,b.id,'Payment proof rejected','Your payment proof could not be verified. Open My Bookings to submit another payment proof.','payment');
  end if;
end;
$$;
