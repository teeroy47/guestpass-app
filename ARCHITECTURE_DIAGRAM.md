# Architecture Diagram: Scanner Session Tracking

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          GUESTPASS APPLICATION                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            USER INTERFACE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │   QR Scanner     │  │  Admin Dashboard │  │ Analytics View   │    │
│  │  (qr-scanner)    │  │   (dashboard)    │  │  (analytics)     │    │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤    │
│  │ • Start Scanner  │  │ • Active Scanners│  │ • Avg Check-In   │    │
│  │ • Scan QR Codes  │  │ • Scanner Sessions│ │   Time           │    │
│  │ • Check In Guest │  │ • Real-Time Stats│  │ • Time Formatting│    │
│  │ • Track Session  │  │ • Admin Only     │  │ • Color Coding   │    │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────────┘    │
│           │                     │                                      │
└───────────┼─────────────────────┼──────────────────────────────────────┘
            │                     │
            │                     │
┌───────────▼─────────────────────▼──────────────────────────────────────┐
│                         REACT CONTEXT LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │  Guests Context  │  │  Events Context  │  │   Auth Context   │    │
│  │ (guests-context) │  │ (events-context) │  │ (auth-context)   │    │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────┤    │
│  │ • Guest Data     │  │ • Event Data     │  │ • User Info      │    │
│  │ • Check-In Logic │  │ • Event Status   │  │ • Display Name   │    │
│  │ • Auto-Refresh   │  │ • Event Details  │  │ • Role (Admin)   │    │
│  │   (30 seconds)   │  │                  │  │                  │    │
│  └────────┬─────────┘  └──────────────────┘  └──────────────────┘    │
│           │                                                             │
└───────────┼─────────────────────────────────────────────────────────────┘
            │
            │
┌───────────▼─────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │         ScannerSessionService (scanner-session-service.ts)       │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  startSession(data)                                              │  │
│  │  ├─ Create new scanner session                                   │  │
│  │  ├─ Store user_id, event_id, usher_name, usher_email           │  │
│  │  └─ Return session ID                                            │  │
│  │                                                                  │  │
│  │  endSession(sessionId)                                           │  │
│  │  ├─ Mark session as inactive                                     │  │
│  │  ├─ Set ended_at timestamp                                       │  │
│  │  └─ Update is_active = false                                     │  │
│  │                                                                  │  │
│  │  incrementScanCount(sessionId)                                   │  │
│  │  ├─ Call database function                                       │  │
│  │  ├─ Increment scans_count atomically                             │  │
│  │  └─ Update last_activity_at                                      │  │
│  │                                                                  │  │
│  │  getActiveSessions(eventId?)                                     │  │
│  │  ├─ Query active sessions                                        │  │
│  │  ├─ Filter by is_active = true                                   │  │
│  │  └─ Join with events table                                       │  │
│  │                                                                  │  │
│  │  subscribeToActiveSessions(callback)                             │  │
│  │  ├─ Subscribe to scanner_sessions table                          │  │
│  │  ├─ Listen for INSERT, UPDATE, DELETE                            │  │
│  │  └─ Call callback on changes                                     │  │
│  │                                                                  │  │
│  └──────────────────────────┬───────────────────────────────────────┘  │
│                             │                                           │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                       SUPABASE DATABASE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    scanner_sessions TABLE                        │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ • id (UUID, PK)                                                  │  │
│  │ • user_id (UUID, FK → auth.users)                               │  │
│  │ • event_id (UUID, FK → events)                                  │  │
│  │ • usher_name (TEXT)                                              │  │
│  │ • usher_email (TEXT)                                             │  │
│  │ • started_at (TIMESTAMPTZ)                                       │  │
│  │ • last_activity_at (TIMESTAMPTZ)                                 │  │
│  │ • ended_at (TIMESTAMPTZ, nullable)                               │  │
│  │ • is_active (BOOLEAN)                                            │  │
│  │ • scans_count (INTEGER)                                          │  │
│  │ • created_at (TIMESTAMPTZ)                                       │  │
│  │ • updated_at (TIMESTAMPTZ)                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         INDEXES                                  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ • idx_scanner_sessions_user_id                                   │  │
│  │ • idx_scanner_sessions_event_id                                  │  │
│  │ • idx_scanner_sessions_is_active                                 │  │
│  │ • idx_scanner_sessions_last_activity                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      RLS POLICIES                                │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ • SELECT: All authenticated users can read                       │  │
│  │ • INSERT: Users can insert their own sessions                    │  │
│  │ • UPDATE: Users can update their own sessions                    │  │
│  │ • DELETE: Users can delete their own sessions                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      FUNCTIONS                                   │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ increment_scanner_session_scans(session_id UUID)                 │  │
│  │ ├─ Atomically increment scans_count                              │  │
│  │ └─ Update last_activity_at                                       │  │
│  │                                                                  │  │
│  │ end_inactive_scanner_sessions()                                  │  │
│  │ ├─ Find sessions inactive > 10 minutes                           │  │
│  │ ├─ Set is_active = false                                         │  │
│  │ └─ Set ended_at = last_activity_at                               │  │
│  │                                                                  │  │
│  │ update_scanner_sessions_updated_at()                             │  │
│  │ └─ Trigger function to update updated_at on changes              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagrams

