-- Migration: Add seating arrangement and cuisine choice fields to guests table
-- This migration adds seating_area and cuisine_choice columns for guest management

-- Add seating_area column (Reserved or Free Seating)
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS seating_area TEXT DEFAULT 'Free Seating' CHECK (seating_area IN ('Reserved', 'Free Seating'));

-- Add cuisine_choice column (Traditional or Western)
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS cuisine_choice TEXT DEFAULT 'Traditional' CHECK (cuisine_choice IN ('Traditional', 'Western'));

-- Add indexes for filtering and reporting
CREATE INDEX IF NOT EXISTS idx_guests_seating_area ON guests(seating_area);
CREATE INDEX IF NOT EXISTS idx_guests_cuisine_choice ON guests(cuisine_choice);

-- Add comments to document the fields
COMMENT ON COLUMN guests.seating_area IS 'Guest seating arrangement: Reserved or Free Seating';
COMMENT ON COLUMN guests.cuisine_choice IS 'Guest cuisine preference: Traditional or Western';

-- Update existing guests to have default values
UPDATE guests 
SET seating_area = 'Free Seating' 
WHERE seating_area IS NULL;

UPDATE guests 
SET cuisine_choice = 'Traditional' 
WHERE cuisine_choice IS NULL;