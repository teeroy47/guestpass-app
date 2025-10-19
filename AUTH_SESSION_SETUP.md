# Authentication & Session Management Setup

## Overview
This document explains the authentication flow and session management configuration for the GuestPass application.

## Features Implemented

### 1. **Duplicate Email Prevention**
- Before creating a new account, the system checks if the email already exists
- Users are shown a clear error message: "An account with this email already exists. Please sign in instead."
- This prevents confusion and duplicate account creation

### 2. **Email Confirmation Flow**
- When users sign up, they receive a confirmation email
- After clicking the confirmation link, they are automatically redirected to `/auth/callback`
- The callback page processes the confirmation and redirects to the dashboard
- **First login is passwordless** - users don't need to enter their password after email confirmation

### 3. **Session Expiry (24 Hours of Inactivity)**
- Sessions automatically expire after 1 day of inactivity for security
- After session expiry, users must sign in again with their password
- This is configured in Supabase dashboard settings

### 4. **Automatic Redirect After Email Confirmation**
- Email confirmation links redirect to: `https://your-app-url.vercel.app/auth/callback`
- The callback page handles the authentication tokens and redirects to dashboard
- Users experience a seamless onboarding flow

---

## Supabase Configuration Required

### Step 1: Configure Session Timeout (24 Hours)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Find the **Session Settings** section
4. Configure the following:

   ```
   JWT Expiry: 86400 seconds (24 hours)
   Refresh Token Rotation: Enabled
   Reuse Interval: 10 seconds
   ```

5. Click **Save**

### Step 2: Add Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add the following to **Redirect URLs**:

   **For Production:**
   ```
   https://guestpass-app.vercel.app/auth/callback
   https://guestpass-app.vercel.app/dashboard
   ```

   **For Development:**
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/dashboard
   ```

3. Set **Site URL** to:
   - Production: `https://guestpass-app.vercel.app`
   - Development: `http://localhost:5173`

4. Click **Save**

### Step 3: Configure Email Templates (Optional but Recommended)

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Customize the email template if desired
4. Ensure the confirmation link uses: `{{ .ConfirmationURL }}`
5. Click **Save**

---

## How It Works

### Sign-Up Flow

```
1. User fills out sign-up form (email, password, name)
   ↓
2. System checks if email already exists in database
   ↓
3. If exists → Show error: "Account already exists"
   If not exists → Continue
   ↓
4. Create account in Supabase Auth
   ↓
5. Send confirmation email with link to /auth/callback
   ↓
6. User clicks email link
   ↓
7. /auth/callback processes tokens and creates session
   ↓
8. Redirect to /dashboard (NO PASSWORD REQUIRED)
```

### Subsequent Login Flow

```
1. User's session expires after 24 hours of inactivity
   ↓
2. User is redirected to /login
   ↓
3. User enters email and password
   ↓
4. System validates credentials
   ↓
5. Create new session
   ↓
6. Redirect to /dashboard
```

---

## Environment Variables

Make sure these are set in your `.env.local` and Vercel:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Application URL (for email redirects)
APP_URL=https://guestpass-app.vercel.app
```

**In Vercel:**
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add `APP_URL` with value: `https://guestpass-app.vercel.app`
4. Apply to all environments (Production, Preview, Development)
5. **Redeploy** your application

---

## Testing the Flow

### Test Sign-Up with Duplicate Email

1. Create an account with email: `test@example.com`
2. Try to create another account with the same email
3. ✅ Expected: Error message "An account with this email already exists"

### Test Email Confirmation

1. Sign up with a new email
2. Check your email inbox
3. Click the confirmation link
4. ✅ Expected: Redirected to dashboard without entering password

### Test Session Expiry

1. Sign in to your account
2. Wait 24 hours (or manually clear localStorage)
3. Try to access a protected page
4. ✅ Expected: Redirected to login page
5. Enter email and password to sign in again

---

## Security Features

✅ **Password Required After Session Expiry** - Users must re-authenticate after 24 hours of inactivity

✅ **Email Verification Required** - Users must confirm their email before accessing the app

✅ **Duplicate Account Prevention** - System prevents multiple accounts with the same email

✅ **Secure Token Storage** - Tokens stored in localStorage with PKCE flow

✅ **Automatic Token Refresh** - Tokens are automatically refreshed before expiry

---

## Troubleshooting

### Issue: Email confirmation link redirects to localhost

**Solution:** 
- Ensure `APP_URL` environment variable is set in Vercel
- Redeploy the application after adding the variable
- Check Supabase redirect URLs include production URL

### Issue: "Invalid or expired confirmation link"

**Solution:**
- Confirmation links expire after a certain time (default: 24 hours)
- Request a new confirmation email
- Check that redirect URLs are correctly configured in Supabase

### Issue: Session doesn't expire after 24 hours

**Solution:**
- Verify JWT Expiry is set to 86400 seconds in Supabase
- Clear browser localStorage and test again
- Check that `autoRefreshToken` is enabled in Supabase client config

### Issue: User can sign up with existing email

**Solution:**
- Ensure the `users` table has proper RLS policies
- Check that the email uniqueness check is working
- Verify Supabase Auth settings allow duplicate email prevention

---

## Files Modified

1. **`lib/auth-context.tsx`**
   - Added duplicate email checking before sign-up
   - Updated redirect URL to `/auth/callback`
   - Enhanced error handling for existing users

2. **`lib/supabase/browser.ts`**
   - Session configuration with 24-hour expiry
   - PKCE flow for enhanced security

3. **`components/auth/login-form.tsx`**
   - Updated success messages for email confirmation
   - Improved user feedback

4. **`components/auth/auth-callback.tsx`** (NEW)
   - Handles email confirmation tokens
   - Processes authentication and redirects to dashboard

5. **`src/App.tsx`**
   - Added `/auth/callback` route

---

## Next Steps

1. ✅ Deploy the updated code to Vercel
2. ✅ Configure Supabase session timeout (24 hours)
3. ✅ Add redirect URLs to Supabase
4. ✅ Set `APP_URL` environment variable in Vercel
5. ✅ Test the complete sign-up and login flow
6. ✅ Verify session expiry after 24 hours

---

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure Supabase configuration matches this guide
4. Test in incognito mode to rule out caching issues