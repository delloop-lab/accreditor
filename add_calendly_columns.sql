-- Add Calendly integration columns to profiles and sessions tables

-- Add calendly_url to profiles table for storing user's Calendly link
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendly_url TEXT;

-- Add Calendly-related columns to sessions table for tracking bookings
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS calendly_event_uri TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS calendly_invitee_uri TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS calendly_booking_id TEXT;

-- Create index for faster lookups by Calendly invitee URI
CREATE INDEX IF NOT EXISTS idx_sessions_calendly_invitee_uri 
ON sessions(calendly_invitee_uri);

-- Create index for faster lookups by Calendly booking ID
CREATE INDEX IF NOT EXISTS idx_sessions_calendly_booking_id 
ON sessions(calendly_booking_id);

-- Add comment to columns for documentation
COMMENT ON COLUMN profiles.calendly_url IS 'User''s Calendly scheduling link';
COMMENT ON COLUMN sessions.calendly_event_uri IS 'Calendly event URI for this booking';
COMMENT ON COLUMN sessions.calendly_invitee_uri IS 'Calendly invitee URI for this booking';
COMMENT ON COLUMN sessions.calendly_booking_id IS 'Calendly booking ID extracted from URI';


