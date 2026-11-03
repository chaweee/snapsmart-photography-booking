-- Permission to share selected photos in the public portfolio is opt-in.
-- Existing bookings are treated as private; this does not publish any files.
alter table public.bookings
  add column public_gallery_permission boolean not null default false;

comment on column public.bookings.public_gallery_permission is
  'Client permission to share selected event photos in the public portfolio; false means private. Permission alone does not publish files.';
