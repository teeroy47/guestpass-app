# Resend Confirmation Email Feature

## Overview
This feature allows users to resend their email confirmation link if they didn't receive it or if it expired. It includes built-in rate limiting to prevent abuse.

## Features Implemented

### ✅ 1. Resend Confirmation Function
**File:** `lib/auth-context.tsx`

Added `resendConfirmationEmail()` function that:
- Uses Supabase's `resend()` API
- Sends confirmation email with proper redirect URL
- Returns error handling for failed attempts

```typescript
resendConfirmationEmail: (email: string) => Promise<{ error: string | null }>
```

### ✅ 2. Resend Confirmation Page
**File:** `components/auth/resend-confirmation.tsx`

Features:
- Clean, user-friendly interface
- Email input with validation
- **60-second rate limiting** (prevents spam)
- Real-time countdown timer
- Success state with instructions
- Auto-populates email from URL query parameter
- "Back to login" navigation

**Rate Limiting:**
- Uses localStorage to track last send time
- Enforces 60-second cooldown between resends
- Shows countdown timer to user
- Prevents button clicks during cooldown

### ✅ 3. Integration with Login/Signup Flow
**File:** `components/auth/login-form.tsx`

Added two access points:

**A. After Signup Success:**
- Shows "Resend confirmation email" link in success message
- Pre-fills email address for convenience

**B. On Login Page:**
- Added "Resend confirmation email" link below "Forgot password"
- Accessible to users who can't log in due to unconfirmed email

### ✅ 4. Route Configuration
**File:** `src/App.tsx`

Added route: `/resend-confirmation`

## User Flow

### Scenario 1: User Just Signed Up
1. User creates account
2. Sees success message: "Check your email to confirm your account"
3. If email not received, clicks "Resend confirmation email" link
4. Redirected to `/resend-confirmation?email=user@example.com`
5. Email pre-filled, clicks "Send confirmation email"
6. Receives new confirmation email
7. Must wait 60 seconds before resending again

### Scenario 2: User Can't Log In (Unconfirmed Email)
1. User tries to log in
2. Login fails (email not confirmed)
3. Clicks "Resend confirmation email" link on login page
4. Enters email address
5. Receives new confirmation email
6. Clicks link in email → Redirected to dashboard

### Scenario 3: Rate Limiting in Action
1. User requests confirmation email
2. Immediately tries to resend again
3. Sees warning: "Please wait 45 seconds before resending"
4. Button is disabled with countdown timer
5. After 60 seconds, can resend again

## Rate Limiting Details

### Implementation
- **Storage:** localStorage (key: `resend_confirmation_last_sent`)
- **Duration:** 60 seconds (60,000ms)
- **Countdown:** Updates every second
- **Persistence:** Survives page refreshes

### Why 60 Seconds?
- Prevents email spam/abuse
- Gives email time to arrive
- Reasonable wait time for users
- Supabase has its own rate limits (this adds client-side protection)

### Rate Limit Bypass Prevention
- Checked on component mount
- Checked before form submission
- Checked on every countdown tick
- Stored timestamp (not just boolean flag)

## Technical Details

### Environment Variables
Uses `VITE_APP_URL` for redirect URL:
```typescript
const redirectUrl = `${import.meta.env.VITE_APP_URL || window.location.origin}/auth/callback`
```

### Supabase API Call
```typescript
await supabase.auth.resend({
  type: 'signup',
  email: email,
  options: {
    emailRedirectTo: redirectUrl,
  }
})
```

### Error Handling
- Network errors → Toast notification
- Invalid email → Form validation error
- Rate limit exceeded → Warning message with countdown
- Supabase errors → User-friendly error message

## UI/UX Features

### Success State
- ✅ Checkmark icon
- Clear instructions (3-step process)
- Option to resend again after cooldown
- "Back to login" button

### Loading State
- Spinner icon
- "Sending..." text
- Disabled button

### Rate Limited State
- Yellow warning box
- Countdown timer
- Disabled button
- Clear explanation

