import { createClient } from '@/utils/supabase/server';
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { newBalance } = await request.json();

    if (typeof newBalance !== 'number') {
      return NextResponse.json({ error: 'Invalid token balance' }, { status: 400 });
    }

    // First get the user's ID using their sub
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('sub', session.user.sub)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user's tokens using their ID
    const { error: updateError } = await supabase
      .from('users')
      .update({ tokens: newBalance })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error updating tokens:', updateError);
      return NextResponse.json({ error: 'Failed to update tokens' }, { status: 500 });
    }

    return NextResponse.json({ success: true, newBalance });

  } catch (error) {
    console.error('Error updating tokens:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 