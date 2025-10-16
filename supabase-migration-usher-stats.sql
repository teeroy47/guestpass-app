-- Migration: Add Usher Statistics Tracking
-- This migration adds fields to track which usher scanned each guest
-- and creates a view for usher statistics

-- Step 1: Add usher_name column to guests table (if not exists)
-- This will store the name of the usher who scanned the guest
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS usher_name TEXT;

-- Step 2: Add usher_email column to guests table (if not exists)
-- This will store the email of the usher who scanned the guest
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS usher_email TEXT;

-- Step 3: Create index for usher lookups (performance optimization)
CREATE INDEX IF NOT EXISTS idx_guests_usher_email ON guests(usher_email);
CREATE INDEX IF NOT EXISTS idx_guests_checked_in_by ON guests(checked_in_by);

-- Step 4: Create a view for usher statistics per event
CREATE OR REPLACE VIEW usher_statistics AS
SELECT 
  g.event_id,
  g.usher_email,
  g.usher_name,
  g.checked_in_by,
  COUNT(*) as total_scans,
  COUNT(DISTINCT g.id) as unique_guests_scanned,
  MIN(g.checked_in_at) as first_scan_at,
  MAX(g.checked_in_at) as last_scan_at
FROM guests g
WHERE g.checked_in = true 
  AND g.checked_in_at IS NOT NULL
GROUP BY g.event_id, g.usher_email, g.usher_name, g.checked_in_by
ORDER BY total_scans DESC;

-- Step 5: Create a function to get top usher for an event
CREATE OR REPLACE FUNCTION get_top_usher_for_event(p_event_id UUID)
RETURNS TABLE (
  usher_name TEXT,
  usher_email TEXT,
  total_scans BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.usher_name,
    g.usher_email,
    COUNT(*)::BIGINT as total_scans
  FROM guests g
  WHERE g.event_id = p_event_id
    AND g.checked_in = true
    AND g.checked_in_at IS NOT NULL
  GROUP BY g.usher_name, g.usher_email
  ORDER BY total_scans DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add comment for documentation
COMMENT ON COLUMN guests.usher_name IS 'Name of the usher who scanned this guest';
COMMENT ON COLUMN guests.usher_email IS 'Email of the usher who scanned this guest';
COMMENT ON VIEW usher_statistics IS 'Aggregated statistics showing scan counts per usher per event';