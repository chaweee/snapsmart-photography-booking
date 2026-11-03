-- Shared hard caps for the public chatbot. Only the Edge Function's service role can use this.
create table if not exists public.chat_quota_windows (
  window_key text primary key,
  used integer not null default 0
);
alter table public.chat_quota_windows enable row level security;
revoke all on public.chat_quota_windows from public, anon, authenticated;

create or replace function public.consume_chat_quota() returns boolean
language plpgsql security definer set search_path = public as $$
declare minute_key text := 'm:' || to_char(now() at time zone 'UTC', 'YYYYMMDDHH24MI');
        day_key text := 'd:' || to_char(now() at time zone 'UTC', 'YYYYMMDD');
        minute_used integer; day_used integer;
begin
  perform pg_advisory_xact_lock(732941);
  delete from public.chat_quota_windows where window_key not in (minute_key, day_key);
  select used into minute_used from public.chat_quota_windows where window_key = minute_key;
  select used into day_used from public.chat_quota_windows where window_key = day_key;
  if coalesce(minute_used, 0) >= 15 or coalesce(day_used, 0) >= 300 then return false; end if;
  insert into public.chat_quota_windows values (minute_key, 1), (day_key, 1)
  on conflict (window_key) do update set used = chat_quota_windows.used + 1;
  return true;
end $$;
revoke all on function public.consume_chat_quota() from public, anon, authenticated;
grant execute on function public.consume_chat_quota() to service_role;
