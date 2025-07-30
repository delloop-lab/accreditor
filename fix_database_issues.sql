-- Fix database issues after adding role column

-- First, let's check if the role column was added properly
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'role';

-- Drop the constraint if it exists (it might be causing issues)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_roles;

-- Update any NULL role values to 'user'
UPDATE profiles SET role = 'user' WHERE role IS NULL OR role = '';

-- Re-add the constraint with proper syntax
ALTER TABLE profiles ADD CONSTRAINT valid_roles CHECK (role IN ('user', 'admin', 'super_admin'));

-- Drop existing RLS policies that might be conflicting
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;

-- Create simpler, working RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create admin policies that actually work
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Super admins can update any profile" ON profiles
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM profiles 
            WHERE role = 'super_admin'
        )
    );

-- Make sure lou@schillaci.com is definitely a super admin
UPDATE profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'lou@schillaci.com'
);

-- Also update by email if it exists in profiles
UPDATE profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE email = 'lou@schillaci.com';

-- Create the profile if it doesn't exist
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

-- Verify the setup
SELECT 
    p.id,
    p.user_id,
    p.email,
    p.name,
    p.role,
    p.icf_level,
    p.created_at
FROM profiles p
WHERE p.email = 'lou@schillaci.com' 
   OR p.user_id IN (SELECT id FROM auth.users WHERE email = 'lou@schillaci.com');

-- Check all profiles to make sure role column is working
SELECT user_id, email, name, role FROM profiles LIMIT 5; 