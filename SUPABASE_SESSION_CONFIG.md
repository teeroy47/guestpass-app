# Supabase Session Configuration Guide

## Quick Setup: 24-Hour Session Timeout

### Step 1: Access Supabase Dashboard Settings

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **GuestPass**
3. Click **Authentication** in the left sidebar
4. Click **Settings** (or **Configuration**)

---

### Step 2: Configure JWT Settings

Find the **JWT Settings** section and configure:

| Setting | Value | Description |
|---------|-------|-------------|
| **JWT Expiry** | `86400` | Session expires after 24 hours (86400 seconds) |
| **Refresh Token Rotation** | `Enabled` | Automatically rotates refresh tokens for security |
| **Reuse Interval** | `10` | Allows token reuse within 10 seconds |

**Screenshot Reference:**
```
┌─────────────────────────────────────────┐
│ JWT Settings                            │
├─────────────────────────────────────────┤
│ JWT Expiry (seconds)                    │
│ [86400                              ]   │
│                                         │
│ ☑ Enable Refresh Token Rotation        │
│                                         │
│ Reuse Interval (seconds)                │
│ [10                                 ]   │
└─────────────────────────────────────────┘
```

---

### Step 3: Configure Redirect URLs

In the **URL Configuration** section:

#### Site URL
```
Production: https://guestpass-app.vercel.app
Development: http://localhost:5173
```

#### Redirect URLs (Add all of these)
```
https://guestpass-app.vercel.app/auth/callback
https://guestpass-app.vercel.app/dashboard
http://localhost:5173/auth/callback
http://localhost:5173/dashboard
```

**Important:** Each URL must be on a separate line!

---

### Step 4: Email Template Configuration (Optional)

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Ensure the template includes: `{{ .ConfirmationURL }}`
4. The confirmation URL will automatically use your configured redirect URLs

---

## Session Behavior

### What Happens After 24 Hours?

```
Hour 0:  User signs in → Session created
Hour 23: Session still valid → User can access app
Hour 24: Session expires → User redirected to login
Hour 25: User must sign in again with password
```

### Automatic Token Refresh

- Tokens are automatically refreshed **before** they expire
- If user is active, they won't be logged out at exactly 24 hours
- Inactivity for 24 hours = session expires

---

## Testing Session Expiry

### Method 1: Manual Testing (Quick)

1. Open browser DevTools (F12)
2. Go to **Application** → **Local Storage**
3. Find key: `guestpass-auth-token`
4. Delete it
5. Try to access a protected page
6. ✅ You should be redirected to login

### Method 2: Modify JWT Expiry (For Testing)

1. Temporarily set JWT Expiry to `60` seconds (1 minute)
2. Sign in
3. Wait 1 minute
4. Try to access a protected page
5. ✅ You should be redirected to login
6. **Don't forget to change it back to 86400!**

---

## Verification Checklist

After configuration, verify:

- [ ] JWT Expiry is set to `86400` seconds
- [ ] Refresh Token Rotation is enabled
- [ ] All redirect URLs are added (production + development)
- [ ] Site URL matches your production domain
- [ ] Email templates use `{{ .ConfirmationURL }}`
- [ ] Environment variable `APP_URL` is set in Vercel
- [ ] Application has been redeployed after changes

---

## Common Issues & Solutions

### Issue: Session never expires

**Cause:** JWT Expiry not configured or set too high

**Solution:**
1. Check JWT Expiry is exactly `86400`
2. Clear browser localStorage
3. Sign in again and test

---

### Issue: Session expires too quickly

**Cause:** JWT Expiry set too low

**Solution:**
1. Verify JWT Expiry is `86400` (not `3600` or lower)
2. Check that Refresh Token Rotation is enabled
3. Ensure `autoRefreshToken: true` in client config (already set)

---

### Issue: Email confirmation redirects to wrong URL

**Cause:** Redirect URLs not configured or `APP_URL` not set

**Solution:**
1. Add all redirect URLs in Supabase (see Step 3)
2. Set `APP_URL` environment variable in Vercel
3. Redeploy application
4. Test with a new sign-up

---

## Security Best Practices

✅ **24-Hour Timeout** - Balances security and user experience

✅ **Refresh Token Rotation** - Prevents token theft and replay attacks

✅ **PKCE Flow** - Enhanced security for single-page applications

✅ **Email Verification** - Ensures users own the email address

✅ **Secure Storage** - Tokens stored in localStorage (not cookies for SPA)

---

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [JWT Best Practices](https://supabase.com/docs/guides/auth/sessions)
- [Session Management Guide](https://supabase.com/docs/guides/auth/sessions/session-management)

---

## Need Help?

If you're stuck:
1. Check the browser console for errors
2. Verify all settings match this guide exactly
3. Test in incognito mode to rule out caching
4. Check Supabase logs for authentication errors

---

**Last Updated:** 2024
**Configuration Version:** v1.0