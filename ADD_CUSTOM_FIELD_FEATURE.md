# Add Custom Field Button - Implementation Guide

## 🎉 Feature Overview

A new **"Add Field" button** has been added to the guest form in the Event Details Dialog. This allows admins to dynamically add custom fields to individual guests when editing or adding them, even if the fields weren't included in the original CSV import.

## 📍 Location

**Path**: Event Details Dialog → Guests Tab → Guest Form → "Custom Fields" Section

## ✨ Features

✅ **Add Custom Fields On-the-Fly**: No need to re-upload CSV if you miss a field  
✅ **Auto-Format Field Names**: "Parking:" → "parking", "Table Assignment" → "tableAssignment"  
✅ **Display Added Fields**: See all custom fields in a clean list with values  
✅ **Remove Fields**: Delete unwanted custom fields with one click  
✅ **Keyboard Shortcuts**: Press Enter to quickly add a field  
✅ **Persistence**: Custom fields are saved with the guest when you click "Add guest" or "Save guest"

## 🎯 How to Use

### Adding a Custom Field

1. **Click "Add guest"** button in the Guest Form area
2. **Fill in standard fields** (Name, Email, Phone, Seating, Cuisine)
3. **Click "Add Field"** button in the Custom Fields section
4. **Enter Field Name** (e.g., "Parking", "Table Assignment", "Dietary Notes")
5. **Enter Field Value** (e.g., "Lot A", "Table 5", "Nut allergy")
6. **Click "Add Field"** in the dialog
7. **See the field appear** in the form
8. **Repeat** for more fields as needed
9. **Click "Add guest"** to save everything

### Removing a Custom Field

1. Find the field in the Custom Fields list
2. Click the **X button** on the right
3. Field is removed immediately

### Editing a Guest with Custom Fields

1. Click the **edit button** next to a guest
2. Existing custom fields will load automatically
3. Add new fields or remove existing ones as needed
4. Click **"Save guest"** to update

## 💾 Data Flow

```
User enters custom field data
        ↓
Field name auto-formatted to camelCase
        ↓
Stored in guestForm.customData object
        ↓
Sent to backend with guest creation/update
        ↓
Saved in Supabase guests table custom_data column
        ↓
Retrieved on check-in and displayed to usher
```

## 🔧 Technical Details

### Files Modified

1. **components/events/event-details-dialog.tsx**
   - Added custom field dialog component
   - Added custom field state management
   - Added handlers for adding/removing fields
   - Added display UI for custom fields
   - Updated guest form submission to include customData

2. **lib/guests-context.tsx**
   - Added `customData?: Record<string, any>` to Guest interface

### New State Variables

```typescript
const [isCustomFieldDialogOpen, setIsCustomFieldDialogOpen] = useState(false)
const [customFieldName, setCustomFieldName] = useState("")
const [customFieldValue, setCustomFieldValue] = useState("")
```

### New Handler Functions

```typescript
handleAddCustomField()      // Adds field to guestForm.customData
handleRemoveCustomField()   // Removes field from guestForm.customData
```

### Field Name Formatting

Field names are automatically converted to camelCase:
- "Parking" → "parking"
- "Table Assignment" → "tableAssignment"
- "Dietary Notes" → "dietaryNotes"
- "VIP Status" → "vipStatus"

## 🎨 UI Components

### Add Field Button
- Located in Custom Fields section
- Opens a modal dialog
- Disabled while form is submitting

### Custom Field Dialog
- **Field Name Input**: Placeholder shows examples
- **Field Value Input**: Placeholder shows examples
- **Cancel Button**: Closes dialog without saving
- **Add Field Button**: Adds field and closes dialog
- **Enter Key**: Submits field (quick add)
- **Error Messages**: Shows validation errors

### Field Display
- Shows field name (formatted for readability)
- Shows field value
- Shows X button to remove
- Clean, muted background styling
- Organized list view

## 🔄 Workflow Examples

### Example 1: Missing Parking Field
1. Upload CSV with guests
2. Realize "Parking" column was missed
3. Click on a guest to edit
4. Click "Add Field"
5. Enter "Parking" and "Lot A"
6. Save guest
7. Parking info now shows on check-in

### Example 2: Multiple Custom Fields
1. Add new guest manually
2. Click "Add Field" three times for:
   - Parking: "Lot B"
   - Table: "8"
   - Dietary: "Vegetarian"
3. Click "Add guest"
4. All three fields saved and displayed at check-in

### Example 3: Editing Existing Fields
1. Click edit on a guest
2. Custom fields load automatically
3. Remove incorrect fields with X button
4. Add new correct fields
5. Save changes

## 📋 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Submit field (when in field inputs) |
| Escape | Close dialog |

## 🐛 Error Handling

- **Empty Field Name**: Shows "Field name is required." error
- **Duplicate Field Names**: Overwrites previous value (same camelCase name)
- **Special Characters**: Automatically removed from field names during formatting

## 📊 Database Integration

Custom fields are stored in the Supabase `guests` table:

```sql
-- custom_data column (JSONB type)
{
  "parking": "Lot A",
  "tableAssignment": "5",
  "dietaryNotes": "Peanut allergy"
}
```

## ✅ Check-In Display

When a guest checks in, all custom fields appear on the success screen:

```
✓ Check-In Successful!

John Doe
📱 +123456789

🪑 Seating: Reserved
🍽️ Cuisine: Traditional
• Parking: Lot A
• Table Assignment: 5
• Dietary Notes: Peanut allergy
```

## 🚀 Next Steps

After using this feature:

1. **Save the guest** with custom fields
2. **Verify at check-in** that fields appear correctly
3. **Export guest data** if needed (includes custom fields)

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Verify Supabase connection
3. Ensure database migration was applied
4. Clear browser cache and try again

---

**Feature Complete!** ✨ You can now add missing custom fields without re-uploading CSVs.