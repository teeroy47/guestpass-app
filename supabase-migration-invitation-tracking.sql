-- Migration: Add Invitation Tracking to Guests Table
-- Date: 2025-01-08
-- Description: Adds columns to track email invitation status and timestamp

-- Add invitation tracking columns
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS invitation_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ;

-- Add index for faster queries on invitation status
CREATE INDEX IF NOT EXISTS idx_guests_invitation_sent 
ON guests(invitation_sent);

-- Add comments for documentation
COMMENT ON COLUMN guests.invitation_sent IS 'Whether an email invitation has been sent to this guest';
COMMENT ON COLUMN guests.invitation_sent_at IS 'Timestamp when the invitation was sent';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'guests' 
  AND column_name IN ('invitation_sent', 'invitation_sent_at');