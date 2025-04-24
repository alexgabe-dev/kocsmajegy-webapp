import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Restaurant, Review } from '../types';
import { supabase } from '../lib/supabase';
import { insertRestaurantDirect } from '../lib/direct-sql';
import { decode } from 'base64-arraybuffer';

// Import Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface AppContextType {
  restaurants: Restaurant[];
  reviews: Review[];
  favoriteIds: string[];
  addRestaurant: (restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'userId'>) => Promise<string | null>;
  updateRestaurant: (restaurant: Restaurant) => Promise<void>;
  deleteRestaurant: (id: string) => Promise<void>;
  addReview: (review: Omit<Review, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateReview: (review: Review) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  getRestaurantReviews: (restaurantId: string) => Review[];
  toggleFavorite: (restaurantId: string) => Promise<void>;
  isFavorite: (restaurantId: string) => boolean;
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = useCallback(async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching restaurants:', error);
      return [];
    }
    return data?.map(dbRestaurant => ({
        ...dbRestaurant,
        userId: dbRestaurant.user_id
    })) || [];
  }, []);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    console.log('Raw reviews data:', data); // Debug log

    const mappedReviews = data?.map((dbReview): Review => {
      const review: Review = {
        id: dbReview.id,
        restaurant_id: dbReview.restaurant_id,
        user_id: dbReview.user_id,
        rating: dbReview.rating,
        average_rating: dbReview.average_rating,
        atmosphere_rating: dbReview.atmosphere_rating ?? undefined,
        taste_rating: dbReview.taste_rating ?? undefined,
        price_rating: dbReview.price_rating ?? undefined,
        message: dbReview.message ?? undefined,
        dishes: dbReview.dishes || [],
        photos: dbReview.photos || [],
        created_at: dbReview.created_at,
        updated_at: dbReview.updated_at,
        dish_prices: dbReview.dish_prices || [],
      };
      return review;
    }) || [];

    return mappedReviews;
  }, []);

  const fetchFavorites = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('restaurant_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching favorites:', error);
        return;
      }

      const ids = data?.map(fav => fav.restaurant_id) || [];
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Error in fetchFavorites:', error);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession(); // Get session
      if (session) { // Check if session exists
        const [fetchedRestaurants, fetchedReviews] = await Promise.all([
          fetchRestaurants(),
          fetchReviews(),
          fetchFavorites() // Fetch favorites concurrently
        ]);
        setRestaurants(fetchedRestaurants);
        setReviews(fetchedReviews);
      } else {
        // Handle case where user is not logged in
        // Maybe clear state or fetch public data
        setRestaurants([]);
        setReviews([]);
        setFavoriteIds([]);
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
      // Handle error appropriately, maybe set an error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession(); // Get session
        if (session) { // Check if session exists
          const [fetchedRestaurants, fetchedReviews] = await Promise.all([
            fetchRestaurants(),
            fetchReviews(),
            fetchFavorites() // Fetch favorites concurrently
          ]);
          setRestaurants(fetchedRestaurants);
          setReviews(fetchedReviews);
        } else {
          // Handle case where user is not logged in
          // Maybe clear state or fetch public data
          setRestaurants([]);
          setReviews([]);
          setFavoriteIds([]);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
        // Handle error appropriately, maybe set an error state
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, _session) => { // Mark _session as unused too if only loadData is needed
      console.log('Auth state changed:', _event);
      loadData(); // Reload data on login/logout
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchRestaurants, fetchReviews, fetchFavorites]);

  const toggleFavorite = async (restaurantId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not logged in to toggle favorite");
        return;
      }

      const isFav = favoriteIds.includes(restaurantId);

      if (isFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .match({ user_id: user.id, restaurant_id: restaurantId });

        if (error) {
          console.error('Error removing from favorites:', error);
          return;
        }
        setFavoriteIds(prev => prev.filter(id => id !== restaurantId));
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, restaurant_id: restaurantId });

        if (error) {
          console.error('Error adding to favorites:', error);
          if (error.code === '23505') {
            console.warn('Favorite already exists, syncing state.');
            if (!favoriteIds.includes(restaurantId)) {
              setFavoriteIds(prev => [...prev, restaurantId]);
            }
          } else {
            return;
          }
        }
        if (!error || error.code === '23505') {
          if (!favoriteIds.includes(restaurantId)) {
            setFavoriteIds(prev => [...prev, restaurantId]);
          }
        }
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
    }
  };

  const isFavorite = (restaurantId: string) => {
    return favoriteIds.includes(restaurantId);
  };

  const addRestaurant = async (restaurantData: Omit<Restaurant, 'id' | 'createdAt' | 'userId'>): Promise<string | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("User not logged in to add restaurant");
          alert('Étterem hozzáadásához be kell jelentkezned.');
          return null;
        }

        // Prepare data for Supabase (add user_id)
        const dataToInsert = {
          name: restaurantData.name,
          address: restaurantData.address,
          price_tier: Number(restaurantData.priceTier),
          user_id: user.id,
        };

        console.log('Inserting restaurant data:', dataToInsert);

        // Try using the direct SQL function
        const result = await insertRestaurantDirect(
          dataToInsert.name,
          dataToInsert.address,
          dataToInsert.price_tier,
          dataToInsert.user_id
        );

        if (!result.success) {
          console.error('Error adding restaurant using direct SQL:', result.error);
          alert(`Hiba történt az étterem mentésekor: ${result.error && typeof result.error === 'object' && 'message' in result.error ? result.error.message : 'Unknown error'}`);
          return null;
        }

        // If insert was successful, fetch the latest restaurants to get the new one
        const { data: restaurants, error: fetchError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', result.data)
          .single();

        if (fetchError) {
          console.error('Error fetching newly added restaurant:', fetchError);
          return null;
        }

        if (restaurants) {
          // Map the database response back to the Restaurant type
          const mappedRestaurant: Restaurant = {
            id: restaurants.id,
            name: restaurants.name,
            address: restaurants.address,
            priceTier: restaurants.price_tier,
            createdAt: restaurants.created_at,
            userId: restaurants.user_id,
          };
          setRestaurants(prev => [mappedRestaurant, ...prev]); // Add to the beginning of the list
          console.log('Restaurant added successfully and state updated');
          return restaurants.id;
        }
        
        return null;
    } catch (error) {
        console.error('Error in addRestaurant:', error);
        alert('Hiba történt az étterem mentésekor. Kérjük, próbáld újra később.');
        return null;
    }
  };

  const updateRestaurant = async (restaurant: Restaurant): Promise<void> => {
    console.log("updateRestaurant needs Supabase implementation");
    alert("Restaurant updating not implemented with Supabase yet.");
  };

  const deleteRestaurant = async (id: string): Promise<void> => {
    console.log("deleteRestaurant needs Supabase implementation");
    alert("Restaurant deleting not implemented with Supabase yet.");
  };

  const addReview = async (reviewData: Omit<Review, 'id' | 'created_at' | 'user_id'>): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not logged in to add review");
        alert('A vélemény hozzáadásához be kell jelentkezned.');
        return;
      }
      
      // Prepare data for Supabase
      const dataToInsert = {
        ...reviewData,
        user_id: user.id,
        message: reviewData.message || null,
        dishes: reviewData.dishes || [],
        photos: reviewData.photos || [],
        atmosphere_rating: reviewData.atmosphere_rating || null,
        taste_rating: reviewData.taste_rating || null,
        price_rating: reviewData.price_rating || null
      };

      // Insert into 'reviews' table and select the inserted row with all fields
      const { data, error } = await supabase
        .from('reviews')
        .insert(dataToInsert)
        .select(`
          id,
          restaurant_id,
          user_id,
          rating,
          average_rating,
          atmosphere_rating,
          taste_rating,
          price_rating,
          message,
          dishes,
          photos,
          created_at,
          updated_at,
          dish_prices
        `)
        .single();

      if (error) {
        console.error('Error adding review:', error);
        alert(`Hiba történt a vélemény mentésekor: ${error.message}`);
        return;
      }

      // Update local state with the newly added review from the database response
      if (data) {
        console.log('Received review data:', data); // Debug log
        
        // Map the database response back to the Review type
        const newReview: Review = {
          id: data.id,
          restaurant_id: data.restaurant_id,
          user_id: data.user_id,
          rating: data.rating,
          average_rating: data.average_rating,
          atmosphere_rating: data.atmosphere_rating,
          taste_rating: data.taste_rating,
          price_rating: data.price_rating,
          message: data.message,
          dishes: data.dishes || [],
          photos: data.photos || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
          dish_prices: data.dish_prices
        };
        
        console.log('Mapped review data:', newReview); // Debug log
        setReviews(prev => [newReview, ...prev]);
        console.log('Review added successfully and state updated');
      } else {
        console.warn("Review added but no data returned from Supabase?");
      }

    } catch (error) {
      console.error('Unexpected error in addReview:', error);
      alert('Váratlan hiba történt a vélemény hozzáadásakor.');
    }
  };

  const updateReview = async (review: Review): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not logged in to update review");
        alert('A vélemény módosításához be kell jelentkezned.');
        return;
      }

      // Calculate average rating from valid ratings
      const ratings = [
        review.atmosphere_rating || 0,
        review.taste_rating || 0,
        review.price_rating || 0
      ].filter(r => r > 0);
      
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : review.rating;

      // Prepare data for Supabase update (snake_case keys, null for empty optionals)
      const dataToUpdate = {
        rating: review.rating,
        average_rating: averageRating,
        atmosphere_rating: review.atmosphere_rating ?? null,
        taste_rating: review.taste_rating ?? null,
        price_rating: review.price_rating ?? null,
        message: review.message ?? null,
        dishes: review.dishes || [],
        photos: review.photos || [],
        updated_at: new Date().toISOString()
      };

      // Update the review in Supabase
      const { error } = await supabase
        .from('reviews')
        .update(dataToUpdate)
        .eq('id', review.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating review:', error);
        alert(`Hiba történt a vélemény módosításakor: ${error.message}`);
        return;
      }

      // Update local state, ensuring consistency with Review type
      setReviews(prev => prev.map(r =>
        r.id === review.id
          ? {
              ...r,
              rating: dataToUpdate.rating,
              average_rating: averageRating,
              atmosphere_rating: dataToUpdate.atmosphere_rating ?? undefined,
              taste_rating: dataToUpdate.taste_rating ?? undefined,
              price_rating: dataToUpdate.price_rating ?? undefined,
              message: dataToUpdate.message ?? undefined,
              dishes: dataToUpdate.dishes,
              photos: dataToUpdate.photos,
              updated_at: dataToUpdate.updated_at,
            }
          : r
      ));
      
      console.log('Review updated successfully and state updated');

    } catch (error) {
      console.error('Unexpected error in updateReview:', error);
      alert('Váratlan hiba történt a vélemény módosításakor.');
    }
  };

  const deleteReview = async (id: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not logged in to delete review");
        alert('A vélemény törléséhez be kell jelentkezned.');
        return;
      }

      // Delete the review from Supabase
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own reviews

      if (error) {
        console.error('Error deleting review:', error);
        alert(`Hiba történt a vélemény törlésekor: ${error.message}`);
        return;
      }

      // Update local state by removing the deleted review
      setReviews(prev => prev.filter(review => review.id !== id));
      console.log('Review deleted successfully and state updated');

    } catch (error) {
      console.error('Unexpected error in deleteReview:', error);
      alert('Váratlan hiba történt a vélemény törlésekor.');
    }
  };

  const getRestaurantReviews = (restaurantId: string): Review[] => {
    return reviews.filter((review) => review.restaurant_id === restaurantId);
  };

  return (
    <AppContext.Provider
      value={{
        restaurants,
        reviews,
        favoriteIds,
        addRestaurant,
        updateRestaurant,
        deleteRestaurant,
        addReview,
        updateReview,
        deleteReview,
        getRestaurantReviews,
        toggleFavorite,
        isFavorite,
        isAddModalOpen,
        openAddModal: () => setIsAddModalOpen(true),
        closeAddModal: () => setIsAddModalOpen(false),
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAppContext = useApp;