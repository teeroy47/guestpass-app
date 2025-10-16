-- Storage Policies for Guest Photos
-- Run this in Supabase Dashboard > SQL Editor AFTER running the main migration

-- IMPORTANT: This uses the simpler LIKE pattern instead of foldername() function
-- which is more compatible across Supabase versions

-- Step 1: Ensure the guestpass bucket exists (it should already exist)
-- If not, create it with:
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('guestpass', 'guestpass', false);

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated uploads to guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from guest-photos" ON storage.objects;

-- Step 3: Create policy to allow authenticated users to INSERT (upload) guest photos
CREATE POLICY "Allow authenticated uploads to guest-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'guestpass' 
  AND name LIKE 'guest-photos/%'
);

-- Step 4: Create policy to allow authenticated users to SELECT (read) guest photos
CREATE POLICY "Allow authenticated reads from guest-photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'guestpass' 
  AND name LIKE 'guest-photos/%'
);

-- Step 5: Create policy to allow authenticated users to UPDATE guest photos (optional)
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

-- Step 6: Create policy to allow authenticated users to DELETE guest photos (optional)
CREATE POLICY "Allow authenticated deletes from guest-photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'guestpass' 
  AND name LIKE 'guest-photos/%'
);

-- Verification Query: Check if policies were created successfully
-- Run this to verify:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%guest-photos%';