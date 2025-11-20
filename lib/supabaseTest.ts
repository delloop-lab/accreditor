import { supabase } from './supabaseClient';

export async function testSupabaseConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      return {
        success: false,
        error: error.message,
        details: 'Database connection or table access issue'
      };
    }
    
    return {
      success: true,
      message: 'Supabase connection successful'
    };
  } catch (err) {
    return {
      success: false,
      error: 'Connection failed',
      details: 'Unable to connect to Supabase'
    };
  }
}

export async function testAuthSettings() {
  try {
    // Test auth settings by trying to get current session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        success: false,
        error: error.message,
        details: 'Authentication service issue'
      };
    }
    
    return {
      success: true,
      message: 'Auth service working correctly'
    };
  } catch (err) {
    return {
      success: false,
      error: 'Auth service failed',
      details: 'Unable to access authentication service'
    };
  }
} 
