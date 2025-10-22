# Custom Guest Fields Implementation

## Overview
This feature adds support for dynamic custom guest fields. You can now:
- Import CSV files with **any columns** (not just predefined ones)
- Custom fields are automatically captured and stored with each guest
- All custom fields are displayed on the check-in success screen
- Fields are stored as JSON in the database for maximum flexibility

## What Changed

### 1. Database Schema (Supabase)
- **New Column**: `guests.custom_data` (JSONB) - Stores any custom field data
- **New Table**: `event_custom_fields` - For future field definitions per event (optional)
- **New Index**: `idx_guests_custom_data` - For performance optimization

**Migration File**: `supabase-migrations/add-custom-fields-support.sql`

### 2. CSV Import - Flexible Column Detection
The CSV parser now supports:
- **Required**: `name` column (always needed)
- **Optional Standard**: `email`, `phone`, `seating`, `cuisine` columns
- **Any Custom Columns**: All other columns are automatically stored as custom fields

**Files Modified**:
- `components/guests/guest-upload.tsx`
- `components/guests/guest-upload-dialog.tsx`

### 3. Check-in Display
When a guest checks in, the success dialog now displays:
- Guest name & phone (standard)
- Seating area (standard)
- Cuisine choice (standard)
- **All custom fields** (dynamically populated)

**File Modified**: `components/scanner/checkin-summary-dialog.tsx`

### 4. Backend Service
The guest service now handles custom fields:
- Stores custom data during creation
- Retrieves custom data when fetching guests
- Supports updating custom fields

**File Modified**: `lib/supabase/guest-service.ts`

## How to Use

### 1. CSV File Format
Your CSV file should have a header row with field names. Example:

```csv
Full Name,Email,Phone Number,Seating,Your choice of cuisine:,Parking:
John Smith,john@example.com,+263785211893,Reserved,Traditional,Lot A
Sarah Johnson,sarah@example.com,+263785211894,Free Seating,Western,Lot B
Michael Chen,michael@example.com,+263785211895,Free Seating,Traditional,Valet
```

**Column Mapping**:
- `Full Name` → Standard `name` field
- `Email` → Standard `email` field
- `Phone Number` → Standard `phone` field
- `Seating` → Standard `seatingArea` field (Reserved | Free Seating)
- `Your choice of cuisine:` → Standard `cuisineChoice` field (Traditional | Western)
- `Parking:` → Custom field (stored as `parking`)
- **Any other columns** → Automatically stored as custom fields

### 2. Column Name Conversion
- Headers are converted to camelCase for storage
  - `Parking:` → `parking`
  - `Table Assignment` → `tableAssignment`
  - `Dietary Restrictions` → `dietaryRestrictions`

### 3. Uploading Guests
1. Go to Events → Select an event → Guest management
2. Click "Upload Guest List" (or equivalent)
3. Select your CSV file with any columns you want
4. Review the preview
5. Click "Upload" - custom fields are automatically captured

### 4. Check-in Flow
1. Scan guest QR code
2. Guest information appears in success dialog
3. All standard fields (name, phone, seating, cuisine) display
4. **All custom fields display below** with proper formatting

## Example CSV Files

### Basic (Minimal)
```csv
name,email,phone
Alice Wong,alice@example.com,+263781234567
Bob Turner,bob@example.com,+263781234568
```

### With Parking
```csv
Full Name,Email,Phone,Seating,Cuisine,Parking
Alice Wong,alice@example.com,+263781234567,Reserved,Traditional,Lot A
Bob Turner,bob@example.com,+263781234568,Free Seating,Western,Valet
```

### With Multiple Custom Fields
```csv
name,email,phone,seating,cuisine,dietary_restrictions,table_number,vip_status
Alice Wong,alice@example.com,+263781234567,Reserved,Traditional,Vegetarian,5,Yes
Bob Turner,bob@example.com,+263781234568,Free Seating,Western,Gluten-free,7,No
Carol Davis,carol@example.com,+263781234569,Reserved,Traditional,None,8,Yes
```

## Field Validation

### Standard Fields
- **name**: Required, must not be empty
- **email**: Optional, no format validation
- **phone**: Optional, no format validation
- **seating**: Optional, must be "Reserved" or "Free Seating" (any other value logs an error)
- **cuisine**: Optional, must be "Traditional" or "Western" (any other value logs an error)

### Custom Fields
- Any value type accepted
- Stored as-is in the database
- Displayed as strings on check-in
- Empty values are not displayed on check-in

## Display on Check-in

