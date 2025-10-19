# New Features Implementation Guide

## Overview
This document covers the implementation of the following features:
1. **Default Usher Role** - All new users get "usher" role (except admin)
2. **Bulk Event Actions** - Select multiple events to delete or change status
3. **Password Reset** - Forgot password and reset password functionality
4. **Email Confirmation Expiry** - Unconfirmed accounts deleted after 24 hours

---

## 1. Default Usher Role Assignment

### What Changed
- **Previous behavior:** All new users were automatically assigned "admin" role
- **New behavior:** Only `chiunyet@africau.edu` gets "admin" role, all others get "usher" role

### Implementation Details

**File:** `lib/auth-context.tsx`

```typescript
// Determine role: only chiunyet@africau.edu gets admin, everyone else gets usher
const metadataRole = authUser.app_metadata?.role
let role: string

if (metadataRole && typeof metadataRole === "string" && metadataRole.trim().length > 0) {
  // Use existing role from metadata
  role = metadataRole
} else if (email.toLowerCase() === "chiunyet@africau.edu") {
  // Admin email gets admin role
  role = "admin"
} else {
  // All other users get usher role by default
  role = "usher"
}
```

### Role Differences

| Feature | Admin | Usher |
|---------|-------|-------|
| View Events | ✅ | ✅ |
| Scan QR Codes | ✅ | ✅ |
| View Guests | ✅ | ✅ |
| Create Events | ✅ | ❌ |
| Edit Events | ✅ | ❌ |
| Delete Events | ✅ | ❌ |
| Upload Guest Lists | ✅ | ❌ |
| View Analytics | ✅ | ❌ |
| Bulk Actions | ✅ | ❌ |

### Testing
1. Sign up with a new email (not chiunyet@africau.edu)
2. Confirm email and log in
3. ✅ Expected: User has "usher" badge and limited permissions
4. Sign up with chiunyet@africau.edu
5. ✅ Expected: User has "admin" badge and full permissions

---

## 2. Bulk Event Actions

### What Changed
- Added checkbox selection mode for events
- Can select multiple events at once
- Bulk delete multiple events
- Bulk change status (draft/active/completed)

### Implementation Details

**File:** `components/events/event-list.tsx`

**New Features:**
- Selection mode toggle
- Checkbox on each event card (admin only)
- Select all / Deselect all
- Bulk status change dropdown
- Bulk delete button

### How to Use

#### Enable Selection Mode
1. Go to Events page
2. Click **"Bulk Actions"** button
3. Checkboxes appear on all event cards

#### Select Events
- Click checkbox on individual events
- Or click **"Select All"** to select all visible events

#### Change Status
1. Select one or more events
2. Click **"Change Status"** dropdown
3. Choose: Draft, Active, or Completed
4. ✅ All selected events updated

#### Delete Events
1. Select one or more events
2. Click **"Delete"** button
3. Confirm deletion
4. ✅ All selected events deleted

#### Cancel Selection
- Click **"Cancel"** to exit selection mode

### UI Changes

**Before Selection Mode:**
```
[Manage Guests] [Create Event] [Create Invite] [Bulk Actions]
```

**During Selection Mode:**
```
[Cancel] [Select All] [Change Status ▼] [Delete (3)]
                       ├─ Set to Draft
                       ├─ Set to Active
                       └─ Set to Completed
```

### Testing
1. Create 3-5 test events
2. Click "Bulk Actions"
3. ✅ Checkboxes appear on event cards
4. Select 2-3 events
5. Change status to "Active"
6. ✅ Selected events now show "active" badge
7. Select different events
8. Click Delete
9. ✅ Selected events removed

---

## 3. Password Reset Functionality

### What Changed
- Added "Forgot Password" link on login page
- New forgot password page
- New reset password page
- Email-based password reset flow

### Implementation Details

**New Files:**
- `components/auth/forgot-password.tsx` - Request reset link
- `components/auth/reset-password.tsx` - Set new password

