-- Fix RLS policies for sessions and CPD tables to allow admin access

-- Sessions table policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON sessions;

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions table
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Allow admins to view all sessions
CREATE POLICY "Admins can view all sessions" ON sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- CPD table policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own cpd" ON cpd;
DROP POLICY IF EXISTS "Users can insert own cpd" ON cpd;
DROP POLICY IF EXISTS "Users can update own cpd" ON cpd;
DROP POLICY IF EXISTS "Users can delete own cpd" ON cpd;
DROP POLICY IF EXISTS "Admins can view all cpd" ON cpd;

-- Enable RLS on CPD table
ALTER TABLE cpd ENABLE ROW LEVEL SECURITY;

-- Create policies for CPD table
CREATE POLICY "Users can view own cpd" ON cpd
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cpd" ON cpd
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cpd" ON cpd
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cpd" ON cpd
    FOR DELETE USING (auth.uid() = user_id);

-- Allow admins to view all CPD entries
CREATE POLICY "Admins can view all cpd" ON cpd
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- Test admin access to sessions
SELECT 
    user_id, 
    COUNT(*) as session_count,
    SUM(duration) as total_minutes
FROM sessions 
GROUP BY user_id;

-- Test admin access to CPD
SELECT 
    user_id, 
    COUNT(*) as cpd_count,
    SUM(hours) as total_hours
FROM cpd 
GROUP BY user_id; 