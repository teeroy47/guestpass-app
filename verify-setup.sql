-- Verification Script for Scanner Session Tracking
-- Run this in Supabase SQL Editor to verify your setup

-- ============================================
-- 1. Check if scanner_sessions table exists
-- ============================================
SELECT 
  'scanner_sessions table' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'scanner_sessions'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run supabase-migration-scanner-sessions.sql'
  END as status;

-- ============================================
-- 2. Check table structure
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'scanner_sessions'
ORDER BY ordinal_position;

-- ============================================
-- 3. Check indexes
-- ============================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'scanner_sessions'
  AND schemaname = 'public';

-- ============================================
-- 4. Check RLS is enabled
-- ============================================
SELECT 
  'RLS Status' as check_name,
  CASE 
    WHEN relrowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED - RLS should be enabled'
  END as status
FROM pg_class
WHERE relname = 'scanner_sessions';

-- ============================================
-- 5. Check RLS policies
-- ============================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'scanner_sessions';

-- ============================================
-- 6. Check if increment function exists
-- ============================================
SELECT 
  'increment_scanner_session_scans function' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_proc 
      WHERE proname = 'increment_scanner_session_scans'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run supabase-scanner-session-functions.sql'
  END as status;

-- ============================================
-- 7. Check function permissions
-- ============================================
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'increment_scanner_session_scans';

-- ============================================
-- 8. Check if cleanup function exists
-- ============================================
SELECT 
  'end_inactive_scanner_sessions function' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT FROM pg_proc 
      WHERE proname = 'end_inactive_scanner_sessions'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run supabase-migration-scanner-sessions.sql'
  END as status;

-- ============================================
-- 9. View current active sessions (if any)
-- ============================================
SELECT 
  ss.id,
  ss.usher_name,
  ss.usher_email,
  e.title as event_name,
  ss.scans_count,
  ss.started_at,
  ss.last_activity_at,
  ss.is_active,
  EXTRACT(EPOCH FROM (NOW() - ss.last_activity_at)) as seconds_since_activity
FROM scanner_sessions ss
LEFT JOIN events e ON e.id = ss.event_id
WHERE ss.is_active = TRUE
ORDER BY ss.last_activity_at DESC;

-- ============================================
-- 10. View recent session history
-- ============================================
SELECT 
  ss.id,
  ss.usher_name,
  e.title as event_name,
  ss.scans_count,
  ss.started_at,
  ss.ended_at,
  EXTRACT(EPOCH FROM (ss.ended_at - ss.started_at)) / 60 as session_duration_minutes,
  ss.is_active
FROM scanner_sessions ss
LEFT JOIN events e ON e.id = ss.event_id
ORDER BY ss.started_at DESC
LIMIT 10;

-- ============================================
-- 11. Test increment function (optional)
-- ============================================
-- Uncomment to test (replace with actual session ID)
-- SELECT increment_scanner_session_scans('00000000-0000-0000-0000-000000000000');

-- ============================================
-- 12. Test cleanup function (optional)
-- ============================================
-- Uncomment to test
-- SELECT end_inactive_scanner_sessions();

-- ============================================
-- SUMMARY
-- ============================================
SELECT 
  '=== SETUP VERIFICATION SUMMARY ===' as summary,
  '' as details
UNION ALL
SELECT 
  'Total Sessions (All Time)',
  COUNT(*)::text
FROM scanner_sessions
UNION ALL
SELECT 
  'Active Sessions (Now)',
  COUNT(*)::text
FROM scanner_sessions
WHERE is_active = TRUE
UNION ALL
SELECT 
  'Total Scans (All Time)',
  COALESCE(SUM(scans_count), 0)::text
FROM scanner_sessions
UNION ALL
SELECT 
  'Average Scans Per Session',
  COALESCE(ROUND(AVG(scans_count), 2), 0)::text
FROM scanner_sessions
WHERE scans_count > 0;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- If setup is correct, you should see:
-- ✅ scanner_sessions table EXISTS
-- ✅ All required columns present
-- ✅ 4 indexes created
-- ✅ RLS ENABLED
-- ✅ 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)
-- ✅ increment_scanner_session_scans function EXISTS
-- ✅ end_inactive_scanner_sessions function EXISTS
-- ============================================