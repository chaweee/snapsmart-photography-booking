-- Requires migrations 00008, 00010 and 00012. Existing records are unchanged.
-- Read the booking created earlier in the same transaction.
alter function public.agreement_signing_material(uuid) volatile;
-- Clients may read signed agreements only after the booking is confirmed;
-- admins may review them while the request is pending.
drop policy if exists agreements_read on public.agreements;
create policy agreements_read on public.agreements for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.bookings b where b.id = booking_id
      and b.client_id = (select auth.uid()) and b.status in ('Confirmed', 'Completed')
  )
);

-- A pending agreement is hidden from the client by RLS. Check links through a
-- restricted definer function so cleanup cannot delete its signed image merely
-- because the pending agreement row is hidden from that client.
create function public.own_signature_is_linked(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select (storage.foldername(p_path))[1] = 'signature'
    and (storage.foldername(p_path))[2] = (select auth.uid())::text
    and exists (select 1 from public.agreements a where a.client_signature_path = p_path);
$$;
revoke all on function public.own_signature_is_linked(text) from public;
grant execute on function public.own_signature_is_linked(text) to authenticated;
drop policy if exists agreement_signature_staged_cleanup on storage.objects;
create policy agreement_signature_staged_cleanup on storage.objects for delete to authenticated
using (bucket_id = 'agreement-files' and (storage.foldername(name))[1] = 'signature'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and not public.own_signature_is_linked(name));

-- Create booking, payment record, preferences and signed agreement in one
-- transaction. Files must have been uploaded to the client's private paths.
create function public.submit_signed_booking(
  submission_id uuid, form_data jsonb, proof_path text, signature_path text,
  agreement_version text, agreement_terms text, admin_png_base64 text, sign_consent boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := (select auth.uid());
  result uuid;
  material jsonb;
begin
  if actor is null or sign_consent is distinct from true then raise exception 'Agreement consent is required'; end if;
  result := public.submit_booking_with_preferences(submission_id, form_data, proof_path);
  material := public.agreement_signing_material(result);
  if agreement_version is distinct from material->>'version' or agreement_terms is distinct from material->>'terms' then
    raise exception 'Agreement terms have changed. Refresh and review them before signing.';
  end if;
  perform public.sign_booking_agreement(result, material->>'version', material->>'terms', material->'booking_snapshot', signature_path, admin_png_base64, true);
  update public.bookings set request_notice = 'I understand that my booking request is not confirmed until payment is verified.' where id = result and client_id = actor;
  return result;
end;
$$;
revoke all on function public.submit_signed_booking(uuid,jsonb,text,text,text,text,text,boolean) from public;
grant execute on function public.submit_signed_booking(uuid,jsonb,text,text,text,text,text,boolean) to authenticated;