**Updated Files:**
- `lib/auth-context.tsx` - Added `resetPassword()` and `updatePassword()`
- `components/auth/login-form.tsx` - Added "Forgot Password" link
- `src/App.tsx` - Added routes for `/forgot-password` and `/reset-password`

### User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Forgot your password?" on login page        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. User enters email address                                │
│    → Clicks "Send reset link"                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. System sends password reset email                        │
│    → Email contains link to /reset-password                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. User clicks link in email                                │
│    → Redirected to reset password page                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. User enters new password (twice)                         │
│    → Clicks "Update password"                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Password updated successfully                            │
│    → Redirected to dashboard                                │
└─────────────────────────────────────────────────────────────┘
```

### Supabase Configuration Required

1. Go to **Authentication** → **URL Configuration**
2. Add redirect URL:
   ```
   https://guestpass-app.vercel.app/reset-password
   http://localhost:5173/reset-password
   ```
3. Go to **Authentication** → **Email Templates**
4. Select **Reset Password** template
5. Ensure it uses: `{{ .ConfirmationURL }}`

### Testing

#### Test Forgot Password
1. Go to login page
2. Click "Forgot your password?"
3. Enter your email
4. Click "Send reset link"
5. ✅ Success message appears
6. Check email inbox

#### Test Reset Password
1. Open password reset email
2. Click the reset link
3. ✅ Redirected to reset password page
4. Enter new password (twice)
5. Click "Update password"
6. ✅ Redirected to dashboard
7. Sign out and sign in with new password
8. ✅ New password works

---

## 4. Email Confirmation Expiry (24 Hours)

### What Changed
- Unconfirmed user accounts are automatically deleted after 24 hours
- Prevents database clutter from abandoned sign-ups
- Users must re-register if they miss the 24-hour window

### Implementation Details

**File:** `supabase-cleanup-unconfirmed-users.sql`

**How it works:**
1. Scheduled job runs every hour
2. Checks for users with `email_confirmed_at IS NULL`
3. Deletes users created more than 24 hours ago
4. Protects admin account (chiunyet@africau.edu)
5. Cleans up both `auth.users` and `public.users` tables

### Supabase Setup

#### Step 1: Enable pg_cron Extension

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for `pg_cron`
4. Click **Enable**

#### Step 2: Run the SQL Migration

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy contents of `supabase-cleanup-unconfirmed-users.sql`
4. Click **Run**
5. ✅ Function and scheduled job created

#### Step 3: Verify Setup

```sql
-- Check if job is scheduled
SELECT * FROM cron.job;

-- Expected output:
-- jobid | schedule   | command                              | nodename
-- ------|------------|--------------------------------------|----------
-- 1     | 0 * * * *  | SELECT cleanup_unconfirmed_users()   | ...
```

#### Step 4: Test Manually (Optional)

```sql
-- Run cleanup manually to test
SELECT cleanup_unconfirmed_users();

-- Check job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Behavior

| Time Since Sign-Up | Email Confirmed | Account Status |
|-------------------|-----------------|----------------|
| 0-24 hours | ❌ | Active, awaiting confirmation |
| 0-24 hours | ✅ | Active, fully functional |
| 24+ hours | ❌ | **Deleted automatically** |
| 24+ hours | ✅ | Active, fully functional |

### User Experience

**Scenario 1: User confirms within 24 hours**
```
Sign up → Receive email → Click link (within 24h) → ✅ Account active
```

**Scenario 2: User misses 24-hour window**
```
Sign up → Receive email → Wait 25 hours → ❌ Account deleted
                                        → Must sign up again
```

### Testing

#### Test Automatic Deletion (Quick Method)

1. **Modify the SQL for testing:**
   ```sql
   -- Temporarily change to 5 minutes for testing
   DELETE FROM auth.users
   WHERE 
     email_confirmed_at IS NULL
     AND created_at < NOW() - INTERVAL '5 minutes'
     AND email != 'chiunyet@africau.edu';
   ```

2. **Test flow:**
   - Sign up with test email
   - Don't confirm email
   - Wait 5 minutes
   - Run cleanup function manually
   - ✅ Account should be deleted

