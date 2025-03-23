"use client";
import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

interface Comment {
  id: number;
  created_at: string;
  comment: string;
  user: {
    name: string;
    nickname: string;
  };
  user_id: string;
  likes?: {
    totalLikes: number;
    userLiked: boolean;
  };
  parent_comment_id: number | null;
}

interface CommentSectionProps {
  fightId: number;
  isVisible: boolean;
}

export default function CommentSection({ fightId, isVisible }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    }

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
  };

  useEffect(() => {
    if (isVisible) {
      fetchComments();
      fetchCurrentUserId();
    }
  }, [isVisible, fightId]);

  const fetchCurrentUserId = async () => {
    if (!user) {
      console.log('No user found in session');
      return;
    }
    try {
      console.log('Fetching user ID for user:', user);
      const response = await fetch('/api/users/me');
      if (!response.ok) {
        console.error('Failed to fetch user data:', response.status);
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      console.log('Received user data:', data);
      setCurrentUserId(data.user.id);
    } catch (err) {
      console.error('Error fetching user ID:', err);
    }
  };

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments?fightId=${fightId}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      
      // Fetch likes for each comment
      const commentsWithLikes = await Promise.all(
        data.comments.map(async (comment: Comment) => {
          const likesResponse = await fetch(`/api/comments/likes?commentId=${comment.id}`);
          if (!likesResponse.ok) return comment;
          const likesData = await likesResponse.json();
          return { ...comment, likes: likesData };
        })
      );
      
      // Sort comments by like count in descending order
      const sortedComments = [...commentsWithLikes].sort((a, b) => {
        const likesA = a.likes?.totalLikes || 0;
        const likesB = b.likes?.totalLikes || 0;
        return likesB - likesA;
      });
      
      setComments(sortedComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fightId,
          comment: newComment.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment');
      
      const data = await response.json();
      // Add new comment with 0 likes and sort the array
      const newCommentWithLikes = { ...data.comment, likes: { totalLikes: 0, userLiked: false }, parent_comment_id: null };
      setComments(prev => [...prev, newCommentWithLikes].sort((a, b) => {
        const likesA = a.likes?.totalLikes || 0;
        const likesB = b.likes?.totalLikes || 0;
        return likesB - likesA;
      }));
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fightId,
          comment: replyText.trim(),
          parentCommentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      const data = await response.json();
      setComments(prev => [...prev, { ...data.comment, parent_comment_id: parentCommentId }]);
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Error posting reply:', err);
      setError('Failed to post reply');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete comment');
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/comments/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId }),
      });

      if (!response.ok) throw new Error('Failed to update like');
      
      const data = await response.json();
      
      // Update the comment's like status and sort the array
      setComments(prev => {
        const updatedComments = prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes: {
                  totalLikes: (comment.likes?.totalLikes || 0) + (data.liked ? 1 : -1),
                  userLiked: data.liked
                }
              }
            : comment
        );
        return updatedComments.sort((a, b) => {
          const likesA = a.likes?.totalLikes || 0;
          const likesB = b.likes?.totalLikes || 0;
          return likesB - likesA;
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like');
    }
  };

  const renderComment = (comment: Comment) => {
    const replies = comments.filter(c => c.parent_comment_id === comment.id);
    
    return (
      <div key={comment.id} className="mb-4">
        <div className="bg-white rounded-lg p-4 shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{comment.user.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-gray-600 text-sm">
                  {formatTimeAgo(comment.created_at)}
                </p>
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className="flex items-center gap-1 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={!user}
                  title={user ? "Like comment" : "Login to like"}
                >
                  <img 
                    src="/heart.svg" 
                    alt="Like" 
                    className="w-4 h-4"
                    style={{
                      filter: comment.likes?.userLiked 
                        ? 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(97%) contrast(97%)' 
                        : 'brightness(0) invert(0.7)'
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    {comment.likes?.totalLikes || 0}
                  </span>
                </button>
              </div>
            </div>
            {user && currentUserId !== null && currentUserId === Number(comment.user_id) && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>
          <p className="mt-2">{comment.comment}</p>
          <div className="mt-2 flex items-center space-x-2">
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Reply
            </button>
          </div>
        </div>

        {replyingTo === comment.id && (
          <form onSubmit={(e) => handleSubmitReply(comment.id, e)} className="ml-8 mt-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="w-full p-2 border rounded"
              rows={2}
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !replyText.trim()}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        )}

        {replies.length > 0 && (
          <div className="ml-8 mt-2">
            {replies.map(reply => renderComment(reply))}
          </div>
        )}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      
      <form onSubmit={handleSubmitComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-2 border rounded"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={isLoading || !newComment.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      <div className="space-y-4">
        {comments
          .filter(comment => !comment.parent_comment_id) // Only show top-level comments
          .map(comment => renderComment(comment))}
      </div>
    </div>
  );
} 