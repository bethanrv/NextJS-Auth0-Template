import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@auth0/nextjs-auth0";
import BetsContent from "./BetsContent";
import { headers } from 'next/headers';

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

export default async function BetsPage() {
  const session = await getSession();
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  if (!session?.user) {
    redirect('/api/auth/login');
  }

  // Fetch bets from the API
  const response = await fetch(`${protocol}://${host}/api/bets`, {
    headers: {
      Cookie: headersList.get('cookie') || ''
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch bets:', await response.text());
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-red-600">
              Error loading bets. Please try again later.
            </h2>
          </div>
        </div>
      </div>
    );
  }

  const { bets } = await response.json();

  // Separate bets into current and past
  const currentBets = bets.filter((bet: Bet) => !bet.completed);
  const pastBets = bets.filter((bet: Bet) => bet.completed);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <BetsContent 
          currentBets={currentBets}
          pastBets={pastBets}
          isLoggedIn={!!session?.user}
        />
      </div>
    </div>
  );
} 