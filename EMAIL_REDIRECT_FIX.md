# Email Confirmation Redirect Fix

## Issue
When users signed up for a new account, the email confirmation link was pointing to `localhost` instead of the production domain.

## Root Cause
The `signUpWithPassword` function in `lib/auth-context.tsx` was not including the `emailRedirectTo` option when calling Supabase's `signUp()` method. This caused Supabase to use the default redirect URL (which was set to localhost during development).

## Solution
Added the `emailRedirectTo` option to the `signUp()` call to dynamically use the current domain:

```typescript
await supabase.auth.signUp({ 
  email, 
  password,
  options: {
    emailRedirectTo: `${window.location.origin}`
  }
})
```

This ensures that:
- In development: Links point to `http://localhost:5173`
- In production: Links point to your production domain (e.g., `https://yourdomain.com`)

## Files Modified
- `lib/auth-context.tsx` (line 170-176)

## How It Works
- `window.location.origin` automatically detects the current domain
- When a user signs up from your production site, the confirmation email will contain a link back to your production domain
- When a user signs up from localhost (during development), the link will point to localhost

## Testing
1. Deploy the updated code to your production environment
2. Sign up with a new email address
3. Check the confirmation email
4. The link should now point to your production domain instead of localhost

## Additional Configuration (Optional)

### Supabase Dashboard Settings
You may also want to verify your Supabase email template settings:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Email Templates**
4. Check the "Confirm signup" template
5. Ensure the redirect URL uses `{{ .ConfirmationURL }}` (this is the default)

### Site URL Configuration
Make sure your Supabase project has the correct Site URL configured:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain (e.g., `https://yourdomain.com`)
3. Add your production domain to **Redirect URLs** if not already there

## Important Notes

- The fix uses `window.location.origin` which dynamically adapts to the environment
- No hardcoded URLs are needed
- Works automatically in both development and production
- Users who signed up before this fix will still have localhost links in their old emails (they'll need to request a new confirmation email)

## Requesting New Confirmation Email

If users need a new confirmation email after this fix:

1. They can use the "Forgot Password" flow to get a new email with the correct link
2. Or you can manually resend confirmation emails from the Supabase Dashboard:
   - Go to **Authentication** → **Users**
   - Find the user
   - Click the three dots menu
   - Select "Send confirmation email"

---

**Status**: ✅ Fixed and deployed
**Build**: Successful (22.51s)
**Date**: January 2025