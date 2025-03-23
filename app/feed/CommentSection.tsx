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

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setIsLoading(true);
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
      const newCommentWithLikes = { ...data.comment, likes: { totalLikes: 0, userLiked: false } };
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

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <form onSubmit={handlePostComment} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 p-2 border rounded"
            disabled={!user}
          />
          <button
            type="submit"
            disabled={!user || !newComment.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </form>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-gray-500">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4 last:border-b-0">
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
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={isLoading}
                    title="Delete comment"
                  >
                    <img 
                      src="/trash.svg" 
                      alt="Delete" 
                      className="w-4 h-4"
                    />
                  </button>
                )}
              </div>
              <p className="mt-2">{comment.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 