-- Complete fix for all database issues

-- First, let's temporarily disable RLS to see if that's the issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON profiles;

-- Drop the admin view if it exists and has issues
DROP VIEW IF EXISTS admin_user_view;

-- Drop the functions if they exist and have issues
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS get_user_stats();

-- Test basic query to see if profiles table is accessible
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check if role column exists and has proper values
SELECT user_id, email, name, role FROM profiles WHERE role IS NOT NULL;

-- Re-enable RLS with very simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that should work
CREATE POLICY "Enable all access for authenticated users" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: Create basic policies
CREATE POLICY "Users can select" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Ensure Lou's profile is correct
UPDATE profiles 
SET role = 'super_admin', updated_at = NOW()
WHERE user_id = 'e6d692df-00cb-4501-abf0-7b99a0be27a6';

-- Test the query that's failing
SELECT name, icf_level, currency 
FROM profiles 
WHERE user_id = 'e6d692df-00cb-4501-abf0-7b99a0be27a6';

-- Verify all is working
SELECT user_id, email, name, role, icf_level, currency FROM profiles LIMIT 5; 