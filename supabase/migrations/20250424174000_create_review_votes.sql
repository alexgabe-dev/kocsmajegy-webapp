-- Create review_votes table
CREATE TABLE IF NOT EXISTS public.review_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all review votes"
    ON public.review_votes
    FOR SELECT
    USING (true);

CREATE POLICY "Users can vote on reviews"
    ON public.review_votes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
    ON public.review_votes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
    ON public.review_votes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to get vote counts
CREATE OR REPLACE FUNCTION get_review_votes(review_uuid UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    upvotes INTEGER;
    downvotes INTEGER;
    user_vote INTEGER;
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
        'upvotes', upvotes,
        'downvotes', downvotes,
        'user_vote', user_vote
    );
END;
$$;

-- Grant permissions
GRANT ALL ON public.review_votes TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_review_votes TO authenticated; 