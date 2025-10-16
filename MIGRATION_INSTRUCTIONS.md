# Migration Instructions - Usher Name Prompt Feature

## Quick Start Guide

You need to run **TWO** migrations in order:

### Migration 1: Usher Statistics (if not already done)
### Migration 2: User Display Name (NEW)

---

## Migration 1: Usher Statistics

**File**: `supabase-migration-usher-stats.sql`

**What it does**:
- Adds `usher_name` and `usher_email` columns to `guests` table
- Creates `usher_statistics` view
- Creates `get_top_usher_for_event()` function

**Steps**:
1. Open Supabase Dashboard → SQL Editor
2. Click "New query"
3. Copy the contents of `supabase-migration-usher-stats.sql`
4. Paste and click "Run"
5. Verify: "Success. No rows returned"

---

## Migration 2: User Display Name

**File**: `supabase-migration-user-display-name.sql`

**What it does**:
- Adds `display_name` column to `users` table
- Creates index for performance

**SQL to run**:
```sql
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
```

**Steps**:
1. Open Supabase Dashboard → SQL Editor
2. Click "New query"
3. Copy the SQL above
4. Paste and click "Run"
5. Verify: "Success. No rows returned"

---

## Enable Realtime (CRITICAL!)

After running both migrations, enable Realtime on the `guests` table:

1. Go to **Database → Replication**
2. Find the `guests` table
3. Toggle the switch to **ON** (green)
4. **DO NOT** enable Realtime on views (`usher_statistics`)

---

## Verification Steps

### 1. Verify Database Changes

**Check `guests` table**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'guests' 
AND column_name IN ('usher_name', 'usher_email');
```
Expected: 2 rows returned

**Check `users` table**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'display_name';
```
Expected: 1 row returned

**Check view exists**:
```sql
SELECT viewname 
FROM pg_views 
WHERE viewname = 'usher_statistics';
```
Expected: 1 row returned

### 2. Test the Application

**Test Name Prompt**:
1. Sign out if logged in
2. Sign in with your account
3. You should see a dialog: "Welcome! What's your name?"
4. Enter your name (e.g., "John Smith")
5. Click "Continue"
6. Dialog should close and dashboard should appear

**Test Check-In**:
1. Go to an event
2. Click "Scan QR Code"
3. Scan a guest
4. Check the database:
```sql
SELECT name, usher_name, usher_email, checked_in_at 
FROM guests 
WHERE checked_in = true 
ORDER BY checked_in_at DESC 
LIMIT 5;
```
5. Verify `usher_name` shows your display name

**Test Usher Statistics**:
1. Go to Dashboard
2. Find "Usher Statistics" card
3. Select an event with check-ins
4. Verify your name appears in the leaderboard
5. Verify scan counts are correct

**Test Real-Time Updates**:
1. Open dashboard on Device A (e.g., Chrome)
2. Open dashboard on Device B (e.g., Firefox or mobile)
3. Navigate to Usher Statistics on both devices
4. Select the same event on both devices
5. Scan a guest on Device A
6. Verify Device B updates instantly (no refresh needed)
7. Check browser console for: "🔴 Real-time check-in detected"

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

### Rollback Migration 2 (Display Name)
```sql
-- Remove display_name column
ALTER TABLE users DROP COLUMN IF EXISTS display_name;

-- Remove index
DROP INDEX IF EXISTS idx_users_display_name;
```

### Rollback Migration 1 (Usher Stats)
```sql
-- Remove function
DROP FUNCTION IF EXISTS get_top_usher_for_event(UUID);

-- Remove view
DROP VIEW IF EXISTS usher_statistics;

-- Remove indexes
DROP INDEX IF EXISTS idx_guests_usher_email;
DROP INDEX IF EXISTS idx_guests_checked_in_by;

-- Remove columns
ALTER TABLE guests DROP COLUMN IF EXISTS usher_name;
ALTER TABLE guests DROP COLUMN IF EXISTS usher_email;
```

---

## Common Issues

### Issue: "column already exists"
**Solution**: This is fine! The migration uses `IF NOT EXISTS`, so it's safe to run multiple times.

### Issue: "permission denied"
**Solution**: Make sure you're using the Supabase SQL Editor with admin privileges, not a client connection.

### Issue: Name prompt doesn't appear
**Solution**: 
1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check browser console for errors
4. Verify migration ran successfully

### Issue: Realtime not working
**Solution**:
1. Verify Realtime is enabled on `guests` table (not the view)
2. Check Supabase project settings → API → Realtime is enabled
3. Check browser console for WebSocket connection errors
4. Try refreshing the page

---

## Post-Migration Tasks

### 1. Update Existing Users (Optional)
If you have existing users who haven't set their display name yet, they'll be prompted on next login. No action needed.

### 2. Backfill Historical Data (Optional)
If you want to update old check-in records with usher names:
```sql
-- This is OPTIONAL and only for historical records
-- New check-ins will automatically have usher names

UPDATE guests 
SET usher_name = users.display_name,
    usher_email = users.email
FROM users
WHERE guests.checked_in_by = users.id
  AND guests.usher_name IS NULL
  AND users.display_name IS NOT NULL;
```

### 3. Monitor Performance
After migration, monitor query performance:
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE indexname IN ('idx_guests_usher_email', 'idx_users_display_name');
```

---

## Success Criteria

✅ Both migrations run without errors  
✅ Realtime enabled on `guests` table  
✅ Name prompt appears for users without display name  
✅ Display name saves to database  
✅ Check-ins record usher name and email  
✅ Usher statistics show display names  
✅ Real-time updates work across devices  
✅ No console errors in browser  

---

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Verify all migration steps were completed
4. Review `USHER_NAME_PROMPT_FEATURE.md` for detailed documentation

---

## Summary

**Total Migrations**: 2  
**Estimated Time**: 5 minutes  
**Downtime Required**: None (migrations are non-breaking)  
**Rollback Available**: Yes  

**What You Get**:
- ✅ Usher name prompt on first login
- ✅ Display names stored in database
- ✅ Usher statistics with real names
- ✅ Real-time leaderboard updates
- ✅ Professional user experience

Ready to proceed? Start with Migration 1, then Migration 2, then enable Realtime! 🚀