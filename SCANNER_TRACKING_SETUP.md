# Scanner Tracking Setup Guide

## Quick Setup (5 Minutes)

Follow these steps to enable active scanner tracking and real-time monitoring.

---

## Step 1: Run Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to **SQL Editor**

2. **Run Migration 1: Scanner Sessions Table**
   - Click **New Query**
   - Copy the entire contents of `supabase-migration-scanner-sessions.sql`
   - Paste into the SQL editor
   - Click **Run** (or press Ctrl+Enter)
   - ✅ You should see "Success. No rows returned"

3. **Run Migration 2: Helper Functions**
   - Click **New Query** again
   - Copy the entire contents of `supabase-scanner-session-functions.sql`
   - Paste into the SQL editor
   - Click **Run**
   - ✅ You should see "Success. No rows returned"

### Option B: Using psql Command Line

```bash
# Set your database connection string
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
psql $DATABASE_URL -f supabase-migration-scanner-sessions.sql
psql $DATABASE_URL -f supabase-scanner-session-functions.sql
```

---

## Step 2: Verify Installation

### Check Tables Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'scanner_sessions';
```

✅ **Expected Result:** One row showing `scanner_sessions`

### Check Functions Created

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'increment_scanner_session_scans';
```

✅ **Expected Result:** One row showing `increment_scanner_session_scans`

### Check RLS Policies

```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'scanner_sessions';
```

✅ **Expected Result:** 4 policies (read, insert, update, delete)

---

## Step 3: Test the Feature

### As Admin:

1. **Login to your app**
2. **Go to Dashboard → Overview tab**
3. **Look for "Active Scanner Sessions" section**
   - Should appear below Quick Actions
   - Shows "No active scanner sessions" initially

### As Usher:

1. **Login as usher**
2. **Go to Scanner tab**
3. **Select an event and start scanning**
4. **Check browser console** - Should see:
   ```
   📊 Scanner session started: <session-id>
   ```

### Verify Real-Time Updates:

1. **Open two browser windows**
   - Window 1: Admin viewing dashboard
   - Window 2: Usher scanning QR codes

2. **Start scanning in Window 2**
3. **Watch Window 1** - Should see:
   - Active scanner appear in real-time
   - Scan count increment with each scan
   - Last activity time update

---

## Step 4: Optional - Set Up Auto-Cleanup

This automatically ends inactive sessions after 10 minutes.

### Using pg_cron (Supabase Pro/Enterprise)

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job (runs every 5 minutes)
SELECT cron.schedule(
  'end-inactive-scanner-sessions',
  '*/5 * * * *',
  'SELECT end_inactive_scanner_sessions()'
);
```

### Using Supabase Edge Functions (All Plans)

Create a scheduled edge function that calls:

```typescript
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error } = await supabase.rpc('end_inactive_scanner_sessions')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

## Troubleshooting

### Issue: "relation 'scanner_sessions' does not exist"

**Solution:**
- Migration didn't run successfully
- Re-run `supabase-migration-scanner-sessions.sql`
- Check for error messages in SQL editor

### Issue: "permission denied for function increment_scanner_session_scans"

**Solution:**
- Function permissions not set correctly
- Re-run `supabase-scanner-session-functions.sql`
- Verify with: `SELECT has_function_privilege('authenticated', 'increment_scanner_session_scans(uuid)', 'execute');`

### Issue: Active Scanner Sessions component not showing

**Solution:**
- Check if user is admin: `user?.app_metadata?.role === "admin"`
- Check browser console for errors
- Verify component is imported in `dashboard.tsx`

### Issue: Scan counts not incrementing

**Solution:**
- Check browser console for errors
- Verify session ID is set: `console.log(scannerSessionId)`
- Check database: `SELECT * FROM scanner_sessions WHERE is_active = true;`

### Issue: Real-time updates not working

**Solution:**
- Check Supabase real-time is enabled for `scanner_sessions` table
- Verify WebSocket connection in browser Network tab
- Fallback to 30-second polling should still work

---

## Verification Checklist

After setup, verify these work:

- [ ] Scanner sessions table exists in database
- [ ] Helper functions created successfully
- [ ] RLS policies are active
- [ ] Admin can see Active Scanner Sessions component
- [ ] Usher cannot see Active Scanner Sessions component
- [ ] Starting scanner creates session in database
- [ ] Scanning QR code increments scan count
- [ ] Stopping scanner ends session
- [ ] Real-time updates work (or 30s polling)
- [ ] Last activity time updates correctly
- [ ] Recently active scanners highlighted green

---

## What's Next?

Once setup is complete, you'll have:

✅ **Real-time monitoring** of all active scanners
✅ **Scan count tracking** per session
✅ **Usher activity visibility** for admins
✅ **Auto-refresh** every 30 seconds
✅ **Automatic cleanup** of inactive sessions

**Admin Dashboard will show:**
- Number of active scanners
- Usher names and emails
- Which events they're scanning
- How many scans they've completed
- When they last scanned

**All automatic** - no manual intervention needed!

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review `ACTIVE_SCANNER_TRACKING.md` for detailed documentation
3. Check browser console for error messages
4. Verify database migrations completed successfully

---

## Files Modified/Created

### New Files:
- `lib/supabase/scanner-session-service.ts` - Session tracking service
- `components/dashboard/active-scanner-sessions.tsx` - Admin dashboard component
- `supabase-migration-scanner-sessions.sql` - Database migration
- `supabase-scanner-session-functions.sql` - Helper functions
- `ACTIVE_SCANNER_TRACKING.md` - Full documentation
- `SCANNER_TRACKING_SETUP.md` - This file

### Modified Files:
- `components/scanner/qr-scanner.tsx` - Added session tracking
- `components/dashboard/dashboard.tsx` - Added Active Scanner Sessions component
- `lib/guests-context.tsx` - Added 30-second auto-refresh

---

**Setup Time:** ~5 minutes
**Complexity:** Low
**Impact:** High - Full visibility into scanner activity!