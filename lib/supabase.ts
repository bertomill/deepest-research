import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Use typeof window to check if we're in the browser
  const supabaseUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co')
    : 'https://placeholder.supabase.co';

  const supabaseAnonKey = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key')
    : 'placeholder-key';

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase URL:', supabaseUrl);
    console.log('Has Anon Key:', !!supabaseAnonKey && supabaseAnonKey !== 'placeholder-key');
  }

  // Validate URL before creating client
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('Supabase URL not configured. Auth features will be disabled.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  },
});
