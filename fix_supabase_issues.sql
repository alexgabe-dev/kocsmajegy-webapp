-- Fix RLS policies for restaurants table
DROP POLICY IF EXISTS "Allow authenticated read access to all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow user to insert own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow user to update own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow user to delete own restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow authenticated users to insert restaurants" ON public.restaurants;

-- Create simpler policies that don't rely on request_headers()
CREATE POLICY "Allow authenticated read access to all restaurants" ON public.restaurants
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update own restaurants" ON public.restaurants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own restaurants" ON public.restaurants
  FOR DELETE USING (auth.uid() = user_id);

-- Make sure RLS is enabled
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS public.insert_restaurant(text, text, integer, uuid);

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

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  ) INTO table_exists;
  
  RETURN jsonb_build_object('exists', table_exists);
END;
$$;

-- Function to get table columns
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  columns jsonb;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable
    )
  )
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = $1
  INTO columns;
  
  RETURN columns;
END;
$$;

-- Function to get RLS status
CREATE OR REPLACE FUNCTION public.get_rls_status(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rls_enabled boolean;
  policies jsonb;
BEGIN
  -- Check if RLS is enabled
  SELECT relrowsecurity
  FROM pg_class
  WHERE relname = $1
  INTO rls_enabled;
  
  -- Get policies
  SELECT jsonb_agg(
    jsonb_build_object(
      'policyname', policyname,
      'permissive', permissive,
      'roles', roles,
      'cmd', cmd,
      'qual', qual,
      'with_check', with_check
    )
  )
  FROM pg_policies
  WHERE tablename = $1
  INTO policies;
  
  RETURN jsonb_build_object(
    'rls_enabled', rls_enabled,
    'policies', policies
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rls_status TO authenticated; 