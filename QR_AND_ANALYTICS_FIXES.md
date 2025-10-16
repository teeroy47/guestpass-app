# QR Codes & Analytics Tab Fixes

## Issues Fixed

### 1. ✅ QR Codes Tab - Distorted Data Display
**Problem:** QR codes were showing distorted data instead of actual QR code images.

**Root Cause:** The `generateQRCodeSVG()` function is asynchronous (returns a Promise), but it was being called synchronously in the render method. This caused the Promise object to be rendered as HTML instead of the actual SVG string.

**Solution:**
- Added a new state variable `qrCodeSvgs` to store pre-generated QR code SVGs
- Created a `useEffect` hook that generates QR codes asynchronously when the "qr-codes" tab is active
- Updated the rendering logic to use the pre-generated SVGs from state
- Added loading indicators while QR codes are being generated

**Changes Made:**
- `components/events/event-details-dialog.tsx`:
  - Added `qrCodeSvgs` state: `useState<Map<string, string>>(new Map())`
  - Added effect to generate QR codes when tab becomes active
  - Updated QR code rendering to use pre-generated SVGs
  - Added loading spinner while QR codes are being generated

### 2. ✅ Analytics Tab - Event-Specific Analytics
**Problem:** Analytics tab showed placeholder text instead of actual analytics, and didn't filter by the specific event.

**Root Cause:** The analytics tab was not implemented - it only showed a placeholder message.

**Solution:**
- Imported the existing `AnalyticsDashboard` component
- Modified `AnalyticsDashboard` to accept an optional `eventId` prop
- When `eventId` is provided, the dashboard automatically filters to show only that event's analytics
- Hides the event selector dropdown when viewing from event details (since the event is already selected)

**Changes Made:**
- `components/events/event-details-dialog.tsx`:
  - Imported `AnalyticsDashboard` component
  - Replaced placeholder content with `<AnalyticsDashboard eventId={eventId} />`

- `components/analytics/analytics-dashboard.tsx`:
  - Added `AnalyticsDashboardProps` interface with optional `eventId` prop
  - Added `isEventLocked` flag to determine if viewing a specific event
  - Updated filtering logic to use `effectiveEventId` (prop or selected)
  - Conditionally hide event selector when `eventId` prop is provided
  - Updated header title to show "Event Analytics" when locked to specific event

## How It Works Now

### QR Codes Tab
1. When you click on an event and navigate to the "QR Codes" tab
2. A loading spinner appears briefly
3. QR codes are generated asynchronously for the first 6 guests
4. Once generated, the actual QR code images are displayed
5. Each QR code shows:
   - The scannable QR code image
   - Guest name
   - Unique code
   - Download button to save as PNG

### Analytics Tab
1. When you click on an event and navigate to the "Analytics" tab
2. The full analytics dashboard is displayed
3. Analytics are automatically filtered to show only data for that specific event
4. The event selector dropdown is hidden (since you're already viewing a specific event)
5. All metrics, charts, and insights are tailored to that event:
   - Total guests for this event
   - Check-in rate for this event
   - Check-in timeline for this event
   - Event-specific alerts and insights

## Testing Checklist

- [x] QR codes display correctly (not distorted)
- [x] QR codes load with a loading indicator
- [x] Download QR code button works
- [x] Analytics tab shows actual analytics (not placeholder)
- [x] Analytics are filtered to the specific event
- [x] Event selector is hidden in event-specific analytics view
- [x] All charts and metrics reflect only the selected event's data

## Technical Details

### QR Code Generation Flow
```typescript
// Before (broken):
const qrSvg = generateQRCodeSVG(qrData, 80) // Returns Promise, not string
dangerouslySetInnerHTML={{ __html: qrSvg }} // Renders "[object Promise]"

// After (fixed):
useEffect(() => {
  const generateQRCodes = async () => {
    const qrSvg = await generateQRCodeSVG(qrData, 80) // Await the Promise
    setQrCodeSvgs(prev => new Map(prev).set(guestId, qrSvg))
  }
  generateQRCodes()
}, [activeTab])

dangerouslySetInnerHTML={{ __html: qrCodeSvgs.get(guestId) }} // Renders actual SVG
```

### Analytics Filtering
```typescript
// Component accepts optional eventId prop
export function AnalyticsDashboard({ eventId: propEventId }: AnalyticsDashboardProps = {})

// When eventId is provided, lock to that event
const effectiveEventId = propEventId || selectedEventId
const isEventLocked = !!propEventId

// Filter all data by the effective event ID
const filteredGuests = effectiveEventId === "all"
  ? guests
  : guests.filter(g => g.eventId === effectiveEventId)
```

## Files Modified

1. `components/events/event-details-dialog.tsx`
   - Added QR code state management
   - Added async QR code generation
   - Integrated AnalyticsDashboard component

2. `components/analytics/analytics-dashboard.tsx`
   - Added eventId prop support
   - Added event-locked mode
   - Conditional event selector visibility

## Benefits

✅ **Better UX**: QR codes display correctly and load smoothly with visual feedback
✅ **Event-Specific Insights**: Analytics are now tailored to each individual event
✅ **Cleaner Interface**: Event selector hidden when viewing specific event analytics
✅ **Performance**: QR codes only generated when needed (lazy loading)
✅ **Consistency**: Same analytics dashboard used everywhere with different filtering modes