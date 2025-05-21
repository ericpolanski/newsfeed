'use client';

import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { useAuth } from '../../context/AuthContext';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

interface PostAuthor {
  id: string;
  username: string;
}

export interface PostItemProps {
  id: string;
  title: string;
  content: string;
  author: PostAuthor;
  createdAt: string; // Assuming ISO string format
  updatedAt: string; // Assuming ISO string format
  isAuthor?: boolean; // Whether the current user is the author
  likesCount?: number; // Number of likes
  commentsCount?: number; // Number of comments
  isLiked?: boolean; // Whether the current user liked this post
  onEdit: (id: string) => void; // Added for editing
  onDelete: (id: string) => void; // Added for deleting
}

// Define GraphQL mutations for likes
const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likesCount
      isLiked
    }
  }
`;

const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      id
      likesCount
      isLiked
    }
  }
`;

const PostItem: React.FC<PostItemProps> = ({
  id,
  title,
  content,
  author,
  createdAt,
  isAuthor = false, // Default to false if not provided
  likesCount = 0,
  commentsCount = 0,
  isLiked = false,
  onEdit,
  onDelete,
}) => {
  const { isAuthenticated } = useAuth();
  const [showComments, setShowComments] = React.useState(false);

  // Track likes and comments state locally with refs to avoid unnecessary re-renders
  const [likeStatus, setLikeStatus] = React.useState({
    isLiked: isLiked,
    likesCount: likesCount
  });
  
  const [commentStatus, setCommentStatus] = React.useState({
    commentsCount: commentsCount,
    isLoading: false
  });
  
  // Use refs to track the latest state without causing re-renders
  const likeStatusRef = React.useRef(likeStatus);
  const commentStatusRef = React.useRef(commentStatus);
  
  // Update refs when state changes
  React.useEffect(() => {
    likeStatusRef.current = likeStatus;
  }, [likeStatus]);
  
  React.useEffect(() => {
    commentStatusRef.current = commentStatus;
  }, [commentStatus]);
  
  // Update local state when props change, but only if they differ from our internal state
  React.useEffect(() => {
    if (isLiked !== likeStatusRef.current.isLiked || likesCount !== likeStatusRef.current.likesCount) {
      setLikeStatus({
        isLiked: isLiked,
        likesCount: likesCount
      });
    }
    
    if (commentsCount !== commentStatusRef.current.commentsCount && !commentStatusRef.current.isLoading) {
      setCommentStatus(prev => ({
        ...prev,
        commentsCount: commentsCount
      }));
    }
  }, [isLiked, likesCount, commentsCount]);

  // Like post mutation
  const [likePost] = useMutation(LIKE_POST, {
    variables: { postId: id },
    optimisticResponse: {
      likePost: {
        __typename: 'Post',
        id,
        likesCount: likeStatus.likesCount + 1,
        isLiked: true
      }
    },
    onCompleted: (data) => {
      // Update local state
      setLikeStatus({
        isLiked: true,
        likesCount: data.likePost.likesCount
      });
    },
    update: (cache, { data }) => {
      // Update cache
      cache.modify({
        id: cache.identify({ __typename: 'Post', id }),
        fields: {
          likesCount: () => data.likePost.likesCount,
          isLiked: () => true
        }
      });
      
      // Also update the post in allPosts query if it exists
      try {
        const cacheId = cache.identify({ __typename: 'Post', id });
        const fragment = gql`
          fragment UpdatedPost on Post {
            likesCount
            isLiked
          }
        `;
        cache.writeFragment({
          id: cacheId,
          fragment,
          data: {
            likesCount: data.likePost.likesCount,
            isLiked: true
          }
        });
      } catch (e) {
        console.error("Error updating cache:", e);
      }
    }
  });

  // Unlike post mutation
  const [unlikePost] = useMutation(UNLIKE_POST, {
    variables: { postId: id },
    optimisticResponse: {
      unlikePost: {
        __typename: 'Post',
        id,
        likesCount: Math.max(0, likeStatus.likesCount - 1),
        isLiked: false
      }
    },
    onCompleted: (data) => {
      // Update local state
      setLikeStatus({
        isLiked: false,
        likesCount: data.unlikePost.likesCount
      });
    },
    update: (cache, { data }) => {
      // Update cache
      cache.modify({
        id: cache.identify({ __typename: 'Post', id }),
        fields: {
          likesCount: () => data.unlikePost.likesCount,
          isLiked: () => false
        }
      });
      
      // Also update the post in allPosts query if it exists
      try {
        const cacheId = cache.identify({ __typename: 'Post', id });
        const fragment = gql`
          fragment UpdatedPost on Post {
            likesCount
            isLiked
          }
        `;
        cache.writeFragment({
          id: cacheId,
          fragment,
          data: {
            likesCount: data.unlikePost.likesCount,
            isLiked: false
          }
        });
      } catch (e) {
        console.error("Error updating cache:", e);
      }
    }
  });

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      alert("You must be logged in to like posts");
      return;
    }
    
    // Store current values for potential reversion
    const previousIsLiked = likeStatus.isLiked;
    const previousCount = likeStatus.likesCount;
    
    // Optimistically update UI before the server response
    if (likeStatus.isLiked) {
      // Optimistic update - immediately reflect in UI
      setLikeStatus({
        isLiked: false,
        likesCount: Math.max(0, likeStatus.likesCount - 1)
      });
      
      // Call the mutation after state update
      unlikePost()
        .catch(() => {
          // Revert on error
          setLikeStatus({
            isLiked: previousIsLiked,
            likesCount: previousCount
          });
        });
    } else {
      // Optimistic update - immediately reflect in UI
      setLikeStatus({
        isLiked: true,
        likesCount: likeStatus.likesCount + 1
      });
      
      // Call the mutation after state update
      likePost()
        .catch(() => {
          // Revert on error
          setLikeStatus({
            isLiked: previousIsLiked,
            likesCount: previousCount
          });
        });
    }
  };
  
  const handleCommentClick = () => {
    setShowComments(!showComments);
  };

  return (
    <div style={{ 
      border: '1px solid var(--card-border)',
      borderRadius: '8px',
      margin: '16px 0',
      padding: '16px',
      boxShadow: '0 2px 4px var(--card-shadow)',
      backgroundColor: 'var(--card-background)',
      transition: 'transform 0.2s ease, background-color 0.3s ease, border-color 0.3s ease',
      cursor: 'default'
    }}>
      <h2 style={{ 
        marginTop: '0', 
        color: 'var(--foreground)',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '8px',
        fontWeight: '700',
        fontSize: '1.5rem'
      }}>{title}</h2>
      
      <p style={{ 
        fontSize: '16px',
        lineHeight: '1.6',
        color: 'var(--secondary-text)'
      }}>{content}</p>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border)',
        fontSize: '14px',
        color: 'var(--muted-text)'
      }}>
        <div>
          <strong>By:</strong> {author.username} <br />
          <span style={{ fontSize: '12px' }}>
            Posted: {new Date(createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Like button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleLikeClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: likeStatus.isLiked ? 'var(--primary)' : 'var(--secondary)',
                color: likeStatus.isLiked ? 'white' : 'var(--secondary-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              <span role="img" aria-label="like">
                👍
              </span>
              {likeStatus.isLiked ? 'Liked' : 'Like'} ({likeStatus.likesCount})
            </button>
          </div>

          {/* Comment button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={handleCommentClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: showComments ? 'var(--primary)' : 'var(--secondary)',
                color: showComments ? 'white' : 'var(--secondary-text)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              <span role="img" aria-label="comment">
                💬
              </span>
              Comments ({commentStatus.commentsCount})
            </button>
          </div>
          
          {/* Edit/Delete buttons */}
          {isAuthor && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => onEdit(id)} 
                style={{ 
                  padding: '6px 12px',
                  backgroundColor: 'var(--success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Edit
              </button>
              
              <button 
                onClick={() => onDelete(id)} 
                style={{ 
                  padding: '6px 12px',
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Comments section (shown/hidden based on state) */}
      {showComments && (
        <div style={{ 
          marginTop: '20px', 
          borderTop: '1px solid var(--border)',
          paddingTop: '16px'
        }}>
          {/* Comment Form */}
          {isAuthenticated && (
            <CommentForm 
              postId={id} 
              onCommentAdded={() => {
                // Update local comment count when a comment is added
                const newCount = commentStatus.commentsCount + 1;
                setCommentStatus(prev => ({
                  ...prev,
                  commentsCount: newCount
                }));
                console.log(`Comment added, new count: ${newCount}`);
              }} 
            />
          )}

          {/* Comments List */}
          <CommentList 
            postId={id} 
            onCommentCountChange={(count) => {
              // Update local comment count when comments are loaded or changed
              setCommentStatus(prev => ({
                ...prev,
                commentsCount: count
              }));
            }} 
          />
        </div>
      )}
    </div>
  );
};

export default PostItem;