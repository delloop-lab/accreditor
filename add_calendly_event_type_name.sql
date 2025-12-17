-- Add calendly_event_type_name column to sessions table for storing Calendly event type name
-- This allows tracking which Calendly event type was used for each booking

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS calendly_event_type_name TEXT;

-- Create index for faster lookups by event type name (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_sessions_calendly_event_type_name 
ON sessions(calendly_event_type_name);

-- Add comment to column for documentation
COMMENT ON COLUMN sessions.calendly_event_type_name IS 'Name of the Calendly event type used for this booking (e.g., "Expert Coaching 45 Minutes")';





