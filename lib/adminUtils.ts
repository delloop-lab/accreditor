import { supabase } from './supabaseClient';

export type UserRole = 'user' | 'admin' | 'super_admin';

export interface AdminUser {
  id: string;
  user_id: string;
  name: string;
  email: string;
  icf_level: string;
  currency: string;
  country: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  total_sessions: number;
  total_cpd_entries: number;
  total_coaching_hours: number;
}

export interface UserStats {
  total_users: number;
  active_users_30d: number;
  total_sessions: number;
  total_cpd_entries: number;
  avg_sessions_per_user: number;
  // Growth metrics
  new_users_this_month: number;
  growth_rate_percent: number;
  // Engagement metrics
  avg_session_duration: number;
  active_users_7d: number;
  users_with_sessions_this_month: number;
  // ICF Level distribution
  mcc_users: number;
  pcc_users: number;
  acc_users: number;
  no_level_users: number;
  // Geographic distribution
  top_countries: Array<{ country: string; count: number }>;
  // Content metrics
  total_coaching_hours: number;
  avg_cpd_hours_per_user: number;
  most_active_day: string;
}

/**
 * Check if the current user has admin or super_admin role
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return profile?.role === 'admin' || profile?.role === 'super_admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if the current user has super_admin role
 */
export const isCurrentUserSuperAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return profile?.role === 'super_admin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};

/**
 * Get current user's role
 */
export const getCurrentUserRole = async (): Promise<UserRole | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return profile?.role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Get all users (admin only) - simplified version using direct profiles table
 */
export const getAllUsers = async (): Promise<AdminUser[]> => {
  try {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return [];
    }

    if (!profiles) return [];

    // Get session counts and hours for each user
    const usersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        // Get session stats
        const { data: sessions } = await supabase
          .from('sessions')
          .select('duration')
          .eq('user_id', profile.user_id);

        // Get CPD stats
        const { data: cpdEntries } = await supabase
          .from('cpd')
          .select('id')
          .eq('user_id', profile.user_id);

        const totalSessions = sessions?.length || 0;
        const totalCpdEntries = cpdEntries?.length || 0;
        const totalCoachingHours = sessions?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;

        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.name || '',
          email: profile.email || '',
          icf_level: profile.icf_level || 'none',
          currency: profile.currency || 'USD',
          country: profile.country || '',
          role: profile.role || 'user',
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          total_sessions: totalSessions,
          total_cpd_entries: totalCpdEntries,
          total_coaching_hours: totalCoachingHours
        } as AdminUser;
      })
    );

    return usersWithStats;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

/**
 * Get user statistics (admin only) - comprehensive version
 */
