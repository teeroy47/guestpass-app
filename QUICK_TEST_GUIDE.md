# Quick Test Guide - Scanner Monitoring Changes

## 🎯 Quick 5-Minute Test

This guide helps you verify the changes work correctly.

---

## Test 1: Active Scanner Sessions (No More Refreshes)

### Setup (30 seconds)
1. Open your app in **Chrome** (as admin)
2. Open **DevTools** (F12)
3. Go to **Network** tab
4. Navigate to **Dashboard** tab

### Test Steps (2 minutes)

**Step 1: Verify No Polling**
```
✅ What to do:
   - Watch the Network tab for 60 seconds
   - Look for repeated API calls

✅ Expected result:
   - NO repeated calls to fetch scanner sessions
   - Only WebSocket connection (ws://)
   - No API calls every 30 seconds

❌ If you see:
   - Repeated API calls every 30 seconds
   - Then the change didn't work
```

**Step 2: Test Real-Time Updates**
```
✅ What to do:
   1. Keep admin dashboard open
   2. Open incognito window
   3. Login as usher
   4. Open QR scanner for any event
   5. Watch admin dashboard

✅ Expected result:
   - Scanner session appears within 2 seconds
   - NO page refresh
   - Only the Active Scanner Sessions card updates
   - Smooth animation

❌ If you see:
   - Page refreshes
   - Delay > 5 seconds
   - All cards flicker
   - Then something is wrong
```

**Step 3: Test Scan Count Updates**
```
✅ What to do:
   1. In usher window, scan a guest QR code
   2. Watch admin dashboard

✅ Expected result:
   - Scan count increments within 2 seconds
   - NO page refresh
   - Only the number changes
   - Smooth update

❌ If you see:
   - Page refreshes
   - Count doesn't update
   - Delay > 5 seconds
   - Then check WebSocket connection
```

**Step 4: Test Session End**
```
✅ What to do:
   1. Close scanner in usher window
   2. Watch admin dashboard

✅ Expected result:
   - Session disappears within 2 seconds
   - NO page refresh
   - Smooth removal animation

❌ If you see:
   - Session stays visible
   - Page refreshes
   - Then check the end session logic
```

---

## Test 2: Average Check-In Time (Completed Events Only)

### Setup (1 minute)
1. Create a test event or use existing completed event
2. Ensure event status is "completed" OR past end date
3. Ensure event has some checked-in guests

### Test Steps (2 minutes)

**Step 1: Verify Completed Events Only**
```
✅ What to do:
   1. Go to Analytics tab
   2. Look at "Avg. Check-in Time" card
   3. Note the value

✅ Expected result:
   - Shows time in seconds/minutes (e.g., "45s")
   - Label says "per guest check-in"
   - OR shows "--" with "No completed events"

❌ If you see:
   - "before event start" or "after event start"
   - Then the old logic is still running
```

**Step 2: Test Active Event Exclusion**
```
✅ What to do:
   1. Change all events to status "active"
   2. Refresh Analytics tab
   3. Look at "Avg. Check-in Time" card

✅ Expected result:
   - Shows "--"
   - Label says "No completed events"

❌ If you see:
   - Any time value
   - "before/after event start"
   - Then active events are being included
```

**Step 3: Test Calculation Logic**
```
✅ What to do:
   1. Create a completed event
   2. Add 3 guests
   3. Check them in at these times:
      - Guest 1: 6:00:00 PM (first scan)
      - Guest 2: 6:01:00 PM (1 min later)
      - Guest 3: 6:02:00 PM (2 min later)
   4. Refresh Analytics tab

✅ Expected result:
   - Average = (0 + 1 + 2) / 3 = 1 minute
   - Shows "1m per guest check-in"

❌ If you see:
   - Different calculation
   - "before/after event start"
   - Then calculation is wrong
```

**Step 4: Test Display Formats**
```
✅ What to do:
   - Check different scenarios

✅ Expected formats:
   - < 1 minute: "45s per guest check-in"
   - 1-59 minutes: "15m per guest check-in"
   - ≥ 60 minutes: "2h 30m per guest check-in"
   - No data: "--" with "No completed events"

❌ If you see:
   - "before event start"
   - "after event start"
   - Wrong units
   - Then formatting is wrong
```

---

## Visual Checklist

### ✅ Active Scanner Sessions Card

**Before Changes:**
```
┌─────────────────────────────────────────────────────┐
│ 🔍 Active Scanner Sessions                      [3] │
│ Real-time monitoring • Updates every 30s            │  ← Should be removed
└─────────────────────────────────────────────────────┘
```

**After Changes:**
```
┌─────────────────────────────────────────────────────┐
│ 🔍 Active Scanner Sessions                      [3] │
│ Real-time monitoring                                │  ← Correct!
└─────────────────────────────────────────────────────┘
```

---

### ✅ Average Check-In Time Card

**Before Changes:**
```
┌─────────────────────────────────────────────────────┐
│ ⏱️ Avg. Check-in Time                               │
├─────────────────────────────────────────────────────┤
│                    45m                              │
│         before event start                          │  ← Old label
└─────────────────────────────────────────────────────┘
```

