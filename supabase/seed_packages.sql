-- Package names, prices and inclusions: src/admin/AdminPackages.tsx.
-- IDs, coverage types, down payments and team requirements: src/data/packages.ts.
-- Existing package IDs are left unchanged; this script never overwrites them.
insert into public.packages
  (id, name, subtitle, coverage_type, price, required_down_payment, inclusions,
   requires_photographer, requires_videographer, is_popular, is_active)
values
  ('captured-moments', 'Captured Moments', 'Photo Coverage Only', 'photo', 9000, 3000,
   jsonb_build_array('Coffee Table Album (100pcs 5R Pictures)', 'Photoshoot / Pre-Nuptial Shoot', '2pcs 8R Size Picture with Elegant Frame', '2x5 Tarpaulin', '8GB Flash Drive'), true, false, false, true),
  ('storyteller', 'Storyteller', 'Photo & Video Coverage', 'photo_video', 16000, 3000,
   jsonb_build_array('Coffee Table Album', 'Photoshoot / Pre-Nuptial Shoot', '1pc 11x14 Picture with Elegant Frame', '1pc 8R Picture with Elegant Frame', '2x3 Tarpaulin', '2x5 Tarpaulin', '32GB Flash Drive', 'Full Edited Video Coverage'), true, true, true, true),
  ('storyteller-guestbook', 'Storyteller + Guestbook', 'Photo & Video Coverage with Guestbook', 'photo_video', 19000, 5000,
   jsonb_build_array('Coffee Table Album', 'Photoshoot / Pre-Nuptial Shoot', '1pc 11x14 Picture with Elegant Frame', '1pc 8R Picture with Elegant Frame', '2x3 Tarpaulin', '2x5 Tarpaulin', '32GB Flash Drive', 'Full Edited Video Coverage', 'Guestbook (10pcs 8R Guestbook Album)'), true, true, false, true),
  ('signature-experience', 'Signature Experience', 'Photo & Video Coverage', 'photo_video', 30000, 5000,
   jsonb_build_array('40-Page Magazine Album (8x10)', 'Pre-Nuptial Shoot', '10 Page Pre-Nuptial Guestbook', '11x14 Signature Frame', '2 Framed 11x14 Prints', '2x3 Tarpaulin', '2x5 Tarpaulin', 'Save The Date Video', 'Wedding Highlights Video', 'Full Coverage Video', '32GB Flash Drive'), true, true, false, true),
  ('digital-keepsake-basic', 'Digital Keepsake Basic', 'Soft Copies Only', 'soft_copy', 4500, 2000,
   jsonb_build_array('Whole Event Soft Copies', '8GB Flash Drive'), true, false, false, true),
  ('digital-keepsake-plus', 'Digital Keepsake Plus', 'Soft Copies Only with Photoshoot', 'soft_copy', 6500, 2000,
   jsonb_build_array('Whole Event Soft Copies', '8GB Flash Drive', 'Photoshoot / Pre-Nuptial'), true, false, false, true)
on conflict (id) do nothing;
