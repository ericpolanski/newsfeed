'use client';

import React from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Define interface for comment author
interface CommentAuthor {
  id: string;
  username: string;
}

// Define interface for comment
export interface CommentProps {
  id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
  isAuthor: boolean;
}

// GraphQL query to fetch comments for a specific post
const GET_POST_COMMENTS = gql`
  query GetPostComments($postId: ID!) {
    postComments(postId: $postId) {
      id
      content
      author {
        id
        username
      }
      createdAt
      updatedAt
      isAuthor
    }
  }
`;

// GraphQL mutation for deleting a comment
const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id) {
      id
    }
  }
`;

interface CommentListProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
}

const CommentList: React.FC<CommentListProps> = ({ postId, onCommentCountChange }) => {
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState('');
  const [commentCount, setCommentCount] = React.useState(0);
  
  // Query to fetch comments
  const { loading, error, data } = useQuery(GET_POST_COMMENTS, {
    variables: { postId },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      const count = data?.postComments?.length || 0;
      setCommentCount(count);
      
      // Update parent component with comment count if callback provided
      if (onCommentCountChange) {
        onCommentCountChange(count);
      }
    }
  });
  
  // Mutation for deleting a comment
  const [deleteComment] = useMutation(DELETE_COMMENT, {
    refetchQueries: [{ 
      query: GET_POST_COMMENTS, 
      variables: { postId } 
    }],
    update: (cache) => {
      // Update the post's comments count in the cache
      try {
        const postCacheId = cache.identify({ __typename: 'Post', id: postId });
        cache.modify({
          id: postCacheId,
          fields: {
            commentsCount: (existingCount = 0) => Math.max(0, existingCount - 1)
          }
        });
      } catch (e) {
        console.error("Error updating comments count in cache:", e);
      }
    }
  });
  
  // Mutation for updating a comment
  const [updateComment] = useMutation(gql`
    mutation UpdateComment($id: ID!, $input: UpdateCommentInput!) {
      updateComment(id: $id, input: $input) {
        id
        content
        updatedAt
      }
    }
  `, {
    refetchQueries: [{ 
      query: GET_POST_COMMENTS, 
      variables: { postId } 
    }]
  });

  // Handle edit comment
  const handleEditComment = (comment: CommentProps) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  // Handle save edited comment
  const handleSaveComment = async (id: string) => {
    if (!editContent.trim()) {
      return;
    }

    try {
      await updateComment({
        variables: {
          id,
          input: { content: editContent }
        }
      });
      
      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        // Optimistically update UI
        const newCount = Math.max(0, commentCount - 1);
        setCommentCount(newCount);
        if (onCommentCountChange) {
          onCommentCountChange(newCount);
        }
        
        await deleteComment({ variables: { id } });
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment');
        
        // Revert on error
        setCommentCount(commentCount);
        if (onCommentCountChange) {
          onCommentCountChange(commentCount);
        }
      }
    }
  };

  if (loading) return <div style={{ color: 'var(--muted-text)' }}>Loading comments...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>Error loading comments: {error.message}</div>;

  const comments = data?.postComments || [];

  if (comments.length === 0) {
    return <div style={{ margin: '16px 0', fontStyle: 'italic', color: 'var(--muted-text)' }}>No comments yet</div>;
  }

  return (
    <div style={{ marginTop: '16px' }}>
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: 'bold', 
        marginBottom: '12px',
        color: 'var(--foreground)'
      }}>
        Comments ({comments.length})
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {comments.map((comment: CommentProps) => (
          <div key={comment.id} style={{ 
            padding: '12px', 
            backgroundColor: 'var(--secondary)', 
            borderRadius: '8px',
            border: '1px solid var(--card-border)'
          }}>
            {editingCommentId === comment.id ? (
              // Edit mode
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea 
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--input-border)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--foreground)',
                    minHeight: '80px',
                    width: '100%',
                    resize: 'vertical',
                    fontSize: '14px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setEditingCommentId(null)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--secondary)',
                      color: 'var(--secondary-text)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveComment(comment.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'var(--success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div>
                <div style={{ 
                  fontSize: '14px', 
                  marginBottom: '4px',
                  color: 'var(--secondary-text)'
                }}>
                  {comment.content}
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '8px',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '8px',
                  fontSize: '12px',
                  color: 'var(--muted-text)'
                }}>
                  <div>
                    <strong>{comment.author.username}</strong> • {new Date(comment.createdAt).toLocaleDateString()}
                  </div>
                  
                  {comment.isAuthor && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditComment(comment)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--secondary)',
                          color: 'var(--secondary-text)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--secondary)',
                          color: 'var(--danger)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentList;