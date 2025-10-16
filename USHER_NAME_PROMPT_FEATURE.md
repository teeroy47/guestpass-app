# Usher Name Prompt Feature

## Overview
This feature ensures that every usher (user) provides their display name upon first login or signup. The name is stored in the database and used for usher statistics tracking.

## How It Works

### 1. **First Login/Signup Flow**
```
User Signs In/Up
    ↓
Auth Context loads user
    ↓
Check if user has display_name in database
    ↓
NO display_name? → Show Name Prompt Dialog (BLOCKING)
    ↓
User enters name → Save to database
    ↓
Continue to dashboard
```

### 2. **Name Prompt Dialog**
- **Modal Dialog**: Cannot be dismissed until name is entered
- **Validation**: 
  - Name must be at least 2 characters
  - Cannot be empty or whitespace only
- **User-Friendly**:
  - Shows user's email for context
  - Clear instructions
  - Loading state during save
  - Error handling

### 3. **Database Storage**
- **Table**: `users`
- **Column**: `display_name` (TEXT)
- **Indexed**: Yes, for performance
- **Usage**: Automatically used when checking in guests

## Files Modified/Created

### New Files
1. **`supabase-migration-user-display-name.sql`**
   - Adds `display_name` column to `users` table
   - Creates index for performance

2. **`components/auth/name-prompt-dialog.tsx`**
   - Modal dialog component
   - Form validation
   - Error handling
   - User-friendly UI

### Modified Files
1. **`lib/auth-context.tsx`**
   - Added `displayName` state
   - Added `hasDisplayName` computed property
   - Added `fetchDisplayName()` function
   - Added `updateDisplayName()` function
   - Fetches display name on user profile load
   - Clears display name on sign out

2. **`app/(protected)/layout.tsx`**
   - Shows name prompt dialog if user has no display name
   - Blocks access to dashboard until name is provided
   - Renders dashboard in background (dimmed, non-interactive)

3. **`components/scanner/qr-scanner.tsx`**
   - Uses `displayName` from auth context instead of `user_metadata.full_name`
   - Passes display name to `checkInGuest()` function

## Setup Instructions

### Step 1: Run Database Migration
```sql
-- Copy and run this in Supabase SQL Editor
-- File: supabase-migration-user-display-name.sql

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name TEXT;

CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

COMMENT ON COLUMN users.display_name IS 'Display name of the usher for statistics tracking';
```

### Step 2: Test the Feature
1. **For New Users**:
   - Sign up with a new account
   - After email verification, you'll be prompted for your name
   - Enter your name and click "Continue"
   - You'll be redirected to the dashboard

2. **For Existing Users**:
   - Sign in with an existing account
   - You'll immediately see the name prompt dialog
   - Enter your name and click "Continue"
   - You'll be redirected to the dashboard

3. **Verify Name is Saved**:
   - Go to Supabase Dashboard → Database → Table Editor → `users`
   - Find your user record
   - Verify `display_name` column has your name

4. **Test Check-In**:
   - Scan a guest QR code
   - Check the `guests` table
   - Verify `usher_name` column has your display name
   - Check Usher Statistics dashboard
   - Verify your name appears in the leaderboard

## Auth Context API

### New Properties
```typescript
interface AuthContextType {
  // ... existing properties
  displayName: string | null          // Current user's display name
  hasDisplayName: boolean              // True if display name is set
  updateDisplayName: (name: string) => Promise<void>  // Update display name
}
```

### Usage Example
```typescript
import { useAuth } from "@/lib/auth-context"

function MyComponent() {
  const { displayName, hasDisplayName, updateDisplayName } = useAuth()

  if (!hasDisplayName) {
    return <div>Please set your name first</div>
  }

  return <div>Welcome, {displayName}!</div>
}
```

## User Experience

### Before This Feature
- ❌ Usher names were taken from `user_metadata.full_name` (often empty)
- ❌ Fell back to email address (not user-friendly)
- ❌ No way for users to set their preferred name
- ❌ Statistics showed emails instead of names

### After This Feature
- ✅ Every usher has a proper display name
- ✅ Users control their own display name
- ✅ Statistics show real names, not emails
- ✅ Professional appearance on leaderboards
- ✅ Better user experience

## Technical Details

### Name Validation
```typescript
// Minimum length: 2 characters
// Maximum length: 100 characters
// Cannot be empty or whitespace only
const trimmedName = name.trim()
if (!trimmedName || trimmedName.length < 2) {
  throw new Error("Invalid name")
}
```

### Dialog Behavior
- **Cannot be dismissed**: No close button, no click-outside-to-close
- **Blocks navigation**: User cannot access dashboard without setting name
- **Persistent**: Dialog remains until name is successfully saved
- **Error recovery**: If save fails, user can retry

### Performance
- **Indexed column**: Fast lookups by display name
- **Cached in context**: No repeated database queries
- **Optimistic updates**: UI updates immediately after save

## Future Enhancements

### Potential Improvements
1. **Name Editing**: Allow users to change their display name from settings
2. **Profile Pictures**: Add avatar/photo upload
3. **Name Suggestions**: Suggest name based on email (e.g., john.doe@example.com → "John Doe")
4. **Validation**: Check for duplicate names, profanity filter
5. **Internationalization**: Support for non-Latin characters
6. **Nickname Support**: Allow both full name and nickname

### Settings Page (Future)
```typescript
// Future feature: User profile settings
function ProfileSettings() {
  const { displayName, updateDisplayName } = useAuth()
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        label="Display Name"
        value={displayName}
        onChange={...}
      />
      <Button type="submit">Save Changes</Button>
    </form>
  )
}
```

## Troubleshooting

### Issue: Name prompt doesn't appear
**Solution**: 
1. Check if `display_name` column exists in `users` table
2. Verify migration was run successfully
3. Check browser console for errors
4. Clear browser cache and reload

### Issue: Name doesn't save
**Solution**:
1. Check Supabase logs for errors
2. Verify user has permission to update `users` table
3. Check network tab for failed requests
4. Ensure `display_name` column accepts TEXT type

### Issue: Old name still appears in statistics
**Solution**:
1. The `guests` table stores a snapshot of the usher name at check-in time
2. New check-ins will use the updated name
3. Old check-ins will keep the old name (historical record)
4. This is by design for audit trail purposes

## Security Considerations

### Row Level Security (RLS)
Ensure users can only update their own display name:

```sql
-- RLS Policy for users table (if not already exists)
CREATE POLICY "Users can update own display_name"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Input Sanitization
- Display names are stored as plain text
- No HTML/script injection risk (React escapes by default)
- Consider adding profanity filter in production
- Consider adding length limits (already set to 100 chars)

## Testing Checklist

- [ ] New user signup shows name prompt
- [ ] Existing user without name shows prompt on login
- [ ] Name validation works (min 2 chars)
- [ ] Name saves to database successfully
- [ ] Display name appears in auth context
- [ ] Scanner uses display name for check-ins
- [ ] Usher statistics show display name
- [ ] Sign out clears display name from context
- [ ] Re-login loads display name from database
- [ ] Dialog cannot be dismissed without entering name
- [ ] Error handling works (network errors, validation errors)
- [ ] Loading states work correctly

## Summary

This feature ensures a professional and user-friendly experience by:
1. ✅ Requiring all ushers to set a display name
2. ✅ Storing names in the database for persistence
3. ✅ Using names in check-in records and statistics
4. ✅ Providing a smooth, non-intrusive onboarding flow
5. ✅ Maintaining data integrity and audit trails

**Result**: Better usher statistics, improved user experience, and professional appearance throughout the application.