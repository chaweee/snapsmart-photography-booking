-- Run separately only after reviewing the migration and enabling pg_cron.
-- 00:00 UTC is 08:00 Asia/Manila. Never blindly create duplicate jobs.
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception 'Enable pg_cron before scheduling deliverables notifications';
  end if;
  if exists (select 1 from cron.job where jobname = 'snapsmart-deliverables-daily') then
    raise exception 'A job with this name already exists; inspect it before making changes';
  end if;
  perform cron.schedule('snapsmart-deliverables-daily', '0 0 * * *', 'select public.send_deliverables_notifications();');
end $$;
