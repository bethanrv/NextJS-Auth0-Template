import { createClient } from '@/utils/supabase/server';
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { fightId, selectedFighter, stake } = await request.json();

    // Validate inputs
    if (!fightId || !selectedFighter || !stake) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's current token balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, tokens')
      .eq('sid', session.user.sid)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough tokens
    if (userData.tokens < stake) {
      return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 });
    }

    // Start a transaction
    const { data: betData, error: betError } = await supabase
      .from('bets')
      .insert({
        fight_id: fightId,
        user_id: userData.id,
        selected_fighter: selectedFighter,
        stake: stake
      })
      .select()
      .single();

    if (betError) {
      return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 });
    }

    // Update user's token balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ tokens: userData.tokens - stake })
      .eq('id', userData.id);

    if (updateError) {
      // If token update fails, we should rollback the bet
      await supabase
        .from('bets')
        .delete()
        .eq('id', betData.id);
      return NextResponse.json({ error: 'Failed to update tokens' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      bet: betData,
      newTokenBalance: userData.tokens - stake 
    });

  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 