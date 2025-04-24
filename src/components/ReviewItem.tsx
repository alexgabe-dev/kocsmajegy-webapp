// src/components/ReviewItem.tsx
import React, { useEffect, useState } from 'react';
import { Calendar, Pencil, Trash, User } from 'lucide-react';
import { Review } from '../types';
import StarRating from './StarRating';
import SimpleReviewVotes from './SimpleReviewVotes';
import { supabase } from '../lib/supabase';

interface ReviewItemProps {
  review: Review;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const formattedDate = new Date(review.createdAt).toLocaleDateString();

  useEffect(() => {
    if (review.user_id) {
      fetchUserData(review.user_id);
    }
  }, [review.user_id]);

  const fetchUserData = async (userId: string) => {
    try {
      // Lekérjük a felhasználó adatait
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.id === userId) {
        // Ha a saját értékelésünkről van szó, akkor a saját adatainkat használjuk
        setUserName(user.user_metadata?.full_name || user.email);
      } else {
        // Alternatív lekérdezés a profiles táblából
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, username')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          console.error('Error fetching profile data:', profileError);
          return;
        }
        
        setUserName(profileData?.username || profileData?.email || 'Felhasználó');
      }
      
      // Lekérjük a profilképet
      const { data: imageData, error: imageError } = await supabase
        .from('profile_images')
        .select('image_data')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
        
      if (imageError && imageError.code !== 'PGRST116') {
        console.error('Error fetching profile image:', imageError);
        return;
      }
      
      if (imageData?.image_data) {
        setUserAvatar(imageData.image_data);
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-black rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex items-start gap-3">
        {/* User avatar */}
        <div className="flex-shrink-0">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-amber-500">
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt={userName || 'User'} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>
            )}
          </div>
        </div>
        
        {/* Review content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base truncate max-w-[150px] md:max-w-xs">
                  {userName || 'Névtelen felhasználó'}
                </h4>
                <StarRating rating={review.rating} readOnly size={14} />
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                <Calendar size={12} className="mr-1" />
                <span>{formattedDate}</span>
              </div>
            </div>
            
            {showActions && (
              <div className="flex space-x-2 mt-2 sm:mt-0">
                <button
                  onClick={onEdit}
                  className="p-1 text-gray-500 hover:text-amber-500 transition-colors"
                  aria-label="Értékelés szerkesztése"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Értékelés törlése"
                >
                  <Trash size={16} />
                </button>
              </div>
            )}
          </div>
          
          {review.message && (
            <p className="text-gray-700 dark:text-gray-300 my-2 break-words text-sm md:text-base">{review.message}</p>
          )}
          
          {review.dishes && review.dishes.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Kipróbált ételek:</h4>
              <div className="flex flex-wrap gap-1.5">
                {review.dishes.map((dish, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded-full text-xs text-amber-800 dark:text-amber-200"
                  >
                    {dish}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {review.photos && review.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {review.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Étel fotó ${index + 1}`}
                  className="rounded-lg w-full h-24 sm:h-32 object-cover"
                />
              ))}
            </div>
          )}
          
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <SimpleReviewVotes 
              reviewId={review.id} 
              initialUpvotes={review.upvotes || 0}
              initialDownvotes={review.downvotes || 0}
              initialUserVote={review.user_vote || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewItem;