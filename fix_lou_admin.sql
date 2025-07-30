-- Make lou@schillaci.me (the correct email) a super admin
UPDATE profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE email = 'lou@schillaci.me';

-- Also update by user_id to be sure
UPDATE profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE user_id = 'e6d692df-00cb-4501-abf0-7b99a0be27a6';

-- Verify the change
SELECT user_id, email, name, role FROM profiles WHERE email = 'lou@schillaci.me'; 