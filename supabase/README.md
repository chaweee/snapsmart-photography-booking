# SnapSmart Supabase schema

`migrations/20261030000000_initial_schema.sql` is the initial schema for an **empty** Supabase project. It creates profiles, packages, bookings, assignments, payments, agreements, galleries, notifications and admin tasks, along with private Storage buckets and read policies. It does not change the React application or upload existing mock data.

## Apply

1. Back up any existing data and verify the target project. This migration is intended to run only once; it is not an idempotent script.
2. In the Supabase dashboard, open **SQL Editor**, paste the complete migration and run it. Alternatively use the Supabase CLI migration workflow on a linked project.
3. Enable and configure Supabase Auth. The trigger creates a client profile when a new Auth user signs up. Existing Auth users, if any, need profiles created separately.
4. Create your own user through Auth, then promote that specific user from the trusted SQL Editor, replacing the UUID with the user's actual Auth ID:

   ```sql
   update public.profiles set role = 'admin' where id = 'YOUR-AUTH-USER-UUID';
   ```

   Never expose the service role key in the browser or commit credentials. Only trusted operators should grant staff roles.

5. Run `migrations/20261030000001_profile_phone.sql` in SQL Editor after the initial migration to save the signup phone number in new profiles. It does not backfill existing profiles.
6. Add packages via a trusted admin workflow or SQL; package data in `src/data/packages.ts` is not automatically imported.
7. Run `migrations/20261030000002_booking_gallery_permission.sql` after the initial migration to add the opt-in public portfolio permission. Existing bookings default to private.
8. Run `migrations/20261030000003_gallery_admin_upload.sql` to allow authenticated admins to upload private gallery files and clean up failed uploads.

## Auth setup

Copy `.env.example` to `.env.local` and fill in the project URL and publishable key (never the service role key). Restart Vite after editing it. Configure the Supabase Auth site URL and allowed redirect URLs to match your local and deployed app URLs, including `/login` for signup confirmation. If email confirmation is enabled, users must confirm their email before logging in. Password recovery, actual terms and privacy documents, and portal data integration remain to be implemented.

## E-agreement design and limitations

The booking form currently draws on a canvas but does not persist the drawing or submit a booking. The existing client agreement preview uses mock booking data and placeholder signatures, and its download button in `src/client/ClientBookings.tsx` has no click handler. This schema alone does not implement those features.

Each signed agreement stores the actual displayed terms (`agreement_snapshot`), booking details at signing (`booking_snapshot`), client and admin names, exact consent text, signed time, version, and paths to the client signature, a **copied immutable-per-agreement** admin signature, and optionally the final PDF. The admin signature field `admin_signature_snapshot` is a Storage object path, not a URL. Use unique object paths for each agreement and never overwrite signed files. Preserve the rendered signed PDF when available so later changes to templates cannot change the historical document.

Agreement rows and private files are deliberately not writable by browser clients or ordinary admin sessions in this migration. Implement a trusted server or Supabase Edge Function that authenticates the caller, validates ownership and consent, captures server time, copies the admin signature, validates and stores files, and inserts the final agreement. It must handle partial failures and clean up orphan files. `service_role` bypasses RLS, so this server-side validation is essential; also prevent overwriting or deleting completed signed artifacts in that code. A signature image alone does not establish identity or guarantee legal validity.

Bookings and payments are currently writable only by an authenticated admin or trusted backend. To let clients submit bookings, payment proofs or signatures, build a validated submission flow and corresponding narrowly scoped policies or server endpoints. Do not grant direct client write access to price, payment verification, roles or signed agreement records. Galleries and payment proof uploads also need a controlled write workflow. Notifications can be read but marking them read is not implemented. Assigned staff can see their bookings, not private agreements, payments or gallery files.

The optional booking checkbox `publicGalleryPermission` is not persisted until the booking submission workflow is implemented. That workflow must explicitly store the checked value in `bookings.public_gallery_permission`, recording the relevant consent wording and time where appropriate. The flag alone does not publish photos or grant public access to private Storage. A future public portfolio workflow must check permission and handle withdrawal and removal before sharing any photos.

Admin Galleries supports creating drafts for real bookings, uploading JPEG/PNG/WebP images, and releasing a gallery to the linked client. My Galleries fetches only released galleries allowed by RLS and supports individual downloads. Upload failures may leave a partial batch; retry only the files that were not uploaded. A failed database insert attempts to remove its uploaded object, reporting its path if cleanup fails. Download All and public portfolio publishing are not implemented. Signed preview URLs last one hour and can remain usable until expiry even if a gallery is hidden; reload to get fresh URLs. Test all permissions with separate users and confirm the bucket's upload size limits before production.

The app uses Supabase Auth for signup and login, but portal data remains mocked. Connect the existing UI to Supabase only after implementing and testing these workflows. Test RLS with separate client, unrelated client, assigned staff and admin accounts, and test all private bucket access before production.
