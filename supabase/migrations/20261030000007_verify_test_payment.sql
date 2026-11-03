-- Simulated verification ONLY. Never use this function for real payments.
create function public.verify_test_payment(p_payment_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  booking_row public.bookings%rowtype;
  payment_row public.payments%rowtype;
  total_verified numeric;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Only an admin can verify a test payment';
  end if;

  -- Lock the booking first, so concurrent reviews for one booking serialize.
  select b.* into booking_row from public.bookings b
  join public.payments p on p.booking_id = b.id
  where p.id = p_payment_id for update of b;
  if not found then raise exception 'Payment not found'; end if;
  if not booking_row.is_test then raise exception 'This function only supports test bookings'; end if;
  if booking_row.client_id is null then raise exception 'Booking has no client account'; end if;
  select * into payment_row from public.payments where id = p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if payment_row.status = 'Verified' and booking_row.status = 'Confirmed' then return; end if;
  if payment_row.status <> 'For Verification' or booking_row.status not in ('Pending', 'Awaiting Payment Verification', 'Payment Insufficient') then
    raise exception 'Payment or booking is not awaiting verification';
  end if;
  if payment_row.proof_path is null or not exists (
    select 1 from storage.objects where bucket_id = 'payment-proofs' and name = payment_row.proof_path
  ) then raise exception 'Payment proof is missing'; end if;
  select coalesce(sum(amount), 0) into total_verified from public.payments
  where booking_id = booking_row.id and status = 'Verified';
  if total_verified + payment_row.amount < booking_row.required_down_payment then
    raise exception 'Test amount is below the required down payment; booking remains unconfirmed';
  end if;
  update public.payments set status = 'Verified', verified_by = (select auth.uid()), verified_at = now() where id = p_payment_id;
  update public.bookings set status = 'Confirmed' where id = booking_row.id;
  insert into public.notifications (recipient_id, booking_id, title, message, type)
  values (booking_row.client_id, booking_row.id, 'TEST: Payment verified and booking confirmed',
    'Your test payment was verified and your test booking is confirmed. This is a simulation, not a real payment or reservation.', 'payment');
end;
$$;
revoke all on function public.verify_test_payment(uuid) from public;
grant execute on function public.verify_test_payment(uuid) to authenticated;
