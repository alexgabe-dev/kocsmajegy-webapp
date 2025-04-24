import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import RestaurantCard from '../components/RestaurantCard';
import { Restaurant } from '../types';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurants, reviews, toggleFavorite, isFavorite } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    // Filter restaurants based on search term
    if (searchTerm.trim() === '') {
      setFilteredRestaurants(restaurants);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = restaurants.filter((restaurant: Restaurant) => 
        restaurant.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        restaurant.address.toLowerCase().includes(lowerCaseSearchTerm) ||
        restaurant.dishes?.some((dish: string) => dish.toLowerCase().includes(lowerCaseSearchTerm))
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchTerm, restaurants]);

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
      <h1 className="text-2xl font-bold mb-6">Keresés</h1>
      
      {/* Search input */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          placeholder="Keresés név, cím vagy étel alapján..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Results */}
      {filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant: Restaurant) => (
            <div key={restaurant.id} className="relative">
              <button
                onClick={(e) => handleToggleFavorite(e, restaurant.id)}
                className={`absolute top-3 right-3 z-10 bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                aria-label={isFavorite(restaurant.id) ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez"}
              >
                <Heart 
                  className={`h-5 w-5 ${isFavorite(restaurant.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`} 
                />
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
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {searchTerm.trim() !== '' ? 'Nincs találat a keresési feltételekre.' : 'Nincsenek éttermek az adatbázisban.'}
          </p>
          {searchTerm.trim() !== '' && (
            <button
              className="text-amber-500 hover:text-amber-600 font-medium"
              onClick={() => setSearchTerm('')}
            >
              Keresés törlése
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SearchPage;
