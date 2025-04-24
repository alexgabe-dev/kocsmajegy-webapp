export interface Restaurant {
  id: string;
  name: string;
  address: string;
  priceTier: 1 | 2 | 3;
  createdAt: string;
  dishes?: string[];
  photoUrl?: string;
}

export interface Review {
  id: string;
  restaurantId: string;
  rating: number;
  message: string;
  dishes: string[];
  photos: string[];
  createdAt: string;
  user_id?: string;
  dish_prices?: DishPrice[];
  upvotes?: number;
  downvotes?: number;
  user_vote?: number;
}

export interface DishPrice {
  dish: string;
  price: number;
}

export type PriceTier = 1 | 2 | 3;