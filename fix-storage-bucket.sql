-- Fix Storage Bucket Configuration for Guest Photos
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Check if bucket exists and create/update it
-- First, try to update existing bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'guestpass';

-- If bucket doesn't exist, insert it (this will fail silently if it already exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guestpass', 
  'guestpass', 
  true,  -- Make bucket public so getPublicUrl works
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from guest-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from guest-photos" ON storage.objects;

-- Step 3: Create policy to allow authenticated users to INSERT (upload) guest photos
CREATE POLICY "Allow authenticated uploads to guest-photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'guestpass' 
  AND name LIKE 'guest-photos/%'
);

-- Step 4: Create policy to allow public reads (since bucket is public)
CREATE POLICY "Allow public reads from guest-photos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'guestpass' 
  AND name LIKE 'guest-photos/%'
);

-- Step 5: Create policy to allow authenticated users to UPDATE guest photos
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

-- Step 6: Create policy to allow authenticated users to DELETE guest photos
CREATE POLICY "Allow authenticated deletes from guest-photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'guestpass' 
  AND name LIKE 'guest-photos/%'
);

-- Verification Queries
-- Run these to verify everything is set up correctly:

-- Check bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'guestpass';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%guest-photos%';