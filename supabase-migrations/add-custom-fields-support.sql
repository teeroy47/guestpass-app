-- ============================================================================
-- ADD CUSTOM FIELDS SUPPORT FOR GUESTS
-- ============================================================================
-- This migration adds support for dynamic custom fields on guest records

-- Add custom_data JSONB column to guests table to store any custom fields
ALTER TABLE guests ADD COLUMN IF NOT EXISTS custom_data jsonb DEFAULT '{}'::jsonb;

-- Create index on custom_data for better query performance
CREATE INDEX IF NOT EXISTS idx_guests_custom_data ON guests USING gin (custom_data);

-- Create a new table to define available custom fields per event
CREATE TABLE IF NOT EXISTS event_custom_fields (
  id bigserial PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text', -- text, number, select, date, etc.
  is_required boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, field_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_custom_fields_event_id ON event_custom_fields(event_id);

-- Enable RLS on event_custom_fields table
ALTER TABLE event_custom_fields ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read custom fields for any event
CREATE POLICY "authenticated_can_read_custom_fields"
ON event_custom_fields
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only authenticated users can manage custom fields
CREATE POLICY "authenticated_can_manage_custom_fields"
ON event_custom_fields
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Check if columns were added:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'guests' AND column_name = 'custom_data';

-- Check if event_custom_fields table exists:
SELECT * FROM information_schema.tables 
WHERE table_name = 'event_custom_fields';