-- Add vote fields directly to the reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS upvotes integer DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS downvotes integer DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_votes jsonb DEFAULT '{}'::jsonb;

-- Create or replace function to update review votes
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
    -- Update vote counts based on previous vote
    IF current_vote = 1 THEN
      -- Remove upvote
      UPDATE reviews SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = p_review_id;
    ELSIF current_vote = -1 THEN
      -- Remove downvote
      UPDATE reviews SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = p_review_id;
    END IF;
    
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

-- Create or replace function to get user vote
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_review_vote TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_vote TO authenticated;
