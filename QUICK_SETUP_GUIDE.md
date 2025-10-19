# Quick Setup Guide - New Features

## 🚀 Quick Start (5 Minutes)

### 1. Deploy Code
```bash
git add .
git commit -m "feat: usher roles, bulk actions, password reset, email expiry"
git push origin main
```

### 2. Configure Supabase

#### A. Enable pg_cron Extension
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. **Database** → **Extensions**
3. Enable `pg_cron`

#### B. Run Cleanup Job SQL
1. **SQL Editor** → **New Query**
2. Copy/paste from `supabase-cleanup-unconfirmed-users.sql`
3. Click **Run**

#### C. Add Password Reset URL
1. **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   https://guestpass-app.vercel.app/reset-password
   http://localhost:5173/reset-password
   ```

### 3. Verify Deployment
- [ ] Visit your app
- [ ] Sign up with new email (not chiunyet@africau.edu)
- [ ] Check you have "usher" role
- [ ] Try "Forgot Password" link
- [ ] Go to Events → Click "Bulk Actions"

---

## ✅ Feature Checklist

### Default Usher Role
- [x] Code deployed
- [ ] New users get "usher" role
- [ ] Admin email gets "admin" role

### Bulk Event Actions
- [x] Code deployed
- [ ] "Bulk Actions" button visible (admin only)
- [ ] Can select multiple events
- [ ] Can change status in bulk
- [ ] Can delete in bulk

### Password Reset
- [x] Code deployed
- [ ] Redirect URLs added to Supabase
- [ ] "Forgot Password" link works
- [ ] Reset email received
- [ ] Can set new password

### Email Expiry
- [x] Code deployed
- [ ] pg_cron enabled
- [ ] Cleanup job scheduled
- [ ] Job appears in `cron.job` table

---

## 🧪 Quick Tests

### Test 1: Usher Role (2 min)
```
1. Sign up with: test-usher@example.com
2. Confirm email
3. Check badge shows "usher"
4. Verify no "Create Event" button
✅ Pass if user has limited permissions
```

### Test 2: Bulk Actions (2 min)
```
1. Sign in as admin (chiunyet@africau.edu)
2. Go to Events page
3. Click "Bulk Actions"
4. Select 2 events
5. Change status to "Active"
✅ Pass if both events now show "active"
```

### Test 3: Password Reset (3 min)
```
1. Go to login page
2. Click "Forgot your password?"
3. Enter your email
4. Check inbox for reset email
5. Click link and set new password
✅ Pass if redirected to dashboard
```

### Test 4: Email Expiry (Manual)
```
1. In Supabase SQL Editor, run:
   SELECT cleanup_unconfirmed_users();
2. Check output for "Cleaned up..."
✅ Pass if function runs without errors
```

---

## 🔧 Troubleshooting

### "Still getting admin role"
→ Clear browser cache, sign up with NEW email

### "Bulk Actions not showing"
→ Make sure you're logged in as admin

### "Password reset email not received"
→ Check spam folder, verify redirect URLs

### "Cleanup job not running"
→ Verify pg_cron is enabled, check `SELECT * FROM cron.job;`

---

## 📚 Full Documentation

For detailed information, see:
- `NEW_FEATURES_IMPLEMENTATION.md` - Complete feature guide
- `AUTH_SESSION_SETUP.md` - Authentication setup
- `SUPABASE_SESSION_CONFIG.md` - Session configuration

---

## 🎯 What's New

| Feature | Status | User Impact |
|---------|--------|-------------|
| **Usher Role** | ✅ | New users have limited permissions |
| **Bulk Actions** | ✅ | Admins can manage multiple events at once |
| **Password Reset** | ✅ | Users can recover forgotten passwords |
| **Email Expiry** | ✅ | Unconfirmed accounts auto-deleted after 24h |

---

## 🔐 Security Notes

- Only `chiunyet@africau.edu` gets admin role
- Admin account protected from auto-deletion
- Password reset links expire (Supabase default: 1 hour)
- Email confirmation links expire after 24 hours
- Unconfirmed accounts deleted automatically

---

## 📞 Need Help?

1. Check `NEW_FEATURES_IMPLEMENTATION.md` for detailed guides
2. Review browser console for errors
3. Check Supabase logs: **Logs** → **Auth Logs**
4. Verify all setup steps completed

---

**Setup Time:** ~5 minutes  
**Testing Time:** ~10 minutes  
**Total Time:** ~15 minutes

✨ **You're all set!**