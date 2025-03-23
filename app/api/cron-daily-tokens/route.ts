import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, tokens');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users found' });
    }

    const DAILY_TOKENS = 10;
    let updatedCount = 0;

    // Update each user's token balance
    for (const user of users) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ tokens: (user.tokens || 0) + DAILY_TOKENS })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Error updating tokens for user ${user.id}:`, updateError);
        continue;
      }

      updatedCount++;
      console.log(`Added ${DAILY_TOKENS} tokens to user ${user.id}`);
    }

    return NextResponse.json({ 
      message: 'Successfully distributed daily tokens',
      usersUpdated: updatedCount,
      totalUsers: users.length
    });

  } catch (error) {
    console.error('Error in cron-daily-tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic'; 