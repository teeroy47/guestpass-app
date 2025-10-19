# Deployment Checklist - All New Features

## 📋 Pre-Deployment Checklist

### Code Review
- [x] All features implemented
- [x] Code tested locally
- [x] No console errors
- [x] TypeScript compiles successfully
- [x] All imports resolved

### Documentation
- [x] Feature documentation created
- [x] Setup guides written
- [x] Troubleshooting guides included
- [x] SQL scripts prepared

---

## 🚀 Deployment Steps

### Step 1: Deploy Code to Vercel

```bash
# Commit all changes
git add .
git commit -m "feat: usher roles, bulk actions, password reset, email expiry cleanup"
git push origin main
```

**Wait for Vercel deployment to complete** ⏳

---

### Step 2: Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **guestpass-app**
3. Go to **Settings** → **Environment Variables**
4. Verify/Add:
   ```
   Name:  APP_URL
   Value: https://guestpass-app.vercel.app
   ```
5. Apply to: **Production, Preview, Development**
6. Click **Save**
7. **Redeploy** if needed

---

### Step 3: Configure Supabase

#### A. Enable pg_cron Extension

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Database** → **Extensions**
4. Search for `pg_cron`
5. Click **Enable**
6. ✅ Wait for confirmation

#### B. Configure JWT Settings (Session Timeout)

1. Go to **Authentication** → **Settings**
2. Find **JWT Settings** section
3. Configure:
   ```
   JWT Expiry: 86400 (24 hours in seconds)
   Refresh Token Rotation: ✅ Enabled
   Reuse Interval: 10 (seconds)
   ```
4. Click **Save**

#### C. Add Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. **Site URL:** `https://guestpass-app.vercel.app`
3. **Redirect URLs** (add all of these):
   ```
   https://guestpass-app.vercel.app/auth/callback
   https://guestpass-app.vercel.app/dashboard
   https://guestpass-app.vercel.app/reset-password
   http://localhost:5173/auth/callback
   http://localhost:5173/dashboard
   http://localhost:5173/reset-password
   ```
4. Click **Save**

#### D. Run Cleanup Job SQL

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `supabase-cleanup-unconfirmed-users.sql`
4. Paste into editor
5. Click **Run** (or press Ctrl+Enter)
6. ✅ Wait for "Success" message

#### E. Verify Scheduled Job

1. In **SQL Editor**, run:
   ```sql
   SELECT * FROM cron.job;
   ```
2. ✅ Should see job named `cleanup-unconfirmed-users`
3. ✅ Schedule should be `0 * * * *` (every hour)

---

## ✅ Post-Deployment Verification

### Test 1: Usher Role Assignment (5 min)

1. **Sign up with new email** (not chiunyet@africau.edu)
   ```
   Email: test-usher-[timestamp]@example.com
   Password: TestPassword123!
   Name: Test Usher
   ```

2. **Check email and confirm**
   - Click confirmation link
   - Should redirect to dashboard

3. **Verify role**
   - ✅ Badge should show "usher"
   - ✅ No "Create Event" button
   - ✅ No "Upload" tab
   - ✅ No "Analytics" tab
   - ✅ Can see "Scanner" tab
   - ✅ Can see "Guests" tab

### Test 2: Admin Role (3 min)

1. **Sign in as admin**
   ```
   Email: chiunyet@africau.edu
   Password: [your password]
   ```

2. **Verify admin permissions**
   - ✅ Badge shows "admin"
   - ✅ "Create Event" button visible
   - ✅ "Upload" tab visible
   - ✅ "Analytics" tab visible
   - ✅ "Bulk Actions" button visible

### Test 3: Bulk Event Actions (5 min)

1. **As admin, go to Events page**
2. **Click "Bulk Actions"**
   - ✅ Checkboxes appear on event cards
   - ✅ Action buttons change

3. **Select 2-3 events**
   - ✅ Checkboxes can be checked
   - ✅ Count updates in buttons

4. **Test status change**
   - Click "Change Status" dropdown
   - Select "Active"
   - ✅ Events update to "active" status

5. **Test bulk delete**
   - Select different events
   - Click "Delete" button
   - Confirm deletion
   - ✅ Events are removed

### Test 4: Password Reset Flow (5 min)

1. **Go to login page**
2. **Click "Forgot your password?"**
3. **Enter email and submit**
   - ✅ Success message appears
   - ✅ Email received (check spam)

4. **Click reset link in email**
   - ✅ Redirects to reset password page
   - ✅ No errors shown

5. **Enter new password (twice)**
   - ✅ Password requirements shown
   - ✅ Passwords must match

6. **Submit new password**
   - ✅ Success message
   - ✅ Redirects to dashboard

7. **Sign out and sign in with new password**
   - ✅ New password works

### Test 5: Email Confirmation Expiry (Manual)

1. **In Supabase SQL Editor, run:**
   ```sql
   -- Check for unconfirmed users
   SELECT 
     id,
     email,
     created_at,
     email_confirmed_at,
     NOW() - created_at AS age
   FROM auth.users
   WHERE email_confirmed_at IS NULL
   ORDER BY created_at DESC;
   ```

2. **Manually trigger cleanup:**
   ```sql
   SELECT cleanup_unconfirmed_users();
   ```

