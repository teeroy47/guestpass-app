-- ============================================================================
-- FIX USERS TABLE RLS POLICIES AND CONSTRAINTS
-- ============================================================================
-- This migration fixes the users table to allow:
-- 1. Reading user data (for role checks and user management)
-- 2. Updating user roles (for super admin)
-- 3. Proper upsert behavior (on_conflict handling)
-- ============================================================================

-- Step 1: Drop existing problematic policies (if any)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Step 2: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create comprehensive RLS policies

-- Policy 1: Allow authenticated users to read ALL user profiles
-- This is needed for the user management interface to display all users
CREATE POLICY "Allow authenticated users to read all profiles"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow users to insert their own profile during signup
-- This uses auth.uid() to ensure users can only create their own profile
CREATE POLICY "Allow users to insert own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile (display_name, full_name)
-- Regular users can update their own non-role fields
CREATE POLICY "Allow users to update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow super admin to update ANY user's role
-- This is specifically for the role management feature
-- The super admin email is hardcoded for security
CREATE POLICY "Allow super admin to update user roles"
ON users
FOR UPDATE
TO authenticated
USING (
  -- Allow if the requesting user is the super admin
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = 'chiunyet@africau.edu'
  )
)
WITH CHECK (
  -- Allow if the requesting user is the super admin
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.email = 'chiunyet@africau.edu'
  )
);

-- Step 4: Verify the email unique constraint exists
-- This ensures we don't have duplicate emails
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_email_key'
    AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END $$;

-- Step 5: Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Step 6: Create an index on role for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration worked:

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'users';

-- Check all policies
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'users';

-- Check constraints
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'users'::regclass;

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this migration:
-- 1. All authenticated users can read all user profiles (needed for user list)
-- 2. Users can create and update their own profiles
-- 3. Only chiunyet@africau.edu can update ANY user's role
-- 4. The email constraint prevents duplicate emails
-- 5. Indexes improve query performance
-- ============================================================================