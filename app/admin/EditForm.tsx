"use client";

import { useState } from "react";

interface EditFormProps {
  initialName1: string;
  initialName2: string;
  event: Fight;
}

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
  poster_image_url: string | null
}

export default function EditForm({
  initialName1,
  initialName2,
  event,
}: EditFormProps) {
  const [name1, setName1] = useState(initialName1);
  const [name2, setName2] = useState(initialName2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/protected/updateFight/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: event.id,
          fighter_1_name: name1,
          fighter__name: name2
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update event");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div>
        <label className="block font-medium">Name 1</label>
        <input
          type="text"
          value={name1}
          onChange={(e) => setName1(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={loading}
        />
      </div>
      <div>
        <label className="block font-medium">Name 2</label>
        <input
          type="text"
          value={name2}
          onChange={(e) => setName2(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="action-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "Updating..." : "Submit"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && (
        <p className="text-green-500 mt-2">
          Event updated successfully ✅
        </p>
      )}
    </form>
  );
}
