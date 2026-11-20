-- Admins can delete portfolio photos. Without this policy the portfolio-delete
-- edge function (which deletes with the caller's JWT) matched zero rows, so the
-- Cloudinary file was removed but its database record stayed behind.
drop policy if exists portfolio_admin_delete on public.portfolio_photos;
create policy portfolio_admin_delete on public.portfolio_photos
  for delete to authenticated
  using (public.is_admin());
