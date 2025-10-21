# WhatsApp Integration - Flow Diagrams

Visual representation of how the WhatsApp integration works.

---

## 🔄 Single Invitation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. User clicks WhatsApp button
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WhatsAppSendButton Component                   │
│  • Shows confirmation dialog                                    │
│  • Displays guest name and phone                                │
│  • User confirms send                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 2. POST request with guestId, eventId
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Route: /api/whatsapp/send-invitation           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Authenticate user                                      │  │
│  │ 2. Fetch guest details from database                     │  │
│  │ 3. Fetch event details from database                     │  │
│  │ 4. Verify user owns event                                │  │
│  │ 5. Generate QR code URL                                  │  │
│  │ 6. Format event date                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Call WhatsApp service
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WhatsAppService Class                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ sendGuestInvitation()                                     │  │
│  │   ├─ Format phone number                                 │  │
│  │   ├─ Send text message (event details)                   │  │
│  │   └─ Send image message (QR code)                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 4. API calls to Meta
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Meta WhatsApp Cloud API                        │
│  • POST /v21.0/{phone_number_id}/messages                      │
│  • Authorization: Bearer {access_token}                        │
│  • Message 1: Text with event details                          │
│  • Message 2: Image with QR code                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 5. WhatsApp delivers messages
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Guest's WhatsApp                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🎉 Event Invitation                                       │  │
│  │                                                           │  │
│  │ Hello John Doe!                                           │  │
│  │                                                           │  │
│  │ You're invited to: Annual Gala                            │  │
│  │ 📅 Date: January 15, 2024                                │  │
│  │ 📍 Location: Grand Ballroom                              │  │
│  │                                                           │  │
│  │ Your QR code is attached below...                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │              [QR CODE IMAGE]                              │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 6. Update database
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Database                          │
│  UPDATE guests SET                                              │
│    invitation_sent = true,                                      │
│    invitation_sent_at = NOW()                                   │
│  WHERE id = guest_id                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 7. Success response
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  ✅ Toast: "WhatsApp invitation sent to John Doe"              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Bulk Invitation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  • User selects multiple guests (checkboxes)                    │
│  • Clicks "Send WhatsApp" button                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Opens bulk send dialog
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               WhatsAppBulkSendDialog Component                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Summary:                                                  │  │
│  │   Total Selected: 10                                      │  │
│  │   With Phone: 8                                           │  │
│  │   Without Phone: 2                                        │  │
│  │                                                           │  │
│  │ ⚠️ 2 guests will be skipped (no phone number)            │  │
│  │                                                           │  │
│  │ [Cancel]  [Send to 8 Guests]                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 2. User confirms
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                API Route: /api/whatsapp/send-bulk               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Authenticate user                                      │  │
│  │ 2. Fetch event details                                    │  │
│  │ 3. Verify user owns event                                │  │
│  │ 4. Fetch all selected guests                             │  │
│  │ 5. Filter guests with phone numbers                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Loop through guests
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    For Each Guest (Sequential)                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Guest 1: John Doe                                         │  │
│  │   ├─ Generate QR code URL                                │  │
│  │   ├─ Send invitation via WhatsApp                        │  │
│  │   ├─ Update database                                     │  │
│  │   ├─ Record success ✅                                   │  │
│  │   └─ Wait 1 second (rate limiting)                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Guest 2: Jane Smith                                       │  │
│  │   ├─ Generate QR code URL                                │  │
│  │   ├─ Send invitation via WhatsApp                        │  │
│  │   ├─ Update database                                     │  │
│  │   ├─ Record success ✅                                   │  │
│  │   └─ Wait 1 second                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Guest 3: Bob Wilson                                       │  │
│  │   ├─ Generate QR code URL                                │  │
│  │   ├─ Send invitation via WhatsApp                        │  │
│  │   ├─ ❌ Error: Invalid phone number                      │  │
│  │   └─ Record failure ❌                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Guest 4: Alice Brown                                      │  │
│  │   └─ ⚠️ Skipped: No phone number                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ... continues for all guests ...                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 4. Return results
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               WhatsAppBulkSendDialog Component                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Results:                                                  │  │
│  │                                                           │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                  │  │
│  │  │   ✅ 6  │  │   ❌ 1  │  │   ⚠️ 3  │                  │  │
│  │  │  Sent   │  │ Failed  │  │ Skipped │                  │  │
│  │  └─────────┘  └─────────┘  └─────────┘                  │  │
│  │                                                           │  │
│  │ Details:                                                  │  │
│  │  ✅ John Doe                                             │  │
│  │  ✅ Jane Smith                                           │  │
│  │  ❌ Bob Wilson (Invalid phone number)                   │  │
│  │  ⚠️ Alice Brown (No phone number)                       │  │
│  │  ...                                                      │  │
│  │                                                           │  │
│  │ [Close]                                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🖼️ QR Code Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  WhatsApp Fetches QR Code                       │
│  When sending image message, WhatsApp needs to fetch the image │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ GET request
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         API Route: /api/guests/[guestId]/qr-code                │
│  • Public endpoint (no auth required)                           │
│  • Accepts guest ID as parameter                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. Fetch guest data
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Database                          │
│  SELECT id, name, event_id                                      │
│  FROM guests                                                    │
│  WHERE id = guest_id                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 2. Generate QR data
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      QR Code Generation                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Data (JSON):                                              │  │
│  │ {                                                         │  │
│  │   "guestId": "uuid",                                      │  │
│  │   "eventId": "uuid",                                      │  │
│  │   "name": "John Doe"                                      │  │
│  │ }                                                         │  │
│  │                                                           │  │
│  │ Settings:                                                 │  │
│  │   • Format: PNG                                           │  │
│  │   • Size: 512x512                                         │  │
│  │   • Error Correction: High                                │  │
│  │   • Margin: 2                                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 3. Return PNG image
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP Response                              │
│  Headers:                                                       │
│    Content-Type: image/png                                      │
│    Cache-Control: public, max-age=31536000, immutable           │
│    Content-Disposition: inline; filename="qr-uuid.png"          │
│                                                                 │
│  Body: [PNG binary data]                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 4. WhatsApp caches and delivers
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Guest's WhatsApp                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │              ┌─────────────────┐                          │  │
│  │              │  ███  ██  ███  │                          │  │
│  │              │  █  █ ██ █  █  │                          │  │
│  │              │  ███  ██  ███  │                          │  │
│  │              │  ██ █ ██ █ ██  │                          │  │
│  │              │  ███  ██  ███  │                          │  │
│  │              └─────────────────┘                          │  │
│  │                                                           │  │
│  │  QR Code for John Doe - Annual Gala                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Request Received                         │
│  POST /api/whatsapp/send-invitation                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    1. Check Configuration                       │
│  if (!whatsappService.isConfigured())                           │
│    return 503 Service Unavailable                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. Authenticate User                         │
│  const { user } = await supabase.auth.getUser()                 │
│  if (!user)                                                     │
│    return 401 Unauthorized                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    3. Validate Request                          │
│  if (!guestId || !eventId)                                      │
│    return 400 Bad Request                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. Fetch Guest                               │
│  const guest = await supabase                                   │
│    .from('guests')                                              │
│    .select('*')                                                 │
│    .eq('id', guestId)                                           │
│    .single()                                                    │
│                                                                 │
│  if (!guest)                                                    │
│    return 404 Not Found                                         │
│                                                                 │
│  if (!guest.phone)                                              │
│    return 400 Bad Request (No phone number)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    5. Fetch Event                               │
│  const event = await supabase                                   │
│    .from('events')                                              │
│    .select('*')                                                 │
│    .eq('id', eventId)                                           │
│    .single()                                                    │
│                                                                 │
│  if (!event)                                                    │
│    return 404 Not Found                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    6. Authorize User                            │
│  if (event.user_id !== user.id)                                 │
│    return 403 Forbidden                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    7. Send Invitation                           │
│  ✅ All checks passed - proceed with sending                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         Database Schema                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│         events           │
├──────────────────────────┤
│ id (uuid) PK             │
│ user_id (uuid) FK        │
│ name (text)              │
│ date (timestamp)         │
│ location (text)          │
│ ...                      │
└──────────────────────────┘
            │
            │ 1:N
            │
            ▼
