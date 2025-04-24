// src/components/ReviewVotes.tsx
import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReviewVotesProps {
  reviewId: string;
}

const ReviewVotes: React.FC<ReviewVotesProps> = ({ reviewId }) => {
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVotes();
    checkUserVote();
  }, [reviewId]);

  const fetchVotes = async () => {
    try {
      // Lekérjük az upvote-ok számát
      const { data: upvoteData, error: upvoteError } = await supabase.rpc(
        'get_review_upvotes',
        { review_uuid: reviewId }
      );
      
      if (upvoteError) {
        console.error('Error fetching upvotes:', upvoteError);
        return;
      }
      
      // Lekérjük a downvote-ok számát
      const { data: downvoteData, error: downvoteError } = await supabase.rpc(
        'get_review_downvotes',
        { review_uuid: reviewId }
      );
      
      if (downvoteError) {
        console.error('Error fetching downvotes:', downvoteError);
        return;
      }
      
      setUpvotes(upvoteData || 0);
      setDownvotes(downvoteData || 0);
    } catch (error) {
      console.error('Error in fetchVotes:', error);
    }
  };

  const checkUserVote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data, error } = await supabase
        .from('review_votes')
        .select('vote_type')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking user vote:', error);
        return;
      }
      
      if (data) {
        setUserVote(data.vote_type);
      }
    } catch (error) {
      console.error('Error in checkUserVote:', error);
    }
  };

  const handleVote = async (voteType: number) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Kérjük, jelentkezz be a szavazáshoz!');
        return;
      }
      
      // Ha a felhasználó már szavazott ugyanígy, akkor töröljük a szavazatát
      if (userVote === voteType) {
        const { error } = await supabase
          .from('review_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error removing vote:', error);
          return;
        }
        
        setUserVote(null);
      } else {
        // Ha a felhasználó már szavazott, de másképp, akkor frissítjük a szavazatát
        // Ha még nem szavazott, akkor új szavazatot adunk hozzá
        
        // Először ellenőrizzük, hogy létezik-e már szavazat
        const { data: existingVote } = await supabase
          .from('review_votes')
          .select('id')
          .eq('review_id', reviewId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        let error;
        
        if (existingVote) {
          // Ha már létezik, akkor frissítjük
          const { error: updateError } = await supabase
            .from('review_votes')
            .update({
              vote_type: voteType,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingVote.id);
            
          error = updateError;
        } else {
          // Ha még nem létezik, akkor beszúrjuk
          const { error: insertError } = await supabase
            .from('review_votes')
            .insert({
              review_id: reviewId,
              user_id: user.id,
              vote_type: voteType
            });
            
          error = insertError;
        }
        
        if (error) {
          console.error('Error adding/updating vote:', error);
          return;
        }
        
        setUserVote(voteType);
      }
      
      // Frissítjük a szavazatok számát
      fetchVotes();
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

export default ReviewVotes;