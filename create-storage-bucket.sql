-- Create and Configure Storage Bucket for Guest Photos
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Make sure the bucket is public (if it already exists)
UPDATE storage.buckets 
SET public = true,
    file_size_limit = 5242880,  -- 5MB limit
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'guestpass';

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Step 3: Create policy to allow authenticated users to INSERT (upload) to guestpass bucket
CREATE POLICY "Authenticated users can upload to guestpass"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'guestpass'
);

-- Step 4: Create policy to allow public reads from guestpass bucket
CREATE POLICY "Public can read from guestpass"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'guestpass'
);

-- Step 5: Create policy to allow authenticated users to UPDATE in guestpass bucket
CREATE POLICY "Authenticated users can update in guestpass"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'guestpass'
)
WITH CHECK (
  bucket_id = 'guestpass'
);

-- Step 6: Create policy to allow authenticated users to DELETE from guestpass bucket
CREATE POLICY "Authenticated users can delete from guestpass"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'guestpass'
);

-- Verification Queries
-- Check bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'guestpass';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%guestpass%'
ORDER BY policyname;