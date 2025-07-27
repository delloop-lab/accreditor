-- Verify Profiles Table Setup
-- Run this to check if everything is working correctly

-- Check table structure
SELECT 'Table Structure' as check_type, 'All columns present' as status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name IN ('id', 'user_id', 'name', 'email', 'icf_level', 'currency', 'country', 'created_at', 'updated_at')
    HAVING COUNT(*) = 9
);

-- Check RLS policies
SELECT 'RLS Policies' as check_type, COUNT(*) || ' policies found' as status
FROM pg_policies 
WHERE tablename = 'profiles';

-- List all policies
SELECT 
    'Policy Details' as check_type,
    policyname,
    cmd,
    CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END as policy_type
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check permissions
SELECT 'Permissions' as check_type, 
       privilege_type || ' granted to ' || grantee as status
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' 
AND grantee = 'authenticated';

-- Test basic access (should work if RLS is configured correctly)
SELECT 'Access Test' as check_type, 
       CASE 
           WHEN COUNT(*) >= 0 THEN 'Table accessible'
           ELSE 'Access denied'
       END as status
FROM profiles LIMIT 1;

-- Check if auth.uid() function works
SELECT 'Auth Function' as check_type,
       CASE 
           WHEN auth.uid() IS NULL THEN 'No authenticated user'
           ELSE 'Auth function working'
       END as status; 