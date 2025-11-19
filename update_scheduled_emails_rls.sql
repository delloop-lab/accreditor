-- Update RLS policy to allow admins to update scheduled emails regardless of status
-- This allows the process-scheduled-emails API to update emails after sending

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update their own scheduled emails" ON scheduled_emails;

-- Create a new policy that allows:
-- 1. Users to update their own emails when status is 'pending' (before sending)
-- 2. Service role (cron jobs) to update any email (bypasses RLS anyway, but good to have)
-- Note: Service role bypasses RLS, so this policy mainly affects regular users
CREATE POLICY "Users can update their own scheduled emails"
  ON scheduled_emails FOR UPDATE
  USING (
    auth.uid() = created_by AND status = 'pending'
  );

-- Also allow updates for service role operations (though service role bypasses RLS)
-- This is mainly for clarity - service role already bypasses RLS


