-- Create a new table for profile images
CREATE TABLE IF NOT EXISTS profile_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  image_data text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profile_images ENABLE ROW LEVEL SECURITY;

-- Create policies for profile_images
CREATE POLICY "Users can view their own profile images"
  ON profile_images
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile images"
  ON profile_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile images"
  ON profile_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile images"
  ON profile_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a function to get the latest profile image for a user
CREATE OR REPLACE FUNCTION get_profile_image(user_uuid uuid)
RETURNS text AS $$
  SELECT image_data
  FROM profile_images
  WHERE user_id = user_uuid
  ORDER BY updated_at DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;
