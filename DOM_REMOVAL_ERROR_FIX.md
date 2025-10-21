# DOM Removal Error Fix

## Error
```
Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
```

## Root Cause
This error was caused by **race conditions** between:
1. **Real-time subscription updates** triggering state changes
2. **Component unmounting** (especially QR Scanner and dialogs)
3. **State updates on unmounted components** causing React to lose track of the DOM tree

### Specific Issues Identified:

#### 1. QR Scanner Cleanup Race Condition
- The `stopScanning()` function was in the useEffect dependency array
- During unmount, `stopScanning` could change, causing React to try removing DOM nodes that were already gone
- The Html5Qrcode library was trying to manipulate DOM elements during cleanup

#### 2. Real-Time Subscription Updates During Unmount
- Real-time subscriptions (events and guests) could fire updates while components were unmounting
- State updates (`setEvents`, `setGuests`, `setIsScanning`, etc.) were being called on unmounted components
- This caused React to attempt DOM manipulations on nodes that no longer existed

#### 3. Reconnection Logic on Unmounted Components
- Subscription error handlers were attempting to reconnect even after component unmount
- `setTimeout` callbacks were executing state updates on unmounted components

## Solution

### Pattern: `isMountedRef` Flag
Added a `useRef` flag to track component mount status and prevent state updates during/after unmount.

### Files Modified:

#### 1. **QR Scanner Component** (`components/scanner/qr-scanner.tsx`)
#### 2. **Events Context Provider** (`lib/events-context.tsx`)
#### 3. **Guests Context Provider** (`lib/guests-context.tsx`)
#### 4. **Active Events Real-time Component** (`components/dashboard/active-events-realtime.tsx`)
#### 5. **Usher Statistics Component** (`components/dashboard/usher-statistics.tsx`)

---

### Detailed Changes:

#### 1. **QR Scanner Component** (`components/scanner/qr-scanner.tsx`)

**Changes:**
- Added `isMountedRef` to track mount status
- Protected all state updates with mount checks
- Removed `stopScanning` from useEffect dependencies (eliminated dependency race condition)
- Improved cleanup logic to handle errors gracefully

**Key Changes:**
```typescript
// Added mount tracking
const isMountedRef = useRef(true)

// Protected state updates
const resetScannerState = useCallback(() => {
  if (!isMountedRef.current) return  // ✅ Prevent updates on unmounted component
  setLastScanResult(null)
  setScannerError(null)
}, [])

// Improved cleanup
useEffect(() => {
  isMountedRef.current = true
  
  return () => {
    isMountedRef.current = false  // ✅ Mark as unmounted
    
    // Cleanup without triggering state updates
    const cleanup = async () => {
      // Stop scanner, tracks, clear instance
      // All wrapped in try-catch to handle errors gracefully
    }
    cleanup()
  }
}, [])  // ✅ Empty dependency array - no race conditions
```

#### 2. **Events Context** (`lib/events-context.tsx`)

**Changes:**
- Added `isMountedRef` to track provider mount status
- Protected real-time subscription handlers from updating unmounted state
- Protected reconnection logic from running on unmounted components

**Key Changes:**
```typescript
// Added mount tracking
const isMountedRef = useRef(true)

// Protected real-time updates
.on("postgres_changes", ..., (payload) => {
  if (!isMountedRef.current) return  // ✅ Prevent updates on unmounted provider
  
  // Handle INSERT, UPDATE, DELETE
})

// Protected reconnection logic
.subscribe((status, err) => {
  if (status === "CHANNEL_ERROR") {
    setTimeout(() => {
      if (isMountedRef.current) {  // ✅ Only reconnect if still mounted
        channel.subscribe()
      }
    }, 3000)
  }
})

// Cleanup
return () => {
  isMountedRef.current = false  // ✅ Mark as unmounted
  supabaseClient.current.removeChannel(channel)
}
```

#### 3. **Guests Context** (`lib/guests-context.tsx`)

**Changes:**
- Same pattern as Events Context
- Protected all real-time subscription handlers (INSERT, UPDATE, DELETE)
- Protected reconnection logic

#### 4. **Active Events Real-time Component** (`components/dashboard/active-events-realtime.tsx`)

**Changes:**
- Added `isMountedRef` to track component mount status
- Protected real-time subscription handler for guest check-ins
- Protected reconnection logic in error handlers
- Protected `setInterval` callback that auto-removes old notifications
- Improved cleanup with try-catch error handling

**Key Changes:**
```typescript
// Added mount tracking
const isMountedRef = useRef(true)

// Protected subscription handler
.on("postgres_changes", { ... }, (payload) => {
  if (!isMountedRef.current) return  // ✅ Prevent updates on unmounted
  // Process check-in updates
})

// Protected interval callback
setInterval(() => {
  if (!isMountedRef.current) return  // ✅ Prevent updates on unmounted
  setRecentCheckIns((prev) => prev.filter(...))
}, 1000)

// Cleanup
return () => {
  isMountedRef.current = false
  try {
    supabaseClient.current.removeChannel(channel)
  } catch (error) {
    console.debug("Error during analytics cleanup:", error)
  }
}
```

#### 5. **Usher Statistics Component** (`components/dashboard/usher-statistics.tsx`)

**Changes:**
- Added `isMountedRef` to track component mount status
- Protected real-time subscription handler for usher statistics updates
- Improved cleanup with try-catch error handling

**Key Changes:**
```typescript
// Added mount tracking
const isMountedRef = useRef(true)

// Protected subscription handler
.on("postgres_changes", { ... }, (payload) => {
  if (!isMountedRef.current) return  // ✅ Prevent updates on unmounted
  // Update usher statistics
})

// Cleanup
return () => {
  isMountedRef.current = false
  try {
    supabaseClient.current.removeChannel(channel)
  } catch (error) {
    console.debug("Error during usher statistics cleanup:", error)
  }
}
```

## Technical Details

### Why This Works

1. **Prevents State Updates on Unmounted Components**
   - `isMountedRef` is checked before every state update
   - React won't try to update DOM nodes that don't exist

2. **Eliminates Dependency Race Conditions**
   - Removed functions from useEffect dependencies where they caused issues
   - Used empty dependency arrays with proper cleanup

3. **Graceful Error Handling**
   - All cleanup operations wrapped in try-catch
   - Errors logged as debug messages, not thrown

4. **Prevents Reconnection on Unmounted Components**
   - Reconnection logic checks mount status before attempting to reconnect
   - Prevents setTimeout callbacks from running on unmounted components

### Performance Impact
- **Minimal overhead**: Single boolean check before state updates
- **No memory leaks**: Proper cleanup of subscriptions and media streams
- **Improved stability**: No more DOM manipulation errors

## Testing Scenarios

### ✅ Scenarios That Previously Caused Errors:

1. **Opening and quickly closing QR Scanner**
   - Before: DOM removal error
   - After: Clean unmount, no errors

2. **Deleting guests while scanner is open**
   - Before: Real-time update during unmount caused error
   - After: Update blocked by mount check

3. **Navigating away during real-time updates**
   - Before: State updates on unmounted contexts
   - After: Updates blocked by mount check

4. **Network reconnection during unmount**
   - Before: Reconnection logic tried to update unmounted component
   - After: Reconnection blocked by mount check

## Best Practices Applied

1. **Mount Tracking Pattern**
   ```typescript
   const isMountedRef = useRef(true)
   
   useEffect(() => {
     isMountedRef.current = true
     return () => {
       isMountedRef.current = false
     }
   }, [])
   ```

2. **Protected State Updates**
   ```typescript
   const updateState = () => {
     if (!isMountedRef.current) return
     setState(newValue)
   }
   ```

3. **Protected Async Callbacks**
   ```typescript
   setTimeout(() => {
     if (isMountedRef.current) {
       // Safe to update state
     }
   }, delay)
   ```

4. **Graceful Cleanup**
   ```typescript
   try {
     await cleanup()
   } catch (error) {
     console.debug("Cleanup error:", error)  // Don't throw
   }
   ```

## Related Issues Fixed

- ✅ QR Scanner unmount errors
- ✅ Real-time subscription race conditions
- ✅ State updates on unmounted components
- ✅ Reconnection logic on unmounted components
- ✅ Media stream cleanup errors

## Future Considerations

1. **Reusable Hook**: Consider creating a `useIsMounted()` hook for consistency
2. **Error Boundary**: Add error boundaries around real-time components
3. **Subscription Manager**: Consider a centralized subscription manager for better control

## Summary

The DOM removal error was caused by React trying to manipulate DOM nodes that no longer existed due to race conditions between real-time updates and component unmounting. The fix uses a simple but effective `isMountedRef` pattern to prevent state updates on unmounted components, combined with improved cleanup logic and error handling.

**Result**: Zero DOM manipulation errors, clean unmounts, and stable real-time updates. ✅