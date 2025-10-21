-- Helper function to increment scanner session scan count
CREATE OR REPLACE FUNCTION increment_scanner_session_scans(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE scanner_sessions
  SET scans_count = scans_count + 1,
      last_activity_at = NOW()
  WHERE id = session_id
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_scanner_session_scans(UUID) TO authenticated;