# Storage Policy Setup Guide

## ⚠️ Important: Two Methods Available

If you're getting 400 errors when creating policies, try **Method 2** (UI-based) instead of Method 1 (SQL-based).

---

## Method 1: SQL Editor (Recommended)

### Step 1: Run the Storage Policies SQL

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase-storage-policies.sql`
4. Click **Run**

### Step 2: Verify Policies Were Created

Run this verification query in SQL Editor:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%guest-photos%';
```

You should see 4 policies listed.

---

## Method 2: Dashboard UI (Alternative if SQL fails)

If Method 1 gives errors, use the Supabase Dashboard UI:

### Step 1: Navigate to Storage Policies

1. Go to **Supabase Dashboard** → **Storage**
2. Click on the **`guestpass`** bucket
3. Click the **Policies** tab
4. Click **New Policy**

### Step 2: Create INSERT Policy (Upload)

1. Click **"Create a policy from scratch"**
2. Fill in the form:
   - **Policy Name:** `Allow authenticated uploads to guest-photos`
   - **Policy Command:** `INSERT`
   - **Target Roles:** `authenticated`
   - **WITH CHECK expression:**
     ```sql
     bucket_id = 'guestpass' AND name LIKE 'guest-photos/%'
     ```
3. Click **Review** → **Save Policy**

### Step 3: Create SELECT Policy (Read)

1. Click **New Policy** → **"Create a policy from scratch"**
2. Fill in the form:
   - **Policy Name:** `Allow authenticated reads from guest-photos`
   - **Policy Command:** `SELECT`
   - **Target Roles:** `authenticated`
   - **USING expression:**
     ```sql
     bucket_id = 'guestpass' AND name LIKE 'guest-photos/%'
     ```
3. Click **Review** → **Save Policy**

### Step 4: Create UPDATE Policy (Optional)

1. Click **New Policy** → **"Create a policy from scratch"**
2. Fill in the form:
   - **Policy Name:** `Allow authenticated updates to guest-photos`
   - **Policy Command:** `UPDATE`
   - **Target Roles:** `authenticated`
   - **USING expression:**
     ```sql
     bucket_id = 'guestpass' AND name LIKE 'guest-photos/%'
     ```
   - **WITH CHECK expression:**
     ```sql
     bucket_id = 'guestpass' AND name LIKE 'guest-photos/%'
     ```
3. Click **Review** → **Save Policy**

### Step 5: Create DELETE Policy (Optional)

1. Click **New Policy** → **"Create a policy from scratch"**
2. Fill in the form:
   - **Policy Name:** `Allow authenticated deletes from guest-photos`
   - **Policy Command:** `DELETE`
   - **Target Roles:** `authenticated`
   - **USING expression:**
     ```sql
     bucket_id = 'guestpass' AND name LIKE 'guest-photos/%'
     ```
3. Click **Review** → **Save Policy**

---

## Method 3: Simplified Approach (If both above fail)

If you're still having issues, you can create a single permissive policy:

### Via SQL Editor:

```sql
-- Single policy for all operations on guest-photos folder
CREATE POLICY IF NOT EXISTS "Allow authenticated access to guest-photos"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'guestpass' AND name LIKE 'guest-photos/%')
WITH CHECK (bucket_id = 'guestpass' AND name LIKE 'guest-photos/%');
```

### Via Dashboard UI:

1. Go to **Storage** → **`guestpass`** bucket → **Policies**
2. Click **New Policy** → **"Create a policy from scratch"**
3. Fill in:
   - **Policy Name:** `Allow authenticated access to guest-photos`
   - **Policy Command:** `ALL`
   - **Target Roles:** `authenticated`
   - **USING expression:** `bucket_id = 'guestpass' AND name LIKE 'guest-photos/%'`
   - **WITH CHECK expression:** `bucket_id = 'guestpass' AND name LIKE 'guest-photos/%'`
4. Click **Review** → **Save Policy**

---

## Verification

After creating policies, test the upload:

1. Start your dev server: `npm run dev`
2. Navigate to an event's QR scanner
3. Scan a guest QR code
4. Try to capture and upload a photo
5. Check the browser console for any errors

If you see upload errors, check:
- The policies are active (green checkmark in Supabase Dashboard)
- The bucket name is exactly `guestpass`
- Your user is authenticated (check `supabase.auth.getUser()`)

---

## Troubleshooting

### Error: "new row violates row-level security policy"
- **Cause:** Policies not created or not active
- **Fix:** Verify policies exist and are enabled in Dashboard

### Error: "storage.foldername is not a function"
- **Cause:** Older Supabase version doesn't support `foldername()`
- **Fix:** Use Method 2 or Method 3 with `name LIKE 'guest-photos/%'`

### Error: "bucket_id does not exist"
- **Cause:** The `guestpass` bucket doesn't exist
- **Fix:** Create it in Storage → New Bucket → Name: `guestpass`, Public: No

### Upload succeeds but can't read photos
- **Cause:** Missing SELECT policy
- **Fix:** Ensure SELECT policy is created with correct USING expression

---

## Next Steps

Once policies are set up successfully:

1. ✅ Test photo capture flow
2. ✅ Test duplicate detection
3. ✅ Verify real-time analytics
4. ✅ Check storage usage in Dashboard

Refer to `PHOTO_CAPTURE_FEATURE_SUMMARY.md` for complete testing checklist.