-- Migration: Add Attended Field to Guests Table
-- Date: 2025-01-08
-- Description: Adds an 'attended' column to track final attendance after event completion

-- Add attended column
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on attended status
CREATE INDEX IF NOT EXISTS idx_guests_attended 
ON guests(attended);

-- Add comment for documentation
COMMENT ON COLUMN guests.attended IS 'Whether the guest attended the event (set when event is marked as completed)';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'guests' 
  AND column_name = 'attended';