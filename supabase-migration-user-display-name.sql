-- Migration: Add Display Name to Users Table
-- This migration adds a display_name field to track usher names for statistics

-- Step 1: Add display_name column to users table (if not exists)
-- This will store the usher's preferred display name
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Step 2: Create index for display name lookups (performance optimization)
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN users.display_name IS 'Display name of the usher for statistics tracking';