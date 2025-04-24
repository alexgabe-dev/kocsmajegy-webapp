-- Add average_rating column to reviews table if it doesn't exist
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,1) DEFAULT 0.0;

-- Create function to update average rating
CREATE OR REPLACE FUNCTION public.update_review_average_rating(p_review_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_upvotes INTEGER;
    v_downvotes INTEGER;
    v_total_votes INTEGER;
    v_average_rating DECIMAL(3,1);
BEGIN
    -- Get vote counts
    SELECT COUNT(*) INTO v_upvotes
    FROM public.votes
    WHERE review_id = p_review_id AND vote_type = 'up';

    SELECT COUNT(*) INTO v_downvotes
    FROM public.votes
    WHERE review_id = p_review_id AND vote_type = 'down';

    -- Calculate total votes and average
    v_total_votes := v_upvotes + v_downvotes;
    
    IF v_total_votes > 0 THEN
        v_average_rating := (v_upvotes::DECIMAL / v_total_votes::DECIMAL) * 5.0;
    ELSE
        v_average_rating := 0.0;
    END IF;

    -- Update the review's average rating
    UPDATE public.reviews
    SET average_rating = v_average_rating
    WHERE id = p_review_id;
END;
$$;

-- Modify vote_for_review function to update average rating
CREATE OR REPLACE FUNCTION public.vote_for_review(
    p_review_id UUID,
    p_vote_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_vote RECORD;
BEGIN
    -- Check if user has already voted
    SELECT * INTO existing_vote
    FROM public.votes
    WHERE review_id = p_review_id
    AND user_id = auth.uid();

    IF existing_vote IS NULL THEN
        -- Insert new vote
        INSERT INTO public.votes (review_id, user_id, vote_type)
        VALUES (p_review_id, auth.uid(), p_vote_type);
    ELSE
        -- Update existing vote
        UPDATE public.votes
        SET vote_type = p_vote_type
        WHERE review_id = p_review_id
        AND user_id = auth.uid();
    END IF;

    -- Update average rating
    PERFORM public.update_review_average_rating(p_review_id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_review_average_rating TO authenticated;
GRANT EXECUTE ON FUNCTION public.vote_for_review TO authenticated; 