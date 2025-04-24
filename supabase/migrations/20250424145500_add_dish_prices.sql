-- Add dish_prices column to reviews table
ALTER TABLE reviews ADD COLUMN dish_prices jsonb DEFAULT '[]'::jsonb;

-- Update RLS policies for the new column
CREATE POLICY "Users can update dish_prices in their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