**After Changes:**
```
┌─────────────────────────────────────────────────────┐
│ ⏱️ Avg. Check-in Time                               │
├─────────────────────────────────────────────────────┤
│                    45s                              │
│         per guest check-in                          │  ← New label
└─────────────────────────────────────────────────────┘
```

---

## Common Issues & Solutions

### Issue 1: Page Still Refreshes Every 30 Seconds

**Symptoms:**
- Dashboard refreshes periodically
- All cards flicker
- Network tab shows repeated API calls

**Solution:**
```bash
# Clear browser cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

# Or rebuild the app
npm run build
```

---

### Issue 2: Scanner Sessions Don't Update

**Symptoms:**
- New scanner sessions don't appear
- Scan counts don't increment
- Sessions don't disappear when closed

**Solution:**
```sql
-- Check Supabase real-time is enabled
-- In Supabase SQL Editor:

-- 1. Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'scanner_sessions';

-- 2. Check if real-time is enabled for table
-- Go to Supabase Dashboard → Database → Replication
-- Ensure 'scanner_sessions' table has real-time enabled
```

---

### Issue 3: Average Check-In Time Shows Old Format

**Symptoms:**
- Still shows "before event start" or "after event start"
- Includes active events in calculation

**Solution:**
```bash
# Rebuild the app
npm run build

# Clear browser cache
# Then refresh the page
```

---

### Issue 4: WebSocket Connection Fails

**Symptoms:**
- Console shows WebSocket errors
- Real-time updates don't work
- Falls back to polling (if implemented)

**Solution:**
```javascript
// Check browser console for errors
// Look for messages like:
// "WebSocket connection failed"
// "Real-time subscription error"

// Verify Supabase configuration
// Check .env.local file:
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

// Ensure real-time is enabled in Supabase project settings
```

---

## Success Criteria

### ✅ All Tests Pass If:

**Active Scanner Sessions:**
- [ ] No API calls every 30 seconds
- [ ] WebSocket connection established
- [ ] Updates appear within 2 seconds
- [ ] No page refreshes
- [ ] Only the card updates
- [ ] Description says "Real-time monitoring" (no "Updates every 30s")

**Average Check-In Time:**
- [ ] Shows "--" when no completed events
- [ ] Shows time in seconds/minutes/hours
- [ ] Label says "per guest check-in"
- [ ] Only includes completed events
- [ ] Calculates from first scan time
- [ ] Displays in appropriate units

---

## Quick Commands

### Build & Test
```bash
# Build the app
npm run build

# Start dev server
npm run dev

# Open in browser
# http://localhost:3000
```

### Check Logs
```bash
# Browser console (F12)
# Look for:
✅ "Real-time analytics connected"
✅ "Scanner session started"
✅ "Scanner session updated"

# Supabase logs
# Go to Supabase Dashboard → Logs
# Check for real-time connection logs
```

### Database Verification
```sql
-- Check active sessions
SELECT * FROM scanner_sessions WHERE is_active = true;

-- Check completed events
SELECT * FROM events WHERE status = 'completed';

-- Check guest check-ins
SELECT 
  e.title,
  g.name,
  g.checked_in_at
FROM guests g
JOIN events e ON e.id = g.event_id
WHERE g.checked_in = true
ORDER BY g.checked_in_at;
```

---

## Performance Benchmarks

### Expected Performance

**Active Scanner Sessions:**
- Initial load: < 500ms
- Real-time update latency: < 2 seconds
- Memory usage: < 5MB
- CPU usage: < 1%
- Network: WebSocket only (no polling)

**Average Check-In Time:**
- Calculation time: < 100ms
- Includes only completed events
- Accurate to the second
- Updates when event status changes

---

## Troubleshooting Checklist

If something doesn't work:

1. **Clear browser cache**
   - [ ] Hard refresh (Ctrl+Shift+R)
   - [ ] Clear cache and cookies
   - [ ] Try incognito mode

2. **Check Supabase connection**
   - [ ] Verify .env.local file
   - [ ] Check Supabase dashboard
   - [ ] Verify real-time is enabled

3. **Check database**
   - [ ] Run verify-setup.sql
   - [ ] Check RLS policies
   - [ ] Verify table structure

4. **Check browser console**
   - [ ] Look for errors
   - [ ] Check WebSocket connection
   - [ ] Verify API calls

5. **Rebuild application**
   - [ ] npm run build
   - [ ] Restart dev server
   - [ ] Clear Next.js cache

---

## Need Help?

If tests fail:

1. Check `CHANGES_SUMMARY.md` for detailed changes
2. Check `BEFORE_AFTER_COMPARISON.md` for visual guide
3. Review browser console for errors
4. Check Supabase logs
5. Verify database setup with `verify-setup.sql`

---

## Summary

✅ **Test 1:** Active Scanner Sessions (2 minutes)
   - No polling
   - Real-time updates
   - No page refreshes

✅ **Test 2:** Average Check-In Time (2 minutes)
   - Completed events only
   - Correct calculation
   - Proper display format

**Total time: 5 minutes** ⏱️

---

**If all tests pass, you're ready to deploy!** 🚀