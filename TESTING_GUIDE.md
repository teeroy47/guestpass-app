# Testing Guide: Real-Time Scanner Monitoring

This guide will help you test all three implemented features to ensure they're working correctly.

## Prerequisites

Before testing, ensure you have:
1. ✅ Applied the database migrations to Supabase
2. ✅ Installed all dependencies (`npm install`)
3. ✅ At least one admin account and one usher account
4. ✅ At least one active event with guests

---

## 🗄️ Step 1: Apply Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `supabase-migration-scanner-sessions.sql`
5. Click **Run** to execute
6. Create another new query
7. Copy and paste the contents of `supabase-scanner-session-functions.sql`
8. Click **Run** to execute

### Option B: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

### Verify Migration Success

Run this query in SQL Editor to verify the table was created:

```sql
SELECT * FROM scanner_sessions LIMIT 1;
```

You should see the table structure (even if empty).

---

## 🧪 Feature 1: Active Scanners Auto-Refresh (30 seconds)

### What This Feature Does
The "Active Scanners" card on the dashboard automatically refreshes every 30 seconds to show how many scanners are currently active (based on check-ins within the last 5 minutes).

### Testing Steps

1. **Login as Admin**
   - Navigate to the dashboard
   - Look for the "Active Scanners" card in the Overview tab

2. **Open Scanner in Another Tab/Device**
   - Open a new browser tab or use another device
   - Login as an usher (or admin)
   - Navigate to Events → Click "Scan" on an event
   - The scanner should open

3. **Perform a Check-In**
   - Scan a guest's QR code (or manually check in a guest)
   - Wait for successful check-in confirmation

4. **Verify Auto-Refresh**
   - Go back to the admin dashboard (Overview tab)
   - Watch the "Active Scanners" card
   - Within 30 seconds, the count should update to show "1 active scanner"
   - Check your browser console for: `"Auto-refreshing guest data..."`

5. **Test Multiple Scanners**
   - Open scanners on 2-3 different devices/tabs
   - Perform check-ins on each
   - The "Active Scanners" count should reflect all active scanners

### Expected Results
- ✅ Active scanner count updates automatically every 30 seconds
- ✅ Console shows refresh logs every 30 seconds
- ✅ Count reflects scanners active within last 5 minutes
- ✅ No page refresh required

---

## ⏱️ Feature 2: Average Check-In Time Tracking

### What This Feature Does
The Analytics Dashboard displays the average time guests check in relative to the event start time, formatted intelligently (seconds, minutes, or hours).

### Testing Steps

1. **Login as Admin**
   - Navigate to Dashboard → Analytics tab

2. **Select an Event with Check-Ins**
   - Use the event dropdown to select an event
   - Ensure the event has at least a few checked-in guests

3. **Locate Average Check-In Time**
   - Look for the "Average Check-In Time" metric
   - It should display in one of these formats:
     - "X seconds early/late/on-time" (< 1 minute)
     - "X minutes early/late/on-time" (< 60 minutes)
     - "X hours Y minutes early/late/on-time" (≥ 60 minutes)

4. **Verify Color Coding**
   - **Green badge**: Guests checked in early
   - **Amber badge**: Guests checked in late
   - **Blue badge**: Guests checked in on time (within ±5 minutes)

5. **Test with Different Scenarios**
   - Create a test event starting in 1 hour
   - Check in a guest now → Should show "early"
   - Create an event that started 30 minutes ago
   - Check in a guest now → Should show "late"

### Expected Results
- ✅ Average check-in time displays correctly
- ✅ Time format is appropriate (seconds/minutes/hours)
- ✅ Color coding matches timing (green/amber/blue)
- ✅ Updates when new guests check in

---

## 👥 Feature 3: Active Scanner Sessions with Usernames (Admin Only)

### What This Feature Does
Admins can see a real-time list of all active scanner sessions, including:
- Usher names (e.g., "Tapiwanashe")
- Event names they're scanning
- Number of scans per session
- Last activity timestamp
- Real-time updates via Supabase subscriptions + 30-second polling

### Testing Steps

#### Part A: Basic Visibility

1. **Login as Usher**
   - Navigate to Dashboard → Overview tab
   - Verify you **DO NOT** see "Active Scanner Sessions" section
   - This confirms admin-only visibility

