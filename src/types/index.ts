export interface Restaurant {
  id: string;
  name: string;
  address: string;
  priceTier: 1 | 2 | 3;
  createdAt: string;
  userId?: string;
  dishes?: string[];
  photoUrl?: string;
}

export interface Review {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  average_rating: number;
  atmosphere_rating?: number;
  taste_rating?: number;
  price_rating?: number;
  message?: string;
  photos?: string[];
  dishes?: string[];
  created_at: string;
  updated_at: string;
  dish_prices?: DishPrice[];
}

export interface DishPrice {
  dish: string;
  price: number;
}

export type PriceTier = 1 | 2 | 3;