3. **Check job history:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE command LIKE '%cleanup_unconfirmed_users%'
   ORDER BY start_time DESC 
   LIMIT 5;
   ```

4. ✅ Function should run without errors

### Test 6: Session Timeout (Quick Test)

1. **Sign in to app**
2. **Open DevTools** (F12)
3. **Go to Application → Local Storage**
4. **Delete `guestpass-auth-token`**
5. **Try to access /dashboard**
   - ✅ Should redirect to /login

---

## 🔍 Monitoring & Verification

### Check Scheduled Job Status

```sql
-- View scheduled jobs
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job;
```

**Expected Output:**
```
jobid | schedule   | command                              | active
------|------------|--------------------------------------|-------
1     | 0 * * * *  | SELECT cleanup_unconfirmed_users()   | true
```

### Check Job Run History

```sql
-- View recent job runs
SELECT 
  jobid,
  runid,
  job_pid,
  status,
  return_message,
  start_time,
  end_time,
  end_time - start_time AS duration
FROM cron.job_run_details
WHERE command LIKE '%cleanup_unconfirmed_users%'
ORDER BY start_time DESC
LIMIT 10;
```

### Check Unconfirmed Users

```sql
-- View all unconfirmed users and their age
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS hours_old
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
```

### Check User Roles

```sql
-- View all users and their roles
SELECT 
  u.id,
  u.email,
  u.role,
  u.created_at,
  au.email_confirmed_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC
LIMIT 20;
```

---

## 🐛 Troubleshooting

### Issue: New users still getting "admin" role

**Diagnosis:**
```sql
-- Check recent user roles
SELECT id, email, role, created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;
```

**Solutions:**
1. Verify code is deployed (check Vercel deployment log)
2. Clear browser cache and localStorage
3. Sign up with completely new email
4. Check `lib/auth-context.tsx` has updated role logic

---

### Issue: Bulk actions not showing

**Diagnosis:**
- Check browser console for errors
- Verify user role: `SELECT role FROM public.users WHERE email = 'your-email';`

**Solutions:**
1. Ensure logged in as admin (chiunyet@africau.edu)
2. Hard refresh page (Ctrl+Shift+R)
3. Check `components/events/event-list.tsx` deployed correctly

---

### Issue: Password reset email not received

**Diagnosis:**
```sql
-- Check auth logs in Supabase
-- Go to: Logs → Auth Logs
-- Filter for: password_recovery
```

**Solutions:**
1. Check spam/junk folder
2. Verify redirect URLs in Supabase include `/reset-password`
3. Check email template: **Authentication** → **Email Templates** → **Reset Password**
4. Verify `APP_URL` environment variable in Vercel

---

### Issue: Cleanup job not running

**Diagnosis:**
```sql
-- Check if job exists
SELECT * FROM cron.job;

-- Check job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 5;
```

**Solutions:**
1. Verify `pg_cron` extension is enabled
2. Re-run the SQL script
3. Check Supabase logs for errors
4. Manually trigger: `SELECT cleanup_unconfirmed_users();`

---

### Issue: Session not expiring after 24 hours

**Diagnosis:**
- Check JWT settings in Supabase

**Solutions:**
1. Verify JWT Expiry is `86400` (not `3600` or other value)
2. Ensure Refresh Token Rotation is enabled
3. Clear browser localStorage and test again
4. Check `lib/supabase/browser.ts` has `autoRefreshToken: true`

---

## 📊 Success Metrics

After deployment, you should see:

### User Metrics
- ✅ New users have "usher" role (except admin)
- ✅ Admin has "admin" role
- ✅ No duplicate email accounts
- ✅ Email confirmation required

### Event Metrics
- ✅ Admins can bulk select events
- ✅ Admins can bulk change status
- ✅ Admins can bulk delete
- ✅ Ushers see limited options

### Security Metrics
- ✅ Sessions expire after 24 hours
- ✅ Password reset flow works
- ✅ Unconfirmed accounts deleted after 24h
- ✅ Admin account protected from deletion

---

## 📝 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor Supabase logs for errors
- [ ] Check cleanup job runs successfully
- [ ] Verify new user sign-ups work
- [ ] Test password reset flow
- [ ] Monitor user feedback

### Short-term (Week 1)
- [ ] Review cleanup job history
- [ ] Check for any unconfirmed users older than 24h
- [ ] Verify role assignments are correct
- [ ] Monitor session timeout behavior
- [ ] Collect user feedback on new features

### Long-term (Month 1)
- [ ] Analyze bulk action usage
- [ ] Review password reset requests
- [ ] Check cleanup job effectiveness
- [ ] Optimize if needed
- [ ] Document any issues

---

## 🎉 Deployment Complete!

### What's New
✅ Default usher role for new users  
✅ Bulk event selection and actions  
✅ Password reset functionality  
✅ 24-hour email confirmation expiry  
✅ 24-hour session timeout  
✅ Duplicate email prevention  

### Documentation Available
📚 `QUICK_SETUP_GUIDE.md` - Quick setup (5 min)  
📚 `NEW_FEATURES_IMPLEMENTATION.md` - Detailed guide  
📚 `FEATURES_SUMMARY.md` - Feature overview  
📚 `AUTH_SESSION_SETUP.md` - Auth configuration  
📚 `SUPABASE_SESSION_CONFIG.md` - Session setup  

### Support
- Check documentation files for detailed guides
- Review browser console for errors
- Check Supabase logs for backend issues
- Test in incognito mode to rule out caching

---

**Deployment Status:** ✅ Ready for Production  
**Estimated Setup Time:** 15-20 minutes  
**Estimated Testing Time:** 20-30 minutes  
**Total Time:** 35-50 minutes  

🚀 **Happy Deploying!**