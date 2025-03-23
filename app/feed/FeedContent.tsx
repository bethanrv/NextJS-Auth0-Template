"use client";
import { useState, useEffect } from "react";
import FeedItemsWrapper from "./FeedItemsWrapper";
import TokenDisplay from "./TokenDisplay";

interface Fight {
  id : number
  created_at: string,
  title: string,
  slug: string,
  date: string,
  location: string,
  status: string,
  scheduled_rounds: number,
  result_outcome: string | null,
  result_round: string | null,
  fighter_1_name: string,
  fighter_2_name: string,
  fighter_1_id: string | null,
  fighter_2_id: string | null,
  fighter_1_is_winner: string | null,
  fighter_2_is_winner: string | null,
  division_name: string | null,
  division_weight_lb: number,
  event_id: string,
  poster_image_url: string | null,
  fighter_1_full_name: string,
  fighter_2_full_name: string,
  fighter_1_img: string,
  fighter_2_img: string,
}

interface FeedContentProps {
  currentEvents: Fight[];
  upcomingEvents: Fight[];
  pastEvents: Fight[];
  initialTokenBalance: number;
  isLoggedIn: boolean;
}

export default function FeedContent({ 
  currentEvents, 
  upcomingEvents, 
  pastEvents, 
  initialTokenBalance,
  isLoggedIn 
}: FeedContentProps) {
  const [tokenBalance, setTokenBalance] = useState(initialTokenBalance);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update token balance when initialTokenBalance changes
  useEffect(() => {
    setTokenBalance(initialTokenBalance);
  }, [initialTokenBalance]);

  const handleTokenUpdate = async (newBalance: number) => {
    if (!isLoggedIn) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch('/api/tokens', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newBalance }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update tokens');
      }

      // Update local state with the new balance from the server
      setTokenBalance(data.newBalance);
    } catch (error) {
      console.error('Error updating tokens:', error);
      // Optionally show an error message to the user
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-black shadow p-6">
      {isLoggedIn ? (
        <TokenDisplay 
          initialTokenBalance={tokenBalance}
          onTokenUpdate={handleTokenUpdate}
          isUpdating={isUpdating}
        />
      ) : (
        <h2 className="text-xl font-semibold text-white mb-4">
          Please login to bet credits
        </h2>
      )}

      <p className="text-gray-600 mb-4 text-white">
        Welcome to PnB
      </p>

      {currentEvents.length > 0 ? (
        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-xl font-semibold text-white mb-3">
            Happening Now
          </h2>
          <FeedItemsWrapper 
            events={currentEvents}
            canBet={false}
            initialTokenBalance={tokenBalance}
            onTokenUpdate={handleTokenUpdate}
            isUpdating={isUpdating}
          />
        </div>
      ) : null}

      {upcomingEvents.length > 0 ? (
        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-xl font-semibold text-white mb-3">
            Upcoming Fights
          </h2>
          <FeedItemsWrapper 
            events={upcomingEvents}
            canBet={true}
            initialTokenBalance={tokenBalance}
            onTokenUpdate={handleTokenUpdate}
            isUpdating={isUpdating}
          />
        </div>
      ) : null}

      {pastEvents.length > 0 ? (
        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-xl font-semibold text-white mb-3">
            Past Events
          </h2>
          <FeedItemsWrapper 
            events={pastEvents}
            canBet={false}
            initialTokenBalance={tokenBalance}
            onTokenUpdate={handleTokenUpdate}
            isUpdating={isUpdating}
          />
        </div>
      ) : null}
    </div>
  );
} 