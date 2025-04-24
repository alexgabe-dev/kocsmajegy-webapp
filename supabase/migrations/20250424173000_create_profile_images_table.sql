-- Create profile_images table
CREATE TABLE IF NOT EXISTS public.profile_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile images"
    ON public.profile_images
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile images"
    ON public.profile_images
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile images"
    ON public.profile_images
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile images"
    ON public.profile_images
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON public.profile_images TO authenticated; 