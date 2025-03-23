import { createClient } from '@/utils/supabase/server';
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('sid', session.user.sid)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's bets with fight details
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select(`
        *,
        fight:fights (
          fighter_1_name,
          fighter_2_name,
          fighter_1_img,
          fighter_2_img,
          date,
          title,
          status,
          result_outcome
        )
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    if (betsError) {
      return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 });
    }

    return NextResponse.json({ bets });

  } catch (error) {
    console.error('Error fetching bets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // First, ensure the user exists in the database
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('sid', session.user.sid)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking user:', userCheckError);
      return NextResponse.json({ error: 'Failed to check user status' }, { status: 500 });
    }

    let userData;
    if (!existingUser) {
      console.log('Creating new user with data:', {
        sid: session.user.sid,
        name: session.user.name,
        nickname: session.user.nickname,
        tokens: 100
      });

      // Create the user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          sid: session.user.sid,
          name: session.user.name,
          nickname: session.user.nickname,
          tokens: 100
        })
        .select()
        .single();

      if (createError) {
        console.error('Detailed error creating user:', {
          code: createError.code,
          message: createError.message,
          details: createError.details,
          hint: createError.hint
        });
        return NextResponse.json({ 
          error: 'Failed to create user',
          details: createError.message 
        }, { status: 500 });
      }
      userData = newUser;
      console.log('Successfully created new user:', userData);
    } else {
      userData = existingUser;
      console.log('Using existing user:', userData);
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