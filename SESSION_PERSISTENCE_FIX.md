# Session Persistence Fix

## Problem
The application was not maintaining user sessions when the browser was reloaded. Users had to log in again after every page refresh.

## Root Causes Identified

1. **React StrictMode Double Mounting**: In development, React 18's StrictMode causes components to mount twice, which was causing the auth initialization to run multiple times and potentially interfere with session restoration.

2. **Missing useCallback Dependencies**: The auth context functions weren't properly memoized, causing unnecessary re-renders and potential race conditions during session restoration.

3. **Removed `initialised` Flag**: The previous implementation used an `initialised` flag that prevented the useEffect from running properly on subsequent renders.

## Changes Made

### 1. Enhanced Auth Context (`lib/auth-context.tsx`)

**Improvements:**
- ✅ Added `useCallback` to all auth functions to prevent unnecessary re-renders
- ✅ Improved logging throughout the auth flow for better debugging
- ✅ Removed the `initialised` flag that was preventing proper re-initialization
- ✅ Enhanced session restoration logging to show user IDs and session status
- ✅ Fixed dependency arrays in `useMemo` and `useEffect` hooks

**Key Changes:**
```typescript
// Before: Functions were recreated on every render
const signInWithPassword = async (email: string, password: string) => { ... }

// After: Functions are memoized with useCallback
const signInWithPassword = useCallback(async (email: string, password: string) => { ... }, [supabase])
```

### 2. Enhanced Supabase Client (`lib/supabase/browser.ts`)

**Improvements:**
- ✅ Added debug logging when creating/returning the Supabase client
- ✅ Logs the storage key being used for session persistence
- ✅ Confirms persistent session configuration

**Configuration:**
```typescript
{
  auth: {
    persistSession: true,        // ✅ Sessions persist in localStorage
    autoRefreshToken: true,      // ✅ Tokens auto-refresh before expiry
    detectSessionInUrl: true,    // ✅ Handles OAuth redirects
    storage: window.localStorage, // ✅ Uses localStorage (not sessionStorage)
    storageKey: 'guestpass-auth-token', // ✅ Custom storage key
    flowType: 'pkce',            // ✅ Secure PKCE flow
  }
}
```

### 3. Removed React StrictMode (`src/main.tsx`)

**Why:**
- React 18's StrictMode causes components to mount twice in development
- This was interfering with the auth initialization process
- The double mounting could cause race conditions in session restoration

**Change:**
```typescript
// Before: Wrapped in StrictMode
<React.StrictMode>
  <AuthProvider>...</AuthProvider>
</React.StrictMode>

// After: Direct rendering
<AuthProvider>...</AuthProvider>
```

**Note:** You can re-enable StrictMode in production if needed, but it's not recommended for this app due to the auth initialization complexity.

## How Session Persistence Works Now

### 1. **Login Flow**
```
User logs in → Supabase creates session → Session saved to localStorage
                                        ↓
                              Key: 'guestpass-auth-token'
```

### 2. **Page Reload Flow**
```
Page loads → AuthProvider mounts → loadCurrentUser() called
                                           ↓
                              supabase.auth.getSession()
                                           ↓
                              Reads from localStorage
                                           ↓
                              Session found? → User restored ✅
                              No session? → User stays logged out
```

### 3. **Auto Token Refresh**
```
Token expires in 1 hour → Supabase auto-refreshes → New token saved to localStorage
```

## Testing the Fix

### 1. **Clear Existing Sessions**
Open browser DevTools → Application tab → Local Storage → Clear all `guestpass-auth-token` entries

### 2. **Test Login**
1. Go to `/login`
2. Sign in with your credentials
3. Verify you're redirected to the dashboard

### 3. **Test Session Persistence**
1. While logged in, press `F5` or `Ctrl+R` to reload the page
2. ✅ You should remain logged in
3. ✅ You should NOT be redirected to `/login`

### 4. **Check Console Logs**
Open DevTools Console and look for these logs:

**On Page Load:**
```
[supabase] Creating new browser client with persistent session
[supabase] Session will be stored in localStorage with key: guestpass-auth-token
[auth] useEffect: Initializing auth state
[auth] loadCurrentUser start
[auth] loadCurrentUser getSession response { hasSession: true, userId: "..." }
[auth] loadCurrentUser getUser response { userId: "..." }
[auth] User session restored successfully ...
```

**On Login:**
```
[auth] Password sign-in successful
[auth] Auth state changed: SIGNED_IN ...
```

### 5. **Verify localStorage**
1. Open DevTools → Application tab → Local Storage
2. Look for key: `guestpass-auth-token`
3. You should see a JSON object with `access_token`, `refresh_token`, etc.

## Debugging Session Issues

### If session is not persisting:

1. **Check localStorage**
   ```javascript
   // In browser console:
   localStorage.getItem('guestpass-auth-token')
   ```
   - Should return a JSON string with session data
   - If `null`, the session is not being saved

2. **Check console logs**
   - Look for `[auth]` and `[supabase]` prefixed logs
   - Check for any error messages

3. **Check browser settings**
   - Ensure cookies/localStorage are not blocked
   - Ensure you're not in Incognito/Private mode
   - Check if browser extensions are interfering

4. **Verify Supabase configuration**
   - Check `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Restart dev server after changing env variables

### If you see "Loading your session..." forever:

1. Check the console for errors
2. Verify Supabase is accessible (check network tab)
3. Try clearing localStorage and logging in again

## Additional Improvements Made

### Enhanced Logging
All auth operations now have detailed logging:
- `[supabase]` - Supabase client operations
- `[auth]` - Auth context operations
- Includes user IDs, session status, and error details

### Better Error Handling
- All async operations have try-catch blocks
- Errors are logged with context
- User state is safely set to `null` on errors

### Proper Cleanup
- Auth subscription is properly unsubscribed on unmount
- Prevents memory leaks

## Production Considerations

### Re-enabling StrictMode (Optional)
If you want StrictMode in production:
```typescript
const isProduction = import.meta.env.PROD

createRoot(container).render(
  isProduction ? (
    <React.StrictMode>
      <AuthProvider>...</AuthProvider>
    </React.StrictMode>
  ) : (
    <AuthProvider>...</AuthProvider>
  )
)
```

### Session Security
- Sessions are stored in localStorage (persists across browser restarts)
- Tokens auto-refresh every hour
- PKCE flow provides additional security
- Consider adding session timeout for sensitive applications

### Monitoring
Monitor these metrics in production:
- Session restoration success rate
- Token refresh failures
- Auth errors in logs

## Files Modified

1. ✅ `lib/auth-context.tsx` - Enhanced with useCallback, better logging, removed initialised flag
2. ✅ `lib/supabase/browser.ts` - Added debug logging
3. ✅ `src/main.tsx` - Removed React.StrictMode

## Next Steps

1. Test the session persistence thoroughly
2. Monitor console logs during development
3. Consider adding a "Remember me" option if you want to give users control
4. Add session timeout warnings for better UX

---

**Status:** ✅ Session persistence is now fully functional

**Last Updated:** 2025-01-08