2. **Login as Admin**
   - Navigate to Dashboard → Overview tab
   - Scroll down to find "Active Scanner Sessions" card
   - Initially, it should show "No active scanner sessions"

#### Part B: Session Tracking

3. **Start a Scanner Session**
   - Open a new tab/device
   - Login as usher (e.g., username "Tapiwanashe")
   - Navigate to Events → Click "Scan" on an event
   - Scanner should open and start

4. **Verify Session Appears**
   - Go back to admin dashboard
   - Within a few seconds (real-time) or up to 30 seconds (polling), you should see:
     ```
     Active Scanner Sessions
     
     Tapiwanashe
     Event: [Event Name]
     Scans: 0 | Last active: just now
     ```

5. **Perform Scans**
   - In the scanner tab, scan a guest QR code
   - Check in the guest successfully
   - Go back to admin dashboard
   - The scan count should update: "Scans: 1"
   - Scan another guest
   - Count should update: "Scans: 2"

6. **Test Multiple Sessions**
   - Open scanners on 2-3 different devices/accounts
   - Each should appear as a separate session
   - Each should track its own scan count
   - Example display:
     ```
     Active Scanner Sessions (3 active, 7 total scans)
     
     Tapiwanashe
     Event: Wedding Reception
     Scans: 3 | Last active: 30 seconds ago
     
     John Doe
     Event: Corporate Event
     Scans: 2 | Last active: just now
     
     Jane Smith
     Event: Wedding Reception
     Scans: 2 | Last active: 1 minute ago
     ```

#### Part C: Real-Time Updates

7. **Test Real-Time Subscription**
   - Keep admin dashboard open
   - In another tab, perform a scan
   - The admin dashboard should update **immediately** (within 1-2 seconds)
   - No page refresh required

8. **Test Polling Fallback**
   - If real-time doesn't work, polling ensures updates every 30 seconds
   - Perform a scan and wait up to 30 seconds
   - Dashboard should update

#### Part D: Session Cleanup

9. **Close Scanner**
   - In the scanner tab, click "Stop Scanning" or close the tab
   - Go back to admin dashboard
   - Within 30 seconds, that session should disappear from the list

10. **Test Inactivity Timeout**
    - Open a scanner but don't scan anything
    - Wait 10 minutes
    - The session should automatically end (marked as inactive)
    - It will disappear from the active sessions list

### Expected Results
- ✅ Only admins can see "Active Scanner Sessions"
- ✅ Sessions appear when scanners start
- ✅ Usher names display correctly (e.g., "Tapiwanashe")
- ✅ Event names display correctly
- ✅ Scan counts increment in real-time
- ✅ Last activity timestamps update ("just now", "2 minutes ago")
- ✅ Recently active sessions highlighted (green background < 1 minute)
- ✅ Sessions disappear when scanner closes
- ✅ Inactive sessions (10+ minutes) auto-cleanup
- ✅ Summary shows total active scanners and total scans

---

## 🐛 Troubleshooting

### Issue: Active Scanners Count Not Updating

**Symptoms:** The "Active Scanners" card shows 0 even after check-ins

**Solutions:**
1. Check browser console for errors
2. Verify the 30-second interval is running (look for console logs)
3. Ensure guests were checked in within the last 5 minutes
4. Refresh the page manually to force an update

### Issue: Active Scanner Sessions Not Appearing

**Symptoms:** Admin dashboard doesn't show scanner sessions

**Solutions:**
1. Verify database migrations were applied:
   ```sql
   SELECT * FROM scanner_sessions;
   ```
2. Check browser console for errors
3. Verify you're logged in as admin
4. Check Supabase RLS policies are enabled
5. Verify the scanner actually started (check console logs in scanner tab)

### Issue: Scan Counts Not Incrementing

**Symptoms:** Session appears but scan count stays at 0

