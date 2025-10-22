# Custom Fields Data Flow - Technical Reference

## End-to-End Data Flow

```
CSV File Upload
    ↓
CSV Parser (guest-upload.tsx)
    ↓
Parse Headers & Identify Standard vs Custom Columns
    ↓
Transform CSV Rows to Guest Objects with customData
    ↓
Send to Backend (addGuestsBulk)
    ↓
Guest Service (guest-service.ts)
    ↓
Insert into Supabase (guests table)
    ↓
Store custom_data as JSONB
    ↓
[During Check-In]
    ↓
QR Scanner reads code
    ↓
Fetch Guest with custom_data
    ↓
Display in Check-In Summary Dialog
    ↓
Show all custom fields dynamically
```

## CSV Import Example

### Step 1: CSV File
```csv
Full Name,Email,Phone Number,Seating,Your choice of cuisine:,Parking:,Table Assignment
John Smith,john@example.com,+263781234567,Reserved,Traditional,Lot A,5
```

### Step 2: Header Parsing
```javascript
headers = ["full name", "email", "phone number", "seating", "your choice of cuisine:", "parking:", "table assignment"]

// Identify standard columns
nameIndex = 0 (found "name")
emailIndex = 1 (found "email")
phoneIndex = 2 (found "phone")
seatingIndex = 3 (found "seating")
cuisineIndex = 4 (found "cuisine")

// Remaining columns are custom
customIndices = [5, 6] // parking, table assignment
```

### Step 3: Row Parsing
```javascript
values = ["John Smith", "john@example.com", "+263781234567", "Reserved", "Traditional", "Lot A", "5"]

// Extract standard fields
name = "John Smith"
email = "john@example.com"
phone = "+263781234567"
seatingArea = "Reserved"
cuisineChoice = "Traditional"

// Extract custom fields
customData = {
  parking: "Lot A",           // from column 5: "parking:"
  tableAssignment: "5"        // from column 6: "table assignment"
}
```

### Step 4: Create Guest Object
```javascript
guest = {
  eventId: "event-123",
  name: "John Smith",
  email: "john@example.com",
  phone: "+263781234567",
  seatingArea: "Reserved",
  cuisineChoice: "Traditional",
  customData: {
    parking: "Lot A",
    tableAssignment: "5"
  }
}
```

### Step 5: Send to Backend
```typescript
// Calls guest service
await addGuestsBulk([guest])
```

### Step 6: Store in Database
```sql
INSERT INTO guests (
  event_id,
  name,
  email,
  phone,
  seating_area,
  cuisine_choice,
  custom_data
) VALUES (
  'event-123',
  'John Smith',
  'john@example.com',
  '+263781234567',
  'Reserved',
  'Traditional',
  '{"parking": "Lot A", "tableAssignment": "5"}'::jsonb
)
```

## Column Name Transformation

Header names are converted to camelCase for storage:

| Original Header | Stored As | Notes |
|---|---|---|
| Parking | parking | lowercase |
| Parking: | parking | colon removed |
| Table Assignment | tableAssignment | spaces converted, camelCase |
| Dietary Restrictions | dietaryRestrictions | camelCase |
| VIP Status | vipStatus | camelCase |
| special_requests | specialRequests | underscore to camelCase |
| Special-Requests | specialRequests | hyphen to camelCase |

**Conversion Logic**:
```javascript
const header = "Table Assignment"
const camelCase = header
  .toLowerCase()                          // "table assignment"
  .replace(/[-_\s]+(.)?/g, (_, char) => 
    (char ? char.toUpperCase() : '')      // "tableAssignment"
  )
```

## Database Schema

### guests table structure
```sql
CREATE TABLE guests (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  seating_area text,
  cuisine_choice text,
  
  -- NEW: Store custom fields
  custom_data jsonb DEFAULT '{}'::jsonb,
  
  -- Standard fields
  unique_code text,
  checked_in boolean DEFAULT false,
  checked_in_at timestamp,
  created_at timestamp DEFAULT now(),
  ...
)

-- NEW: Index for performance
CREATE INDEX idx_guests_custom_data ON guests USING gin (custom_data);
```

## Data Type Handling

### Input CSV
```csv
name,email,phone,amount,active
John,john@example.com,+123,500,Yes
```

### Stored (as strings)
```json
{
  "amount": "500",
  "active": "Yes"
}
```

### Retrieved
```typescript
guest.customData = {
  amount: "500",      // string
  active: "Yes"       // string
}
```

**Note**: All CSV values are stored as strings. No automatic type conversion.

## Check-In Retrieval Flow

### 1. QR Code Scanned
```
QR Code → uniqueCode = "ABC123XYZ"
```

### 2. Query Guest
```typescript
const { guest } = await SupabaseGuestService.checkInGuest(
  eventId,
  "ABC123XYZ"
)
// Guest object includes custom_data field
```

### 3. Serialized Response
```typescript
{
  id: "guest-id",
  name: "John Smith",
  email: "john@example.com",
  phone: "+263781234567",
  seatingArea: "Reserved",
  cuisineChoice: "Traditional",
  customData: {          // ← Included here
    parking: "Lot A",
    tableAssignment: "5"
  },
  checkedInAt: "2024-01-15T14:30:00Z",
  ...
}
```

