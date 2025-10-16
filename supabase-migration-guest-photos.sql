-- Migration: Add Photo Capture Support for Guest Check-ins
-- This migration adds photo storage fields to track guest photos during check-in

-- Step 1: Add photo_url column to guests table
-- This will store the Supabase Storage URL for the guest's photo
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Step 2: Add first_checkin_at column to track initial check-in time
-- This helps differentiate between first check-in (with photo) and duplicate scans
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS first_checkin_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Update existing checked-in guests to set first_checkin_at
-- For existing data, use checked_in_at as first_checkin_at
UPDATE guests 
SET first_checkin_at = checked_in_at 
WHERE checked_in = true AND first_checkin_at IS NULL;

-- Step 4: Create index for photo lookups (performance optimization)
CREATE INDEX IF NOT EXISTS idx_guests_photo_url ON guests(photo_url) WHERE photo_url IS NOT NULL;

-- Step 5: Create index for first check-in lookups
CREATE INDEX IF NOT EXISTS idx_guests_first_checkin ON guests(first_checkin_at) WHERE first_checkin_at IS NOT NULL;

-- Step 6: Add comments for documentation
COMMENT ON COLUMN guests.photo_url IS 'Supabase Storage URL for guest photo captured during first check-in';
COMMENT ON COLUMN guests.first_checkin_at IS 'Timestamp of first check-in when photo was captured';

-- Step 7: Set up Storage Bucket Policy (Run this in Supabase Dashboard > Storage > Policies)
-- Note: You need to create these policies in the Supabase Dashboard UI or via SQL:
-- 
-- Bucket: guestpass
-- Policy Name: Allow authenticated users to upload guest photos
-- Policy: 
--   CREATE POLICY "Allow authenticated uploads" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'guestpass' AND (storage.foldername(name))[1] = 'guest-photos');
--
-- Policy Name: Allow authenticated users to read guest photos
-- Policy:
--   CREATE POLICY "Allow authenticated reads" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (bucket_id = 'guestpass' AND (storage.foldername(name))[1] = 'guest-photos');