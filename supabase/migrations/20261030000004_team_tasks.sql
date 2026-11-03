-- Personal checklists for photographer and videographer accounts.
create table public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);
create index team_tasks_member_created_idx on public.team_tasks(team_member_id, created_at desc);
alter table public.team_tasks enable row level security;

-- An account may access only its own checklist while it has a staff role.
create policy team_tasks_own on public.team_tasks for all to authenticated
  using (team_member_id = (select auth.uid()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('photographer', 'videographer')
  ))
  with check (team_member_id = (select auth.uid()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('photographer', 'videographer')
  ));