When a guest checks in, the success dialog shows:

```
✓ Check-In Successful!

[Guest Photo if available]

┌─────────────────────────────┐
│ Name: Alice Wong            │
│ 📱 +263781234567            │
│                             │
│ 🪑 Seating: Reserved        │
│ 🍽️ Cuisine: Traditional      │
│ • Parking: Lot A            │
│ • Table Number: 5           │
│ • VIP Status: Yes           │
│                             │
│ 🕐 Checked in: 2:30 PM      │
└─────────────────────────────┘

[Check In Another Guest]
```

## Database Schema Details

### guests table
```sql
ALTER TABLE guests ADD COLUMN custom_data jsonb DEFAULT '{}'::jsonb;
```

### Example Data
```json
{
  "parking": "Lot A",
  "tableNumber": "5",
  "vipStatus": "Yes",
  "dietaryRestrictions": "Vegetarian"
}
```

## Backward Compatibility

✅ **Fully backward compatible**
- Existing guests without custom fields work fine
- Empty `custom_data` defaults to `{}`
- CSV files without extra columns work as before
- Check-in dialog gracefully hides empty custom fields

## Future Enhancements

Planned features (not yet implemented):
1. Admin UI to define/manage custom fields per event
2. Custom field type validation (dropdown options, date pickers, etc.)
3. Search/filter guests by custom field values
4. Export reports including custom fields
5. Custom field requirement configuration per event

## Technical Implementation

### TypeScript Types
```typescript
// Guest object now includes:
{
  customData?: Record<string, any>
}

// Create guest input:
interface SupabaseCreateGuestInput {
  customData?: Record<string, any>
}
```

### CSV Parsing Logic
1. Read CSV header row
2. Identify standard columns (name, email, phone, seating, cuisine)
3. For each data row:
   - Extract standard fields
   - Capture all non-standard columns as custom fields
   - Convert header names to camelCase
4. Store custom fields as JSON object

### Check-in Display Logic
1. Fetch guest with `custom_data` field
2. Display standard fields (name, phone, seating, cuisine)
3. Iterate through `custom_data` object
4. Display each key-value pair with formatted label
5. Skip null, undefined, or empty values

## Troubleshooting

### Issue: Custom fields not appearing on check-in
- Verify custom_data column exists in Supabase guests table
- Check that CSV import showed custom fields in preview
- Confirm custom_data is populated in database

### Issue: Column names not mapping correctly
- Verify column headers match exactly (case-insensitive)
- Standard columns must include the identifying keyword:
  - "name" in column name (Full Name, Guest Name, etc.)
  - "email" in column name
  - "phone" in column name
  - "seating" in column name
  - "cuisine" in column name

### Issue: Validation errors on upload
- Seating must be exactly "Reserved" or "Free Seating"
- Cuisine must be exactly "Traditional" or "Western"
- Name field is required for each row

## Migration Steps

1. **Apply Database Migration**:
   ```sql
   -- Run the migration in Supabase SQL Editor:
   -- supabase-migrations/add-custom-fields-support.sql
   ```

2. **Update Application**:
   - All files are already updated
   - No additional code changes needed

3. **Test**:
   - Create a test CSV with custom columns
   - Upload to an event
   - Verify custom fields appear on check-in

## Files Modified

### New Files
- `supabase-migrations/add-custom-fields-support.sql`
- `CUSTOM_FIELDS_IMPLEMENTATION.md` (this file)

### Updated Files
- `lib/supabase/types.ts` - Added custom field types
- `lib/supabase/guest-service.ts` - Added custom data handling
- `components/guests/guest-upload.tsx` - Flexible CSV parsing
- `components/guests/guest-upload-dialog.tsx` - Flexible CSV parsing
- `components/scanner/checkin-summary-dialog.tsx` - Display custom fields

## API Changes

### SupabaseGuestService.createGuest()
```typescript
// Old
await service.createGuest({
  eventId: "123",
  name: "John",
  email: "john@example.com"
})

// New - supports custom data
await service.createGuest({
  eventId: "123",
  name: "John",
  email: "john@example.com",
  customData: { parking: "Lot A", vip: true }
})
```

### SupabaseGuestService.updateGuest()
```typescript
// Now supports updating custom data
await service.updateGuest("guestId", {
  customData: { parking: "Lot B" }
})
```

## Notes for Future Development

- Custom fields feature is extensible - new column types can be added via CSV
- Consider adding a UI for admins to define field schemas per event
- Custom fields could support different data types with validation
- Integration with reports/exports should include custom fields