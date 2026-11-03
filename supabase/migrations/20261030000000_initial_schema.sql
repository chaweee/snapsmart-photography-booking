-- SnapSmart initial schema. Apply once to an empty Supabase project.
-- Signing and financial writes are intentionally restricted to trusted staff/backend.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'client' check (role in ('client', 'admin', 'photographer', 'videographer')),
  created_at timestamptz not null default now()
);

create function public.create_profile_for_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create table public.packages (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  coverage_type text not null check (coverage_type in ('photo', 'photo_video', 'soft_copy')),
  price numeric(12,2) not null check (price >= 0),
  required_down_payment numeric(12,2) not null check (required_down_payment >= 0 and required_down_payment <= price),
  inclusions jsonb not null default '[]'::jsonb check (jsonb_typeof(inclusions) = 'array'),
  requires_photographer boolean not null default true,
  requires_videographer boolean not null default false,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete restrict,
  client_name text not null,
  client_email text,
  client_phone text,
  package_id text references public.packages(id) on delete restrict,
  package_snapshot jsonb not null default '{}'::jsonb,
  event_type text not null,
  event_date date not null,
  start_time time,
  end_time time,
  event_location text not null,
  theme_motif text,
  status text not null default 'Pending' check (status in ('Pending', 'Awaiting Payment Verification', 'Confirmed', 'Payment Insufficient', 'Completed', 'Cancelled')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  required_down_payment numeric(12,2) not null check (required_down_payment >= 0 and required_down_payment <= total_amount),
  created_at timestamptz not null default now()
);
create index bookings_client_id_idx on public.bookings(client_id);
create index bookings_event_date_idx on public.bookings(event_date);

create table public.booking_assignments (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  team_member_id uuid not null references public.profiles(id) on delete restrict,
  assignment_role text not null check (assignment_role in ('photographer', 'videographer')),
  primary key (booking_id, team_member_id, assignment_role)
);
create index booking_assignments_member_idx on public.booking_assignments(team_member_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  method text not null,
  reference_number text,
  proof_path text,
  status text not null default 'For Verification' check (status in ('For Verification', 'Verified', 'Insufficient', 'Rejected')),
  verified_by uuid references public.profiles(id) on delete restrict,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index payments_booking_id_idx on public.payments(booking_id);

-- Each signed record preserves the exact terms and relevant booking details.
-- Paths point to private agreement-files; never store public URLs or base64 images here.
create table public.agreements (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  version text not null,
  agreement_snapshot text not null,
  booking_snapshot jsonb not null check (jsonb_typeof(booking_snapshot) = 'object'),
  client_name text not null,
  client_signature_path text not null,
  admin_name text not null,
  admin_signature_snapshot text not null,
  signed_pdf_path text,
  consent_text text not null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (booking_id, version)
);
create index agreements_booking_id_idx on public.agreements(booking_id);

create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  title text not null,
  is_available boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  file_path text not null,
  created_at timestamptz not null default now()
);
create index galleries_booking_id_idx on public.galleries(booking_id);
create index gallery_items_gallery_id_idx on public.gallery_items(gallery_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  title text not null,
  message text not null,
  type text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(recipient_id);

create table public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  booking_id uuid references public.bookings(id) on delete set null,
  due_date date,
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed')),
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER avoids recursive RLS when checking assignments.
create function public.can_access_booking(booking uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bookings b where b.id = booking and
      (b.client_id = (select auth.uid()) or public.is_admin() or exists (
        select 1 from public.booking_assignments a
        where a.booking_id = b.id and a.team_member_id = (select auth.uid())
      ))
  );
$$;
create function public.owns_booking(booking uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bookings b where b.id = booking and b.client_id = (select auth.uid()));
$$;
revoke all on function public.can_access_booking(uuid) from public;
revoke all on function public.owns_booking(uuid) from public;
grant execute on function public.can_access_booking(uuid), public.owns_booking(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.packages enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_assignments enable row level security;
alter table public.payments enable row level security;
alter table public.agreements enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_items enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_tasks enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
-- Only allow users to edit non-privileged columns, never their own role.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy packages_active_read on public.packages for select to anon, authenticated using (is_active);
create policy packages_admin on public.packages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy bookings_read on public.bookings for select to authenticated using (public.can_access_booking(id));
create policy bookings_admin_write on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy assignments_read on public.booking_assignments for select to authenticated using (public.can_access_booking(booking_id));
create policy assignments_admin_write on public.booking_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy payments_read on public.payments for select to authenticated using (public.owns_booking(booking_id) or public.is_admin());
create policy payments_admin_write on public.payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy agreements_read on public.agreements for select to authenticated using (public.owns_booking(booking_id) or public.is_admin());
-- Signed records have no authenticated update/delete policy. Creation is reserved
-- for a trusted backend using service_role after validating consent and files.
create policy galleries_read on public.galleries for select to authenticated using (public.is_admin() or (is_available and public.owns_booking(booking_id)));
create policy galleries_admin_write on public.galleries for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy gallery_items_read on public.gallery_items for select to authenticated using (exists (select 1 from public.galleries g where g.id = gallery_id));
create policy gallery_items_admin_write on public.gallery_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy notifications_read on public.notifications for select to authenticated using (recipient_id = (select auth.uid()) or public.is_admin());
create policy notifications_admin_write on public.notifications for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy tasks_admin on public.admin_tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public) values
  ('agreement-files', 'agreement-files', false),
  ('payment-proofs', 'payment-proofs', false),
  ('gallery-files', 'gallery-files', false);

-- Storage reads are tied to existing authorized database records, not guessed paths.
create policy agreement_files_read on storage.objects for select to authenticated using (
  bucket_id = 'agreement-files' and exists (
    select 1 from public.agreements a where
      (name = a.client_signature_path or name = a.admin_signature_snapshot or name = a.signed_pdf_path)
      and (public.owns_booking(a.booking_id) or public.is_admin())
  )
);
create policy payment_proofs_read on storage.objects for select to authenticated using (
  bucket_id = 'payment-proofs' and exists (
    select 1 from public.payments p where name = p.proof_path and (public.owns_booking(p.booking_id) or public.is_admin())
  )
);
create policy gallery_files_read on storage.objects for select to authenticated using (
  bucket_id = 'gallery-files' and exists (
    select 1 from public.gallery_items i join public.galleries g on g.id = i.gallery_id
    where name = i.file_path and (public.is_admin() or (g.is_available and public.owns_booking(g.booking_id)))
  )
);
-- Uploads are deliberately not enabled here; use a validated trusted backend.
