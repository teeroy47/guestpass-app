-- Complete Storage Setup - Creates bucket and policies
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Create the bucket if it doesn't exist
DO $$
BEGIN
  -- Try to insert the bucket
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'guestpass', 
    'guestpass', 
    true,  -- PUBLIC bucket
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
  ON CONFLICT (id) DO UPDATE 
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  RAISE NOTICE 'Bucket created/updated successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating bucket: %', SQLERRM;
END $$;

-- Step 2: Drop all existing policies for guestpass bucket
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND (policyname LIKE '%guestpass%' OR policyname LIKE '%guest-photos%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
  END LOOP;
END $$;

-- Step 3: Create INSERT policy (authenticated users can upload)
CREATE POLICY "Authenticated users can upload to guestpass"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'guestpass');

-- Step 4: Create SELECT policy (public can read)
CREATE POLICY "Public can read from guestpass"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'guestpass');

-- Step 5: Create UPDATE policy (authenticated users can update)
CREATE POLICY "Authenticated users can update in guestpass"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'guestpass')
WITH CHECK (bucket_id = 'guestpass');

-- Step 6: Create DELETE policy (authenticated users can delete)
CREATE POLICY "Authenticated users can delete from guestpass"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'guestpass');

-- Verification
SELECT 
  'Bucket Configuration' as check_type,
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'guestpass'

UNION ALL

SELECT 
  'Storage Policies' as check_type,
  policyname as id,
  cmd as name,
  permissive::text as public,
  roles::text as file_size_limit,
  NULL as allowed_mime_types
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%guestpass%'
ORDER BY check_type, id;