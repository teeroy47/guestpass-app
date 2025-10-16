# Feature Flow Diagrams

## 1. Loading States Flow

```
User Opens Dashboard
        ↓
    [Loading State]
    ┌─────────────────┐
    │   🔄 Spinner    │
    │ "Loading data..." │
    └─────────────────┘
        ↓
    Fetch Events & Guests
        ↓
    [Data Loaded]
    ┌─────────────────┐
    │  📊 Dashboard   │
    │  Stats & Cards  │
    └─────────────────┘
```

---

## 2. Color-Coded Progress Bar Flow

```
Event Card Rendered
        ↓
Calculate Attendance %
        ↓
    ┌─────────────────────┐
    │  < 30% Attendance?  │
    └─────────────────────┘
         ↓ Yes        ↓ No
    🔴 RED BAR    ┌─────────────────────┐
                  │  30-70% Attendance? │
                  └─────────────────────┘
                       ↓ Yes        ↓ No
                  🟡 YELLOW BAR   🟢 GREEN BAR
                  
        ↓
    Smooth 500ms Transition
        ↓
    Display with Percentage
```

---

## 3. Instant Scanner Access Flow

```
User Views Event Card
        ↓
    Clicks "Scan" Button
        ↓
    [Instant Action]
    ┌─────────────────┐
    │  Open Scanner   │
    │  for Event ID   │
    └─────────────────┘
        ↓
    Scanner Ready
    ┌─────────────────┐
    │  📷 Camera On   │
    │  Event: Wedding │
    │  0/150 checked  │
    └─────────────────┘
```

**Before**: Events Tab → Scanner Tab → Select Event → Start (4 steps)
**After**: Event Card → Click Scan (1 step)

---

## 4. Automatic Event Completion Flow

```
Events Fetched from DB
        ↓
For Each Event:
    ┌─────────────────────┐
    │  Status = "active"? │
    └─────────────────────┘
         ↓ Yes        ↓ No
    Check Date    Skip Event
         ↓
    ┌─────────────────────┐
    │  > 24 hours past?   │
    └─────────────────────┘
         ↓ Yes        ↓ No
    Update Status   Keep Active
    to "completed"
         ↓
    [Background Update]
    ┌─────────────────┐
    │  Update in DB   │
    │  (non-blocking) │
    └─────────────────┘
         ↓
    Display as Completed
```

---

## 5. Audio Feedback Flow

```
QR Code Scanned
        ↓
    Decode QR Data
        ↓
    ┌─────────────────────┐
    │  Valid Event Code?  │
    └─────────────────────┘
         ↓ No         ↓ Yes
    ❌ ERROR      Check Guest
    🔊 ♪♪♪↓           ↓
    3 Descending  ┌─────────────────────┐
    Tones         │  Already Checked?   │
                  └─────────────────────┘
                       ↓ Yes        ↓ No
                  ⚠️ DUPLICATE   ✅ SUCCESS
                  🔊 ♪♪ ♪♪       🔊 ♪↗ ♪↗
                  2 Warning      2 Ascending
                  Tones          Tones
                       ↓              ↓
                  Show Message   Check In Guest
                       ↓              ↓
                  Reset (1.5s)   Show Success
                                      ↓
                                 Reset (2s)
```

### Audio Tone Details

**Success** (✅):
```
Time:  0ms      80ms
Freq:  C5  →    E5
       523Hz    659Hz
Sound: ♪ ↗ ♪ (ascending, pleasant)
```

**Duplicate** (⚠️):
```
Time:  0ms      150ms
Freq:  A4       A4
       440Hz    440Hz
Sound: ♪♪ ♪♪ (warning, attention)
Wave:  Square (more distinct)
```

**Error** (❌):
```
Time:  0ms    100ms   200ms
Freq:  400Hz  350Hz   300Hz
Sound: ♪ ↘ ♪ ↘ ♪ (descending, failure)
```

---

## 6. Complete User Journey: Event Check-In

```
ADMIN CREATES EVENT
        ↓
    Uploads Guest List
        ↓
    Event Status: "active"
        ↓
    ┌─────────────────┐
    │  Event Card     │
    │  🔴 0% (Red)    │
    │  [Scan] Button  │
    └─────────────────┘
        ↓
USHER CLICKS SCAN
        ↓
    📷 Scanner Opens
        ↓
    Scans Guest #1
        ↓
    🔊 ♪↗♪ (Success)
    ✅ "John Doe checked in"
        ↓
    Scans Guest #2
        ↓
    🔊 ♪↗♪ (Success)
    ✅ "Jane Smith checked in"
        ↓
    Accidentally scans Guest #2 again
        ↓
    🔊 ♪♪ ♪♪ (Duplicate)
    ⚠️ "Jane Smith already checked in"
        ↓
    Continues scanning...
        ↓
    ┌─────────────────┐
    │  Event Card     │
    │  🟡 45% (Yellow)│
    │  Progress Bar   │
    └─────────────────┘
        ↓
    More guests arrive...
        ↓
    ┌─────────────────┐
    │  Event Card     │
    │  🟢 85% (Green) │
    │  Almost Full!   │
    └─────────────────┘
        ↓
    Event Date Passes
        ↓
    Wait 24 Hours
        ↓
    [Auto-Completion]
    Status → "completed"
        ↓
    ┌─────────────────┐
    │  Event Card     │
    │  Badge: Completed│
    │  Final: 85%     │
    └─────────────────┘
```

