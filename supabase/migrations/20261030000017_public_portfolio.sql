-- Public portfolio is separate from private client galleries.
create table if not exists public.portfolio_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  public_id text not null unique,
  image_url text not null check (image_url like 'https://res.cloudinary.com/%'),
  created_at timestamptz not null default now()
);
alter table public.portfolio_photos enable row level security;
create policy portfolio_public_read on public.portfolio_photos for select to anon, authenticated using (true);
create policy portfolio_admin_insert on public.portfolio_photos for insert to authenticated with check (public.is_admin());