### 4. Display in Dialog
```typescript
// In CheckInSummaryDialog component
<div>
  <p>Name: {guest.name}</p>
  <p>Phone: {guest.phone}</p>
  <p>Seating: {guest.seatingArea}</p>
  <p>Cuisine: {guest.cuisineChoice}</p>
  
  {/* Render custom fields */}
  {Object.entries(guest.customData).map(([key, value]) => (
    <p key={key}>{key}: {value}</p>
  ))}
</div>
```

## Example: Multi-Row CSV Import

### Input CSV
```csv
Full Name,Email,Phone,Seating,Cuisine,Parking,VIP Status
Alice,alice@example.com,+111,Reserved,Traditional,Lot A,Yes
Bob,bob@example.com,+222,Free,Western,Valet,No
Carol,carol@example.com,+333,Reserved,Western,Lot B,Yes
```

### Processing
```
Row 1: Alice
  ├─ Standard: name=Alice, email=..., phone=..., seating=Reserved, cuisine=Traditional
  └─ Custom: {parking: "Lot A", vipStatus: "Yes"}

Row 2: Bob
  ├─ Standard: name=Bob, email=..., phone=..., seating=Free, cuisine=Western
  └─ Custom: {parking: "Valet", vipStatus: "No"}

Row 3: Carol
  ├─ Standard: name=Carol, email=..., phone=..., seating=Reserved, cuisine=Western
  └─ Custom: {parking: "Lot B", vipStatus: "Yes"}
```

### Database Inserts
```sql
INSERT INTO guests (..., custom_data) VALUES
  (..., '{"parking": "Lot A", "vipStatus": "Yes"}'::jsonb),
  (..., '{"parking": "Valet", "vipStatus": "No"}'::jsonb),
  (..., '{"parking": "Lot B", "vipStatus": "Yes"}'::jsonb);
```

## API Integration

### Client Side (React Component)
```typescript
// Components/guests/guest-upload.tsx
const parseCSVFile = (file: File) => {
  // Parse CSV
  const guests = parseRows(csvContent)
  // Each guest has customData
  return guests
}

const handleUpload = async () => {
  const guestsToAdd = guests.map(guest => ({
    eventId,
    name: guest.name,
    email: guest.email,
    phone: guest.phone,
    seatingArea: guest.seatingArea,
    cuisineChoice: guest.cuisineChoice,
    customData: guest.customData  // ← Include custom data
  }))
  
  await addGuestsBulk(guestsToAdd)
}
```

### Backend Service
```typescript
// lib/supabase/guest-service.ts
export interface SupabaseCreateGuestInput {
  eventId: string
  name: string
  email?: string
  phone?: string
  seatingArea?: 'Reserved' | 'Free Seating'
  cuisineChoice?: 'Traditional' | 'Western'
  customData?: Record<string, any>  // ← Support custom data
}

static async createGuestsBulk(
  eventId: string,
  guests: SupabaseCreateGuestInput[]
) {
  const payload = guests.map(guest => ({
    event_id: eventId,
    name: guest.name,
    email: guest.email ?? null,
    phone: guest.phone ?? null,
    seating_area: guest.seatingArea ?? 'Free Seating',
    cuisine_choice: guest.cuisineChoice ?? 'Traditional',
    custom_data: guest.customData ?? {},  // ← Store custom data
  }))
  
  return await client
    .from('guests')
    .insert(payload)
    .select(...)
}
```

## Null/Empty Value Handling

### CSV with Empty Cells
```csv
name,email,phone,parking,table
John,john@example.com,,Lot A,5
Jane,jane@example.com,+456,,7
```

### Parsed Result
```typescript
// John's guest
{
  name: "John",
  email: "john@example.com",
  phone: undefined,        // Empty cell ignored
  customData: {
    parking: "Lot A",
    table: "5"
  }
}

// Jane's guest
{
  name: "Jane",
  email: "jane@example.com",
  phone: "+456",
  customData: {
    table: "7"
    // parking is empty, not included
  }
}
```

### Display on Check-In
```
Only non-empty values display:

Jane's Check-In
┌───────────────────────┐
│ Name: Jane            │
│ 📱 +456               │
│ • Table: 7            │  ← parking not shown
└───────────────────────┘
```

## Error Handling

### Invalid Seating Value
```csv
name,seating
John,InvalidValue
```

**Result**: Error message
```
"Row 2: Invalid seating area 'InvalidValue'. Must be 'Reserved' or 'Free Seating'"
```

### Missing Name
```csv
name,email
,john@example.com
```

**Result**: Error message
```
"Row 2: Name is required"
```

### Custom Fields - No Validation
```csv
name,customField
John,AnyValue123!@#
Jane,123.456
Carol,true
```

**Result**: All values accepted and stored as-is ✓

## Performance Considerations

### JSONB Index
```sql
CREATE INDEX idx_guests_custom_data ON guests USING gin (custom_data);
```

Allows efficient queries like:
```sql
-- Find guests with parking = "Lot A"
SELECT * FROM guests
WHERE custom_data @> '{"parking": "Lot A"}'::jsonb;
```

### Storage Size
- JSONB is efficiently compressed
- Minimal overhead for custom fields
- Index keeps queries fast

## Future Enhancement Points

1. **Type Validation**: Support field types (text, number, date, select)
2. **Per-Event Schemas**: Define required/optional fields per event
3. **Search**: Filter guests by custom field values
4. **Validation Rules**: Enforce patterns or ranges on custom fields
5. **Exports**: Include custom fields in CSV/Excel exports

---

For implementation details, see `CUSTOM_FIELDS_IMPLEMENTATION.md`