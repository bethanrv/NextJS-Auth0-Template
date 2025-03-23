"use client";

import { useState } from "react";

interface EditFormProps {
  initialName1: string;
  initialName2: string;
  initialImg1: string;
  initialImg2: string;
  initialPosterUrl: string | null;
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
  poster_image_url: string | null,
  fighter_1_full_name: string,
  fighter_2_full_name: string,
  fighter_1_img: string,
  fighter_2_img: string,
}

export default function EditForm({
  initialName1,
  initialName2,
  initialImg1,
  initialImg2,
  initialPosterUrl,
  event,
}: EditFormProps) {
  const [name1, setName1] = useState(initialName1);
  const [name2, setName2] = useState(initialName2);
  const [img1, setImg1] = useState(initialImg1);
  const [img2, setImg2] = useState(initialImg2);
  const [posterUrl, setPosterUrl] = useState(initialPosterUrl || "");
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
          fighter_2_name: name2,
          fighter_1_img: img1,
          fighter_2_img: img2,
          poster_image_url: posterUrl || null,
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

      <div>
        <img src={img1} />
        <label className="block font-medium">Img 1</label>
        <input
          type="text"
          value={img1}
          onChange={(e) => setImg1(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={loading}
        />
      </div>
      <div>
        <img src={img2} />
        <label className="block font-medium">Img 2</label>
        <input
          type="text"
          value={img2}
          onChange={(e) => setImg2(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block font-medium">Poster Image URL</label>
        <input
          type="text"
          value={posterUrl}
          onChange={(e) => setPosterUrl(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={loading}
          placeholder="Enter poster image URL"
        />
        {posterUrl && (
          <div className="mt-2 max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-2">
            <img 
              src={posterUrl} 
              alt="Poster preview" 
              className="max-h-[200px] w-auto mx-auto object-contain"
            />
          </div>
        )}
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
