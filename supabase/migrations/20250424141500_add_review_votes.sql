-- Create a table for review votes
CREATE TABLE IF NOT EXISTS review_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  review_id uuid NOT NULL,
  vote_type smallint NOT NULL, -- 1 for upvote, -1 for downvote
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add a unique constraint to prevent duplicate votes
  UNIQUE(user_id, review_id)
);

-- Enable RLS
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for review_votes
CREATE POLICY "Users can view all review votes"
  ON review_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own votes"
  ON review_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON review_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON review_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create functions to get vote counts
CREATE OR REPLACE FUNCTION get_review_upvotes(review_uuid uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM review_votes
  WHERE review_id = review_uuid AND vote_type = 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_review_downvotes(review_uuid uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM review_votes
  WHERE review_id = review_uuid AND vote_type = -1;
$$ LANGUAGE SQL STABLE;

-- Add user_id column to reviews table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reviews' AND column_name = 'user_id') THEN
    ALTER TABLE reviews ADD COLUMN user_id uuid REFERENCES auth.users;
  END IF;
END $$;