### Flow 1: Scanner Session Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCANNER SESSION LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────────┘

1. USER OPENS SCANNER
   │
   ├─► QR Scanner Component Mounts
   │   │
   │   └─► startScanning() called
   │       │
   │       └─► ScannerSessionService.startSession({
   │           │   userId: user.id,
   │           │   eventId: eventId,
   │           │   usherName: "Tapiwanashe",
   │           │   usherEmail: "tapiwanashe@example.com"
   │           })
   │           │
   │           └─► INSERT INTO scanner_sessions
   │               │   (user_id, event_id, usher_name, usher_email,
   │               │    started_at, is_active, scans_count)
   │               │   VALUES (...)
   │               │
   │               └─► Returns session ID
   │                   │
   │                   └─► setScannerSessionId(session.id)
   │
   ▼

2. USER SCANS QR CODES
   │
   ├─► QR Code Detected
   │   │
   │   └─► handleSuccessfulScan() called
   │       │
   │       └─► Check in guest
   │           │
   │           └─► ScannerSessionService.incrementScanCount(sessionId)
   │               │
   │               └─► CALL increment_scanner_session_scans(session_id)
   │                   │
   │                   └─► UPDATE scanner_sessions
   │                       │   SET scans_count = scans_count + 1,
   │                       │       last_activity_at = NOW()
   │                       │   WHERE id = session_id
   │                       │
   │                       └─► Real-time update triggered
   │                           │
   │                           └─► Admin dashboard updates
   │
   ▼

3. USER CLOSES SCANNER
   │
   ├─► stopScanning() called OR Component Unmounts
   │   │
   │   └─► ScannerSessionService.endSession(sessionId)
   │       │
   │       └─► UPDATE scanner_sessions
   │           │   SET is_active = FALSE,
   │           │       ended_at = NOW()
   │           │   WHERE id = session_id
   │           │
   │           └─► Real-time update triggered
   │               │
   │               └─► Admin dashboard removes session
   │
   ▼

4. AUTOMATIC CLEANUP (if user forgets to close)
   │
   └─► After 10 minutes of inactivity
       │
       └─► end_inactive_scanner_sessions() function
           │
           └─► UPDATE scanner_sessions
               │   SET is_active = FALSE,
               │       ended_at = last_activity_at
               │   WHERE is_active = TRUE
               │     AND last_activity_at < NOW() - INTERVAL '10 minutes'
