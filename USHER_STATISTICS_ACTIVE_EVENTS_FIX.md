# Usher Statistics - Active Events Only Fix

## Problem
The usher statistics page was showing all events (draft, active, and completed) that had check-ins. This allowed users to select non-active events, which shouldn't be displayed in the statistics view.

## Solution
Modified the usher statistics component to:
1. **Filter for active events only** - Only events with `status === "active"` are shown
2. **Smart event selector** - The dropdown only appears when there are multiple active events
3. **Auto-display single event** - If only one active event exists, it's automatically selected and displayed prominently without a dropdown

## Changes Made

### File: `components/dashboard/usher-statistics.tsx`

#### 1. Filter Logic (Lines 28-35)
```typescript
// Filter for active events only (with at least one checked-in guest)
const activeEventsWithCheckIns = events.filter((event) => {
  // Only show active events
  if (event.status !== "active") return false
  
  const eventGuests = guests.filter((g) => g.eventId === event.id)
  return eventGuests.some((g) => g.checkedIn)
})
```

**Before:** Filtered all events with check-ins regardless of status
**After:** Only includes events where `status === "active"` AND has at least one check-in

#### 2. Empty State Message (Lines 188-204)
```typescript
if (activeEventsWithCheckIns.length === 0) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usher Statistics</CardTitle>
        <CardDescription>Track usher performance and scan activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-sm text-muted-foreground">No active events with check-ins</p>
          <p className="text-xs text-muted-foreground mt-1">
            Usher statistics will appear here once guests check in to active events
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Before:** "No check-ins recorded yet"
**After:** "No active events with check-ins" - More specific messaging

#### 3. Smart Event Selector (Lines 228-258)
```typescript
{/* Event Selector - Only show if more than one active event */}
{activeEventsWithCheckIns.length > 1 && (
  <div className="space-y-2">
    <label className="text-sm font-medium">Select Active Event</label>
    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
      <SelectTrigger>
        <SelectValue placeholder="Choose an event" />
      </SelectTrigger>
      <SelectContent>
        {activeEventsWithCheckIns.map((event) => {
          const eventGuestsCount = guests.filter(
            (g) => g.eventId === event.id && g.checkedIn
          ).length
          return (
            <SelectItem key={event.id} value={event.id}>
              {event.title} ({eventGuestsCount} check-ins)
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  </div>
)}

{/* Show event name if only one active event */}
{activeEventsWithCheckIns.length === 1 && selectedEvent && (
  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
    <p className="text-sm font-medium text-primary">Active Event</p>
    <p className="text-lg font-bold">{selectedEvent.title}</p>
  </div>
)}
```

**Before:** Always showed dropdown selector
**After:** 
- Shows dropdown only when multiple active events exist
- Shows prominent event name display when only one active event exists
- Label changed from "Select Event" to "Select Active Event" for clarity

## Event Status Values
The system uses three status values:
- `"draft"` - Event is being planned
- `"active"` - Event is currently happening (shown in statistics)
- `"completed"` - Event has ended

## User Experience Improvements

### Multiple Active Events
- Users see a dropdown to select which active event to view statistics for
- Each option shows the event name and number of check-ins

### Single Active Event
- No dropdown clutter - the event name is displayed prominently
- Statistics automatically load for that event
- Cleaner, more focused interface

### No Active Events
- Clear message explaining why statistics aren't available
- Guides users to understand they need active events with check-ins

## Testing Checklist

- [ ] With no active events: Shows "No active events with check-ins" message
- [ ] With one active event: Shows event name prominently, no dropdown
- [ ] With multiple active events: Shows dropdown selector
- [ ] Draft events with check-ins: Not shown in statistics
- [ ] Completed events with check-ins: Not shown in statistics
- [ ] Only active events appear in the dropdown
- [ ] Statistics update correctly when switching between active events
- [ ] Real-time updates still work for the selected active event

## Technical Notes

- The filter is applied at the component level using the `events` array from context
- The `status` field comes from the database `events` table
- Real-time subscriptions continue to work for the selected event
- Auto-selection logic prioritizes the first active event in the filtered list

## Related Files
- `components/dashboard/usher-statistics.tsx` - Main component (modified)
- `lib/supabase/event-service.ts` - Event type definitions
- `components/events/event-details-dialog.tsx` - Event status type definition