-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create an index on the role column for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update existing profiles to have 'user' role if null
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Add constraint to ensure valid roles
ALTER TABLE profiles ADD CONSTRAINT valid_roles CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create a view for admin user management (optional but recommended)
CREATE OR REPLACE VIEW admin_user_view AS
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.email,
    p.icf_level,
    p.currency,
    p.country,
    p.role,
    p.created_at,
    p.updated_at,
    -- Count user's sessions
    COALESCE(s.session_count, 0) as total_sessions,
    -- Count user's CPD entries
    COALESCE(c.cpd_count, 0) as total_cpd_entries,
    -- Calculate total coaching hours
    COALESCE(s.total_hours, 0) as total_coaching_hours
FROM profiles p
LEFT JOIN (
    SELECT 
        user_id, 
        COUNT(*) as session_count,
        SUM(duration) as total_hours
    FROM sessions 
    GROUP BY user_id
) s ON p.user_id = s.user_id
LEFT JOIN (
    SELECT 
        user_id, 
        COUNT(*) as cpd_count
    FROM cpd 
    GROUP BY user_id
) c ON p.user_id = c.user_id;

-- Set up Row Level Security (RLS) policies for admin access
-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy: Super admins can update any profile
CREATE POLICY "Super admins can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user statistics (for admin dashboard)
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    active_users_30d BIGINT,
    total_sessions BIGINT,
    total_cpd_entries BIGINT,
    avg_sessions_per_user NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM profiles) as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM sessions WHERE date >= CURRENT_DATE - INTERVAL '30 days') as active_users_30d,
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM cpd) as total_cpd_entries,
        (SELECT ROUND(AVG(session_count), 2) FROM (
            SELECT COUNT(*) as session_count 
            FROM sessions 
            GROUP BY user_id
        ) user_sessions) as avg_sessions_per_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 