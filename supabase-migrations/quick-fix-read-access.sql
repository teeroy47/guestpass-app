-- ============================================================================
-- QUICK FIX: Allow reading users table
-- ============================================================================
-- This fixes the 406 error by allowing authenticated users to read the users table
-- Run this first if you're getting 406 errors
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting read policies
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

-- Create a simple read policy for all authenticated users
CREATE POLICY "Allow authenticated users to read all profiles"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Verify it worked
SELECT 
  tablename, 
  policyname, 
  cmd as operation,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'SELECT';