---

## 7. Data Flow Architecture

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                        │
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   Dashboard  │      │  Event List  │        │
│  │              │      │              │        │
│  │  - Loading   │      │  - Progress  │        │
│  │    States    │      │    Bars      │        │
│  │  - Stats     │      │  - Scan Btn  │        │
│  └──────┬───────┘      └──────┬───────┘        │
│         │                     │                 │
│         └──────────┬──────────┘                 │
│                    ↓                            │
│         ┌──────────────────────┐               │
│         │   Context Providers   │               │
│         │                       │               │
│         │  - EventsContext     │               │
│         │  - GuestsContext     │               │
│         │  - AuthContext       │               │
│         └──────────┬────────────┘               │
│                    ↓                            │
└────────────────────┼─────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│                  SERVICES                        │
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │ EventService │      │ GuestService │        │
│  │              │      │              │        │
│  │ - listEvents │      │ - checkIn    │        │
│  │ - update     │      │ - list       │        │
│  │ - auto-      │      │              │        │
│  │   complete   │      │              │        │
│  └──────┬───────┘      └──────┬───────┘        │
│         │                     │                 │
│         └──────────┬──────────┘                 │
│                    ↓                            │
└────────────────────┼─────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────┐
│                 SUPABASE                         │
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   events     │      │    guests    │        │
│  │   table      │      │    table     │        │
│  └──────────────┘      └──────────────┘        │
│                                                  │
└─────────────────────────────────────────────────┘

ADDITIONAL SYSTEMS:

┌─────────────────┐
│  Sound Effects  │
│                 │
│  Web Audio API  │
│  - Success      │
│  - Duplicate    │
│  - Error        │
└─────────────────┘

┌─────────────────┐
│  QR Scanner     │
│                 │
│  Html5Qrcode    │
│  - Camera       │
│  - Decode       │
│  - Feedback     │
└─────────────────┘
```

---

## 8. State Management Flow

```
┌─────────────────────────────────────────────────┐
│              APPLICATION STATE                   │
└─────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Events  │  │  Guests  │  │   Auth   │
│  State   │  │  State   │  │  State   │
│          │  │          │  │          │
│ loading  │  │ loading  │  │ user     │
│ events[] │  │ guests[] │  │ loading  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┼─────────────┘
                   ↓
         ┌──────────────────┐
         │   UI Components  │
         │                  │
         │  - Dashboard     │
         │  - Event Cards   │
         │  - Scanner       │
         └──────────────────┘
```

---

## 9. Performance Optimization Flow

```
User Action
    ↓
┌─────────────────────┐
│  Immediate UI       │
│  Feedback           │
│  (< 100ms)          │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Background         │
│  Operations         │
│  (non-blocking)     │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Update UI          │
│  When Complete      │
└─────────────────────┘

Examples:
- Loading spinner shows immediately
- Progress bars animate smoothly (GPU)
- Audio plays instantly (< 50ms)
- Auto-completion doesn't block UI
- Profile creation happens in background
```

---

## 10. Error Handling Flow

```
Operation Attempted
        ↓
    Try Block
        ↓
    ┌─────────────────┐
    │  Success?       │
    └─────────────────┘
         ↓ No      ↓ Yes
    Catch Error   Continue
         ↓
    Log to Console
         ↓
    ┌─────────────────┐
    │  User Facing?   │
    └─────────────────┘
         ↓ Yes      ↓ No
    Show Message   Silent
    🔊 Error Tone  (logged only)
         ↓
    Graceful Degradation
         ↓
    App Continues Working
```

---

## Summary

These diagrams show how all the new features work together to create a seamless, professional user experience. Each feature is designed to:

1. **Provide immediate feedback** (loading states, audio)
2. **Reduce cognitive load** (color-coding, automation)
3. **Streamline workflows** (instant scanner access)
4. **Handle errors gracefully** (non-blocking operations)
5. **Maintain performance** (GPU acceleration, background tasks)

The result is a polished, production-ready event management system! 🎉