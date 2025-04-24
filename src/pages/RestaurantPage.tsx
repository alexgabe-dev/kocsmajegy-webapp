// src/pages/RestaurantPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Pencil, 
  Trash, 
  Star, 
  MapPin, 
  ChevronLeft,
  MessageSquare,
  Heart,
  DollarSign,
  Calendar,
  Clock,
  Phone,
  Globe,
  Edit2,
  Trash2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import PriceTier from '../components/PriceTier';
import StarRating from '../components/StarRating';
import ReviewItem from '../components/ReviewItem';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import RestaurantForm from '../components/RestaurantForm';
import ReviewForm from '../components/ReviewForm';
import { Review } from '../types';

const RestaurantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { reviews, getRestaurantReviews } = useApp();
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showRatingDetails, setShowRatingDetails] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userReview, setUserReview] = useState<any>(null);

  const {
    restaurants,
    updateRestaurant,
    deleteRestaurant,
    addReview,
    updateReview,
    deleteReview,
    toggleFavorite,
    isFavorite
  } = useApp();

  const restaurant = restaurants.find((r) => r.id === id);
  const restaurantReviews = id ? getRestaurantReviews(id) : [];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteReviewModalOpen, setIsDeleteReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [deletingReview, setDeletingReview] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const refreshReview = async (reviewId: string) => {
    const { data: updatedReview } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();
    
    if (updatedReview) {
      // Force a re-render by updating state
      setShowRatingDetails(prev => !prev);
      setShowRatingDetails(prev => !prev);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user && restaurantReviews.length > 0) {
        const userReview = restaurantReviews.find(review => review.user_id === user.id);
        setUserReview(userReview);
      }
    };
    
    fetchCurrentUser();
  }, [restaurantReviews]);

  const averageRating =
    restaurantReviews.length > 0
      ? restaurantReviews.reduce((acc, review) => {
          const rating = review.average_rating || review.rating || 0;
          return acc + rating;
        }, 0) / restaurantReviews.length
      : 0;

  if (!restaurant) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Étterem nem található</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-md"
          >
            Vissza a főoldalra
          </button>
        </div>
      </div>
    );
  }

  const handleEditRestaurant = (data: any) => {
    updateRestaurant({ ...restaurant, ...data });
    setIsEditModalOpen(false);
    showToast('Étterem adatai sikeresen frissítve!', 'success');
  };

  const handleDeleteRestaurant = () => {
    deleteRestaurant(restaurant.id);
    setIsDeleteModalOpen(false);
    navigate('/');
    showToast('Étterem sikeresen törölve!', 'success');
  };

  const handleAddReview = async (data: any) => {
    if (!currentUser) {
      showToast('Be kell jelentkezned az értékeléshez!', 'error');
      return;
    }

    try {
      // Add user_id to the review data
      const reviewData = {
        ...data,
        user_id: currentUser.id,
        created_at: new Date().toISOString()
      };
      
      // Submit the review
      await addReview(reviewData);
      setIsReviewModalOpen(false);
      showToast('Értékelés sikeresen hozzáadva!', 'success');
      
      // Update the userReview state
      setUserReview(reviewData);
    } catch (error) {
      console.error('Error adding review:', error);
      showToast('Hiba történt az értékelés hozzáadásakor!', 'error');
    }
  };

  const handleEditReview = (data: any) => {
    const review = reviews.find((r) => r.id === editingReview);
    if (review) {
      updateReview({ ...review, ...data });
      showToast('Értékelés sikeresen frissítve!', 'success');
    }
    setEditingReview(null);
    setIsReviewModalOpen(false);
    
    if (currentUser && review?.user_id === currentUser.id) {
      setUserReview({ ...review, ...data });
    }
  };

  const handleDeleteReview = () => {
    if (deletingReview) {
      deleteReview(deletingReview);
      setIsDeleteReviewModalOpen(false);
      setDeletingReview(null);
      showToast('Értékelés sikeresen törölve!', 'success');
      
      if (currentUser && userReview?.id === deletingReview) {
        setUserReview(null);
      }
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      await toggleFavorite(id);
      const isFav = isFavorite(id);
      showToast(
        isFav
          ? 'Étterem hozzáadva a kedvencekhez!'
          : 'Étterem eltávolítva a kedvencekből!',
        'info'
      );
    }
  };

  const sortedReviews = [...restaurantReviews].sort((a, b) => {
    switch (sortBy) {
      case 'highest':
        return b.average_rating - a.average_rating;
      case 'lowest':
        return a.average_rating - b.average_rating;
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-900"
    >
      {/* Header section */}
      <div className="relative bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-6">
            {/* Back button and actions */}
            <div className="flex items-center justify-between">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                aria-label="Vissza"
              >
                <ChevronLeft size={24} />
              </motion.button>

              <div className="flex items-center gap-2">
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleToggleFavorite}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  aria-label={isFavorite(restaurant.id) ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez"}
                >
                  <Heart 
                    size={20} 
                    className={isFavorite(restaurant.id) ? "fill-red-500 text-red-500" : ""} 
                  />
                </motion.button>

                {currentUser?.id === restaurant.userId && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                    >
                      <Pencil size={20} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash size={20} />
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Restaurant info */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
              >
                {restaurant.name}
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap items-center gap-4"
              >
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin size={16} />
                  <span className="text-sm">{restaurant.address}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <DollarSign size={16} />
                  <PriceTier tier={restaurant.priceTier} readOnly />
                </div>

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Star size={16} className="text-amber-500" />
                  <span className="text-sm font-medium">
                    {averageRating.toFixed(1)} ({restaurantReviews.length} értékelés)
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          {/* Reviews header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Értékelések
            </h2>
            
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="newest">Legújabb</option>
                <option value="oldest">Legrégebbi</option>
                <option value="highest">Legjobb értékelés</option>
                <option value="lowest">Legrosszabb értékelés</option>
              </select>

              {currentUser && !userReview && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  <span>Értékelés írása</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-6">
            {sortedReviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                showActions={currentUser?.id === review.user_id}
                onEdit={() => {
                  setEditingReview(review.id);
                  setIsReviewModalOpen(true);
                }}
                onDelete={() => {
                  setDeletingReview(review.id);
                  setIsDeleteReviewModalOpen(true);
                }}
                onVote={(reviewId) => refreshReview(reviewId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Étterem szerkesztése"
      >
        <RestaurantForm
          initialData={restaurant}
          onSubmit={handleEditRestaurant}
        />
      </Modal>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={editingReview ? "Értékelés szerkesztése" : "Új értékelés"}
      >
        <ReviewForm
          restaurant_id={restaurant.id}
          initialData={editingReview ? reviews.find(r => r.id === editingReview) : undefined}
          onSubmit={editingReview ? handleEditReview : handleAddReview}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteReviewModalOpen}
        onClose={() => setIsDeleteReviewModalOpen(false)}
        onConfirm={handleDeleteReview}
        onCancel={() => setIsDeleteReviewModalOpen(false)}
        title="Értékelés törlése"
        message="Biztosan törölni szeretnéd ezt az értékelést?"
      />

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteRestaurant}
        onCancel={() => setIsDeleteModalOpen(false)}
        title="Étterem törlése"
        message="Biztosan törölni szeretnéd ezt az éttermet?"
      />
    </motion.div>
  );
};

export default RestaurantPage;