┌──────────────────────────┐
│         guests           │
├──────────────────────────┤
│ id (uuid) PK             │
│ event_id (uuid) FK       │
│ name (text)              │
│ email (text)             │
│ phone (text)             │◄─── Used for WhatsApp
│ invitation_sent (bool)   │◄─── Tracks if sent
│ invitation_sent_at (ts)  │◄─── Tracks when sent
│ seating_area (text)      │
│ cuisine_choice (text)    │
│ ...                      │
└──────────────────────────┘
```

---

## 🌐 External API Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your Application                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS Request
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Meta WhatsApp Cloud API                            │
│  Endpoint: https://graph.facebook.com/v21.0/                    │
│            {phone_number_id}/messages                           │
│                                                                 │
│  Headers:                                                       │
│    Authorization: Bearer {access_token}                         │
│    Content-Type: application/json                               │
│                                                                 │
│  Body:                                                          │
│    {                                                            │
│      "messaging_product": "whatsapp",                           │
│      "recipient_type": "individual",                            │
│      "to": "263785211893",                                      │
│      "type": "text",                                            │
│      "text": {                                                  │
│        "preview_url": true,                                     │
│        "body": "Your message here"                              │
│      }                                                          │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Response
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Response                                 │
│  {                                                              │
│    "messaging_product": "whatsapp",                             │
│    "contacts": [{                                               │
│      "input": "263785211893",                                   │
│      "wa_id": "263785211893"                                    │
│    }],                                                          │
│    "messages": [{                                               │
│      "id": "wamid.HBgNMjYzNzg1MjExODkzFQIAERgSNEE..."          │
│    }]                                                           │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Complete User Journey

```
Event Organizer                                              Guest
      │                                                        │
      │ 1. Creates event                                      │
      │ 2. Adds guests (with phone numbers)                   │
      │                                                        │
      │ 3. Clicks "Send WhatsApp"                             │
      ├──────────────────────────────────────────────────────►│
      │                                                        │ 4. Receives invitation
      │                                                        │    on WhatsApp
      │                                                        │
      │                                                        │ 5. Views event details
      │                                                        │
      │                                                        │ 6. Saves QR code
      │                                                        │
      │                                                        │ 7. Arrives at event
      │                                                        │
      │ 8. Scans guest's QR code                              │
      │◄──────────────────────────────────────────────────────┤ 8. Shows QR code
      │                                                        │
      │ 9. System checks in guest                             │
      │                                                        │
      │ 10. (Optional) Sends check-in confirmation            │
      ├──────────────────────────────────────────────────────►│
      │                                                        │ 11. Receives confirmation
      │                                                        │
      │ 12. Views analytics                                   │ 12. Enjoys event!
      │     (who checked in, etc.)                            │
      │                                                        │
```

---

## 📱 Message Sequence

```
Time    Your App          Meta API          WhatsApp Server    Guest's Phone
─────────────────────────────────────────────────────────────────────────────
T+0s    Send Text ──────► Validate ────────► Queue ──────────► Deliver
        Message           Request            Message           Text Message
                                                               
T+1s    Send Image ─────► Fetch QR ────────► Queue ──────────► Deliver
        Message           Code URL           Message           QR Image
                          
T+2s    Update ─────────► Return ──────────► Confirm ────────► Display
        Database          Success            Delivery          Messages
```

---

These diagrams show the complete flow of the WhatsApp integration from user action to message delivery!