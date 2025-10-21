-- Migration: Add scanner_sessions table for tracking active scanner sessions
-- This allows real-time monitoring of who is currently scanning and their activity

-- Create scanner_sessions table
CREATE TABLE IF NOT EXISTS scanner_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  usher_name TEXT NOT NULL,
  usher_email TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  scans_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scanner_sessions_user_id ON scanner_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scanner_sessions_event_id ON scanner_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_scanner_sessions_is_active ON scanner_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_scanner_sessions_last_activity ON scanner_sessions(last_activity_at);

-- Add RLS policies
ALTER TABLE scanner_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all scanner sessions
CREATE POLICY "Allow authenticated users to read scanner sessions"
  ON scanner_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert their own scanner sessions
CREATE POLICY "Allow users to insert their own scanner sessions"
  ON scanner_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own scanner sessions
CREATE POLICY "Allow users to update their own scanner sessions"
  ON scanner_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own scanner sessions
CREATE POLICY "Allow users to delete their own scanner sessions"
  ON scanner_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scanner_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_scanner_sessions_updated_at ON scanner_sessions;
CREATE TRIGGER trigger_update_scanner_sessions_updated_at
  BEFORE UPDATE ON scanner_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_scanner_sessions_updated_at();

-- Create function to automatically end inactive sessions (older than 10 minutes)
CREATE OR REPLACE FUNCTION end_inactive_scanner_sessions()
RETURNS void AS $$
BEGIN
  UPDATE scanner_sessions
  SET is_active = FALSE,
      ended_at = last_activity_at
  WHERE is_active = TRUE
    AND last_activity_at < NOW() - INTERVAL '10 minutes'
    AND ended_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: You can set up a cron job or periodic task to call end_inactive_scanner_sessions()
-- For example, using pg_cron extension:
-- SELECT cron.schedule('end-inactive-sessions', '*/5 * * * *', 'SELECT end_inactive_scanner_sessions()');

COMMENT ON TABLE scanner_sessions IS 'Tracks active scanner sessions for real-time monitoring';
COMMENT ON COLUMN scanner_sessions.last_activity_at IS 'Updated on every scan to track activity';
COMMENT ON COLUMN scanner_sessions.scans_count IS 'Total number of successful scans in this session';
COMMENT ON COLUMN scanner_sessions.is_active IS 'Whether the scanner is currently active';