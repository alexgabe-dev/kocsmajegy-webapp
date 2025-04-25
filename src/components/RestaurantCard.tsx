import React from 'react';
import { MapPin, Star, Image as ImageIcon } from 'lucide-react'; 
import { Restaurant, Review } from '../types';
import { motion } from 'framer-motion';

interface RestaurantCardProps {
  restaurant: Restaurant;
  reviews: Review[];
  onClick: () => void;
}

const formatDateAdded = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return `Hozzáadva ${date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Hozzáadva dátum ismeretlen'; 
  }
};

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  reviews,
  onClick,
}) => {
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;

  const getFirstPhoto = (): string | null => {
    for (const review of reviews) {
      if (review.photos && review.photos.length > 0) {
        return review.photos[0];
      }
    }
    return null;
  };

  const firstPhoto = getFirstPhoto();

  const displayPriceTier = (tier: number): string => {
    return '$'.repeat(tier);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      // Modern dark theme styling
      className="rounded-lg overflow-hidden cursor-pointer bg-zinc-800 shadow-lg flex flex-col h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-900/30 border border-zinc-700 group"
    >
      <div className="relative h-52 sm:h-60 bg-zinc-700 flex items-center justify-center overflow-hidden"> {/* Darker placeholder bg */}
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ease-in-out"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <ImageIcon className="w-16 h-16 text-zinc-500 mb-2" /> {/* Adjusted icon color */}
            <span className="text-sm text-zinc-500">Nincs kép</span>
          </div>
        )}
        {restaurant.priceTier > 0 && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md">
            {displayPriceTier(restaurant.priceTier)}
          </div>
        )}
      </div>

      {/* Content Section - Adjusted text colors */}
      <div className="p-4 text-zinc-200 flex flex-col flex-1 gap-2">
        <h3 className="text-lg font-semibold mb-1 truncate group-hover:text-orange-400 transition-colors">
          {restaurant.name}
        </h3>

        <div className="flex items-center text-sm text-zinc-400 mb-2 gap-1">
          <MapPin size={14} className="flex-shrink-0" />
          <p className="truncate">{restaurant.address}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1 sm:gap-0">
          <div className="flex items-center space-x-1 bg-zinc-700 text-yellow-400 px-2 py-0.5 rounded mb-1 sm:mb-0 shadow-sm">
            <Star size={14} className="fill-current text-yellow-400"/>
            <span className="font-medium">{averageRating.toFixed(1)}</span>
          </div>

          <span className="text-zinc-500"> {/* Adjusted date added color */}
            {formatDateAdded(restaurant.createdAt || new Date().toISOString())}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default RestaurantCard;