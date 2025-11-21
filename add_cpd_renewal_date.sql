-- Add CPD renewal date field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cpd_renewal_date DATE;

-- Add index for efficient querying of upcoming renewals
CREATE INDEX IF NOT EXISTS idx_profiles_cpd_renewal_date 
ON profiles(cpd_renewal_date) 
WHERE cpd_renewal_date IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.cpd_renewal_date IS 'Date when user needs to renew their ICF credential/CPD requirements';

