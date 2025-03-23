import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface UserStats {
  id: string;
  username: string;
  tokens: number;
  total_bets: number;
  winning_bets: number;
  total_won: number;
  win_rate: number;
  rank: number;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all users with their betting stats
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        username,
        tokens,
        bets!inner (
          id,
          completed,
          payout,
          result
        )
      `);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Process user stats
    const userStats: UserStats[] = users
      .map(user => {
        const completedBets = user.bets.filter(bet => bet.completed);
        const winningBets = completedBets.filter(bet => bet.result === 'WIN');
        const totalWon = winningBets.reduce((sum, bet) => sum + (bet.payout || 0), 0);
        const winRate = completedBets.length > 0 
          ? (winningBets.length / completedBets.length) * 100 
          : 0;

        return {
          id: user.id,
          username: user.username,
          tokens: user.tokens || 0,
          total_bets: completedBets.length,
          winning_bets: winningBets.length,
          total_won: totalWon,
          win_rate: winRate,
          rank: 0 // Will be calculated after sorting
        };
      })
      .filter(user => user.total_bets > 0) // Only include users who have placed bets
      .sort((a, b) => b.tokens - a.tokens) // Sort by token balance
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    return NextResponse.json({ 
      leaderboard: userStats,
      total_users: userStats.length
    });

  } catch (error) {
    console.error('Error in leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 