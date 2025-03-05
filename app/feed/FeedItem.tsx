"use client";
import { useState } from "react";

interface Event {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: string;
  home_team: string;
  away_team: string;
  scores: string;
  last_updated: string;
}

export default function FeedItem({ event }: { event: Event }) {
  return (
        
    <li key={event.id} className="p-4 bg-gray-100 rounded shadow flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium">
            {event.home_team} vs {event.away_team}
          </p>
          <p className="text-sm text-gray-600">
            Commence Time: {new Date(event.commence_time).toLocaleString()}
          </p>
        </div>
      </div>
    </li>
  );
}