```

---

### Flow 2: Admin Dashboard Real-Time Updates

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  ADMIN DASHBOARD REAL-TIME UPDATES                      │
└─────────────────────────────────────────────────────────────────────────┘

1. ADMIN OPENS DASHBOARD
   │
   ├─► ActiveScannerSessions Component Mounts
   │   │
   │   ├─► Initial Data Load
   │   │   │
   │   │   └─► ScannerSessionService.getActiveSessions()
   │   │       │
   │   │       └─► SELECT * FROM scanner_sessions
   │   │           │   WHERE is_active = TRUE
   │   │           │   ORDER BY last_activity_at DESC
   │   │           │
   │   │           └─► Display sessions in UI
   │   │
   │   ├─► Setup Real-Time Subscription
   │   │   │
   │   │   └─► ScannerSessionService.subscribeToActiveSessions(callback)
   │   │       │
   │   │       └─► supabase
   │   │           │   .channel('scanner-sessions')
   │   │           │   .on('postgres_changes', ...)
   │   │           │   .subscribe()
   │   │           │
   │   │           └─► Listen for INSERT, UPDATE, DELETE
   │   │
   │   └─► Setup Polling Fallback
   │       │
   │       └─► setInterval(() => {
   │           │   fetchActiveSessions()
   │           }, 30000)
   │
   ▼

2. USHER PERFORMS SCAN (in another tab/device)
   │
   ├─► Scan count incremented in database
   │   │
   │   └─► UPDATE scanner_sessions
   │       │   SET scans_count = scans_count + 1,
   │       │       last_activity_at = NOW()
   │       │
   │       └─► Triggers real-time event
   │
   ▼

3. ADMIN DASHBOARD RECEIVES UPDATE
   │
   ├─► Real-Time Path (< 2 seconds)
   │   │
   │   └─► Supabase sends UPDATE event via WebSocket
   │       │
   │       └─► Subscription callback triggered
   │           │
   │           └─► fetchActiveSessions()
   │               │
   │               └─► UI updates with new scan count
   │
   └─► Polling Path (< 30 seconds)
       │
       └─► setInterval fires
           │
           └─► fetchActiveSessions()
               │
               └─► UI updates with new scan count
```

---

### Flow 3: Auto-Refresh Active Scanners Count

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  AUTO-REFRESH ACTIVE SCANNERS COUNT                     │
└─────────────────────────────────────────────────────────────────────────┘

1. DASHBOARD LOADS
   │
   ├─► Guests Context Initializes
   │   │
   │   └─► useEffect(() => {
   │       │   const interval = setInterval(() => {
   │       │     console.log("Auto-refreshing guest data...")
   │       │     refreshGuests()
   │       │   }, 30000)
   │       │   return () => clearInterval(interval)
   │       }, [])
   │
   ▼

2. EVERY 30 SECONDS
   │
   ├─► refreshGuests() called
   │   │
   │   └─► Fetch all guests from database
   │       │
   │       └─► SELECT * FROM guests
   │           │
   │           └─► Update guests state
   │               │
   │               └─► Trigger re-render
   │
   ▼

3. DASHBOARD CALCULATES ACTIVE SCANNERS
   │
   ├─► Filter guests checked in within last 5 minutes
   │   │
   │   └─► const activeScanners = guests.filter(g => 
   │       │   g.checkedIn && 
   │       │   (Date.now() - new Date(g.checkedInAt).getTime()) < 5 * 60 * 1000
   │       )
   │       │
   │       └─► activeScanners.length
   │           │
   │           └─► Display in "Active Scanners" card
   │
   ▼

4. UI UPDATES AUTOMATICALLY
   │
   └─► No page refresh required
       └─► Seamless background update
