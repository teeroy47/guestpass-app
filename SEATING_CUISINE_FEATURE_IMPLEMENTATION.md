# Seating Arrangement & Cuisine Choice Feature Implementation

## Overview
This document outlines the implementation of seating arrangement and cuisine choice features for the Guest Pass Management Application.

## Features Implemented

### 1. Database Schema Updates
**File:** `supabase-migration-seating-cuisine.sql`

Added two new columns to the `guests` table:
- `seating_area` - TEXT field with CHECK constraint
  - Options: `'Reserved'` or `'Free Seating'`
  - Default: `'Free Seating'`
- `cuisine_choice` - TEXT field with CHECK constraint
  - Options: `'Traditional'` or `'Western'`
  - Default: `'Traditional'`

**To Apply Migration:**
```sql
-- Run this SQL in your Supabase SQL Editor
-- File: supabase-migration-seating-cuisine.sql
```

### 2. TypeScript Type Updates
**Files Modified:**
- `lib/supabase/types.ts` - Added `seating_area` and `cuisine_choice` to `SupabaseGuestRow`
- `lib/supabase/guest-service.ts` - Updated `SupabaseCreateGuestInput` interface

### 3. Guest Service Updates
**File:** `lib/supabase/guest-service.ts`

Updated all database operations to include seating and cuisine fields:
- ✅ `serializeGuest()` - Includes seatingArea and cuisineChoice in serialized output
- ✅ `listGuestsByEvent()` - SELECT queries include new fields
- ✅ `createGuest()` - Inserts with default values ('Free Seating', 'Traditional')
- ✅ `createGuestsBulk()` - Bulk insert with seating and cuisine
- ✅ `updateGuest()` - Can update seating and cuisine
- ✅ `checkInGuest()` - SELECT queries include new fields

### 4. CSV Upload Enhancement
**File:** `components/guests/guest-upload-dialog.tsx`

#### Updated CSV Template
New template includes 5 columns:
```csv
name,email,phone,seating,cuisine
John Smith,john@example.com,+265991234567,Reserved,Traditional
Sarah Johnson,sarah@example.com,+265992345678,Free Seating,Western
Michael Chen,michael@example.com,+265993456789,Free Seating,Traditional
```

#### CSV Parsing Features
- ✅ Detects `seating` and `cuisine` columns automatically
- ✅ Validates seating values (Reserved or Free Seating)
- ✅ Validates cuisine values (Traditional or Western)
- ✅ Provides helpful error messages for invalid values
- ✅ Defaults to 'Free Seating' and 'Traditional' if not specified

#### Preview Display
- Shows seating area with 🪑 icon
- Shows cuisine choice with 🍽️ icon
- Displays all guest information in preview before upload

### 5. Check-in Scanner Enhancement
**File:** `components/scanner/qr-scanner.tsx`

When a guest QR code is scanned (Step 1), the scanner now displays:
- ✅ Guest name
- ✅ **Seating Area** (🪑 icon) - Shows where the guest should be seated
- ✅ **Cuisine Choice** (🍽️ icon) - Shows the guest's meal preference

**Usher Workflow:**
1. Scan QR code
2. See guest details including seating and cuisine
3. Direct guest to appropriate seating area
4. Inform kitchen/catering of cuisine preference
5. Capture photo (Step 2)
6. Complete check-in

## User Experience Flow

### For Admins (Creating Guests)

#### Option 1: CSV Upload
1. Click "Upload Guests" button
2. Download CSV template (includes seating and cuisine columns)
3. Fill in guest details with phone numbers in international format (+265...)
4. Specify seating: `Reserved` or `Free Seating`
5. Specify cuisine: `Traditional` or `Western`
6. Upload CSV file
7. Preview shows all details including seating and cuisine
8. Confirm upload

#### Option 2: Manual Entry (Future Enhancement)
- Add individual guests with seating and cuisine dropdowns

### For Ushers (Check-in)

1. Open QR Scanner for event
2. Scan guest's QR code
3. **Scanner displays:**
   - ✅ Guest name
   - 🪑 **Seating: Reserved** or **Free Seating**
   - 🍽️ **Cuisine: Traditional** or **Western**
4. Usher directs guest to appropriate seating area
5. Usher informs guest/catering of cuisine choice
6. Capture guest photo
7. Check-in complete

## Capacity Tracking (Future Enhancement)

The system tracks capacity but allows admin override:
- Reserved seats: Track count vs. capacity
- Free seating: Track count vs. capacity
- Admin can override limits if needed
- Dashboard shows seating distribution

## Data Validation

