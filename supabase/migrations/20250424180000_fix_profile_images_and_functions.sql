-- Drop existing profile_images table if it exists
DROP TABLE IF EXISTS public.profile_images;

-- Recreate profile_images table with correct structure
CREATE TABLE IF NOT EXISTS public.profile_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  image_data text NOT NULL, -- Base64 encoded image data
  storage_path text,        -- Optional storage path if using Storage
  mime_type text NOT NULL,  -- MIME type of the image
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.profile_images IS 'Stores profile image information for users.';
CREATE INDEX IF NOT EXISTS idx_profile_images_user_id ON public.profile_images(user_id);

-- Enable RLS
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated read access to own profile images" ON public.profile_images
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to insert profile images" ON public.profile_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Allow users to update own profile images" ON public.profile_images
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own profile images" ON public.profile_images
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_profile_images_updated_at
  BEFORE UPDATE ON public.profile_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get profile image
CREATE OR REPLACE FUNCTION public.get_profile_image(p_user_id uuid)
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
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1
  INTO image_record;
  
  RETURN COALESCE(image_record, '{}'::jsonb);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profile_image TO authenticated;

-- Function to handle new user creation (update existing function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.raw_user_meta_data->>'full_name',
      updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 