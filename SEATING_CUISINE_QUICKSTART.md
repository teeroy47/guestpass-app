# Quick Start: Seating & Cuisine Feature

## Step 1: Apply Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `supabase-migration-seating-cuisine.sql`
6. Click **Run** to execute the migration

**Verify Migration:**
```sql
-- Run this to verify the columns exist
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'guests' 
AND column_name IN ('seating_area', 'cuisine_choice');
```

You should see:
- `seating_area` | text | 'Free Seating'
- `cuisine_choice` | text | 'Traditional'

## Step 2: Deploy Updated Code

### Option A: Vercel (Recommended)
```powershell
# Commit changes
git add .
git commit -m "Add seating arrangement and cuisine choice features"
git push origin main

# Vercel will auto-deploy
```

### Option B: Manual Deploy
```powershell
# Build the project
npm run build

# Deploy to your hosting platform
```

## Step 3: Test the Feature

### Test CSV Upload

1. **Download the new template:**
   - Go to your event
   - Click "Upload Guests"
   - Click "Template" button
   - You'll get a CSV with: `name,email,phone,seating,cuisine`

2. **Create test CSV:**
```csv
name,email,phone,seating,cuisine
Test Guest 1,test1@example.com,+265991234567,Reserved,Traditional
Test Guest 2,test2@example.com,+265992345678,Free Seating,Western
Test Guest 3,test3@example.com,+265993456789,Free Seating,Traditional
```

3. **Upload the CSV:**
   - Select your test CSV file
   - Preview should show seating (🪑) and cuisine (🍽️) icons
   - Click "Upload X Guests"
   - Verify guests are created

### Test QR Scanner

1. **Generate QR codes for test guests:**
   - Go to guest list
   - Download QR codes for your test guests

2. **Open QR Scanner:**
   - Click "Scan QR Codes" for your event
   - Grant camera permissions
   - Start scanning

3. **Scan a test QR code:**
   - You should see:
     ```
     ✓ Step 1 Complete: Test Guest 1 identified
     🪑 Seating: Reserved
     🍽️ Cuisine: Traditional
     → Proceeding to Step 2: Photo Capture
     ```

4. **Complete check-in:**
   - Capture photo or skip
   - Verify check-in completes successfully

## Step 4: Update Your Guest Lists

### For Existing Events

If you have existing guests without seating/cuisine data:
- They will automatically have defaults:
  - Seating: `Free Seating`
  - Cuisine: `Traditional`

### For New Events

Use the new CSV template that includes seating and cuisine columns.

## CSV Template Reference

### Minimal Template (Name only)
```csv
name
John Smith
Sarah Johnson
```
*Defaults: Free Seating, Traditional*

### Full Template (All fields)
```csv
name,email,phone,seating,cuisine
John Smith,john@example.com,+265991234567,Reserved,Traditional
Sarah Johnson,sarah@example.com,+265992345678,Free Seating,Western
Michael Chen,michael@example.com,+265993456789,Free Seating,Traditional
```

### Valid Values

**Seating:**
- `Reserved` - Guest has a reserved seat
- `Free Seating` - Guest can sit anywhere

**Cuisine:**
- `Traditional` - Traditional meal
- `Western` - Western meal

**Phone Format:**
- Must include country code: `+265991234567`
- Used for WhatsApp QR code delivery (coming soon)

## Troubleshooting

### Migration Fails
**Error:** Column already exists
- **Solution:** The migration has already been applied. Skip to Step 2.

**Error:** Permission denied
- **Solution:** Make sure you're using the Supabase SQL Editor with admin privileges.

### CSV Upload Errors

**Error:** "Invalid seating area"
- **Cause:** Seating value is not 'Reserved' or 'Free Seating'
- **Solution:** Check spelling and capitalization exactly as shown

**Error:** "Invalid cuisine choice"
- **Cause:** Cuisine value is not 'Traditional' or 'Western'
- **Solution:** Check spelling and capitalization exactly as shown

### Scanner Not Showing Seating/Cuisine

**Cause:** Old code still cached
- **Solution:** Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- **Solution:** Clear browser cache
- **Solution:** Verify deployment completed successfully

### Guests Have Wrong Defaults

**Cause:** Migration didn't update existing guests
- **Solution:** Run this SQL to update existing guests:
```sql
UPDATE guests 
SET seating_area = 'Free Seating' 
WHERE seating_area IS NULL;

UPDATE guests 
SET cuisine_choice = 'Traditional' 
WHERE cuisine_choice IS NULL;
```

## What's Next?

### Immediate Use
✅ Upload guests with seating and cuisine preferences
✅ Ushers see seating/cuisine when scanning QR codes
✅ Direct guests to correct seating areas
✅ Inform catering of cuisine preferences

### Coming Soon
🔄 Manual guest creation form with seating/cuisine dropdowns
🔄 Filter guest list by seating area or cuisine
🔄 Capacity tracking for Reserved vs Free Seating
🔄 WhatsApp QR code delivery via Bird API
🔄 Analytics dashboard showing seating/cuisine distribution

## Need Help?

1. **Check the full documentation:** `SEATING_CUISINE_FEATURE_IMPLEMENTATION.md`
2. **Verify migration:** Run the verification SQL above
3. **Check browser console:** Look for any JavaScript errors
4. **Test with sample CSV:** Use the exact template provided above

## Success Checklist

- [ ] Database migration applied successfully
- [ ] Code deployed to production
- [ ] Downloaded new CSV template
- [ ] Uploaded test guests with seating/cuisine
- [ ] Scanned QR code and saw seating/cuisine info
- [ ] Completed full check-in flow
- [ ] Ready to use for real event!

---

**Last Updated:** January 2025
**Version:** 1.0.0