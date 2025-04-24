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
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import PriceTier from '../components/PriceTier';
import StarRating from '../components/StarRating';
import ReviewItem from '../components/ReviewItem';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import RestaurantForm from '../components/RestaurantForm';
import ReviewForm from '../components/ReviewForm';
import { supabase } from '../lib/supabase';

const RestaurantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    restaurants,
    reviews,
    updateRestaurant,
    deleteRestaurant,
    addReview,
    updateReview,
    deleteReview,
    getRestaurantReviews,
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userReview, setUserReview] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showRatingDetails, setShowRatingDetails] = useState(false);

  useEffect(() => {
    // Lekérjük a bejelentkezett felhasználót
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Ellenőrizzük, hogy a felhasználó írt-e már értékelést
      if (user && restaurantReviews.length > 0) {
        const userReview = restaurantReviews.find(review => review.user_id === user.id);
        setUserReview(userReview);
      }
    };
    
    fetchCurrentUser();
  }, [restaurantReviews]);

  const averageRating =
    restaurantReviews.length > 0
      ? restaurantReviews.reduce((acc, review) => acc + review.rating, 0) /
        restaurantReviews.length
      : 0;

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Étterem nem található</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
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
    // Hozzáadjuk a felhasználó ID-t az értékeléshez
    if (currentUser) {
      data.user_id = currentUser.id;
    }
    
    addReview(data);
    setIsReviewModalOpen(false);
    showToast('Értékelés sikeresen hozzáadva!', 'success');
    
    // Frissítjük a felhasználó értékelését
    if (currentUser) {
      const newReview = {
        ...data,
        id: crypto.randomUUID(), // Ez csak ideiglenes, a valódi ID-t az addReview generálja
        createdAt: new Date().toISOString()
      };
      setUserReview(newReview);
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
    
    // Frissítjük a felhasználó értékelését, ha a sajátját szerkesztette
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
      
      // Ha a felhasználó a saját értékelését törölte, frissítjük az állapotot
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

  // Rendezzük az értékeléseket a kiválasztott szempont szerint
  const sortedReviews = [...restaurantReviews].sort((a, b) => {
    switch (sortBy) {
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background dark:bg-black"
    >
      {/* Hero section with restaurant info */}
      <div className="relative bg-gradient-to-r from-amber-600 to-amber-500 text-white">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/30 transition-colors"
            aria-label="Vissza"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        
        <div className="container mx-auto px-4 py-8 pt-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{restaurant.name}</h1>
                <button
                  onClick={handleToggleFavorite}
                  className="p-2 bg-black/20 backdrop-blur-sm rounded-full hover:bg-black/30 transition-colors"
                  aria-label={isFavorite(restaurant.id) ? "Eltávolítás a kedvencekből" : "Hozzáadás a kedvencekhez"}
                >
                  <Heart 
                    size={18} 
                    className={isFavorite(restaurant.id) ? "fill-current" : ""} 
                  />
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-white/90">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1" />
                  <span className="text-sm md:text-base">{restaurant.address}</span>
                </div>
                
                <div className="flex items-center">
                  <PriceTier tier={restaurant.priceTier} readOnly />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 mt-2 md:mt-0">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-lg hover:bg-black/30 transition-colors flex items-center text-sm"
              >
                <Pencil size={14} className="mr-1" />
                <span>Szerkesztés</span>
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-1.5 bg-black/20 backdrop-blur-sm rounded-lg hover:bg-black/30 transition-colors flex items-center text-sm"
              >
                <Trash size={14} className="mr-1" />
                <span>Törlés</span>
              </button>
            </div>
          </div>
          
          {/* Rating summary */}
          <div className="mt-6 bg-black/10 backdrop-blur-sm rounded-xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-4xl font-bold mb-1">{averageRating.toFixed(1)}</div>
                <StarRating rating={Math.round(averageRating)} readOnly size={20} />
                <div className="mt-1 text-xs md:text-sm">
                  {restaurantReviews.length} {restaurantReviews.length === 1 ? 'értékelés' : 'értékelés'}
                </div>
              </div>
              
              {/* Mobil nézeten csak akkor mutatjuk a részletes értékeléseket, ha a felhasználó kéri */}
              <div className="md:hidden w-full">
                <button 
                  onClick={() => setShowRatingDetails(!showRatingDetails)}
                  className="flex items-center justify-center w-full py-2 px-4 bg-black/20 rounded-lg text-sm"
                >
                  {showRatingDetails ? (
                    <>
                      <ArrowUp size={14} className="mr-2" />
                      <span>Részletek elrejtése</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown size={14} className="mr-2" />
                      <span>Részletes értékelések</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Asztali nézeten mindig látható, mobilon csak ha kérik */}
              <div className={`flex-1 ${showRatingDetails || 'hidden md:block'}`}>
                <div className="grid grid-cols-1 gap-2">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = restaurantReviews.filter(r => r.rating === rating).length;
                    const percentage = restaurantReviews.length > 0 
                      ? (count / restaurantReviews.length) * 100 
                      : 0;
                      
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <div className="flex items-center w-8 md:w-10">
                          <span>{rating}</span>
                          <Star size={10} className="ml-1" />
                        </div>
                        <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="w-6 text-xs">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="w-full md:w-auto">
                <button
                  onClick={() => {
                    if (userReview) {
                      setEditingReview(userReview.id);
                      setIsReviewModalOpen(true);
                    } else {
                      setEditingReview(null);
                      setIsReviewModalOpen(true);
                    }
                  }}
                  className="w-full md:w-auto px-4 py-2 bg-black text-amber-500 font-medium rounded-lg hover:bg-gray-900 transition-colors"
                >
                  {userReview ? 'Értékelésem szerkesztése' : 'Értékelés írása'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews section */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl md:text-2xl font-bold">Értékelések</h2>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label htmlFor="sort-reviews" className="text-sm text-gray-600 dark:text-gray-400">
              Rendezés:
            </label>
            <select
              id="sort-reviews"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="newest">Legújabb elöl</option>
              <option value="oldest">Legrégebbi elöl</option>
              <option value="highest">Legjobb értékelés</option>
              <option value="lowest">Legrosszabb értékelés</option>
            </select>
          </div>
        </div>
        
        {restaurantReviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm">
            <MessageSquare size={40} className="mx-auto mb-4 text-amber-500" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">Még nincsenek értékelések. Legyél te az első!</p>
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-6 py-3 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-600 transition-colors"
            >
              Értékelés írása
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <ReviewItem
                key={review.id}
                review={review}
                showActions={currentUser && review.user_id === currentUser.id}
                onEdit={() => {
                  setEditingReview(review.id);
                  setIsReviewModalOpen(true);
                }}
                onDelete={() => {
                  setDeletingReview(review.id);
                  setIsDeleteReviewModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>
      
      {/* Edit Restaurant Modal */}
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
      
      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setEditingReview(null);
        }}
        title={editingReview ? "Értékelés szerkesztése" : "Értékelés írása"}
      >
        <ReviewForm
          restaurantId={restaurant.id}
          initialData={
            editingReview
              ? reviews.find((r) => r.id === editingReview)
              : undefined
          }
          onSubmit={editingReview ? handleEditReview : handleAddReview}
        />
      </Modal>
      
      {/* Delete Restaurant Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Étterem törlése"
        message="Biztosan törölni szeretnéd ezt az éttermet? Ez a művelet nem visszavonható."
        confirmText="Törlés"
        confirmType="danger"
        onConfirm={handleDeleteRestaurant}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
      
      {/* Delete Review Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteReviewModalOpen}
        title="Értékelés törlése"
        message="Biztosan törölni szeretnéd ezt az értékelést? Ez a művelet nem visszavonható."
        confirmText="Törlés"
        confirmType="danger"
        onConfirm={handleDeleteReview}
        onCancel={() => setIsDeleteReviewModalOpen(false)}
      />
    </motion.div>
  );
};

export default RestaurantPage;