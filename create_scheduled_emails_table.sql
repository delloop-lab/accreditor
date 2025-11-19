-- Create scheduled_emails table for storing scheduled reminder emails
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  email_content TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('all', 'selected')),
  recipient_user_ids UUID[] DEFAULT ARRAY[]::UUID[],
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying of pending emails
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status_scheduled_for 
ON scheduled_emails(status, scheduled_for) 
WHERE status = 'pending';

-- Create index for querying by creator
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_created_by 
ON scheduled_emails(created_by);

-- Enable RLS
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see scheduled emails they created
CREATE POLICY "Users can view their own scheduled emails"
  ON scheduled_emails FOR SELECT
  USING (auth.uid() = created_by);

-- RLS Policy: Users can insert scheduled emails
CREATE POLICY "Users can create scheduled emails"
  ON scheduled_emails FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policy: Users can update their own scheduled emails (before sending)
CREATE POLICY "Users can update their own scheduled emails"
  ON scheduled_emails FOR UPDATE
  USING (auth.uid() = created_by AND status = 'pending');

-- RLS Policy: Users can delete their own scheduled emails
CREATE POLICY "Users can delete their own scheduled emails"
  ON scheduled_emails FOR DELETE
  USING (auth.uid() = created_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_scheduled_emails_updated_at
  BEFORE UPDATE ON scheduled_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_emails_updated_at();


