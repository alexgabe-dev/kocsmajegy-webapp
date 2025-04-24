import React, { useState, useEffect } from 'react';
import { Review, DishPrice } from '../types';
import StarRating from './StarRating';
import DishPriceInput from './DishPriceInput';
import PhotoUpload from './PhotoUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  MessageSquare, 
  UtensilsCrossed, 
  Camera, 
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReviewFormProps {
  restaurant_id: string;
  initialData?: Partial<Review>;
  onSubmit: (data: Omit<Review, 'id' | 'created_at' | 'user_id'>) => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  restaurant_id,
  initialData = {},
  onSubmit,
}) => {
  const [rating, setRating] = useState(initialData.rating || 0);
  const [atmosphere_rating, setAtmosphereRating] = useState(initialData.atmosphere_rating || 0);
  const [taste_rating, setTasteRating] = useState(initialData.taste_rating || 0);
  const [price_rating, setPriceRating] = useState(initialData.price_rating || 0);
  const [message, setMessage] = useState(initialData.message || '');
  const [dish_prices, setDishPrices] = useState<DishPrice[]>(initialData.dish_prices || []);
  const [photos, setPhotos] = useState<string[]>(initialData.photos || []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'rating' | 'message' | 'dishes' | 'photos'>('rating');
  const [showRatingDetails, setShowRatingDetails] = useState(false);

  useEffect(() => {
    const ratings = [atmosphere_rating, taste_rating, price_rating].filter(r => r > 0);
    if (ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      setRating(Number(avgRating.toFixed(1)));
    }
  }, [atmosphere_rating, taste_rating, price_rating]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (atmosphere_rating === 0 && taste_rating === 0 && price_rating === 0) {
      newErrors.rating = 'Kérjük, válassz legalább egy értékelési szempontot';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const reviewData: Omit<Review, 'id' | 'created_at' | 'user_id'> = {
      restaurant_id,
      rating: Number(rating.toFixed(1)),
      average_rating: rating,
      atmosphere_rating: atmosphere_rating > 0 ? Number(atmosphere_rating.toFixed(1)) : undefined,
      taste_rating: taste_rating > 0 ? Number(taste_rating.toFixed(1)) : undefined,
      price_rating: price_rating > 0 ? Number(price_rating.toFixed(1)) : undefined,
      message: message || undefined,
      dishes: dish_prices.map(dp => dp.dish),
      photos,
      dish_prices,
      updated_at: new Date().toISOString()
    };

    onSubmit(reviewData);
  };

  // Ellenőrzi, hogy az értékelési szekcióban van-e érvényes értékelés
  const hasValidRating = (): boolean => {
    return atmosphere_rating > 0 || taste_rating > 0 || price_rating > 0;
  };

  // Következő szekcióra lépés kezelése
  const handleNextSection = () => {
    const currentIndex = sections.findIndex(s => s.id === activeSection);
    
    // Ha az értékelési szekcióban vagyunk, ellenőrizzük, hogy van-e érvényes értékelés
    if (activeSection === 'rating' && !hasValidRating()) {
      setErrors({ rating: 'Kérjük, válassz legalább egy értékelési szempontot' });
      return;
    }
    
    // Töröljük a hibákat, ha van
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
    
    // Következő szekcióra lépés
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id as any);
    }
  };

  const sections = [
    {
      id: 'rating',
      title: 'Értékelés',
      icon: Star,
      isRequired: true,
      content: (
        <div className="flex flex-col items-center space-y-3">
          {/* Mobilnézetben egy oszlop, asztali nézetben három oszlop */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Hangulat</h3>
              <StarRating 
                rating={atmosphere_rating} 
                onChange={setAtmosphereRating} 
                size={24}
                className="mb-1" 
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {atmosphere_rating > 0 ? `${atmosphere_rating} csillag` : 'Nincs értékelve'}
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Ízek</h3>
              <StarRating 
                rating={taste_rating} 
                onChange={setTasteRating} 
                size={24}
                className="mb-1" 
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {taste_rating > 0 ? `${taste_rating} csillag` : 'Nincs értékelve'}
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Árak</h3>
              <StarRating 
                rating={price_rating} 
                onChange={setPriceRating} 
                size={24}
                className="mb-1" 
              />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {price_rating > 0 ? `${price_rating} csillag` : 'Nincs értékelve'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center mt-1 pt-1 border-t border-gray-200 dark:border-gray-700 w-full">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Átlagos értékelés</h3>
            <button 
              type="button"
              onClick={() => setShowRatingDetails(true)}
              className="focus:outline-none cursor-pointer"
            >
              <div className="flex items-center mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600 fill-none'
                    }`}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ))}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {rating > 0 ? `${rating} csillag` : 'Nincs értékelve'}
              </span>
            </button>
          </div>
          
          {errors.rating && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-500 mt-1"
            >
              <AlertCircle size={14} />
              <span className="text-xs">{errors.rating}</span>
            </motion.div>
          )}
        </div>
      )
    },
    {
      id: 'message',
      title: 'Vélemény',
      icon: MessageSquare,
      content: (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Oszd meg a tapasztalataidat..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
        />
      )
    },
    {
      id: 'dishes',
      title: 'Kipróbált ételek',
      icon: UtensilsCrossed,
      content: (
        <div className="space-y-2">
          <DishPriceInput dishPrices={dish_prices} onChange={setDishPrices} />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Add meg az ételek nevét és árát, amiket kipróbáltál
          </p>
        </div>
      )
    },
    {
      id: 'photos',
      title: 'Fotók',
      icon: Camera,
      content: (
        <PhotoUpload photos={photos} onChange={setPhotos} />
      )
    }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Progress indikátor - mindkét nézetben egymás mellett */}
      <div className="flex items-center justify-between px-1 mb-3">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <React.Fragment key={section.id}>
              <motion.button
                type="button"
                onClick={() => setActiveSection(section.id as any)}
                className={`relative flex flex-col items-center group ${
                  activeSection === section.id 
                    ? 'text-orange-500 dark:text-orange-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  activeSection === section.id
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400'
                    : 'bg-gray-100 dark:bg-gray-900'
                }`}>
                  <Icon size={16} className="md:w-5 md:h-5" />
                </div>
                <span className="mt-1 text-xs font-medium hidden sm:block">
                  {section.title}
                  {section.isRequired && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                {activeSection === section.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 w-8 md:w-10 h-1 bg-orange-500 dark:bg-orange-400 rounded-full"
                  />
                )}
              </motion.button>
              {index < sections.length - 1 && (
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800 mx-1 md:mx-2" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Content Area - Még kisebb minimális magasság */}
      <div className="min-h-[120px] p-3 md:p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {sections.find(s => s.id === activeSection)?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation - Kompaktabb gombok és jobb elhelyezés */}
      <div className="flex justify-between gap-2 pt-1">
        <motion.button
          type="button"
          onClick={() => {
            const currentIndex = sections.findIndex(s => s.id === activeSection);
            if (currentIndex > 0) {
              setActiveSection(sections[currentIndex - 1].id as any);
            }
          }}
          className={`p-2 md:p-3 rounded-lg font-medium transition-all duration-200 ${
            sections[0].id === activeSection
              ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900 text-gray-400'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:shadow-md'
          }`}
          disabled={sections[0].id === activeSection}
          whileHover={sections[0].id !== activeSection ? { scale: 1.05 } : undefined}
          whileTap={sections[0].id !== activeSection ? { scale: 0.95 } : undefined}
        >
          <ArrowLeft size={16} className="md:w-5 md:h-5" />
        </motion.button>
        
        {activeSection === sections[sections.length - 1].id ? (
          <motion.button
            type="submit"
            className="px-4 py-2 md:px-6 md:py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md shadow-orange-600/20 flex items-center gap-2 text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Mentés</span>
            <Check size={16} className="md:w-5 md:h-5" />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={handleNextSection}
            className="p-2 md:p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 shadow-md shadow-orange-600/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowRight size={16} className="md:w-5 md:h-5" />
          </motion.button>
        )}
      </div>

      {/* Rating Details Modal */}
      {showRatingDetails && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowRatingDetails(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Részletes értékelés</h3>
              <button
                type="button"
                onClick={() => setShowRatingDetails(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Hangulat</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                    {atmosphere_rating > 0 ? atmosphere_rating : '-'}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= atmosphere_rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600 fill-none'
                        }`}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ízek</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                    {taste_rating > 0 ? taste_rating : '-'}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= taste_rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600 fill-none'
                        }`}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Árak</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                    {price_rating > 0 ? price_rating : '-'}
                  </span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= price_rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 dark:text-gray-600 fill-none'
                        }`}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Átlagos értékelés</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                      {rating > 0 ? rating : '-'}
                    </span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600 fill-none'
                          }`}
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ReviewForm;