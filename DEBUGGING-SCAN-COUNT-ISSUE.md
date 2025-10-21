# Debugging Scanner Session Scan Count Issue

## Issue Summary
After removing the 30-second polling from the Active Scanner Sessions card, two issues emerged:
1. ✅ **FIXED**: Page was still refreshing every 30 seconds
2. ⚠️ **INVESTIGATING**: Scan counts not incrementing when QR codes are scanned

## Root Cause Analysis

### Issue 1: Page Still Refreshing (FIXED)
**Root Cause**: The `guests-context.tsx` file had a 30-second polling interval (lines 100-111) that was calling `refreshGuests()` every 30 seconds, causing the entire page to refresh.

**Solution**: Removed the polling interval and now relying solely on real-time Supabase subscriptions for guest updates.

**Files Modified**:
- `c:\Users\Teeroy\Downloads\guestpass-app\lib\guests-context.tsx`

### Issue 2: Scan Counts Not Incrementing (INVESTIGATING)
**Symptoms**:
- Scanner session shows "0 scans" despite successful QR scans
- Guests ARE being checked in successfully (scanner is working)
- No errors in browser console
- RPC call to `increment_scanner_session_scans` is NOT appearing in Network tab

**Possible Causes**:
1. `scannerSessionId` might be null when increment is attempted
2. RPC call is failing silently
3. Timing issue where session ID hasn't been set yet
4. Supabase RPC function might not exist or lacks proper permissions

## Debugging Steps Added

### 1. QR Scanner Component Logging
Added comprehensive logging in `qr-scanner.tsx`:
- Session creation logging (lines 454-463)
- Scan increment attempt logging (lines 359-375)
- Tracks whether `scannerSessionId` is available
- Logs success/failure of increment calls

### 2. Scanner Service Logging
Added detailed logging in `scanner-session-service.ts`:
- Tracks when `incrementScanCount()` is called
- Logs RPC call attempts and responses
- Logs fallback mechanism if RPC fails
- Tracks manual increment attempts

### 3. Files Modified
- `c:\Users\Teeroy\Downloads\guestpass-app\components\scanner\qr-scanner.tsx`
- `c:\Users\Teeroy\Downloads\guestpass-app\lib\supabase\scanner-session-service.ts`
- `c:\Users\Teeroy\Downloads\guestpass-app\lib\guests-context.tsx`

## Next Steps for User

### Step 1: Test the Page Refresh Fix
1. Open the overview page
2. Start a scanner session
3. Verify the page is NO LONGER refreshing every 30 seconds
4. ✅ This should now be fixed

### Step 2: Debug the Scan Count Issue
1. Open browser DevTools Console
2. Start a scanner session
3. Look for these log messages:
   ```
   ✅ [QR Scanner] Scanner session started successfully: <session-id>
   ```
4. Scan a QR code
5. Look for these log messages in order:
   ```
   🔍 [QR Scanner] About to increment scan count
   🔍 [QR Scanner] Calling incrementScanCount with ID: <session-id>
   🔍 [Scanner Service] incrementScanCount called with sessionId: <session-id>
   🔍 [Scanner Service] Got Supabase client
   🔍 [Scanner Service] Calling RPC: increment_scanner_session_scans
   🔍 [Scanner Service] RPC response: { data: ..., error: ... }
   ```

### Step 3: Share Console Output
Please share the complete console output after scanning a QR code. This will help identify:
- ✅ Is the scanner session being created?
- ✅ Is the `scannerSessionId` available when increment is called?
- ✅ Is the `incrementScanCount()` function being called?
- ✅ Is the RPC call succeeding or failing?
- ✅ Is the fallback mechanism being triggered?

### Step 4: Verify Database Setup
Run the verification script in Supabase SQL Editor:
1. Open `verify-setup.sql` (already open in your editor)
2. Copy all contents
3. Go to Supabase Dashboard → SQL Editor
4. Paste and run the script
5. Check the results:
   - ✅ Does `scanner_sessions` table exist?
   - ✅ Does `increment_scanner_session_scans` function exist?
   - ✅ Is RLS enabled?
   - ✅ Are there any active sessions showing?

## Expected Console Output (When Working)

### On Scanner Start:
```
🔍 [QR Scanner] Starting scanner session for: { usherName: "...", usherEmail: "...", eventId: "..." }
✅ [QR Scanner] Scanner session started successfully: abc-123-def-456
📊 Scanner session started: abc-123-def-456
```

### On QR Scan:
```
🔍 [QR Scanner] About to increment scan count { scannerSessionId: "abc-123-def-456", hasScannerSessionId: true, timestamp: "..." }
🔍 [QR Scanner] Calling incrementScanCount with ID: abc-123-def-456
🔍 [Scanner Service] incrementScanCount called with sessionId: abc-123-def-456
🔍 [Scanner Service] Got Supabase client
🔍 [Scanner Service] Calling RPC: increment_scanner_session_scans
🔍 [Scanner Service] RPC response: { data: null, error: null }
✅ [Scanner Service] RPC increment successful
✅ [QR Scanner] Successfully incremented scan count
```

## Troubleshooting Guide

### If you see: "⚠️ No scannerSessionId available"
**Problem**: Scanner session wasn't created or state wasn't set
**Solution**: Check if session creation is failing (look for "❌ Failed to start scanner session")

### If you see: "⚠️ RPC failed, using fallback increment"
**Problem**: The RPC function doesn't exist or has permission issues
**Solution**: Run the verification script and check if the function exists

### If you see: "❌ Fallback update failed"
**Problem**: Database permissions issue or session doesn't exist
**Solution**: Check RLS policies and verify session exists in database

### If you see NO logs at all
**Problem**: The increment code isn't being reached
**Solution**: Check if QR scanning is actually succeeding (look for "✓ Step 1 Complete" message)

## Database Verification Checklist

Run `verify-setup.sql` and verify:
- [ ] `scanner_sessions` table EXISTS
- [ ] Table has all required columns (id, event_id, usher_name, scans_count, etc.)
- [ ] RLS is ENABLED
- [ ] 4 RLS policies exist (SELECT, INSERT, UPDATE, DELETE)
- [ ] `increment_scanner_session_scans` function EXISTS
- [ ] Function has SECURITY DEFINER permission
- [ ] `end_inactive_scanner_sessions` function EXISTS

## Additional Notes

### Why the RPC Function?
The `increment_scanner_session_scans` RPC function is used for atomic increment operations. It:
1. Updates `scans_count` by incrementing it
2. Updates `last_activity_at` to current timestamp
3. Only affects active sessions
4. Uses SECURITY DEFINER to bypass RLS

### Fallback Mechanism
If the RPC call fails, the code has a fallback that:
1. Fetches the current scan count
2. Manually increments it by 1
3. Updates the database with the new count
4. Also updates `last_activity_at`

This ensures scan counting works even if the RPC function is missing.

### Real-Time Updates
The Active Scanner Sessions card uses Supabase real-time subscriptions to:
1. Listen for changes to the `scanner_sessions` table
2. Automatically update the UI when scans are incremented
3. Show live updates without polling or page refreshes

## Success Criteria

✅ **Page Refresh Issue**: FIXED - Removed 30-second polling from guests context
⏳ **Scan Count Issue**: INVESTIGATING - Waiting for console logs to identify root cause

Once you provide the console output, we can:
1. Identify exactly where the increment is failing
2. Determine if it's a database issue or code issue
3. Implement the appropriate fix
4. Verify the fix works end-to-end