```

---

## 🎯 Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      COMPONENT INTERACTIONS                             │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   Dashboard      │
                    │   (dashboard)    │
                    └────────┬─────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │  Events   │  │  Guests   │  │ Analytics │
        │   Tab     │  │   Tab     │  │    Tab    │
        └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
              │              │              │
              │              │              │
              ▼              ▼              ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │ Event     │  │ Guest     │  │ Analytics │
        │ List      │  │ List      │  │ Dashboard │
        └─────┬─────┘  └───────────┘  └─────┬─────┘
              │                              │
              │                              │
              ▼                              ▼
        ┌───────────┐                  ┌───────────┐
        │ QR        │                  │ Average   │
        │ Scanner   │                  │ Check-In  │
        │           │                  │ Time      │
        └─────┬─────┘                  └───────────┘
              │
              │
              ▼
        ┌───────────────────────────────────┐
        │  ScannerSessionService            │
        │  • startSession()                 │
        │  • incrementScanCount()           │
        │  • endSession()                   │
        └─────┬─────────────────────────────┘
              │
              │
              ▼
        ┌───────────────────────────────────┐
        │  Supabase Database                │
        │  • scanner_sessions table         │
        │  • Functions & Triggers           │
        └─────┬─────────────────────────────┘
              │
              │ (Real-time updates)
              │
              ▼
        ┌───────────────────────────────────┐
        │  ActiveScannerSessions            │
        │  (Admin Dashboard)                │
        │  • Real-time subscription         │
        │  • 30-second polling              │
        │  • Display active sessions        │
        └───────────────────────────────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: UI VISIBILITY CONTROL                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  {isAdmin && <ActiveScannerSessions />}                                 │
│                                                                         │
│  ✅ Only admins see the component                                       │
│  ✅ Ushers cannot access the UI                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: ROW LEVEL SECURITY (RLS)                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SELECT Policy: "Allow authenticated users to read scanner sessions"   │
│  ├─ All authenticated users can read all sessions                      │
│  └─ Enables admins to monitor all scanners                             │
│                                                                         │
│  INSERT Policy: "Allow users to insert their own scanner sessions"     │
│  ├─ Users can only create sessions for themselves                      │
│  └─ Prevents impersonation                                             │
│                                                                         │
│  UPDATE Policy: "Allow users to update their own scanner sessions"     │
│  ├─ Users can only modify their own sessions                           │
│  └─ Prevents tampering with other users' data                          │
│                                                                         │
│  DELETE Policy: "Allow users to delete their own scanner sessions"     │
│  ├─ Users can only delete their own sessions                           │
│  └─ Prevents malicious deletion                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: FUNCTION SECURITY                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  increment_scanner_session_scans(session_id UUID)                       │
│  ├─ SECURITY DEFINER (runs with function owner's privileges)           │
│  ├─ GRANT EXECUTE TO authenticated                                     │
│  └─ Only updates sessions where is_active = TRUE                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 4: DATA VALIDATION                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Foreign Key Constraints:                                               │
│  ├─ user_id → auth.users(id) ON DELETE CASCADE                         │
│  └─ event_id → events(id) ON DELETE CASCADE                            │
│                                                                         │
│  NOT NULL Constraints:                                                  │
│  ├─ user_id, event_id, usher_name, usher_email                         │
│  └─ started_at, last_activity_at, is_active, scans_count              │
│                                                                         │
│  Default Values:                                                        │
│  ├─ is_active = TRUE                                                    │
│  ├─ scans_count = 0                                                     │
│  └─ timestamps = NOW()                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATIONS                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ DATABASE LEVEL                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Indexes:                                                               │
│  ├─ idx_scanner_sessions_user_id → Fast user lookups                   │
│  ├─ idx_scanner_sessions_event_id → Fast event filtering               │
│  ├─ idx_scanner_sessions_is_active → Fast active session queries       │
│  └─ idx_scanner_sessions_last_activity → Fast sorting & cleanup        │
│                                                                         │
│  Atomic Operations:                                                     │
│  └─ increment_scanner_session_scans() → No race conditions             │
│                                                                         │
│  Efficient Queries:                                                     │
│  ├─ WHERE is_active = TRUE → Indexed boolean filter                    │
│  ├─ ORDER BY last_activity_at DESC → Indexed sort                      │
│  └─ JOIN events ON event_id → Foreign key index                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ APPLICATION LEVEL                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  React Optimization:                                                    │
│  ├─ useCallback for event handlers                                     │
│  ├─ useMemo for computed values                                        │
│  └─ Proper dependency arrays                                           │
│                                                                         │
│  State Management:                                                      │
│  ├─ Context API for global state                                       │
│  ├─ Local state for component-specific data                            │
│  └─ Minimal re-renders                                                 │
│                                                                         │
│  Data Fetching:                                                         │
│  ├─ Real-time subscriptions (instant updates)                          │
│  ├─ 30-second polling (fallback)                                       │
│  └─ Debounced updates                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ NETWORK LEVEL                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  WebSocket Connections:                                                 │
│  ├─ Single connection for all subscriptions                            │
│  ├─ Automatic reconnection                                             │
│  └─ Minimal bandwidth usage                                            │
│                                                                         │
│  Data Transfer:                                                         │
│  ├─ Only fetch active sessions (is_active = TRUE)                      │
│  ├─ Selective field fetching                                           │
│  └─ Compressed payloads                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Scalability Considerations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SCALABILITY METRICS                             │
└─────────────────────────────────────────────────────────────────────────┘

Current Capacity:
├─ 100+ concurrent scanners
├─ < 100ms database queries
├─ < 2 seconds real-time updates
└─ < 30 seconds polling updates

Growth Path:
├─ 1,000+ scanners → Add database read replicas
├─ 10,000+ scanners → Implement caching layer (Redis)
├─ 100,000+ scanners → Shard database by event_id
└─ Global scale → CDN + edge functions

Automatic Cleanup:
├─ 10-minute inactivity timeout
├─ Prevents database bloat
└─ Maintains query performance
```

---

**Last Updated:** 2024
**Version:** 1.0.0