import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Create a server-side Supabase client for API routes
 * This client can read cookies from the request headers
 */
export function createServerSupabaseClient(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Get access token from Authorization header (preferred method)
  const authHeader = request?.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '') || null;
  
  // Create a client with the access token if available
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`,
      } : {},
    },
  });
  
  return client;
}

/**
 * Create a Supabase client with service role key (bypasses RLS)
 * Use this for cron jobs and admin operations that need to access all data
 */
export function createServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role environment variables');
  }

  // Service role key bypasses RLS policies
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get the current user from the server-side Supabase client
 */
export async function getServerUser(request?: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    
    // Use getUser() which validates the token from the Authorization header
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('Error getting server user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error creating server Supabase client:', error);
    return null;
  }
}

