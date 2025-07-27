-- Add country column to existing profiles table
-- Run this script in your Supabase SQL editor if your profiles table is missing the country column

-- Check if country column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'country'
    ) THEN
        ALTER TABLE profiles ADD COLUMN country VARCHAR(100) DEFAULT 'United States';
        RAISE NOTICE 'Added country column to profiles table';
    ELSE
        RAISE NOTICE 'Country column already exists in profiles table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'country'; 