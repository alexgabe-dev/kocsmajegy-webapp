import { supabase } from './supabase';

export const checkDatabaseStructure = async () => {
  try {
    console.log('Checking database structure...');
    
    // Check if restaurants table exists using a direct SQL query
    const { data: tables, error: tablesError } = await supabase
      .rpc('check_table_exists', { table_name: 'restaurants' });
    
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return { success: false, error: tablesError };
    }
    
    console.log('Tables:', tables);
    
    if (!tables || !tables.exists) {
      console.error('Restaurants table does not exist!');
      return { success: false, error: 'Restaurants table does not exist' };
    }
    
    // Check table structure using a direct SQL query
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'restaurants' });
    
    if (columnsError) {
      console.error('Error checking columns:', columnsError);
      return { success: false, error: columnsError };
    }
    
    console.log('Columns:', columns);
    
    // Check RLS status
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('get_rls_status', { table_name: 'restaurants' });
    
    if (rlsError) {
      console.error('Error checking RLS status:', rlsError);
      // This might fail if the function doesn't exist, which is fine
    } else {
      console.log('RLS status:', rlsStatus);
    }
    
    return { 
      success: true, 
      tables, 
      columns,
      rlsStatus: rlsError ? 'Unknown' : rlsStatus
    };
  } catch (error) {
    console.error('Error checking database structure:', error);
    return { success: false, error };
  }
}; 