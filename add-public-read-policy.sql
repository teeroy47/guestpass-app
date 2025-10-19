-- Add public read access policy for storage objects
-- This allows anyone to view photos via getPublicUrl()

CREATE POLICY "Public can read guest photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'guestpass');

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;