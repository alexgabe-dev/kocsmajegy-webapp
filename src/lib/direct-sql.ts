import { supabase } from './supabase';

export const insertRestaurantDirect = async (name: string, address: string, priceTier: number, userId: string) => {
  try {
    console.log('Inserting restaurant using direct SQL...');
    
    // Use the rpc function to call a SQL function
    const { data, error } = await supabase.rpc('insert_restaurant', {
      p_name: name,
      p_address: address,
      p_price_tier: priceTier,
      p_user_id: userId
    });
    
    if (error) {
      console.error('Error inserting restaurant using direct SQL:', error);
      return { success: false, error };
    }
    
    console.log('Restaurant inserted successfully using direct SQL:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in insertRestaurantDirect:', error);
    return { success: false, error };
  }
}; 