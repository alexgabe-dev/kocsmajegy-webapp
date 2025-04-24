-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_profile_image(uuid);

-- Recreate the function with the correct parameter name
CREATE OR REPLACE FUNCTION public.get_profile_image(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  image_record jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'user_id', user_id,
    'image_data', image_data,
    'storage_path', storage_path,
    'mime_type', mime_type,
    'created_at', created_at,
    'updated_at', updated_at
  )
  FROM profile_images
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1
  INTO image_record;
  
  -- Return empty object if no image found
  IF image_record IS NULL THEN
    RETURN jsonb_build_object(
      'id', NULL,
      'user_id', user_uuid,
      'image_data', NULL,
      'storage_path', NULL,
      'mime_type', NULL,
      'created_at', NULL,
      'updated_at', NULL
    );
  END IF;
  
  RETURN image_record;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profile_image(uuid) TO authenticated; 