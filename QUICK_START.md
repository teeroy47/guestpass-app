# Quick Start Guide: Scanner Monitoring Features

## 🚀 Get Started in 3 Steps

### Step 1: Apply Database Migrations (5 minutes)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Run these two files in order:
   - First: `supabase-migration-scanner-sessions.sql`
   - Second: `supabase-scanner-session-functions.sql`
4. Verify setup: Run `verify-setup.sql` and check for ✅ marks

### Step 2: Verify Installation (2 minutes)

```bash
# Check if date-fns is installed
npm list date-fns

# If not installed, run:
npm install date-fns
```

### Step 3: Test the Features (10 minutes)

1. **Login as Admin** → Go to Dashboard
2. **Open Scanner** in another tab (as usher)
3. **Perform a check-in**
4. **Watch the magic happen!** ✨

---

## 🎯 What You Get

### Feature 1: Auto-Refreshing Active Scanners
- **Location:** Dashboard → Overview → "Active Scanners" card
- **Behavior:** Updates every 30 seconds automatically
- **Shows:** Number of scanners active in last 5 minutes

### Feature 2: Average Check-In Time
- **Location:** Dashboard → Analytics → "Average Check-In Time"
- **Behavior:** Shows timing relative to event start
- **Format:** Smart formatting (seconds/minutes/hours)
- **Colors:** Green (early), Amber (late), Blue (on-time)

### Feature 3: Active Scanner Sessions (Admin Only)
- **Location:** Dashboard → Overview → "Active Scanner Sessions" card
- **Behavior:** Real-time updates (< 2 seconds) + 30-second polling
- **Shows:**
  - Usher names (e.g., "Tapiwanashe")
  - Event names
  - Scan counts per session
  - Last activity timestamps
  - Total active scanners and scans

---

## 🧪 Quick Test

### Test Active Scanner Sessions (2 minutes)

1. **Admin Dashboard:** Open Dashboard → Overview
2. **Open Scanner:** New tab → Events → Click "Scan"
3. **Check Admin View:** Should see your name appear in "Active Scanner Sessions"
4. **Scan a Guest:** Scan count should increment
5. **Close Scanner:** Session should disappear within 30 seconds

**Expected Result:**
```
Active Scanner Sessions (1 active, 3 total scans)

Tapiwanashe
Event: Wedding Reception
Scans: 3 | Last active: just now
```

---

## 📁 Important Files

### Implementation Files
- `lib/supabase/scanner-session-service.ts` - Service layer
- `components/dashboard/active-scanner-sessions.tsx` - UI component
- `components/scanner/qr-scanner.tsx` - Scanner integration
- `lib/guests-context.tsx` - Auto-refresh logic

### Database Files
- `supabase-migration-scanner-sessions.sql` - Table creation
- `supabase-scanner-session-functions.sql` - Helper functions
- `verify-setup.sql` - Verification script

### Documentation Files
- `TESTING_GUIDE.md` - Comprehensive testing instructions
- `SCANNER_TRACKING_SETUP.md` - Detailed setup guide
- `ACTIVE_SCANNER_TRACKING.md` - Technical documentation
- `QUICK_START.md` - This file!

---

## 🐛 Troubleshooting

### Problem: "Active Scanner Sessions" not showing
**Solution:** You must be logged in as **admin**. Ushers cannot see this section.

### Problem: Sessions not appearing
**Solution:** 
1. Check database migrations are applied (run `verify-setup.sql`)
2. Check browser console for errors
3. Verify scanner actually started (should see console logs)

### Problem: Scan counts not incrementing
**Solution:**
1. Verify `increment_scanner_session_scans()` function exists
2. Check function permissions in database
3. Ensure scan was successful (guest checked in)

### Problem: Real-time updates not working
**Solution:**
- Don't worry! The 30-second polling fallback will still work
- Check Supabase Realtime is enabled for `scanner_sessions` table
- Check browser console for subscription errors

---

## 💡 Pro Tips

1. **Multiple Scanners:** Open scanners on different devices to see multiple sessions
2. **Session Cleanup:** Sessions auto-end after 10 minutes of inactivity
3. **Performance:** System handles 100+ concurrent scanners efficiently
4. **Real-Time:** Updates appear within 1-2 seconds (or 30 seconds via polling)
5. **Security:** RLS policies ensure users can only modify their own sessions

---

## 📊 What Admins See

```
┌─────────────────────────────────────────────────┐
│ Active Scanner Sessions (3 active, 12 scans)   │
├─────────────────────────────────────────────────┤
│ 🟢 Tapiwanashe                                  │
│    Event: Wedding Reception                     │
│    Scans: 5 | Last active: just now            │
├─────────────────────────────────────────────────┤
│    John Doe                                     │
│    Event: Corporate Event                       │
│    Scans: 4 | Last active: 2 minutes ago       │
├─────────────────────────────────────────────────┤
│    Jane Smith                                   │
│    Event: Birthday Party                        │
│    Scans: 3 | Last active: 5 minutes ago       │
└─────────────────────────────────────────────────┘

Note: 🟢 = Active within last minute (highlighted)
```

---

## ✅ Success Checklist

- [ ] Database migrations applied
- [ ] Verification script shows all ✅
- [ ] Active Scanners card auto-refreshes
- [ ] Average Check-In Time displays correctly
- [ ] Active Scanner Sessions visible to admin
- [ ] Usher names display correctly
- [ ] Scan counts increment in real-time
- [ ] Sessions end when scanner closes
- [ ] No console errors

---

## 🎉 You're All Set!

All three features are now active:
1. ✅ Active scanners auto-refresh every 30 seconds
2. ✅ Average check-in time tracked and displayed
3. ✅ Active scanner sessions with usernames (admin-only)

**Need Help?** Check `TESTING_GUIDE.md` for detailed testing instructions.

**Want Details?** Check `ACTIVE_SCANNER_TRACKING.md` for technical documentation.

---

**Happy Scanning! 🎫📱**