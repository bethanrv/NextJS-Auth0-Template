"use client";

import { useState } from "react";

interface EditFormProps {
  initialHomeTeam: string;
  initialAwayTeam: string;
  event: Event;
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

export default function EditForm({
  initialHomeTeam,
  initialAwayTeam,
  event,
}: EditFormProps) {
  const [homeTeam, setHomeTeam] = useState(initialHomeTeam);
  const [awayTeam, setAwayTeam] = useState(initialAwayTeam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/protected/updateEvent/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: event.id,
          home_team: homeTeam,
          away_team: awayTeam
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
          value={homeTeam}
          onChange={(e) => setHomeTeam(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={loading}
        />
      </div>
      <div>
        <label className="block font-medium">Name 2</label>
        <input
          type="text"
          value={awayTeam}
          onChange={(e) => setAwayTeam(e.target.value)}
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
