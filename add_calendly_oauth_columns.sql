-- Add Calendly OAuth token columns to profiles table
-- These store the access and refresh tokens from OAuth authentication

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendly_access_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS calendly_refresh_token TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.calendly_access_token IS 'Calendly OAuth access token for API access';
COMMENT ON COLUMN profiles.calendly_refresh_token IS 'Calendly OAuth refresh token for token renewal';


