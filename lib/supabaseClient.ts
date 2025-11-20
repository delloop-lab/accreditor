import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

if (!supabaseUrl || !supabaseAnonKey) {
  if (isBrowser) {
    // Environment variables missing; intentionally no console output per requirements
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Add a helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Previously suppressed specific Supabase auth errors in console; now omitted to avoid console usage

// Helper function to safely get the current user with error handling
export const getCurrentUser = async () => {
  try {
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      // Don't log session errors as they're expected during auth flows
      return { user: null, error: sessionError };
    }
    
    if (!session) {
      return { user: null, error: null };
    }
    
    // If we have a session, get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      // Don't log user errors as they're expected during auth flows
      return { user: null, error: userError };
    }
    
    return { user, error: null };
  } catch (error) {
    // Don't log these errors as they're expected during auth flows
    return { user: null, error };
  }
}; 