**Solutions:**
1. Verify the `increment_scanner_session_scans()` function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'increment_scanner_session_scans';
   ```
2. Check function permissions:
   ```sql
   GRANT EXECUTE ON FUNCTION increment_scanner_session_scans(UUID) TO authenticated;
   ```
3. Check browser console for errors during scan
4. Verify the scan was successful (guest checked in)

### Issue: Real-Time Updates Not Working

**Symptoms:** Dashboard only updates after page refresh

**Solutions:**
1. Check Supabase Realtime is enabled for `scanner_sessions` table
2. Verify browser console for subscription errors
3. The 30-second polling fallback should still work
4. Check network tab for WebSocket connections

### Issue: Sessions Not Ending

**Symptoms:** Sessions remain active after closing scanner

**Solutions:**
1. Check browser console for errors when closing scanner
2. Verify the cleanup useEffect is running
3. Manually end sessions in database:
   ```sql
   UPDATE scanner_sessions 
   SET is_active = FALSE, ended_at = NOW() 
   WHERE is_active = TRUE;
   ```
4. Wait 10 minutes for automatic cleanup

### Issue: Usher Names Not Displaying

**Symptoms:** Sessions show but usher name is blank or incorrect

**Solutions:**
1. Verify user has a display name set in the database:
   ```sql
   SELECT id, email, raw_user_meta_data->>'display_name' as display_name 
   FROM auth.users;
   ```
2. Update display name if missing:
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = raw_user_meta_data || '{"display_name": "Tapiwanashe"}'::jsonb
   WHERE email = 'usher@example.com';
   ```
3. Check the `useAuth` context is providing `displayName`

---

## 📊 Performance Testing

### Test with Multiple Concurrent Users

1. **Setup:**
   - Create 5-10 test accounts (mix of admin and usher)
   - Create 2-3 test events with guests

2. **Simulate Load:**
   - Open 5-10 browser tabs/devices
   - Login with different accounts
   - Open scanners simultaneously
   - Perform check-ins rapidly

3. **Monitor:**
   - Admin dashboard should handle all sessions
   - Real-time updates should remain responsive
   - Database queries should be fast (< 100ms)
   - No memory leaks or performance degradation

4. **Expected Performance:**
   - ✅ Handles 10+ concurrent scanners smoothly
   - ✅ Real-time updates within 1-2 seconds
   - ✅ Polling fallback works reliably
   - ✅ No UI lag or freezing
   - ✅ Database queries remain fast

---

## ✅ Final Verification Checklist

Before considering the implementation complete, verify:

- [ ] Database migrations applied successfully
- [ ] `scanner_sessions` table exists with correct schema
- [ ] `increment_scanner_session_scans()` function exists
- [ ] RLS policies are enabled and working
- [ ] Active Scanners card auto-refreshes every 30 seconds
- [ ] Console logs show refresh activity
- [ ] Average Check-In Time displays on Analytics Dashboard
- [ ] Time formatting is correct (seconds/minutes/hours)
- [ ] Color coding works (green/amber/blue)
- [ ] Active Scanner Sessions visible to admins only
- [ ] Usher names display correctly
- [ ] Event names display correctly
- [ ] Scan counts increment in real-time
- [ ] Last activity timestamps update
- [ ] Recently active sessions highlighted
- [ ] Sessions end when scanner closes
- [ ] Inactive sessions auto-cleanup after 10 minutes
- [ ] Real-time subscriptions working
- [ ] 30-second polling fallback working
- [ ] Multiple concurrent sessions work correctly
- [ ] No console errors
- [ ] Performance is acceptable with 10+ scanners

---

## 🎉 Success Criteria

All three features are working correctly when:

1. **Active Scanners Auto-Refresh:**
   - Card updates every 30 seconds without manual refresh
   - Count accurately reflects scanners active in last 5 minutes

2. **Average Check-In Time:**
   - Displays on Analytics Dashboard
   - Shows appropriate time format (seconds/minutes/hours)
   - Color-coded correctly (early/late/on-time)

3. **Active Scanner Sessions:**
   - Visible to admins only
   - Shows usher names (e.g., "Tapiwanashe")
   - Shows event names
   - Tracks scan counts per session
   - Updates in real-time (< 2 seconds) or via polling (< 30 seconds)
   - Sessions end properly when scanner closes
   - Handles multiple concurrent sessions

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Check Supabase logs for database errors
3. Review the implementation files:
   - `lib/supabase/scanner-session-service.ts`
   - `components/dashboard/active-scanner-sessions.tsx`
   - `components/scanner/qr-scanner.tsx`
   - `lib/guests-context.tsx`
4. Refer to `SCANNER_TRACKING_SETUP.md` for detailed setup instructions
5. Refer to `ACTIVE_SCANNER_TRACKING.md` for technical documentation

---

**Last Updated:** 2024
**Version:** 1.0.0