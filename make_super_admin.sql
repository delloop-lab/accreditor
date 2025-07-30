-- Make lou@schillaci.com a super admin
-- First, find the user ID for this email
UPDATE profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE email = 'lou@schillaci.com';

-- Alternative approach if the email is stored in auth.users instead of profiles
-- This will work if the profile doesn't exist yet or email is in auth.users
UPDATE profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'lou@schillaci.com'
);

-- Create the profile if it doesn't exist (in case the user hasn't logged in yet)
INSERT INTO profiles (user_id, email, name, role, icf_level, currency, country, created_at, updated_at)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email),
    'super_admin',
    'none',
    'USD',
    'United States',
    created_at,
    NOW()
FROM auth.users 
WHERE email = 'lou@schillaci.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'super_admin',
    updated_at = NOW();

-- Verify the change
SELECT 
    p.id,
    p.user_id,
    p.email,
    p.name,
    p.role,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.email = 'lou@schillaci.com' 
   OR p.user_id IN (SELECT id FROM auth.users WHERE email = 'lou@schillaci.com'); 