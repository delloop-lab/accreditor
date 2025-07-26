import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client if environment variables are missing
const createMockClient = () => {
  console.warn('Supabase environment variables not found. Using mock client.');
  
  // Mock user for demo purposes
  const mockUser = {
    id: 'demo-user-id',
    email: 'demo@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const createMockQueryBuilder = () => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options?: any) => ({
          limit: (count: number) => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: { message: 'Mock client' } })
        }),
        single: () => Promise.resolve({ data: null, error: { message: 'Mock client' } })
      }),
      order: (column: string, options?: any) => ({
        limit: (count: number) => Promise.resolve({ data: [], error: null })
      }),
      single: () => Promise.resolve({ data: null, error: { message: 'Mock client' } })
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: { message: 'Mock client' } }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        eq: (column2: string, value2: any) => Promise.resolve({ data: null, error: { message: 'Mock client' } })
      })
    }),
    delete: () => Promise.resolve({ data: null, error: { message: 'Mock client' } }),
  });
  
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        // Allow any login for demo purposes
        if (email && password) {
          return { 
            data: { user: mockUser }, 
            error: null 
          };
        }
        return { 
          data: { user: null }, 
          error: { message: 'Invalid credentials' } 
        };
      },
      signUp: async ({ email, password }: { email: string; password: string }) => {
        // Allow any registration for demo purposes
        if (email && password) {
          return { 
            data: { user: mockUser }, 
            error: null 
          };
        }
        return { 
          data: { user: null }, 
          error: { message: 'Invalid credentials' } 
        };
      },
      signOut: async () => ({ error: null }),
    },
    from: (table: string) => createMockQueryBuilder(),
  };
};

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient(); 