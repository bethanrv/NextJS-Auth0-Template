"use client";
import { useState } from "react";

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

interface FeedItemProps {
  event: Fight; 
  canBet: boolean; 
  onTokenUpdate: (newBalance: number) => void;
  isUpdating: boolean;
  userTokenBalance: number;
}

interface dbEvent {
  id: string;
  sport_key : string;
  sport_title : string;
  commence_time : string;
  completed : string;
  home_team : string;
  away_team : string;
  home_team_price: number;
  away_team_price: number;
  scores : string | null;
  last_updated : string | null;
}

function getLastName(name : string) {
  if(! name.includes(' ')) return name

  const lastName = name.substring(name.lastIndexOf(' ') + 1)

  if( lastName.length < 3) {
    if( name.split(' ').length >= 2 ) {
      const names = name.split(' ')
      if(names[names.length-1].toLocaleLowerCase() == 'jr')
        return names[names.length-2]  
      return names[names.length-2] + ' ' + names[names.length-1]
    }
  }

  return name.substring(name.lastIndexOf(' ') + 1).toUpperCase()
}

function getPriceClass(price : number) {
  if (price > 0) return 'green-main'
  else if (price < 0) return 'red-main'
  return 'hidden'
}

function getBetBtnClass(canBet : boolean) {
  if (canBet) {
    return 'bet-btn'
  }
  return 'hidden'
}

export default function FeedItem({ event, canBet, onTokenUpdate, isUpdating, userTokenBalance }:FeedItemProps) {
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBetClick = () => {
    setShowBetModal(true);
    setSelectedFighter(null);
    setBetAmount(1);
    setError('');
  };

  const handlePlaceBet = async () => {
    if (!selectedFighter) {
      setError('Please select a fighter');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fightId: event.id,
          selectedFighter: selectedFighter === 1 ? event.fighter_1_name : event.fighter_2_name,
          stake: betAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bet');
      }

      // Update token balance in parent component
      if (onTokenUpdate) {
        onTokenUpdate(data.newTokenBalance);
      }

      setShowBetModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setBetAmount(value);
  };

  const handleIncrement = () => {
    setBetAmount(prev => Math.min(prev + 1, userTokenBalance));
  };

  const handleDecrement = () => {
    setBetAmount(prev => Math.max(prev - 1, 1));
  };

  return (
    <>
      <li key={event.id} className="feed-item bg-gray-100 rounded shadow flex flex-col"  style={{ 
        backgroundImage: `url('${event.poster_image_url}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        borderRadius: '10px',
        marginBottom: '1.5rem'
      }}>
        <div className="flex items-center justify-between" style={{backdropFilter:'blur(5px) brightness(60%) grayscale(50%)', borderRadius:'10px'}}>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', width:'100%'}}>
            
            <div style={{display: 'flex', justifyContent:'space-evenly', alignItems:'center', width:'100%'}}>
             
              <div style={{display: 'flex'}}>
                <div className="square-container">
                  <img src={event.fighter_1_img} className="square-image" alt=""/>
                </div>
              </div>

              <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                <div className="fightCardTitle" style={{marginTop:'1rem'}}> 
                  <p> {event.fighter_1_name} </p>
                </div>
                <p className="fightCardTitle" style={{fontSize:'1.5rem'}} > VS. </p>
                <div className="fightCardTitle"> 
                  <p> {event.fighter_2_name} </p>
                </div>
              </div>

              <div style={{display: 'flex'}}>
                <div className="square-container">
                  <img src={event.fighter_2_img} className="square-image" alt=""/>
                </div>
              </div>

            </div>

            <p style={{textAlign:'center'}}> {event.title} </p>
            <p style={{textAlign:'center'}}> {event.location} </p>
            <p className="text-sm" style={{textAlign:'center', marginTop: '5px'}}>
              {new Date(event.date).toLocaleString()}
            </p>
            <button 
              style={{marginBottom:'1rem'}} 
              className={getBetBtnClass(canBet)}
              onClick={handleBetClick}
              disabled={isUpdating}
            > 
              Bet Now 
            </button>
          </div>
        </div>
      </li>

      {/* Betting Modal */}
      {showBetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Place Your Bet</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Fighter
              </label>
              <div className="flex space-x-4">
                <button
                  className={`flex-1 py-2 px-4 rounded ${
                    selectedFighter === 1 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setSelectedFighter(1)}
                  disabled={isSubmitting || isUpdating}
                >
                  {event.fighter_1_name}
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded ${
                    selectedFighter === 2 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                  onClick={() => setSelectedFighter(2)}
                  disabled={isSubmitting || isUpdating}
                >
                  {event.fighter_2_name}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bet Amount (tokens)
              </label>
              <div className="flex items-center space-x-4">
                <button
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                  onClick={handleDecrement}
                  disabled={betAmount <= 1 || isSubmitting || isUpdating}
                >
                  -
                </button>
                <input
                  type="range"
                  min="1"
                  max={userTokenBalance}
                  value={betAmount}
                  onChange={handleSliderChange}
                  className="flex-1"
                  disabled={isSubmitting || isUpdating}
                />
                <button
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                  onClick={handleIncrement}
                  disabled={betAmount >= userTokenBalance || isSubmitting || isUpdating}
                >
                  +
                </button>
              </div>
              <div className="text-center mt-2 text-sm text-gray-600">
                {betAmount} tokens
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
                onClick={() => setShowBetModal(false)}
                disabled={isSubmitting || isUpdating}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-blue-600 text-white rounded ${
                  (isSubmitting || isUpdating || userTokenBalance === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handlePlaceBet}
                disabled={isSubmitting || isUpdating || userTokenBalance === 0}
              >
                {isSubmitting ? 'Placing Bet...' : userTokenBalance === 0 ? 'No Tokens Available' : 'Place Bet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
