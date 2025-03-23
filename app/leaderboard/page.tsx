import { createClient } from '@/utils/supabase/server';
import LeaderboardContent from './LeaderboardContent';

export default async function LeaderboardPage() {
  const supabase = await createClient();
  
  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession();
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Betting Leaderboard
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            See how you stack up against other bettors
          </p>
          <img src="/leaderboard.svg" alt="Leaderboard" className="w-[15rem] mx-auto" />
        </div>
        
        <LeaderboardContent currentUserId={session?.user?.id} />
      </div>
    </div>
  );
} 