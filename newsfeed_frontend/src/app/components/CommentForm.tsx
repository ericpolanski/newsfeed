'use client';

import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';

// GraphQL mutation for creating a comment
const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
      content
      createdAt
      author {
        id
        username
      }
    }
  }
`;

// GraphQL query to fetch comments (for refetching after mutations)
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

interface CommentFormProps {
  postId: string;
  onCommentAdded?: () => void; // Optional callback for when a comment is added
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, onCommentAdded }) => {
  const [commentContent, setCommentContent] = useState('');
  const { isAuthenticated } = useAuth();
  
  // Create comment mutation
  const [createComment, { loading }] = useMutation(CREATE_COMMENT, {
    optimisticResponse: {
      createComment: {
        __typename: 'Comment',
        id: 'temp-id-' + Date.now(),
        content: commentContent,
        createdAt: new Date().toISOString(),
        author: {
          __typename: 'User',
          id: 'current-user',
          username: 'You'
        }
      }
    },
    update: (cache, { data: { createComment } }) => {
      // Update comments count in the post
      const postRef = cache.identify({ __typename: 'Post', id: postId });
      cache.modify({
        id: postRef,
        fields: {
          commentsCount: (existing = 0) => existing + 1
        }
      });

      // Update the comments list
      const existingComments = cache.readQuery({
        query: GET_POST_COMMENTS,
        variables: { postId }
      });

      if (existingComments) {
        cache.writeQuery({
          query: GET_POST_COMMENTS,
          variables: { postId },
          data: {
            postComments: [createComment, ...existingComments.postComments]
          }
        });
      }
    },
    onCompleted: () => {
      setCommentContent(''); // Clear the form after successful submission
      if (onCommentAdded) {
        onCommentAdded(); // Notify parent component
      }
    },
    update: (cache, { data }) => {
      // Update the post's comments count in the cache
      try {
        const postCacheId = cache.identify({ __typename: 'Post', id: postId });
        cache.modify({
          id: postCacheId,
          fields: {
            commentsCount: (existingCount = 0) => existingCount + 1
          }
        });
      } catch (e) {
        console.error("Error updating comments count in cache:", e);
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('You must be logged in to comment');
      return;
    }
    
    if (!commentContent.trim()) {
      return; // Don't submit empty comments
    }
    
    try {
      await createComment({
        variables: {
          input: {
            postId,
            content: commentContent.trim()
          }
        }
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to post comment');
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
        Add a comment
      </h3>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="Write your comment..."
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            minHeight: '80px',
            marginBottom: '8px',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '14px'
          }}
          disabled={loading}
        />
        
        <button
          type="submit"
          disabled={loading || !commentContent.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4267B2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !commentContent.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !commentContent.trim() ? 0.7 : 1,
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background-color 0.2s ease'
          }}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
};

export default CommentForm;
