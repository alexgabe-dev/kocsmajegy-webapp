-- Drop existing table and related objects if they exist
DROP TABLE IF EXISTS public.review_votes CASCADE;
DROP FUNCTION IF EXISTS public.get_review_votes CASCADE;

-- Create review_votes table
CREATE TABLE public.review_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vote smallint NOT NULL CHECK (vote IN (-1, 1)),
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(review_id, user_id)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_review_votes_updated_at
    BEFORE UPDATE ON public.review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all review votes"
    ON public.review_votes FOR SELECT
    USING (true);

CREATE POLICY "Users can vote on reviews"
    ON public.review_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
    ON public.review_votes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
    ON public.review_votes FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to get vote counts
CREATE OR REPLACE FUNCTION public.get_review_votes(review_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    upvotes integer;
    downvotes integer;
    user_vote integer;
BEGIN
    -- Get upvotes
    SELECT COUNT(*) INTO upvotes
    FROM review_votes
    WHERE review_id = review_uuid AND vote = 1;

    -- Get downvotes
    SELECT COUNT(*) INTO downvotes
    FROM review_votes
    WHERE review_id = review_uuid AND vote = -1;

    -- Get user's vote if authenticated
    IF auth.uid() IS NOT NULL THEN
        SELECT vote INTO user_vote
        FROM review_votes
        WHERE review_id = review_uuid AND user_id = auth.uid();
    END IF;

    RETURN jsonb_build_object(
        'upvotes', COALESCE(upvotes, 0),
        'downvotes', COALESCE(downvotes, 0),
        'user_vote', user_vote
    );
END;
$$;

-- Grant permissions
GRANT ALL ON public.review_votes TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_votes TO authenticated;

-- Create indexes for better performance
CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes(user_id);
CREATE INDEX idx_review_votes_vote ON public.review_votes(vote);

-- Add comment
COMMENT ON TABLE public.review_votes IS 'Stores user votes on reviews'; 