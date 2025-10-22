# Custom Guest Fields - Quick Start Guide

## What's New? ✨

Your GuestPass app now supports **custom guest fields**! You can add ANY columns to your CSV file, and they'll automatically appear on the check-in screen.

## Before (Limited Fields)
```csv
name,email,phone,seating,cuisine
John Smith,john@example.com,+263781234567,Reserved,Traditional
```

## After (Any Fields Supported!) 🎉
```csv
Full Name,Email,Phone Number,Seating,Your choice of cuisine:,Parking:,Table Assignment,Dietary Restrictions
John Smith,john@example.com,+263781234567,Reserved,Traditional,Lot A,5,Vegetarian
Sarah Johnson,sarah@example.com,+263781234568,Free Seating,Western,Valet,7,Gluten-free
```

## How It Works

### 1️⃣ **Upload CSV with Extra Columns**
- Include whatever columns you need
- First row must be headers
- Only `name` column is required

### 2️⃣ **Extra Columns Are Auto-Detected**
- Standard columns: `name`, `email`, `phone`, `seating`, `cuisine`
- Everything else → stored as custom field
- Column names automatically converted to camelCase (`Parking:` → `parking`)

### 3️⃣ **Custom Fields Show on Check-In**
When you scan a guest's QR code, the success dialog displays:
- ✓ Standard info (Name, Phone, Seating, Cuisine)
- ✓ **All custom fields** (Parking, Table Assignment, Dietary Restrictions, etc.)

## Quick Example

### CSV File
```csv
Full Name,Email,Phone,Seating,Cuisine,Parking,Table,Special Requests
Alice,alice@example.com,+123,Reserved,Traditional,Lot A,5,Window seat
Bob,bob@example.com,+456,Free,Western,Valet,7,High chair needed
```

### What Gets Stored
```
Alice
├─ email: alice@example.com
├─ phone: +123
├─ seatingArea: Reserved
├─ cuisineChoice: Traditional
├─ customData:
│  ├─ parking: Lot A
│  ├─ table: 5
│  └─ specialRequests: Window seat
```

### Check-In Screen Shows
```
✓ Check-In Successful!

Alice
📱 +123

🪑 Seating: Reserved
🍽️ Cuisine: Traditional
• Parking: Lot A
• Table: 5
• Special Requests: Window seat

[Check In Another Guest]
```

## Setup Required ✅

### 1. Run Database Migration
Apply this migration in Supabase SQL Editor:
```sql
-- File: supabase-migrations/add-custom-fields-support.sql
-- Just copy and paste the entire file contents
```

This adds:
- `custom_data` column to guests table (JSONB)
- Supporting indexes for performance

### 2. That's It! 🚀
The app code is already updated. No additional setup needed.

## Common Use Cases

### Event with Parking
```csv
name,email,phone,seating,cuisine,parking
John,john@example.com,+123,Reserved,Traditional,Lot A
Jane,jane@example.com,+456,Free,Western,Valet
```

### Conference with Tickets
```csv
name,email,phone,seating,cuisine,ticket_type,access_level
Alice,alice@example.com,+123,Reserved,Traditional,VIP,Full
Bob,bob@example.com,+456,Free,Western,Standard,Hall A
```

### Wedding with Dietary Info
```csv
Full Name,Email,Phone,Seating,Cuisine,Dietary Restrictions,Plus One,Table
Alice Smith,alice@example.com,+123,Reserved,Traditional,Vegetarian,Yes,5
Bob Jones,bob@example.com,+456,Free,Western,Gluten-free,No,7
```

### Corporate Event
```csv
Name,Email,Phone,Seating,Cuisine,Company,Department,Contact
John Doe,john@example.com,+123,Reserved,Traditional,TechCorp,Engineering,Yes
Jane Smith,jane@example.com,+456,Free,Western,FinanceInc,Marketing,No
```

## Important Notes

### ✅ Works With
- CSV files with any number of columns
- Empty values (they won't show on check-in)
- Mixed data types (text, numbers, yes/no, etc.)
- Existing guests without custom fields

### ❌ Known Limitations
- `seating` column values must be "Reserved" or "Free Seating"
- `cuisine` column values must be "Traditional" or "Western"
- Custom column names are converted to camelCase (Parking: → parking)
- No validation on custom field values (any value accepted)

### 💡 Tips
1. Keep column names simple (avoid special characters)
2. Use headers that describe the data (Parking, Table Number, etc.)
3. Empty cells in custom fields are ignored (won't display)
4. Standard columns (name, email, phone, seating, cuisine) still work as before

## Verification Checklist

After setup, verify it works:

- [ ] Database migration applied (check Supabase SQL Editor)
- [ ] App updated to latest code
- [ ] Create test CSV with custom columns
- [ ] Upload CSV to an event
- [ ] Preview shows all columns (check the preview)
- [ ] Scan a guest QR code
- [ ] Check-in dialog shows custom fields ✓

## Need Help?

### Custom fields not showing on check-in?
1. Verify migration was applied
2. Check browser console for errors
3. Verify custom_data is in database: `SELECT custom_data FROM guests LIMIT 1;`
4. Refresh the page

### Column not recognized as custom field?
- Make sure it's not a standard column name
- Standard names: name, email, phone, seating, cuisine
- Any other column name = custom field

### Validation errors on upload?
- Ensure `name` column exists and has values
- Check `seating` is "Reserved" or "Free Seating"
- Check `cuisine` is "Traditional" or "Western"
- Review error message for specific row issues

## What's Coming Next? 🔮

Future enhancements (in development):
- Admin UI to define custom field schemas
- Custom field data types (dropdown, date picker, etc.)
- Search/filter by custom fields
- Export reports with custom fields
- Per-event field definitions

---

**Questions?** Check the full documentation in `CUSTOM_FIELDS_IMPLEMENTATION.md`