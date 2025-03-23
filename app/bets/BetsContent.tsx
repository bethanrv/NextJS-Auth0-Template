"use client";
import { useState } from "react";

interface Bet {
  id: number;
  created_at: string;
  user_id: string;
  fight_id: number;
  selected_fighter: string;
  stake: number;
  completed: boolean;
  fight: {
    fighter_1_name: string;
    fighter_2_name: string;
    fighter_1_img: string;
    fighter_2_img: string;
    date: string;
    title: string;
    status: string;
    result_outcome: string | null;
  };
}

interface BetsContentProps {
  currentBets: Bet[];
  pastBets: Bet[];
  isLoggedIn: boolean;
}

export default function BetsContent({ currentBets, pastBets, isLoggedIn }: BetsContentProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');

  if (!isLoggedIn) {
    return (
      <div className="bg-white shadow p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-700">
          Please login to view your bets
        </h2>
      </div>
    );
  }

  const renderBetCard = (bet: Bet) => (
    <div key={bet.id} className="bg-white shadow rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{bet.fight.title}</h3>
        <span className="text-sm text-gray-500">
          {new Date(bet.created_at).toLocaleDateString()}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="square-container">
            <img src={bet.fight.fighter_1_img} className="square-image" alt={bet.fight.fighter_1_name} />
          </div>
          <div className="text-center">
            <p className="font-medium">{bet.fight.fighter_1_name}</p>
            <p className="text-sm text-gray-500">vs</p>
            <p className="font-medium">{bet.fight.fighter_2_name}</p>
          </div>
          <div className="square-container">
            <img src={bet.fight.fighter_2_img} className="square-image" alt={bet.fight.fighter_2_name} />
          </div>
        </div>
        
        <div className="text-right">
          <p className="font-medium">Stake: {bet.stake} tokens</p>
          <p className="text-sm text-gray-500">On: {bet.selected_fighter}</p>
        </div>
      </div>

      {bet.completed && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">
            Result: {bet.fight.result_outcome || 'Not available'}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white shadow p-6 rounded-lg">
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === 'current'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setActiveTab('current')}
        >
          Current Bets ({currentBets.length})
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === 'past'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setActiveTab('past')}
        >
          Past Bets ({pastBets.length})
        </button>
      </div>

      {activeTab === 'current' ? (
        <div>
          {currentBets.length === 0 ? (
            <p className="text-gray-500 text-center">No current bets</p>
          ) : (
            currentBets.map(renderBetCard)
          )}
        </div>
      ) : (
        <div>
          {pastBets.length === 0 ? (
            <p className="text-gray-500 text-center">No past bets</p>
          ) : (
            pastBets.map(renderBetCard)
          )}
        </div>
      )}
    </div>
  );
} 