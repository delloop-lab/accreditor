# Profile Data Saving Issue - Fix Guide

## Problem
Profile data was not being saved properly due to a mismatch between the database schema and the application code.

## Root Cause
The application code was trying to save and read a `country` field from the profiles table, but the database schema was missing this column.

## Files Modified
1. `profiles_table.sql` - Added missing `country` column to the schema
2. `app/dashboard/profile/page.tsx` - Fixed profile saving logic and added better error handling
3. `add_country_column.sql` - Created script to add the missing column to existing databases

## How to Fix

### For New Installations
If you're setting up a new database, use the updated `profiles_table.sql` file which now includes the `country` column.

### For Existing Installations
If you already have a database with the profiles table, run the `add_country_column.sql` script in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add_country_column.sql`
4. Run the script

### Verification
After running the fix, you can verify the column was added by running:
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'country';
```

## Additional Improvements Made

### Better Error Handling
- Added more detailed error messages
- Improved profile saving logic to properly handle insert vs update scenarios
- Added console logging for debugging

### Fixed Logic Issues
- The original code tried to update first, then insert on error
- New code properly checks if profile exists first, then either inserts or updates
- Better handling of database errors

## Testing
After applying the fix:
1. Try to save profile data
2. Check the browser console for any error messages
3. Verify the data persists after page refresh
4. Test with different ICF levels, currencies, and countries

## Environment Variables
Make sure your `.env.local` file has the correct Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Common Issues
- **"Column does not exist" errors**: Run the `add_country_column.sql` script
- **RLS Policy issues**: Make sure Row Level Security policies are properly configured
- **Authentication issues**: Verify your Supabase project is active and credentials are correct 