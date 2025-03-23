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
    const { commentId } = await request.json();

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('sid', session.user.sid)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already liked the comment
    const { data: existingLike, error: checkError } = await supabase
      .from('commentLikes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userData.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking like:', checkError);
      return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
    }

    if (existingLike) {
      // Unlike the comment
      const { error: deleteError } = await supabase
        .from('commentLikes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 });
      }

      return NextResponse.json({ liked: false });
    } else {
      // Like the comment
      const { error: insertError } = await supabase
        .from('commentLikes')
        .insert({
          comment_id: commentId,
          user_id: userData.id
        });

      if (insertError) {
        console.error('Error adding like:', insertError);
        return NextResponse.json({ error: 'Failed to add like' }, { status: 500 });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error in POST /api/comments/likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const session = await getSession();

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get total likes count
    const { count: totalLikes, error: countError } = await supabase
      .from('commentLikes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', commentId);

    if (countError) {
      console.error('Error getting likes count:', countError);
      return NextResponse.json({ error: 'Failed to get likes count' }, { status: 500 });
    }

    // If user is logged in, check if they liked the comment
    let userLiked = false;
    if (session?.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('sid', session.user.sid)
        .single();

      if (!userError && userData) {
        const { data: likeData, error: likeError } = await supabase
          .from('commentLikes')
          .select('id')
          .eq('comment_id', commentId)
          .eq('user_id', userData.id)
          .single();

        if (!likeError && likeData) {
          userLiked = true;
        }
      }
    }

    return NextResponse.json({
      totalLikes: totalLikes || 0,
      userLiked
    });
  } catch (error) {
    console.error('Error in GET /api/comments/likes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 