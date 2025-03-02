// components/EventItem.tsx
"use client";

import { useState } from "react";
import EditForm from "./EditForm"; // Your Client Component for editing the event

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

export default function EventItem({ event }: { event: Event }) {
  const [isEditing, setIsEditing] = useState(false);

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
        <button
          onClick={() => setIsEditing((prev) => !prev)}
          className="ml-4 inline-flex items-center px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <img src="/edit.svg" alt="Edit" className="w-5 h-5" />
        </button>
      </div>
      {/* Conditionally render the edit form */}
      {isEditing && (
        <div className="mt-2">
          <EditForm event={event} initialHomeTeam={event.home_team} initialAwayTeam={event.away_team} />
        </div>
      )}
    </li>
  );
}
