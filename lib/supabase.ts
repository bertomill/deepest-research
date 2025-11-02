import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let isConfigured = false;

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Log what we're getting (only in browser)
  if (typeof window !== 'undefined') {
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
  }

  // Check if Supabase is properly configured
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    console.warn('Supabase not configured. Using mock client. Auth features will be disabled.');
    isConfigured = false;

    // Create a mock client that won't throw errors
    supabaseInstance = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signUp: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => ({ data: null, error: null }),
        eq: function() { return this; },
        order: function() { return this; },
      }),
    } as any;

    return supabaseInstance;
  }

  isConfigured = true;
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  },
});

export const isSupabaseConfigured = () => {
  getSupabaseClient(); // Ensure client is initialized
  return isConfigured;
};
