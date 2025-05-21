'use client';

import React, { useState, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import { PostItemProps } from './PostItem';
import { useAuth } from '../context/AuthContext';

// Define the GraphQL mutation
const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      title
      content
      author {
        id
        username
      }
      createdAt
      updatedAt
    }
  }
`;

// Re-using the query from PostList to refetch after mutation
const GET_ALL_POSTS = gql`
  query GetAllPosts {
    allPosts {
      id
      title
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

interface EditPostFormProps {
  post: PostItemProps;
  onCancel: () => void;
}

const EditPostForm: React.FC<EditPostFormProps> = ({ post, onCancel }) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const { user } = useAuth();
  
  // Check if the current user is the author of the post
  const isAuthorized = user?.id === post.author.id;

  const [updatePost, { loading, error }] = useMutation(UPDATE_POST, {
    refetchQueries: [
      { query: GET_ALL_POSTS }
    ],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      console.log("Post update completed:", data);
      alert('Post updated successfully!');
      onCancel(); // Close the edit form
    },
    onError: (error) => {
      console.error("Error updating post:", error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Please fill in title and content.');
      return;
    }
    
    // Ensure the user is authorized to edit this post
    if (!isAuthorized) {
      alert('You are not authorized to edit this post.');
      onCancel();
      return;
    }
    
    try {
      await updatePost({
        variables: {
          id: post.id,
          input: {
            title,
            content
          }
        }
      });
    } catch (err) {
      console.error("Failed to update post:", err);
    }
  };

  // If not authorized, show an error message and return to post list
  if (!isAuthorized) {
    setTimeout(() => {
      onCancel(); // Return to post list after showing message
    }, 2000);
    
    return (
      <div style={{ 
        margin: '20px', 
        padding: '20px', 
        border: '1px solid #f44336',
        borderRadius: '5px',
        backgroundColor: '#ffebee',
        color: '#c62828',
        textAlign: 'center'
      }}>
        <h3>Not Authorized</h3>
        <p>You do not have permission to edit this post.</p>
        <p>Redirecting back to the post list...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ 
      margin: '20px', 
      padding: '20px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Edit Post</h3>
      <div>
        <label htmlFor="title">Title: </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ 
            marginBottom: '10px', 
            padding: '8px', 
            width: 'calc(100% - 16px)',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
      </div>
      <div>
        <label htmlFor="content">Content: </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          style={{ 
            marginBottom: '10px', 
            padding: '8px', 
            width: 'calc(100% - 16px)', 
            minHeight: '100px',
            borderRadius: '4px',
            border: '1px solid #ccc' 
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '10px 15px', 
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {loading ? 'Updating...' : 'Update Post'}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          style={{ 
            padding: '10px 15px', 
            cursor: 'pointer',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Cancel
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>Error updating post: {error.message}</p>}
    </form>
  );
};

export default EditPostForm;
