-- Módosítjuk a rating mezők típusát, hogy elfogadjanak tizedes számokat
ALTER TABLE public.reviews 
  ALTER COLUMN rating TYPE numeric(3,1),
  ALTER COLUMN atmosphere_rating TYPE numeric(3,1),
  ALTER COLUMN taste_rating TYPE numeric(3,1),
  ALTER COLUMN price_rating TYPE numeric(3,1);

-- Töröljük a meglévő függvényeket
DROP FUNCTION IF EXISTS public.check_table_exists(text);
DROP FUNCTION IF EXISTS public.get_table_columns(text);
DROP FUNCTION IF EXISTS public.get_rls_status(text);

-- Helper functions for checking database structure
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'exists', EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable
      )
    )
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = $1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rls_status(table_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'rls_enabled', (
      SELECT relrowsecurity
      FROM pg_class
      WHERE relname = $1
    ),
    'policies', (
      SELECT json_agg(
        json_build_object(
          'policy_name', policyname,
          'permissive', permissive,
          'roles', roles,
          'cmd', cmd,
          'qual', qual,
          'with_check', with_check
        )
      )
      FROM pg_policies
      WHERE tablename = $1
    )
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.check_table_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rls_status(text) TO authenticated; 