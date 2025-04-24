-- ### Extensions ###
-- Enable pgcrypto for gen_random_uuid() if not already enabled (usually is by default)
-- create extension if not exists pgcrypto;

-- ### Tables ###

-- Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null, -- Kept for potential denormalization, but auth.users.email is the source of truth
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
  -- constraint email_unique unique (email) -- Consider if needed, auth.users should handle uniqueness
);
comment on table public.profiles is 'User profile information, extending auth.users.';

-- Restaurants table
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null not null, -- Who originally added it
  name text not null check (char_length(name) > 0),
  address text not null check (char_length(address) > 0),
  price_tier smallint not null check (price_tier between 1 and 5), -- Using smallint, assuming 1-5 scale
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null -- Add updated_at
);
comment on table public.restaurants is 'Details about each restaurant or pub.';
create index if not exists idx_restaurants_user_id on public.restaurants(user_id);

-- Reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null, -- Cascade delete if user is deleted
  rating smallint not null check (rating between 1 and 5),
  message text check (char_length(message) <= 1000), -- Optional message length limit
  dishes text[] default '{}' not null, -- Array of dish names/tags mentioned
  photos text[] default '{}' not null, -- Array of photo URLs/identifiers
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null -- Add updated_at
  -- constraint user_restaurant_review_unique unique (user_id, restaurant_id) -- Optional: Allow only one review per user per restaurant?
);
comment on table public.reviews is 'User reviews for restaurants.';
create index if not exists idx_reviews_restaurant_id on public.reviews(restaurant_id);
create index if not exists idx_reviews_user_id on public.reviews(user_id);

-- Favorites table (Many-to-Many between users and restaurants)
create table if not exists public.favorites (
  user_id uuid references auth.users on delete cascade not null,
  restaurant_id uuid references public.restaurants on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, restaurant_id) -- Composite primary key ensures uniqueness
);
comment on table public.favorites is 'Tracks which users favorited which restaurants.';

-- Review Votes table (Many-to-Many between users and reviews)
create table if not exists public.review_votes (
  user_id uuid references auth.users on delete cascade not null,
  review_id uuid references public.reviews on delete cascade not null,
  vote_type smallint not null check (vote_type in (-1, 1)), -- -1 for downvote, 1 for upvote
  created_at timestamptz default now() not null,
  primary key (user_id, review_id) -- Composite primary key prevents multiple votes by the same user
);
comment on table public.review_votes is 'Tracks user upvotes/downvotes on reviews.';


-- ### Row Level Security (RLS) ###

-- Enable RLS for all tables
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.review_votes enable row level security;

-- Profiles Policies
create policy "Allow authenticated read access to own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Allow user to update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- No insert/delete policies needed as handle_new_user trigger handles insert

-- Restaurants Policies
create policy "Allow authenticated read access to all restaurants" on public.restaurants
  for select using (true);
create policy "Allow user to insert own restaurants" on public.restaurants
  for insert with check (auth.uid() = user_id);
create policy "Allow user to update own restaurants" on public.restaurants
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Allow user to delete own restaurants" on public.restaurants
  for delete using (auth.uid() = user_id);

-- Reviews Policies
create policy "Allow authenticated read access to all reviews" on public.reviews
  for select using (true);
create policy "Allow user to insert own reviews" on public.reviews
  for insert with check (auth.uid() = user_id);
create policy "Allow user to update own reviews" on public.reviews
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Allow user to delete own reviews" on public.reviews
  for delete using (auth.uid() = user_id);

-- Favorites Policies
create policy "Allow authenticated read access to own favorites" on public.favorites
  for select using (auth.uid() = user_id);
create policy "Allow user to insert/delete own favorites" on public.favorites
  -- Using allows insert+delete with the same condition
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  -- Note: No update policy usually needed for a simple join table like favorites.

-- Review Votes Policies
create policy "Allow authenticated read access to all votes (for vote counts)" on public.review_votes
  for select using (true); -- Needed to count votes, could be restricted if needed
create policy "Allow user to insert/update/delete own votes" on public.review_votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  -- Update is included here in case user wants to change their vote from up to down or vice versa.


-- ### Triggers and Functions ###

-- Function to create a profile entry when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public -- Important for security definer
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name', -- Example: Get from metadata if provided at signup
    new.raw_user_meta_data ->> 'avatar_url' -- Example: Get from metadata
  );
  return new;
end;
$$;

-- Trigger to call handle_new_user on new auth.users entries
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to automatically update 'updated_at' columns
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
   new.updated_at = now();
   return new;
end;
$$;

-- Triggers to update 'updated_at' on relevant tables
create or replace trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create or replace trigger update_restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.update_updated_at_column();

create or replace trigger update_reviews_updated_at
  before update on public.reviews
  for each row execute function public.update_updated_at_column();

-- Note: No updated_at triggers needed for favorites or review_votes unless modification time is critical.


-- ### Initial Data (Optional) ###
-- You could add some initial seed data here if needed, for example:
-- insert into public.restaurants (user_id, name, address, price_tier) values
--  ('some-user-uuid', 'Example Pub', '123 Fake St', 3);