-- Delivery estimates are not proof that physical deliverables are ready.
-- Historical due dates before activation do not generate reminder backlogs.
create table if not exists public.deliverables_config (
  singleton boolean primary key default true check (singleton),
  activated_on date not null default ((now() at time zone 'Asia/Manila')::date)
);
alter table public.deliverables_config enable row level security;
revoke all on public.deliverables_config from public, anon, authenticated;
insert into public.deliverables_config (singleton) values (true) on conflict do nothing;

create table if not exists public.booking_deliverables (
  booking_id uuid primary key references public.bookings(id) on delete cascade,
  ready_at timestamptz not null default now(),
  ready_by uuid not null references public.profiles(id) on delete restrict
);
alter table public.booking_deliverables enable row level security;
revoke all on public.booking_deliverables from public, anon, authenticated;
grant select on public.booking_deliverables to authenticated;
create policy deliverables_read on public.booking_deliverables for select to authenticated
using (public.is_admin() or public.owns_booking(booking_id));

-- Separate ledger prevents duplicates even if notifications are deleted or jobs overlap.
create table if not exists public.deliverables_notification_log (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  kind text not null check (kind in ('estimate', 'ready')),
  sent_at timestamptz not null default now(),
  primary key (booking_id, kind)
);
alter table public.deliverables_notification_log enable row level security;
revoke all on public.deliverables_notification_log from public, anon, authenticated;

create or replace function public.mark_deliverables_ready(p_booking_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare b public.bookings%rowtype; inserted integer;
begin
  if (select auth.uid()) is null or not public.is_admin() then raise exception 'Only an admin can mark deliverables ready'; end if;
  select * into b from public.bookings where id = p_booking_id for update;
  if not found or b.status not in ('Confirmed', 'Completed') or b.event_date > (now() at time zone 'Asia/Manila')::date then
    raise exception 'Deliverables can only be marked ready for a confirmed or completed event that has taken place';
  end if;
  insert into public.booking_deliverables (booking_id, ready_by) values (b.id, (select auth.uid())) on conflict do nothing;
  if b.client_id is not null then
    insert into public.deliverables_notification_log (booking_id, kind) values (b.id, 'ready') on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 1 then
      insert into public.notifications (recipient_id, booking_id, title, message, type)
      values (b.client_id, b.id, case when b.is_test then 'TEST: Deliverables ready' else 'Your deliverables are ready' end,
        case when b.is_test then 'This is a test notification, not a real collection notice.' else 'Toni Photography marked your deliverables as ready. Please contact the studio to arrange collection.' end, 'deliverables');
    end if;
  end if;
end $$;
revoke all on function public.mark_deliverables_ready(uuid) from public, anon;
grant execute on function public.mark_deliverables_ready(uuid) to authenticated;

-- Run daily from trusted scheduling only; also catches missed runs and bookings linked later.
create or replace function public.send_deliverables_notifications()
returns integer language plpgsql security definer set search_path = '' as $$
declare b record; inserted integer; total integer := 0; today date := (now() at time zone 'Asia/Manila')::date;
begin
  perform pg_catalog.pg_advisory_xact_lock(732942);
  for b in
    select bk.id, bk.client_id, (bk.event_date + interval '2 months')::date as due_date,
           d.ready_at, c.activated_on
    from public.bookings bk
    cross join public.deliverables_config c
    left join public.booking_deliverables d on d.booking_id = bk.id
    where c.singleton and bk.client_id is not null and bk.status in ('Confirmed', 'Completed')
      and not bk.is_test
      and ((d.ready_at is not null) or ((bk.event_date + interval '2 months')::date between c.activated_on and today))
    for update of bk
  loop
    if b.ready_at is not null then
      insert into public.deliverables_notification_log (booking_id, kind) values (b.id, 'ready') on conflict do nothing;
      get diagnostics inserted = row_count;
      if inserted = 1 then
        insert into public.notifications (recipient_id, booking_id, title, message, type)
        values (b.client_id, b.id, 'Your deliverables are ready', 'Toni Photography marked your deliverables as ready. Please contact the studio to arrange collection.', 'deliverables');
        total := total + 1;
      end if;
    elsif b.due_date <= today then
      insert into public.deliverables_notification_log (booking_id, kind) values (b.id, 'estimate') on conflict do nothing;
      get diagnostics inserted = row_count;
      if inserted = 1 then
        insert into public.notifications (recipient_id, booking_id, title, message, type)
        values (b.client_id, b.id, 'Estimated deliverables date', 'Your estimated deliverables date has arrived. This is not a ready confirmation; please contact Toni Photography for an update.', 'deliverables');
        total := total + 1;
      end if;
    end if;
  end loop;
  return total;
end $$;
revoke all on function public.send_deliverables_notifications() from public, anon, authenticated;
grant execute on function public.send_deliverables_notifications() to service_role;
