import { createClient } from '@/utils/supabase/server';
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', session.user);
    const supabase = await createClient();
    
    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('sub', session.user.sub)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userData) {
      console.log('No user data found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user data:', userData);
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error in GET /api/users/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 