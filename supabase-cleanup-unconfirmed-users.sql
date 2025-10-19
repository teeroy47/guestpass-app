-- Cleanup unconfirmed user accounts after 24 hours
-- This function should be run as a scheduled job (cron) in Supabase

-- Create a function to delete unconfirmed users older than 24 hours
CREATE OR REPLACE FUNCTION cleanup_unconfirmed_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete users from auth.users who haven't confirmed their email within 24 hours
  DELETE FROM auth.users
  WHERE 
    email_confirmed_at IS NULL
    AND created_at < NOW() - INTERVAL '24 hours'
    AND email != 'chiunyet@africau.edu'; -- Protect admin account
    
  -- Also clean up corresponding records in public.users table
  DELETE FROM public.users
  WHERE id IN (
    SELECT id FROM auth.users
    WHERE 
      email_confirmed_at IS NULL
      AND created_at < NOW() - INTERVAL '24 hours'
      AND email != 'chiunyet@africau.edu'
  );
  
  RAISE NOTICE 'Cleaned up unconfirmed users older than 24 hours';
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION cleanup_unconfirmed_users() TO service_role;

-- Create a scheduled job to run this function every hour
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- You can enable it in: Database > Extensions > pg_cron

-- First, enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job to run every hour
SELECT cron.schedule(
  'cleanup-unconfirmed-users',  -- Job name
  '0 * * * *',                   -- Cron expression: every hour at minute 0
  $$SELECT cleanup_unconfirmed_users()$$
);

-- To manually run the cleanup (for testing):
-- SELECT cleanup_unconfirmed_users();

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule the job (if needed):
-- SELECT cron.unschedule('cleanup-unconfirmed-users');

-- To view job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;