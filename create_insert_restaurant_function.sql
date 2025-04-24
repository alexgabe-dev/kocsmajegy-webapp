-- Create a function to insert a restaurant and return its ID
CREATE OR REPLACE FUNCTION public.insert_restaurant(
  p_name text,
  p_address text,
  p_price_tier integer,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_restaurant_id uuid;
BEGIN
  -- Insert the restaurant and get its ID
  INSERT INTO public.restaurants (
    name,
    address,
    price_tier,
    user_id
  )
  VALUES (
    p_name,
    p_address,
    p_price_tier,
    p_user_id
  )
  RETURNING id INTO v_restaurant_id;
  
  -- Return the ID of the inserted restaurant
  RETURN v_restaurant_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_restaurant TO authenticated; 