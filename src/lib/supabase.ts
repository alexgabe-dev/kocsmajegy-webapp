import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a more basic client without additional options
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log the Supabase URL for debugging
console.log('Supabase URL:', supabaseUrl);