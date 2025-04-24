import React, { useState } from 'react';
import { Review, DishPrice } from '../types';
import StarRating from './StarRating';
import DishPriceInput from './DishPriceInput';
import PhotoUpload from './PhotoUpload';

interface ReviewFormProps {
  restaurantId: string;
  initialData?: Partial<Review>;
  onSubmit: (data: Omit<Review, 'id' | 'createdAt'>) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  restaurantId,
  initialData = {},
  onSubmit,
}) => {
  const [rating, setRating] = useState(initialData.rating || 0);
  const [message, setMessage] = useState(initialData.message || '');
  const [dishPrices, setDishPrices] = useState<DishPrice[]>(initialData.dish_prices || []);
  const [photos, setPhotos] = useState<string[]>(initialData.photos || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (rating === 0) {
      newErrors.rating = 'Kérjük, válassz értékelést';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({
        restaurantId,
        rating,
        message,
        dishes: dishPrices.map(dp => dp.dish),
        photos,
        dish_prices: dishPrices,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-full sm:max-w-xl mx-auto bg-white dark:bg-black p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-amber-500 pb-2">
        Értékelés írása
      </h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-amber-400 mb-2">
          Értékelés
        </label>
        <StarRating rating={rating} onChange={setRating} size={32} />
        {errors.rating && <p className="mt-1 text-sm text-red-500">{errors.rating}</p>}
      </div>
      
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-amber-400 mb-1">
          Vélemény (Opcionális)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Oszd meg a tapasztalataidat..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-black text-gray-900 dark:text-gray-100 resize-none"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-amber-400 mb-2">
          Kipróbált ételek és árak
        </label>
        <DishPriceInput dishPrices={dishPrices} onChange={setDishPrices} />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Add meg az ételek nevét és árát, amiket kipróbáltál
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-amber-400 mb-2">
          Fotók
        </label>
        <PhotoUpload photos={photos} onChange={setPhotos} />
      </div>
      
      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md"
        >
          Értékelés mentése
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;