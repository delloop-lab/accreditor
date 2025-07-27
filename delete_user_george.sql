-- Delete user george@yopmail.com from all tables
-- Run this in your Supabase SQL Editor

-- Step 1: First, let's see what user_id we're dealing with
SELECT user_id, name, email 
FROM profiles 
WHERE email = 'george@yopmail.com';

-- Step 2: Delete from sessions table
DELETE FROM sessions 
WHERE user_id = (
    SELECT user_id 
    FROM profiles 
    WHERE email = 'george@yopmail.com'
);

-- Step 3: Delete from cpd table
DELETE FROM cpd 
WHERE user_id = (
    SELECT user_id 
    FROM profiles 
    WHERE email = 'george@yopmail.com'
);

-- Step 4: Delete from clients table
DELETE FROM clients 
WHERE user_id = (
    SELECT user_id 
    FROM profiles 
    WHERE email = 'george@yopmail.com'
);

-- Step 5: Finally, delete from profiles table
DELETE FROM profiles 
WHERE email = 'george@yopmail.com';

-- Step 6: Verify the user is gone
SELECT 'User deletion complete' as status;
SELECT COUNT(*) as remaining_profiles FROM profiles WHERE email = 'george@yopmail.com'; 