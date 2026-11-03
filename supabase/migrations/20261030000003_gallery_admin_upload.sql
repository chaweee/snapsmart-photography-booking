-- Allow authenticated admins to upload private gallery photos and clean up failed uploads.
-- Clients still only have read access to files referenced by their released galleries.
create policy gallery_files_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery-files' and public.is_admin());

create policy gallery_files_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'gallery-files' and public.is_admin());

create policy gallery_files_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'gallery-files' and public.is_admin());
