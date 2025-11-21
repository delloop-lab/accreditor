-- Add email notification preferences to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_notification_types JSONB DEFAULT '[]'::jsonb;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_email_notification_types 
ON profiles USING GIN (email_notification_types);

-- Add comment
COMMENT ON COLUMN profiles.email_notification_types IS 'Array of notification types user wants to receive via email: ["Session reminders", "CPD deadlines", "Calendly events"]';

