// src/components/SimpleReviewVotes.tsx
import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SimpleReviewVotesProps {
  reviewId: string;
  initialUpvotes?: number;
  initialDownvotes?: number;
  initialUserVote?: number;
}

// Ideiglenes memória a szavazatok tárolására, amíg nem fut le a migráció
const voteMemory = new Map<string, Map<string, number>>();
const reviewVotes = new Map<string, { upvotes: number, downvotes: number }>();

const SimpleReviewVotes: React.FC<SimpleReviewVotesProps> = ({ 
  reviewId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialUserVote = 0
}) => {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<number>(initialUserVote);
  const [loading, setLoading] = useState(false);

  // Inicializáljuk a memóriát, ha még nem létezik
  useEffect(() => {
    if (!reviewVotes.has(reviewId)) {
      reviewVotes.set(reviewId, { 
        upvotes: initialUpvotes, 
        downvotes: initialDownvotes 
      });
    }
    
    if (!voteMemory.has(reviewId)) {
      voteMemory.set(reviewId, new Map());
    }
  }, [reviewId, initialUpvotes, initialDownvotes]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Ellenőrizzük, hogy a felhasználó szavazott-e már
        const reviewVoteMap = voteMemory.get(reviewId);
        if (reviewVoteMap && reviewVoteMap.has(user.id)) {
          setUserVote(reviewVoteMap.get(user.id) || 0);
        } else {
          setUserVote(0);
        }
      }
    };
    
    checkUser();
  }, [reviewId]);

  const handleVote = async (voteType: number) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Kérjük, jelentkezz be a szavazáshoz!');
        return;
      }
      
      // Lekérjük az aktuális szavazati adatokat
      const reviewVoteMap = voteMemory.get(reviewId) || new Map();
      const currentVote = reviewVoteMap.get(user.id) || 0;
      const currentVoteCounts = reviewVotes.get(reviewId) || { upvotes: 0, downvotes: 0 };
      
      // Ha ugyanarra szavaztunk, töröljük a szavazatot
      if (currentVote === voteType) {
        reviewVoteMap.delete(user.id);
        
        // Frissítjük a szavazatok számát
        if (voteType === 1) {
          currentVoteCounts.upvotes = Math.max(currentVoteCounts.upvotes - 1, 0);
          setUpvotes(prev => Math.max(prev - 1, 0));
        } else if (voteType === -1) {
          currentVoteCounts.downvotes = Math.max(currentVoteCounts.downvotes - 1, 0);
          setDownvotes(prev => Math.max(prev - 1, 0));
        }
        
        setUserVote(0);
      } else {
        // Ha a felhasználó már szavazott, de másképp
        if (currentVote === 1) {
          currentVoteCounts.upvotes = Math.max(currentVoteCounts.upvotes - 1, 0);
          setUpvotes(prev => Math.max(prev - 1, 0));
        } else if (currentVote === -1) {
          currentVoteCounts.downvotes = Math.max(currentVoteCounts.downvotes - 1, 0);
          setDownvotes(prev => Math.max(prev - 1, 0));
        }
        
        // Új szavazat hozzáadása
        reviewVoteMap.set(user.id, voteType);
        
        if (voteType === 1) {
          currentVoteCounts.upvotes += 1;
          setUpvotes(prev => prev + 1);
        } else if (voteType === -1) {
          currentVoteCounts.downvotes += 1;
          setDownvotes(prev => prev + 1);
        }
        
        setUserVote(voteType);
      }
      
      // Mentjük a frissített adatokat
      voteMemory.set(reviewId, reviewVoteMap);
      reviewVotes.set(reviewId, currentVoteCounts);
      
      // Próbáljuk menteni az adatbázisban is, ha a migráció már lefutott
      try {
        // Frissítjük a review-t közvetlenül
        await supabase
          .from('reviews')
          .update({
            upvotes: currentVoteCounts.upvotes,
            downvotes: currentVoteCounts.downvotes,
            user_votes: Object.fromEntries(reviewVoteMap)
          })
          .eq('id', reviewId);
      } catch (dbError) {
        console.log('Adatbázis frissítése nem sikerült, valószínűleg a migráció még nem futott le:', dbError);
      }
      
    } catch (error) {
      console.error('Error in handleVote:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => !loading && handleVote(1)}
        className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
          userVote === 1 
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={loading}
        aria-label="Hasznos"
      >
        <ThumbsUp size={14} />
        <span className="text-xs font-medium">{upvotes}</span>
      </button>
      
      <button
        onClick={() => !loading && handleVote(-1)}
        className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-colors ${
          userVote === -1 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={loading}
        aria-label="Nem hasznos"
      >
        <ThumbsDown size={14} />
        <span className="text-xs font-medium">{downvotes}</span>
      </button>
    </div>
  );
};

export default SimpleReviewVotes;
