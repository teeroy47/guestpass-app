# Guest Count Display Fix

## Problem
Event cards on the Events tab were not showing the checked-in guest counts. The display showed "0 / 0 checked in" for all events, even when guests had been added and checked in.

## Root Cause
The event service was trying to fetch `total_guests` and `checked_in_guests` columns directly from the `events` table in Supabase. However, these columns either:
1. Don't exist in the Supabase database schema, OR
2. Exist but aren't being updated when guests are added/checked in

## Solution
Modified the `EventService` class in `lib/supabase/event-service.ts` to **dynamically calculate** guest counts from the `guests` table instead of relying on columns in the `events` table.

### Changes Made

#### 1. Added `getGuestCounts()` Helper Method
```typescript
private static async getGuestCounts(eventIds: string[]): Promise<Record<string, { total: number; checkedIn: number }>>
```
- Fetches all guests for the given event IDs
- Counts total guests and checked-in guests for each event
- Returns a map of event ID to counts

#### 2. Updated `listEvents()` Method
- Removed `total_guests` and `checked_in_guests` from the SELECT query
- After fetching events, calls `getGuestCounts()` to get real-time counts
- Merges the counts into the event data before returning

#### 3. Updated `getEvent()` Method
- Removed `total_guests` and `checked_in_guests` from the SELECT query
- Calls `getGuestCounts()` for the single event
- Merges the counts into the event data before returning

#### 4. Updated `createEvent()` Method
- Removed `total_guests` and `checked_in_guests` from the SELECT query
- Returns 0 for both counts (new events have no guests)

#### 5. Updated `updateEvent()` Method
- Removed `total_guests` and `checked_in_guests` from the SELECT query
- Calls `getGuestCounts()` to get current counts after update
- Merges the counts into the event data before returning

## Benefits

### ✅ Real-Time Accuracy
Guest counts are always accurate because they're calculated directly from the `guests` table in real-time.

### ✅ No Database Schema Changes Required
The solution works with the existing database schema without requiring migrations or new columns.

### ✅ Automatic Updates
When guests are added, removed, or checked in, the counts automatically reflect the changes on the next fetch.

### ✅ Performance Optimized
- Uses a single query to fetch guest counts for all events (batch operation)
- Efficient counting logic that processes data in memory
- No N+1 query problem

## Testing

To verify the fix works:

1. **Navigate to Events Tab**
   - You should now see accurate guest counts on each event card
   - Example: "5 / 10 checked in" if 5 out of 10 guests have checked in

2. **Check Progress Bars**
   - Progress bars should now display with the correct width
   - Colors should change based on attendance percentage:
     - Red (< 30%)
     - Yellow (30-70%)
     - Green (> 70%)

3. **Add New Guests**
   - Add guests to an event
   - Refresh the Events tab
   - Total guest count should increase

4. **Check In Guests**
   - Scan a guest QR code or manually check in a guest
   - Refresh the Events tab
   - Checked-in count should increase
   - Progress bar should update

## Technical Details

### Database Queries
**Before:**
```sql
SELECT id, title, ..., total_guests, checked_in_guests FROM events
```

**After:**
```sql
-- First query
SELECT id, title, ..., status FROM events

-- Second query (for all event IDs)
SELECT event_id, checked_in FROM guests WHERE event_id IN (...)
```

### Count Calculation Logic
```typescript
for (const guest of data ?? []) {
  if (!counts[guest.event_id]) {
    counts[guest.event_id] = { total: 0, checkedIn: 0 }
  }
  counts[guest.event_id].total++
  if (guest.checked_in) {
    counts[guest.event_id].checkedIn++
  }
}
```

## Files Modified
- `lib/supabase/event-service.ts` - Added dynamic guest count calculation

## No Breaking Changes
This fix is backward compatible and doesn't require:
- Database migrations
- Changes to other components
- Updates to the API contract
- Modifications to the UI components

The event cards will now display accurate guest counts automatically! 🎉