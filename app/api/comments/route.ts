import { createClient } from '@/utils/supabase/server';
import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fightId = searchParams.get('fightId');

    if (!fightId) {
      return NextResponse.json({ error: 'Fight ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Fetch comments with user details
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        user:users (
          name,
          nickname
        )
      `)
      .eq('fight_id', fightId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({ comments });

  } catch (error) {
    console.error('Error in comments GET:', error);
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
    const { fightId, comment, parentCommentId } = await request.json();

    if (!fightId || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    // If this is a reply, verify the parent comment exists
    if (parentCommentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parentCommentId)
        .eq('fight_id', fightId)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    // Insert the comment
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        fight_id: fightId,
        user_id: userData.id,
        comment: comment,
        parent_comment_id: parentCommentId || null
      })
      .select(`
        *,
        user:users (
          name,
          nickname
        )
      `)
      .single();

    if (insertError) {
      console.error('Error inserting comment:', insertError);
      return NextResponse.json({ error: 'Failed to insert comment' }, { status: 500 });
    }

    return NextResponse.json({ comment: newComment });

  } catch (error) {
    console.error('Error in comments POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user's ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('sub', session.user.sub)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userData.id);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in comments DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 