### Form Validation
- Email format validation
- Required field validation
- Real-time error messages

## Files Created/Modified

### Created:
1. ✅ `components/auth/resend-confirmation.tsx` - Main component

### Modified:
1. ✅ `lib/auth-context.tsx` - Added `resendConfirmationEmail()` function
2. ✅ `components/auth/login-form.tsx` - Added resend links
3. ✅ `src/App.tsx` - Added route

## Testing Checklist

### Manual Testing:
- [ ] Sign up with new email
- [ ] Click "Resend confirmation email" after signup
- [ ] Verify email is pre-filled
- [ ] Click "Send confirmation email"
- [ ] Check inbox for confirmation email
- [ ] Try to resend immediately (should be blocked)
- [ ] Wait for countdown to reach 0
- [ ] Resend again (should work)
- [ ] Click link in email
- [ ] Verify redirect to dashboard
- [ ] Test "Resend confirmation email" link on login page
- [ ] Test with invalid email format
- [ ] Test with empty email field
- [ ] Test "Back to login" button

### Edge Cases:
- [ ] User closes tab during countdown (should persist on return)
- [ ] User clears localStorage (countdown resets)
- [ ] User opens in incognito (separate rate limit)
- [ ] Multiple tabs open (shared localStorage)
- [ ] Network error during send
- [ ] Email doesn't exist in system

## Deployment Notes

### Supabase Configuration Required:
1. **Redirect URLs:** Add to Supabase Auth settings:
   ```
   https://guestpass-app.vercel.app/auth/callback
   ```

2. **Email Template:** Ensure confirmation email template includes:
   ```
   {{ .ConfirmationURL }}
   ```

3. **Rate Limits:** Supabase has built-in rate limits (check your plan)

### Environment Variables:
Ensure `VITE_APP_URL` is set in:
- `.env.local` (development)
- Vercel environment variables (production)

```env
VITE_APP_URL=https://guestpass-app.vercel.app
```

## Security Considerations

### ✅ Implemented:
- Client-side rate limiting (60 seconds)
- Email validation
- Proper error handling (no sensitive info leaked)
- Uses Supabase's secure resend API

### ⚠️ Note:
- Supabase has server-side rate limits
- Client-side rate limit can be bypassed (localStorage can be cleared)
- This is acceptable because Supabase enforces server-side limits
- The client-side limit improves UX and reduces unnecessary API calls

## Future Enhancements (Optional)

### Possible Improvements:
1. **Server-side rate limiting** - Track in database instead of localStorage
2. **Email verification** - Check if email exists before sending
3. **Analytics** - Track resend requests
4. **Customizable cooldown** - Admin can adjust rate limit duration
5. **IP-based rate limiting** - Prevent abuse from same IP
6. **CAPTCHA** - Add for additional security
7. **Email queue status** - Show if email is still being processed

## Troubleshooting

### Issue: "Email not received"
**Solutions:**
1. Check spam/junk folder
2. Verify email address is correct
3. Wait a few minutes (email delivery can be delayed)
4. Use resend feature after 60 seconds
5. Check Supabase email logs

### Issue: "Rate limit error"
**Solutions:**
1. Wait for countdown to complete
2. Check if multiple tabs are open
3. Clear localStorage if stuck
4. Contact support if persistent

### Issue: "Invalid or expired link"
**Solutions:**
1. Request new confirmation email
2. Links typically expire after 24 hours
3. Ensure clicking the latest email link

### Issue: "Redirect to localhost"
**Solutions:**
1. Verify `VITE_APP_URL` is set correctly
2. Restart dev server after changing .env
3. Check Supabase redirect URL configuration
4. See `LOCALHOST_FIX.md` for details

## Related Documentation
- `LOCALHOST_FIX.md` - Fixing redirect URL issues
- `AUTH_SESSION_SETUP.md` - Complete auth setup guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment steps

## Status
✅ **FULLY IMPLEMENTED** - Ready for testing and deployment