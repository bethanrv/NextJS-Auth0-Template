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

export default function EventItem({ event }: { event: Fight }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <li key={event.id} className="p-4 bg-gray-100 rounded shadow flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium">
            {event.fighter_1_name} vs {event.fighter_2_name}
          </p>
          <p className="text-sm text-gray-600">
            Commence Time: {new Date(event.date).toLocaleString()}
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
          <EditForm event={event} initialName1={event.fighter_1_name} initialName2={event.fighter_2_name} initialImg1={event.fighter_1_img} initialImg2={event.fighter_2_img} />
        </div>
      )}
    </li>
  );
}
