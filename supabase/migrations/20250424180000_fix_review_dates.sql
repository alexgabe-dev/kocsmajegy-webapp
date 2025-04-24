-- Update the reviews table to ensure consistent date formatting
ALTER TABLE public.reviews
ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE 'Europe/Budapest'),
ALTER COLUMN updated_at SET DEFAULT (now() AT TIME ZONE 'Europe/Budapest');

-- Create a trigger function to handle the timezone conversion
CREATE OR REPLACE FUNCTION handle_review_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the timezone to Budapest
  NEW.created_at = (NEW.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Budapest');
  NEW.updated_at = (NEW.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Budapest');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS set_review_dates ON public.reviews;
CREATE TRIGGER set_review_dates
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION handle_review_dates(); 