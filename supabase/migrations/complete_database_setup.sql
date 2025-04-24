-- Complete Database Setup Script

-- ### Extensions ###
-- Enable pgcrypto for gen_random_uuid() if not already enabled (usually is by default)
-- create extension if not exists pgcrypto;

-- ### Tables ###

-- Profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'User profile information, extending auth.users.';

-- Profile Images table
CREATE TABLE IF NOT EXISTS public.profile_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.profile_images IS 'Stores profile image information for users.';
CREATE INDEX IF NOT EXISTS idx_profile_images_user_id ON public.profile_images(user_id);

-- Restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL NOT NULL,
  name text NOT NULL CHECK (char_length(name) > 0),
  address text NOT NULL CHECK (char_length(address) > 0),
  price_tier smallint NOT NULL CHECK (price_tier BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.restaurants IS 'Details about each restaurant or pub.';
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants(user_id);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES public.restaurants ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message text CHECK (char_length(message) <= 1000),
  dishes text[] DEFAULT '{}' NOT NULL,
  photos text[] DEFAULT '{}' NOT NULL,
  dish_prices jsonb DEFAULT '[]'::jsonb,
  upvotes integer DEFAULT 0,
  downvotes integer DEFAULT 0,
  user_votes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.reviews IS 'User reviews for restaurants.';
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON public.reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Favorites table (Many-to-Many between users and restaurants)
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  restaurant_id uuid REFERENCES public.restaurants ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, restaurant_id)
);
COMMENT ON TABLE public.favorites IS 'Tracks which users favorited which restaurants.';

-- Review Votes table (Many-to-Many between users and reviews)
CREATE TABLE IF NOT EXISTS public.review_votes (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  review_id uuid REFERENCES public.reviews ON DELETE CASCADE NOT NULL,
  vote_type smallint NOT NULL CHECK (vote_type IN (-1, 1)),
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, review_id)
);
COMMENT ON TABLE public.review_votes IS 'Tracks user upvotes/downvotes on reviews.';

-- ### Row Level Security (RLS) ###

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Allow authenticated read access to own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow user to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Profile Images Policies
CREATE POLICY "Allow authenticated read access to own profile images" ON public.profile_images
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow authenticated users to insert profile images" ON public.profile_images
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Allow users to update own profile images" ON public.profile_images
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own profile images" ON public.profile_images
  FOR DELETE USING (auth.uid() = user_id);

-- Restaurants Policies
CREATE POLICY "Allow authenticated read access to all restaurants" ON public.restaurants
  FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow users to update own restaurants" ON public.restaurants
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own restaurants" ON public.restaurants
  FOR DELETE USING (auth.uid() = user_id);

-- Reviews Policies
CREATE POLICY "Allow authenticated read access to all reviews" ON public.reviews
  FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow users to update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Favorites Policies
CREATE POLICY "Allow authenticated read access to all favorites" ON public.favorites
  FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow users to delete own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Review Votes Policies
CREATE POLICY "Allow authenticated read access to all review votes" ON public.review_votes
  FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert review votes" ON public.review_votes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow users to update own review votes" ON public.review_votes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to delete own review votes" ON public.review_votes
  FOR DELETE USING (auth.uid() = user_id);

-- ### Functions ###

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update 'updated_at' columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
   new.updated_at = now();
   RETURN new;
END;
$$;

-- Function to insert a restaurant and return its ID
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

-- Function to update review votes
CREATE OR REPLACE FUNCTION update_review_vote(
  p_review_id uuid,
  p_user_id uuid,
  p_vote_type integer
)
RETURNS void AS $$
DECLARE
  current_vote integer;
  votes jsonb;
BEGIN
  -- Get the current review
  SELECT user_votes INTO votes FROM reviews WHERE id = p_review_id;
  
  -- Check if user has already voted
  IF votes ? p_user_id::text THEN
    current_vote := (votes ->> p_user_id::text)::integer;
  ELSE
    current_vote := 0;
  END IF;
  
  -- If same vote type, remove the vote
  IF current_vote = p_vote_type THEN
    -- Remove vote from user_votes
    UPDATE reviews 
    SET user_votes = user_votes - p_user_id::text,
        upvotes = CASE 
                    WHEN p_vote_type = 1 THEN GREATEST(upvotes - 1, 0)
                    ELSE upvotes
                  END,
        downvotes = CASE 
                      WHEN p_vote_type = -1 THEN GREATEST(downvotes - 1, 0)
                      ELSE downvotes
                    END
    WHERE id = p_review_id;
  ELSE
    -- Add new vote
    IF p_vote_type = 1 THEN
      UPDATE reviews SET upvotes = upvotes + 1 WHERE id = p_review_id;
    ELSIF p_vote_type = -1 THEN
      UPDATE reviews SET downvotes = downvotes + 1 WHERE id = p_review_id;
    END IF;
    
    -- Update user_votes
    UPDATE reviews 
    SET user_votes = jsonb_set(
      CASE 
        WHEN user_votes ? p_user_id::text THEN user_votes 
        ELSE user_votes || jsonb_build_object(p_user_id::text, '0')
      END,
      ARRAY[p_user_id::text],
      to_jsonb(p_vote_type)
    )
    WHERE id = p_review_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user vote
CREATE OR REPLACE FUNCTION get_user_vote(
  p_review_id uuid,
  p_user_id uuid
)
RETURNS integer AS $$
DECLARE
  votes jsonb;
BEGIN
  SELECT user_votes INTO votes FROM reviews WHERE id = p_review_id;
  
  IF votes ? p_user_id::text THEN
    RETURN (votes ->> p_user_id::text)::integer;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- ### Triggers ###

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers to update 'updated_at' on relevant tables
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_profile_images_updated_at
  BEFORE UPDATE ON public.profile_images
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ### Permissions ###

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.insert_restaurant TO authenticated;
GRANT EXECUTE ON FUNCTION update_review_vote TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_vote TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rls_status TO authenticated; 