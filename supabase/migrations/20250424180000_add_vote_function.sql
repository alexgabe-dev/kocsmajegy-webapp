-- Create votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(review_id, user_id)
);

-- Enable RLS on votes table
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to vote" ON public.votes;

-- Create policy to allow authenticated users to vote
CREATE POLICY "Allow authenticated users to vote" ON public.votes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.vote_for_review(UUID, TEXT);

-- Create function to handle voting
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
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.vote_for_review TO authenticated; 