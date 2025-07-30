-- Temporarily disable RLS on sessions and CPD tables for admins
-- This is a simpler approach that should work immediately

-- Option 1: Disable RLS temporarily (for testing)
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cpd DISABLE ROW LEVEL SECURITY;

-- Test queries to verify admin can see all data
SELECT 'Sessions data:' as table_name;
SELECT 
    p.email,
    p.name,
    COUNT(s.id) as session_count,
    COALESCE(SUM(s.duration), 0) as total_minutes
FROM profiles p
LEFT JOIN sessions s ON p.user_id = s.user_id
GROUP BY p.user_id, p.email, p.name
ORDER BY p.email;

SELECT 'CPD data:' as table_name;
SELECT 
    p.email,
    p.name,
    COUNT(c.id) as cpd_count,
    COALESCE(SUM(c.hours), 0) as total_hours
FROM profiles p
LEFT JOIN cpd c ON p.user_id = c.user_id
GROUP BY p.user_id, p.email, p.name
ORDER BY p.email; 