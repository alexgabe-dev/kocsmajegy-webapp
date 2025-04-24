import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Restaurant, Review } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  restaurants: Restaurant[];
  reviews: Review[];
  favoriteIds: string[];
  addRestaurant: (restaurant: Omit<Restaurant, 'id' | 'createdAt' | 'userId'>) => Promise<string | null>;
  updateRestaurant: (restaurant: Restaurant) => Promise<void>;
  deleteRestaurant: (id: string) => Promise<void>;
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
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
    return data?.map(dbReview => ({
        ...dbReview,
        restaurantId: dbReview.restaurant_id,
        userId: dbReview.user_id
    })) || [];
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
        // Ensure required fields like name, address, price_tier are present
        const dataToInsert = {
          ...restaurantData,
          user_id: user.id,
          // Ensure price_tier is a number if it comes from a form as string
          price_tier: Number(restaurantData.priceTier),
        };
        // Remove client-side camelCase fields if they exist and aren't in the DB table
        delete (dataToInsert as any).priceTier;


        // Insert into 'restaurants' table and select the inserted row
        const { data, error } = await supabase
          .from('restaurants')
          .insert(dataToInsert)
          .select()
          .single(); // Use single() if you expect exactly one row back

        if (error) {
          console.error('Error adding restaurant:', error);
          alert(`Hiba történt az étterem mentésekor: ${error.message}`);
          return null;
        }

        // Update local state with the newly added restaurant from the database response
        if (data) {
            // Map the database response back to the Restaurant type
            const newRestaurant: Restaurant = {
                ...data,
                userId: data.user_id, // Map back to camelCase
                priceTier: data.price_tier // Map back to camelCase
            };
            setRestaurants(prev => [newRestaurant, ...prev]); // Add to the beginning of the list
            console.log('Restaurant added successfully and state updated');
            // Close modal after successful addition using the state setter
            if (isAddModalOpen) {
                setIsAddModalOpen(false); // Use state setter directly
            }
            return newRestaurant.id; // Return the new ID
        } else {
            console.warn("Restaurant added but no data returned from Supabase?");
             // Optionally refetch restaurants as a fallback
             // await fetchRestaurants().then(setRestaurants);
            return null;
        }

    } catch (error) {
        console.error('Unexpected error in addRestaurant:', error);
        alert('Váratlan hiba történt az étterem hozzáadásakor.');
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

  const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'userId'>): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not logged in to add review");
        // Optionally: Trigger login flow or show a message
        alert('A vélemény hozzáadásához be kell jelentkezned.');
        return;
      }

      // Prepare data for Supabase (map restaurantId to restaurant_id, add user_id)
      // Ensure required fields like rating are present in reviewData
      const dataToInsert = {
        ...reviewData,
        restaurant_id: reviewData.restaurantId,
        user_id: user.id,
        // Explicitly handle optional fields like message, dishes, photos if needed
        message: reviewData.message || null, // Use null if empty string is not desired
        dishes: reviewData.dishes || [], // Default to empty array if undefined/null
        photos: reviewData.photos || [], // Default to empty array if undefined/null
      };
      // Remove the client-side restaurantId before inserting
      delete (dataToInsert as any).restaurantId;

      // Insert into 'reviews' table and select the inserted row
      const { data, error } = await supabase
        .from('reviews')
        .insert(dataToInsert)
        .select()
        .single(); // Use single() if you expect exactly one row back

      if (error) {
        console.error('Error adding review:', error);
        alert(`Hiba történt a vélemény mentésekor: ${error.message}`);
        return;
      }

      // Update local state with the newly added review from the database response
      if (data) {
        // Map the database response back to the Review type
        const newReview: Review = {
            ...data,
            restaurantId: data.restaurant_id, // Map back to camelCase
            userId: data.user_id // Map back to camelCase
        };
        setReviews(prev => [newReview, ...prev]); // Add to the beginning of the list for immediate visibility
        console.log('Review added successfully and state updated');
      } else {
          console.warn("Review added but no data returned from Supabase?");
          // Optionally refetch reviews as a fallback
          // await fetchReviews().then(setReviews);
      }

    } catch (error) {
        console.error('Unexpected error in addReview:', error);
        alert('Váratlan hiba történt a vélemény hozzáadásakor.');
    }
  };

  const updateReview = async (review: Review): Promise<void> => {
    console.log("updateReview needs Supabase implementation");
    alert("Review updating not implemented with Supabase yet.");
  };

  const deleteReview = async (id: string): Promise<void> => {
    console.log("deleteReview needs Supabase implementation");
    alert("Review deleting not implemented with Supabase yet.");
  };

  const getRestaurantReviews = (restaurantId: string) => {
    return reviews.filter((review) => review.restaurantId === restaurantId);
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