"use client";
import { useState, useEffect } from "react";
import FeedItem from "./FeedItem";

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

interface FeedItemsWrapperProps {
  events: Fight[];
  canBet: boolean;
  initialTokenBalance: number;
  onTokenUpdate: (newBalance: number) => void;
  isUpdating: boolean;
}

export default function FeedItemsWrapper({ events, canBet, initialTokenBalance, onTokenUpdate, isUpdating }: FeedItemsWrapperProps) {
  const [tokenBalance, setTokenBalance] = useState(initialTokenBalance);

  // Update token balance when initialTokenBalance changes
  useEffect(() => {
    setTokenBalance(initialTokenBalance);
  }, [initialTokenBalance]);

  return (
    <ul className="space-y-2">
      {events.map((event) => (
        <FeedItem 
          key={event.id} 
          event={event} 
          canBet={canBet}
          onTokenUpdate={onTokenUpdate}
          isUpdating={isUpdating}
        />
      ))}
    </ul>
  );
} 