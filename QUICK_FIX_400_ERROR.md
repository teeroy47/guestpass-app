# Quick Fix for 400 Error When Creating Storage Policies

## 🔴 Problem
You're getting `400 (Bad Request)` errors when trying to create storage policies through the Supabase Dashboard UI.

## ✅ Solution: Use SQL Editor Instead

The Dashboard UI's policy creator sometimes has issues. Use the SQL Editor instead:

### Step-by-Step Fix:

1. **Open SQL Editor**
   - Go to your Supabase Dashboard
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Copy and Paste This SQL**
   ```sql
   -- Drop existing policies if they exist (to avoid conflicts)
   DROP POLICY IF EXISTS "Allow authenticated uploads to guest-photos" ON storage.objects;
   DROP POLICY IF EXISTS "Allow authenticated reads from guest-photos" ON storage.objects;
   DROP POLICY IF EXISTS "Allow authenticated updates to guest-photos" ON storage.objects;
   DROP POLICY IF EXISTS "Allow authenticated deletes from guest-photos" ON storage.objects;

   -- Create policy to allow authenticated users to upload guest photos
   CREATE POLICY "Allow authenticated uploads to guest-photos"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'guestpass' 
     AND name LIKE 'guest-photos/%'
   );

   -- Create policy to allow authenticated users to read guest photos
   CREATE POLICY "Allow authenticated reads from guest-photos"
   ON storage.objects
   FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'guestpass' 
     AND name LIKE 'guest-photos/%'
   );

   -- Create policy to allow authenticated users to update guest photos
   CREATE POLICY "Allow authenticated updates to guest-photos"
   ON storage.objects
   FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'guestpass' 
     AND name LIKE 'guest-photos/%'
   )
   WITH CHECK (
     bucket_id = 'guestpass' 
     AND name LIKE 'guest-photos/%'
   );

   -- Create policy to allow authenticated users to delete guest photos
   CREATE POLICY "Allow authenticated deletes from guest-photos"
   ON storage.objects
   FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'guestpass' 
     AND name LIKE 'guest-photos/%'
   );
   ```

3. **Click Run**
   - You should see "Success. No rows returned"
   - This is normal and means the policies were created

4. **Verify Policies Were Created**
   - Run this verification query:
   ```sql
   SELECT policyname, cmd, qual, with_check 
   FROM pg_policies 
   WHERE tablename = 'objects' 
   AND policyname LIKE '%guest-photos%';
   ```
   - You should see 4 policies listed

5. **Check in Dashboard**
   - Go to **Storage** → **`guestpass`** bucket → **Policies** tab
   - You should now see the 4 policies listed with green checkmarks

## 🧪 Test It Works

After creating the policies, test the upload:

```powershell
npm run dev
```

Then:
1. Navigate to an event's QR scanner
2. Scan a guest QR code
3. Capture a photo
4. Check browser console for any errors

If upload succeeds, you're all set! ✅

## 🆘 Still Having Issues?

If you still get errors after creating policies via SQL:

### Check 1: Bucket Exists
```sql
SELECT * FROM storage.buckets WHERE id = 'guestpass';
```
Should return 1 row. If not, create the bucket:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('guestpass', 'guestpass', false);
```

### Check 2: User is Authenticated
In browser console:
```javascript
const { data } = await supabase.auth.getUser();
console.log(data.user); // Should show user object, not null
```

### Check 3: Policies are Active
Go to **Storage** → **`guestpass`** → **Policies**
- All policies should have green checkmarks
- If red X, click the policy and toggle it on

## 📝 Summary

**Don't use the Dashboard UI policy creator** - it's buggy and gives 400 errors.

**Use SQL Editor instead** - copy the SQL above and run it.

That's it! 🎉