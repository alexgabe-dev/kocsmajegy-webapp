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
      className="rounded-lg overflow-hidden cursor-pointer bg-card shadow-md flex flex-col h-full transition-transform duration-200 hover:scale-[1.02] card-hover border border-border group"
    >
      <div className="relative h-52 sm:h-60 bg-secondary flex items-center justify-center">
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:brightness-95 transition-all duration-200"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <ImageIcon className="w-16 h-16 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">No photo</span>
          </div>
        )}
        {restaurant.priceTier > 0 && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full shadow-md">
            {displayPriceTier(restaurant.priceTier)}
          </div>
        )}
      </div>

      <div className="p-4 text-foreground flex flex-col flex-1 gap-2">
        <h3 className="text-lg font-semibold mb-1 truncate group-hover:text-primary transition-colors">
          {restaurant.name}
        </h3>

        <div className="flex items-center text-sm text-muted-foreground mb-2 gap-1">
          <MapPin size={14} className="flex-shrink-0" />
          <p className="truncate">{restaurant.address}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1 sm:gap-0">
          <div className="flex items-center space-x-1 bg-accent text-accent-foreground px-2 py-0.5 rounded mb-1 sm:mb-0 shadow-sm">
            <Star size={14} className="fill-current text-yellow-400"/>
            <span className="font-medium">{averageRating.toFixed(1)}</span>
          </div>

          <span className="text-muted-foreground">
            {formatDateAdded(restaurant.createdAt || new Date().toISOString())} 
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default RestaurantCard;