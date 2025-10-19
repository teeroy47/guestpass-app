# Localhost Redirect Issue - FIXED ✅

## Problem
Email confirmation links and password reset links were redirecting to `localhost` instead of your production URL (`https://guestpass-app.vercel.app`).

## Root Cause
The environment variable `APP_URL` was not accessible in the browser because **Vite requires all browser-accessible environment variables to be prefixed with `VITE_`**.

When `import.meta.env.APP_URL` returned `undefined`, the code fell back to `window.location.origin`, which was `http://localhost:5173` during development.

## Solution Applied

### 1. Updated `.env.local`
Changed:
```env
APP_URL=https://guestpass-app.vercel.app
```

To:
```env
VITE_APP_URL=https://guestpass-app.vercel.app
```

### 2. Updated `lib/auth-context.tsx`
Changed all occurrences from:
```typescript
import.meta.env.APP_URL
```

To:
```typescript
import.meta.env.VITE_APP_URL
```

This affects:
- `signInWithOtp()` - Line 234
- `signUpWithPassword()` - Line 274
- `resetPassword()` - Line 352

### 3. Updated `.env.example`
Updated the example file to show the correct variable name with `VITE_` prefix.

## How to Apply the Fix

### Step 1: Restart Your Development Server
**IMPORTANT:** Environment variable changes require a server restart!

1. Stop your current dev server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 2: Test the Fix
1. Sign up with a new email address
2. Check the confirmation email
3. The link should now point to: `https://guestpass-app.vercel.app/auth/callback`
4. NOT: `http://localhost:5173/auth/callback`

### Step 3: Update Vercel Environment Variables
In your Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add or update:
   - **Key:** `VITE_APP_URL`
   - **Value:** `https://guestpass-app.vercel.app`
3. Redeploy your application

## Why This Happened

### Vite Environment Variable Rules:
- ✅ `VITE_*` variables → Accessible in browser code
- ❌ Regular variables → Only accessible in server-side code (Node.js)

### Example:
```typescript
// ✅ Works in browser
const url = import.meta.env.VITE_APP_URL

// ❌ Returns undefined in browser
const url = import.meta.env.APP_URL

// ✅ Works in Node.js server code
const url = process.env.APP_URL
```

## Verification

After restarting your dev server, you can verify the fix by:

1. **Check in browser console:**
   ```javascript
   console.log(import.meta.env.VITE_APP_URL)
   // Should output: "https://guestpass-app.vercel.app"
   ```

2. **Sign up with a test email** and check the confirmation link in the email

3. **Request a password reset** and check the reset link in the email

## Related Files Changed
- ✅ `.env.local` - Updated variable name
- ✅ `.env.example` - Updated variable name
- ✅ `lib/auth-context.tsx` - Updated all references (3 locations)

## Important Notes

1. **Always restart dev server** after changing `.env` files
2. **Update Vercel** with the new variable name
3. **The fallback still works:** If `VITE_APP_URL` is not set, it falls back to `window.location.origin`
4. **For production:** Make sure `VITE_APP_URL` is set in Vercel to avoid localhost links

## Status
✅ **FIXED** - Email links will now use your production URL instead of localhost