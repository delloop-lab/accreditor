-- Test Database Connection and Permissions
-- Run this in your Supabase SQL editor to verify everything is working

-- Test 1: Check if we can access the profiles table
SELECT 
    'Profiles table accessible' as test,
    COUNT(*) as row_count
FROM profiles;

-- Test 2: Check table structure
SELECT 
    'Table structure' as test,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Test 3: Check RLS policies
SELECT 
    'RLS policies' as test,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles';

-- Test 4: Check current user context
SELECT 
    'Current user context' as test,
    current_user,
    session_user,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- Test 5: Check if auth.uid() function works
SELECT 
    'Auth function test' as test,
    auth.uid() as current_user_id;

-- Test 6: Check permissions for authenticated role
SELECT 
    'Permissions test' as test,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' 
AND grantee = 'authenticated'; 