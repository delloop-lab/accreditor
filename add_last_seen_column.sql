-- Add last_seen column to profiles table for tracking online status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- Update existing rows to have current timestamp
UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;


