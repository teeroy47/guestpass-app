-- Migration: Add phone number field to guests table
-- This migration adds a phone field to store guest phone numbers

-- Add phone column to guests table
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for phone lookups (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);

-- Add comment to document the field
COMMENT ON COLUMN guests.phone IS 'Guest phone number in format: 0785211893';