export const getUserStats = async (): Promise<UserStats | null> => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Basic counts
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true });

    const { count: totalCpdEntries } = await supabase
      .from('cpd')
      .select('*', { count: 'exact', head: true });

    // Growth metrics
    const { count: newUsersThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstOfMonth.toISOString());

    const { count: newUsersLastMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstOfLastMonth.toISOString())
      .lt('created_at', firstOfMonth.toISOString());

    const growthRate = newUsersLastMonth && newUsersLastMonth > 0 
      ? Math.round(((newUsersThisMonth || 0) - (newUsersLastMonth || 0)) / (newUsersLastMonth || 1) * 100)
      : 0;

    // Active users
    const { data: activeSessions30d } = await supabase
      .from('sessions')
      .select('user_id')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    const { data: activeSessions7d } = await supabase
      .from('sessions')
      .select('user_id')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

    const { data: activeSessionsThisMonth } = await supabase
      .from('sessions')
      .select('user_id')
      .gte('date', firstOfMonth.toISOString().split('T')[0]);

    const activeUserIds30d = [...new Set(activeSessions30d?.map(s => s.user_id) || [])];
    const activeUserIds7d = [...new Set(activeSessions7d?.map(s => s.user_id) || [])];
    const activeUsersThisMonth = [...new Set(activeSessionsThisMonth?.map(s => s.user_id) || [])];

    // Session duration and coaching hours
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('duration, date');

    const totalCoachingHours = allSessions?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;
    const avgSessionDuration = allSessions && allSessions.length > 0 
      ? Math.round(totalCoachingHours / allSessions.length) 
      : 0;

    // ICF Level distribution
    const { data: profiles } = await supabase
      .from('profiles')
      .select('icf_level, country');

    const icfLevels = profiles?.reduce((acc, profile) => {
      const level = profile.icf_level || 'none';
      if (level === 'MCC') acc.mcc++;
      else if (level === 'PCC') acc.pcc++;
      else if (level === 'ACC') acc.acc++;
      else acc.no_level++;
      return acc;
    }, { mcc: 0, pcc: 0, acc: 0, no_level: 0 }) || { mcc: 0, pcc: 0, acc: 0, no_level: 0 };

    // Geographic distribution
    const countryCount = profiles?.reduce((acc, profile) => {
      const country = profile.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topCountries = Object.entries(countryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // CPD analytics
    const { data: cpdEntries } = await supabase
      .from('cpd')
      .select('hours, user_id');

    const totalCpdHours = cpdEntries?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0;
    const avgCpdHoursPerUser = totalUsers && totalUsers > 0 
      ? Math.round(totalCpdHours / totalUsers * 100) / 100 
      : 0;

    // Most active day of week
    const dayCount = allSessions?.reduce((acc, session) => {
      const dayOfWeek = new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' });
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const mostActiveDay = Object.entries(dayCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';

    // Calculate averages
    const avgSessionsPerUser = totalUsers && totalUsers > 0 
      ? Math.round((totalSessions || 0) / totalUsers * 100) / 100 
      : 0;

    return {
      // Basic metrics
      total_users: totalUsers || 0,
      active_users_30d: activeUserIds30d.length,
      total_sessions: totalSessions || 0,
      total_cpd_entries: totalCpdEntries || 0,
      avg_sessions_per_user: avgSessionsPerUser,
      
      // Growth metrics
      new_users_this_month: newUsersThisMonth || 0,
      growth_rate_percent: growthRate,
      
      // Engagement metrics
      avg_session_duration: avgSessionDuration,
      active_users_7d: activeUserIds7d.length,
      users_with_sessions_this_month: activeUsersThisMonth.length,
      
      // ICF Level distribution
      mcc_users: icfLevels.mcc,
      pcc_users: icfLevels.pcc,
      acc_users: icfLevels.acc,
      no_level_users: icfLevels.no_level,
      
      // Geographic and content metrics
      top_countries: topCountries,
      total_coaching_hours: Math.round(totalCoachingHours / 60), // Convert minutes to hours
      avg_cpd_hours_per_user: avgCpdHoursPerUser,
      most_active_day: mostActiveDay,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
};

/**
 * Update user role (super admin only)
 */
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
};

/**
 * Search users by name or email (admin only)
 */
export const searchUsers = async (searchTerm: string): Promise<AdminUser[]> => {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    if (!profiles) return [];

    // Get stats for each profile (simplified for search)
    const usersWithStats = profiles.map(profile => ({
      id: profile.id,
      user_id: profile.user_id,
      name: profile.name || '',
      email: profile.email || '',
      icf_level: profile.icf_level || 'none',
      currency: profile.currency || 'USD',
      country: profile.country || '',
      role: profile.role || 'user',
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      total_sessions: 0, // Simplified for search
      total_cpd_entries: 0, // Simplified for search
      total_coaching_hours: 0 // Simplified for search
    })) as AdminUser[];

    return usersWithStats;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Get user activity summary for a specific user (admin only)
 */
export const getUserActivity = async (userId: string) => {
  try {
    // Get user's recent sessions
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, client_name, date, duration')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    // Get user's recent CPD entries
    const { data: cpdEntries } = await supabase
      .from('cpd')
      .select('id, title, date, hours')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    return {
      recentSessions: sessions || [],
      recentCpdEntries: cpdEntries || []
    };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return {
      recentSessions: [],
      recentCpdEntries: []
    };
  }
}; 