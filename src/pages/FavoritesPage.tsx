import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, HeartOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import RestaurantCard from '../components/RestaurantCard';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurants, reviews, toggleFavorite, isFavorite } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Csak a betöltést állítjuk be, a kedvenceket már az AppContext kezeli
    setLoading(false);
  }, []);

  const favoriteRestaurants = restaurants.filter(restaurant => 
    isFavorite(restaurant.id)
  );

  const handleViewRestaurant = (id: string) => {
    navigate(`/restaurant/${id}`);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, restaurantId: string) => {
    e.stopPropagation();
    await toggleFavorite(restaurantId);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-6"
    >
      <h1 className="text-2xl font-bold mb-6">Kedvencek</h1>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : favoriteRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="relative">
              <button
                onClick={(e) => handleToggleFavorite(e, restaurant.id)}
                className="absolute top-3 right-3 z-10 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Eltávolítás a kedvencekből"
              >
                <Heart className="h-5 w-5 text-red-500 fill-current" />
              </button>
              <RestaurantCard
                restaurant={restaurant}
                reviews={reviews.filter((r) => r.restaurantId === restaurant.id)}
                onClick={() => handleViewRestaurant(restaurant.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <HeartOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Még nincsenek kedvenc éttermeid.
          </p>
          <button
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            onClick={() => navigate('/')}
          >
            Éttermek böngészése
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default FavoritesPage;
