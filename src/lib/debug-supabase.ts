import { supabase } from './supabase';

// Function to test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth session:', authData);
    if (authError) console.error('Auth error:', authError);
    
    // Test database access
    const { data: dbData, error: dbError } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1);
    
    console.log('Database test result:', dbData);
    if (dbError) console.error('Database error:', dbError);
    
    return { success: !authError && !dbError, authData, dbData };
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return { success: false, error };
  }
};

// Function to check if RLS is enabled
export const checkRLSStatus = async () => {
  try {
    console.log('Checking RLS status...');
    
    // This query will fail if RLS is blocking access
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('RLS check error:', error);
      return { rlsEnabled: true, error };
    }
    
    console.log('RLS check result:', data);
    return { rlsEnabled: false, data };
  } catch (error) {
    console.error('Error checking RLS status:', error);
    return { rlsEnabled: true, error };
  }
}; 