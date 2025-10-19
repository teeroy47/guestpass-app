-- Complete storage.objects policies for guestpass bucket
-- These control access to the actual files (not just the bucket)

-- 1. Allow public (including authenticated) to INSERT (upload) files
-- This allows both logged-in ushers and anonymous test uploads
CREATE POLICY "Public can upload to guestpass"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'guestpass');

-- 2. Allow public to SELECT (read/view) files
CREATE POLICY "Public can read from guestpass"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'guestpass');

-- 3. Allow public to UPDATE files
CREATE POLICY "Public can update guestpass files"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'guestpass')
WITH CHECK (bucket_id = 'guestpass');

-- 4. Allow public to DELETE files
CREATE POLICY "Public can delete from guestpass"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'guestpass');

-- Verify all policies were created
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING clause present'
    ELSE 'No USING clause'
  END as using_check,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK present'
    ELSE 'No WITH CHECK'
  END as with_check_status
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%guestpass%'
ORDER BY cmd, policyname;