3. **Restore to 24 hours:**
   ```sql
   -- Change back to 24 hours
   DELETE FROM auth.users
   WHERE 
     email_confirmed_at IS NULL
     AND created_at < NOW() - INTERVAL '24 hours'
     AND email != 'chiunyet@africau.edu';
   ```

#### Test Admin Protection

1. Sign up with `chiunyet@africau.edu`
2. Don't confirm email
3. Wait 24+ hours
4. Run cleanup function
5. ✅ Admin account should NOT be deleted

### Monitoring

#### Check Unconfirmed Users

```sql
-- View all unconfirmed users
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

#### Check Cleanup History

```sql
-- View recent cleanup job runs
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE command LIKE '%cleanup_unconfirmed_users%'
ORDER BY start_time DESC
LIMIT 20;
```

---

## Deployment Checklist

### Code Deployment
- [ ] Push all code changes to repository
- [ ] Deploy to Vercel
- [ ] Verify build succeeds

### Supabase Configuration
- [ ] Enable `pg_cron` extension
- [ ] Run `supabase-cleanup-unconfirmed-users.sql`
- [ ] Verify scheduled job is created
- [ ] Add `/reset-password` to redirect URLs
- [ ] Test password reset email template

### Environment Variables
- [ ] Verify `APP_URL` is set in Vercel
- [ ] Verify all Supabase keys are correct

### Testing
- [ ] Test new user sign-up (should get "usher" role)
- [ ] Test admin sign-up (chiunyet@africau.edu)
- [ ] Test bulk event selection
- [ ] Test bulk status change
- [ ] Test bulk delete
- [ ] Test forgot password flow
- [ ] Test reset password flow
- [ ] Test email confirmation expiry (manually trigger)

---

## Troubleshooting

### Issue: New users still getting "admin" role

**Solution:**
1. Check `lib/auth-context.tsx` has the updated role logic
2. Clear browser cache and localStorage
3. Sign up with a completely new email
4. Check user role in Supabase dashboard: **Authentication** → **Users**

---

### Issue: Bulk actions not showing

**Solution:**
1. Ensure you're logged in as admin (chiunyet@africau.edu)
2. Check browser console for errors
3. Verify `updateEvent` function exists in events context

---

### Issue: Password reset email not received

**Solution:**
1. Check spam/junk folder
2. Verify email template is configured in Supabase
3. Check Supabase logs: **Logs** → **Auth Logs**
4. Verify redirect URLs include `/reset-password`

---

### Issue: Scheduled cleanup not running

**Solution:**
1. Verify `pg_cron` extension is enabled
2. Check job exists: `SELECT * FROM cron.job;`
3. Check job logs: `SELECT * FROM cron.job_run_details;`
4. Manually run: `SELECT cleanup_unconfirmed_users();`
5. Check for errors in Supabase logs

---

### Issue: Admin account at risk of deletion

**Solution:**
The cleanup function explicitly protects `chiunyet@africau.edu`:
```sql
AND email != 'chiunyet@africau.edu'
```
This ensures the admin account is never deleted, even if unconfirmed.

---

## Summary of Changes

### Files Created
1. `components/auth/forgot-password.tsx` - Forgot password page
2. `components/auth/reset-password.tsx` - Reset password page
3. `supabase-cleanup-unconfirmed-users.sql` - Cleanup job
4. `NEW_FEATURES_IMPLEMENTATION.md` - This documentation

### Files Modified
1. `lib/auth-context.tsx` - Role assignment, password reset functions
2. `components/auth/login-form.tsx` - Added "Forgot Password" link
3. `components/events/event-list.tsx` - Bulk actions functionality
4. `src/App.tsx` - Added password reset routes

### Database Changes
1. Scheduled job: `cleanup-unconfirmed-users` (runs hourly)
2. Function: `cleanup_unconfirmed_users()` (deletes old unconfirmed users)

---

## Support

If you encounter any issues:
1. Check this documentation first
2. Review browser console for errors
3. Check Supabase logs for backend errors
4. Verify all configuration steps were completed
5. Test in incognito mode to rule out caching

---

**Last Updated:** 2024
**Version:** 1.0