### Seating Area
- **Valid values:** `'Reserved'`, `'Free Seating'`
- **Default:** `'Free Seating'`
- **Database constraint:** CHECK constraint ensures only valid values

### Cuisine Choice
- **Valid values:** `'Traditional'`, `'Western'`
- **Default:** `'Traditional'`
- **Database constraint:** CHECK constraint ensures only valid values

### Phone Number Format
- **Required format:** International format with country code
- **Example:** `+265991234567` (Malawi)
- **Used for:** WhatsApp QR code delivery (future feature)

## CSV File Requirements

### Required Columns
- ✅ `name` - Guest full name (required)

### Optional Columns
- `email` - Guest email address
- `phone` - Phone number in international format (+265...)
- `seating` - Reserved or Free Seating
- `cuisine` - Traditional or Western

### Example CSV
```csv
name,email,phone,seating,cuisine
John Smith,john@example.com,+265991234567,Reserved,Traditional
Sarah Johnson,sarah@example.com,+265992345678,Free Seating,Western
Michael Chen,michael@example.com,+265993456789,Free Seating,Traditional
David Wilson,david@example.com,+265994567890,Reserved,Western
Emma Brown,emma@example.com,+265995678901,Free Seating,Traditional
```

## Testing Checklist

### Database Migration
- [ ] Run migration SQL in Supabase SQL Editor
- [ ] Verify columns exist: `seating_area`, `cuisine_choice`
- [ ] Verify CHECK constraints work
- [ ] Verify indexes created
- [ ] Verify existing guests have default values

### CSV Upload
- [ ] Download new CSV template
- [ ] Upload CSV with seating and cuisine data
- [ ] Verify preview shows seating and cuisine
- [ ] Verify guests created with correct values
- [ ] Test invalid seating values (should show error)
- [ ] Test invalid cuisine values (should show error)
- [ ] Test CSV without seating/cuisine (should use defaults)

### QR Scanner
- [ ] Scan guest QR code
- [ ] Verify seating area displays correctly
- [ ] Verify cuisine choice displays correctly
- [ ] Verify defaults show for old guests
- [ ] Complete check-in flow

### Guest List (Future)
- [ ] View guest list
- [ ] Filter by seating area
- [ ] Filter by cuisine choice
- [ ] Export includes seating and cuisine

## Next Steps: Bird WhatsApp Integration

### Prerequisites
1. Bird account with API credentials
2. WhatsApp Business API access
3. Approved WhatsApp message templates

### Implementation Plan
1. Create Bird API service (`lib/bird-service.ts`)
2. Add environment variables for Bird API key
3. Create WhatsApp message template with QR code
4. Add "Send to WhatsApp" button in guest list
5. Implement bulk WhatsApp sending
6. Track WhatsApp delivery status

### Bird API Integration
```typescript
// lib/bird-service.ts
export class BirdService {
  static async sendQRCodeWhatsApp(
    phoneNumber: string,
    guestName: string,
    qrCodeUrl: string,
    eventDetails: string
  ) {
    // Send WhatsApp message with QR code
  }
}
```

## Database Schema Reference

```sql
-- Guests table structure (relevant fields)
CREATE TABLE guests (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  seating_area TEXT DEFAULT 'Free Seating' CHECK (seating_area IN ('Reserved', 'Free Seating')),
  cuisine_choice TEXT DEFAULT 'Traditional' CHECK (cuisine_choice IN ('Traditional', 'Western')),
  unique_code TEXT NOT NULL,
  checked_in BOOLEAN DEFAULT FALSE,
  -- ... other fields
);
```

## API Response Format

```typescript
interface Guest {
  id: string
  eventId: string
  name: string
  email?: string
  phone?: string
  seatingArea: 'Reserved' | 'Free Seating'
  cuisineChoice: 'Traditional' | 'Western'
  uniqueCode: string
  checkedIn: boolean
  // ... other fields
}
```

## Summary

✅ **Completed:**
- Database migration with seating and cuisine fields
- TypeScript type definitions updated
- Guest service CRUD operations updated
- CSV upload with seating and cuisine parsing
- QR scanner displays seating and cuisine during check-in
- Validation and error handling
- Default values for backward compatibility

🔄 **Pending:**
- Manual guest creation form (add seating/cuisine dropdowns)
- Guest list filtering by seating/cuisine
- Capacity tracking dashboard
- Bird WhatsApp integration for QR code delivery
- Analytics by seating area and cuisine choice

## Support

For questions or issues:
1. Check this documentation
2. Review the code comments
3. Test with the provided CSV template
4. Verify database migration was applied correctly