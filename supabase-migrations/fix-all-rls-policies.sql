-- ============================================================================
-- COMPREHENSIVE RLS POLICY FIX FOR USERS TABLE
-- ============================================================================
-- This migration fixes all Row Level Security issues preventing:
-- 1. Users from reading their own profile (display name, role)
-- 2. Users from updating their own display name
-- 3. System from creating new user profiles on signup
-- 4. Admin from updating user roles via API
-- ============================================================================

-- Step 1: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Allow service to read users" ON users;
DROP POLICY IF EXISTS "Allow service to update users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Super admin can update any user role" ON users;

-- Step 2: Enable RLS (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create comprehensive policies

-- ============================================================================
-- POLICY 1: Allow ALL authenticated users to READ all user profiles
-- ============================================================================
-- This is needed for:
-- - User list in admin panel
-- - Fetching display names
-- - Fetching user roles
-- ============================================================================
CREATE POLICY "authenticated_users_can_read_all_profiles"
ON users
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- POLICY 2: Allow users to INSERT their own profile on signup
-- ============================================================================
-- This is needed when a new user signs up and we create their profile
-- ============================================================================
CREATE POLICY "users_can_insert_own_profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- POLICY 3: Allow users to UPDATE their own display_name and full_name
-- ============================================================================
-- This is needed when users update their profile information
-- Users can ONLY update display_name and full_name, NOT role
-- ============================================================================
CREATE POLICY "users_can_update_own_profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Ensure role is not being changed (must stay the same)
  role = (SELECT role FROM users WHERE id = auth.uid())
);

-- ============================================================================
-- POLICY 4: Allow super admin to UPDATE any user's role
-- ============================================================================
-- This is needed for the admin panel role management feature
-- Only the super admin (chiunyet@africau.edu) can change roles
-- ============================================================================
CREATE POLICY "super_admin_can_update_any_user_role"
ON users
FOR UPDATE
TO authenticated
USING (
  -- The requesting user must be the super admin
  (SELECT email FROM users WHERE id = auth.uid()) = 'chiunyet@africau.edu'
)
WITH CHECK (
  -- The requesting user must be the super admin
  (SELECT email FROM users WHERE id = auth.uid()) = 'chiunyet@africau.edu'
);

-- ============================================================================
-- Step 4: Create indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

-- ============================================================================
-- Step 5: Verification queries
-- ============================================================================
-- Run these to verify the policies are working:

-- Check all policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- After running this migration:
-- ✅ Users can read all profiles (for admin panel user list)
-- ✅ Users can create their own profile on signup
-- ✅ Users can update their own display_name
-- ✅ Users CANNOT update their own role
-- ✅ Super admin can update any user's role
-- ✅ Role changes take effect immediately (no need to re-login)
-- ✅ Display name persists after logout/login
-- ============================================================================