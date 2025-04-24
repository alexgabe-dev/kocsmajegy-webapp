-- Add new rating columns to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS atmosphere_rating INTEGER CHECK (atmosphere_rating >= 1 AND atmosphere_rating <= 5),
ADD COLUMN IF NOT EXISTS taste_rating INTEGER CHECK (taste_rating >= 1 AND taste_rating <= 5),
ADD COLUMN IF NOT EXISTS price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5);

-- Add comment to explain the columns
COMMENT ON COLUMN public.reviews.atmosphere_rating IS 'Értékelés a hangulatra (1-5 csillag)';
COMMENT ON COLUMN public.reviews.taste_rating IS 'Értékelés az ízekre (1-5 csillag)';
COMMENT ON COLUMN public.reviews.price_rating IS 'Értékelés az árakra (1-5 csillag)';

-- Create a function to calculate the average rating
CREATE OR REPLACE FUNCTION calculate_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate the average of the three ratings if at least one is provided
  IF NEW.atmosphere_rating IS NOT NULL OR NEW.taste_rating IS NOT NULL OR NEW.price_rating IS NOT NULL THEN
    NEW.rating := (
      COALESCE(NEW.atmosphere_rating, 0) + 
      COALESCE(NEW.taste_rating, 0) + 
      COALESCE(NEW.price_rating, 0)
    ) / (
      CASE 
        WHEN NEW.atmosphere_rating IS NOT NULL THEN 1 ELSE 0 END +
      CASE 
        WHEN NEW.taste_rating IS NOT NULL THEN 1 ELSE 0 END +
      CASE 
        WHEN NEW.price_rating IS NOT NULL THEN 1 ELSE 0 END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically calculate the average rating
DROP TRIGGER IF EXISTS calculate_average_rating_trigger ON public.reviews;
CREATE TRIGGER calculate_average_rating_trigger
BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION calculate_average_rating(); 