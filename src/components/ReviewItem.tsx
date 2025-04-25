// src/components/ReviewItem.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Review } from '../types';
import StarRating from './StarRating';
import { Pencil, Trash, Clock, User, Image as ImageIcon, ArrowUp, ArrowDown, MoreVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface ReviewItemProps {
  review: Review;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onVote?: (reviewId: string) => void;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  showActions = false,
  onEdit,
  onDelete,
  onVote,
}) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showRatingDetails, setShowRatingDetails] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [averageRating, setAverageRating] = useState(review.average_rating || review.rating || 0);
  
  // Format the date in the requested format: YYYY.MM.DD HH:mm
  const formatDate = (dateString: string | null | undefined): string => {
    // Return fallback immediately if dateString is null, undefined, or empty
    if (!dateString) {
      return 'Publikálás ideje';
    }
    
    try {
      const date = new Date(dateString);
      // Check if the date object is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string received:', dateString);
        return 'Publikálás ideje';
      }

      // Format using Hungarian locale and specific options
      const formatted = date.toLocaleString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // Use 24-hour format
        timeZone: 'Europe/Budapest' // Optional: Specify timezone if needed
      });
      
      // Clean up potential extra spaces or formatting artifacts if necessary
      // The default toLocaleString for hu-HU might already be good
      // Example cleanup: return formatted.replace(/, /g, ' ').replace(/\./g, '.');
      // For YYYY. MM. DD. HH:mm format, this might be closer:
      return formatted.replace(', ', ' '); // Basic cleanup

    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Publikálás ideje'; // Fallback on any error
    }
  };

  const formattedDate = formatDate(review.created_at);
  console.log('Review created_at:', review.created_at, 'Formatted:', formattedDate); // Debug log

  // Format date for mobile view
  const formattedDateMobile = review.created_at ? new Date(review.created_at).toLocaleString('hu-HU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Budapest'
  }).replace('.', '') : 'Publikálás ideje';

  useEffect(() => {
    if (review.user_id) {
      fetchUserData(review.user_id);
    }
  }, [review.user_id]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchVoteData = async () => {
      if (!currentUser) return;

      try {
        // Fetch user's vote
        const { data: voteData, error: voteError } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('review_id', review.id)
          .eq('user_id', currentUser.id)
          .single();

        if (voteError) {
          console.error('Error fetching user vote:', voteError);
        } else if (voteData) {
          setUserVote(voteData.vote_type as 'up' | 'down');
        }

        // Fetch vote counts
        const { count: upvotes, error: upvotesError } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('review_id', review.id)
          .eq('vote_type', 'up');

        if (upvotesError) {
          console.error('Error fetching upvotes:', upvotesError);
        }

        const { count: downvotes, error: downvotesError } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('review_id', review.id)
          .eq('vote_type', 'down');

        if (downvotesError) {
          console.error('Error fetching downvotes:', downvotesError);
        }

        setVoteCount((upvotes || 0) - (downvotes || 0));
      } catch (error) {
        console.error('Error in fetchVoteData:', error);
      }
    };

    fetchVoteData();
  }, [currentUser, review.id]);

  // Subscribe to vote changes
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`votes:${review.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `review_id=eq.${review.id}`,
        },
        async () => {
          // Refresh vote data when changes occur
          const { data: voteData } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('review_id', review.id)
            .eq('user_id', currentUser.id)
            .single();

          if (voteData) {
            setUserVote(voteData.vote_type as 'up' | 'down');
          } else {
            setUserVote(null);
          }

          const { count: upvotes } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id)
            .eq('vote_type', 'up');

          const { count: downvotes } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id)
            .eq('vote_type', 'down');

          setVoteCount((upvotes || 0) - (downvotes || 0));

          // Refresh review data including average rating
          const { data: reviewData } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', review.id)
            .single();

          if (reviewData) {
            setAverageRating(reviewData.average_rating || reviewData.rating || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, review.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMobileActions(false);
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUserData = async (userId: string) => {
  try {
    // First try to get from profile_images
    const { data: images, error: imageError } = await supabase
      .from('profile_images')
      .select('image_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    let imageData: string | null = null;
    if (!imageError && images && images.length > 0 && images[0].image_data) {
      imageData = images[0].image_data;
      // Add base64 prefix if missing
      if (imageData.startsWith('data:image/')) {
        setUserAvatar(imageData);
      } else {
        // Try to detect mime type (default to jpeg)
        let prefix = 'data:image/jpeg;base64,';
        if (imageData.charAt(0) === '/') {
          // PNG base64 usually starts with iVBORw
          prefix = 'data:image/png;base64,';
        }
        setUserAvatar(prefix + imageData);
      }
    }

    // Then get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username, email, avatar_url')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile data:', profileError);
      return;
    }

    setUserName(profileData?.username || profileData?.email || 'Felhasználó');
    if (!imageData && profileData?.avatar_url) {
      // Add prefix if missing
      let avatarUrl = profileData.avatar_url;
      if (avatarUrl.startsWith('data:image/')) {
        setUserAvatar(avatarUrl);
      } else {
        let prefix = 'data:image/jpeg;base64,';
        if (avatarUrl.charAt(0) === '/') {
          prefix = 'data:image/png;base64,';
        }
        setUserAvatar(prefix + avatarUrl);
      }
    }
  } catch (error) {
    console.error('Error in fetchUserData:', error);
  }
};

  const handleVote = async (type: 'up' | 'down') => {
    if (!currentUser) {
      toast.error('A szavazáshoz be kell jelentkezned!');
      return;
    }

    setIsVoting(true);
    try {
      // Először ellenőrizzük, hogy van-e már szavazat a felhasználótól
      const { data: existingVote, error: checkError } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('review_id', review.id)
        .eq('user_id', currentUser.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116: nem található rekord
        console.error('Error checking existing vote:', checkError);
        throw checkError;
      }

      if (existingVote) {
        // Ha már szavazott, akkor frissítjük a szavazatot
        const { error: updateError } = await supabase
          .from('votes')
          .update({ vote_type: type })
          .eq('review_id', review.id)
          .eq('user_id', currentUser.id);

        if (updateError) {
          console.error('Error updating vote:', updateError);
          throw updateError;
        }
      } else {
        // Ha még nem szavazott, akkor létrehozunk egy új szavazatot
        const { error: insertError } = await supabase
          .from('votes')
          .insert({ 
            review_id: review.id, 
            user_id: currentUser.id, 
            vote_type: type 
          });

        if (insertError) {
          console.error('Error inserting vote:', insertError);
          throw insertError;
        }
      }

      // Update local state
      setUserVote(type);
      setVoteCount(prev => {
        if (userVote === type) return prev; // If clicking the same vote type, no change
        if (userVote === null) return type === 'up' ? prev + 1 : prev - 1; // New vote
        return type === 'up' ? prev + 2 : prev - 2; // Changing vote
      });

      // Refresh review data including average rating
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', review.id)
        .single();

      if (reviewError) {
        console.error('Error fetching review data:', reviewError);
      } else if (reviewData) {
        setAverageRating(reviewData.average_rating || reviewData.rating || 0);
      }

      // Call the onVote callback to refresh the review data
      onVote?.(review.id);
      
      toast.success(type === 'up' ? 'Felnyilaltál egy értékelést!' : 'Lefelé nyilaltál egy értékelést!');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Hiba történt a szavazás során');
    } finally {
      setIsVoting(false);
    }
  };

  // Handle menu toggle
  const toggleMenu = () => {
    const newState = !showMobileActions;
    setShowMobileActions(newState);
    setIsMenuOpen(newState);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const imageVariants = {
    normal: { scale: 1 },
    expanded: { scale: 1.05 }
  };

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: -10,
      transition: {
        duration: 0.2
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.2
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }),
    exit: { opacity: 0, x: -20 }
  };

  // Frissítsük az átlagos értékelést, amikor a review objektum változik
  useEffect(() => {
    setAverageRating(review.average_rating || review.rating || 0);
  }, [review.average_rating, review.rating]);

  // Fetch review data including average rating
  useEffect(() => {
    const fetchReviewData = async () => {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', review.id)
        .single();

      if (reviewData) {
        // Használjuk az average_rating-et, ha van, egyébként a rating-et
        setAverageRating(reviewData.average_rating || reviewData.rating || 0);
      }
    };

    fetchReviewData();
  }, [review.id]);

  return (
    <motion.div 
      layout
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="p-6">
        {/* Header Section with Votes */}
        <div className="flex items-start gap-4">
          {/* Vote Column */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVote('up')}
              className={`p-2 rounded-lg transition-all ${
                userVote === 'up'
                  ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/20'
              }`}
            >
              <ArrowUp size={20} />
            </motion.button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {voteCount}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleVote('down')}
              className={`p-2 rounded-lg transition-all ${
                userVote === 'down'
                  ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20'
              }`}
            >
              <ArrowDown size={20} />
            </motion.button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <motion.div 
                className="flex items-center gap-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <div className="relative group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 shadow-md"
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                        <User size={24} className="text-white" />
                      </div>
                    )}
                  </motion.div>
                </div>
                
                <div>
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-semibold text-gray-900 dark:text-white"
                  >
                    {userName || 'Felhasználó'}
                  </motion.h3>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap items-center gap-3 mt-1"
                  >
                    <div className="flex items-center gap-1">
                      <div 
                        className="flex cursor-pointer" 
                        onClick={() => setShowRatingDetails(true)}
                      >
                        <StarRating 
                          rating={averageRating} 
                          readOnly 
                          size={16} 
                          className="cursor-pointer"
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {averageRating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <Clock size={14} className="text-amber-500 flex-shrink-0" />
                      <span className="flex items-center gap-1 overflow-hidden">
                        {formattedDate !== 'Publikálás ideje' ? (
                          <>
                            <span className="truncate">{formattedDate.split(' ')[0]}</span>
                            <span className="font-semibold flex-shrink-0">{formattedDate.split(' ')[1]}</span>
                          </>
                        ) : (
                          formattedDate
                        )}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Action Buttons - Desktop */}
              {showActions && (
                <motion.div 
                  className="hidden sm:flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onEdit}
                    className="p-2 text-gray-600 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 transition-all rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:shadow-md"
                    aria-label="Szerkesztés"
                  >
                    <Pencil size={18} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onDelete}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-md"
                    aria-label="Törlés"
                  >
                    <Trash size={18} />
                  </motion.button>
                </motion.div>
              )}
              
              {/* Mobile Action Button */}
              {showActions && (
                <div className="relative sm:hidden" ref={menuRef}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMenu}
                    className="p-2 text-gray-600 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 transition-all rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:shadow-md"
                    aria-label="Műveletek"
                  >
                    <MoreVertical size={18} />
                  </motion.button>
                  
                  {/* Overlay for blur effect */}
                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10"
                        onClick={() => {
                          setShowMobileActions(false);
                          setIsMenuOpen(false);
                        }}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Animated Menu */}
                  <AnimatePresence>
                    {showMobileActions && (
                      <motion.div
                        variants={menuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed inset-0 flex items-center justify-center z-20"
                      >
                        <div className="w-[90%] max-w-xs bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                          <div className="p-2">
                            <motion.div
                              custom={0}
                              variants={menuItemVariants}
                              className="flex items-center justify-between p-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700"
                            >
                              <span>Műveletek</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setShowMobileActions(false);
                                  setIsMenuOpen(false);
                                }}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                <X size={16} />
                              </motion.button>
                            </motion.div>
                            
                            <motion.button
                              custom={1}
                              variants={menuItemVariants}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setShowMobileActions(false);
                                setIsMenuOpen(false);
                                onEdit && onEdit();
                              }}
                              className="w-full flex items-center gap-2 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            >
                              <Pencil size={18} className="text-amber-500" />
                              <span>Szerkesztés</span>
                            </motion.button>
                            
                            <motion.button
                              custom={2}
                              variants={menuItemVariants}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setShowMobileActions(false);
                                setIsMenuOpen(false);
                                onDelete && onDelete();
                              }}
                              className="w-full flex items-center gap-2 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash size={18} className="text-red-500" />
                              <span>Törlés</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Review Content */}
            <div className="mt-4">
              {review.message && (
                <p className="text-gray-700 dark:text-gray-300">{review.message}</p>
              )}
              {review.dishes && review.dishes.length > 0 && (
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                  {review.dishes.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Photo Gallery */}
        {review.photos && review.photos.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {review.photos.map((photo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <motion.img
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    variants={imageVariants}
                    initial="normal"
                    whileHover="expanded"
                    onClick={() => setIsImageExpanded(index)}
                    className="w-full h-full object-cover cursor-pointer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ImageIcon size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {isImageExpanded !== null && review.photos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setIsImageExpanded(null)}
          >
            <motion.img
              src={review.photos[isImageExpanded]}
              alt={`Expanded review photo ${isImageExpanded + 1}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rating Details Modal */}
      <AnimatePresence>
        {showRatingDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowRatingDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Részletes értékelés
                </h3>
                <button
                  onClick={() => setShowRatingDetails(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Átlagos értékelés</span>
                  <StarRating rating={averageRating} readOnly size={20} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Környezet</span>
                  <StarRating rating={review.atmosphere_rating || 0} readOnly size={20} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Íz</span>
                  <StarRating rating={review.taste_rating || 0} readOnly size={20} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Ár/érték arány</span>
                  <StarRating rating={review.price_rating || 0} readOnly size={20} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReviewItem;