'use client';

import React, { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from './ErrorMessage';

// Define the GraphQL mutation (ensure it matches your backend schema.py)
const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
      author {
        id
        username
      }
      createdAt
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

// Using Record<string, never> instead of empty interface for better typing
interface CreatePostFormProps {
  // This is intentionally empty as we might add props later
  _unused?: never;
}

const CreatePostForm: React.FC<CreatePostFormProps> = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get authentication state
  const { user, isAuthenticated } = useAuth();

  const [createPost, { loading, error: mutationError }] = useMutation(CREATE_POST, {
    refetchQueries: [
      { query: GET_ALL_POSTS }
    ],
    awaitRefetchQueries: true, // Ensure refetch completes before mutation is considered done
    onCompleted: (data) => {
      console.log("Post creation completed:", data);
      setTitle('');
      setContent('');
      setIsFormVisible(false); // Hide form after successful submission
    },
    onError: (error) => {
      console.error("Error creating post:", error);
      setErrorMessage(error.message || 'Error creating post. Please try again.');
    }
  });

  // Handle mutation error display
  React.useEffect(() => {
    if (mutationError) {
      setErrorMessage(mutationError.message);
    }
  }, [mutationError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!title.trim() || !content.trim()) {
      setErrorMessage('Please fill in both title and content.');
      return;
    }
    
    if (!isAuthenticated || !user) {
      setErrorMessage('You must be logged in to create a post.');
      return;
    }
    
    try {
      await createPost({ 
        variables: { 
          input: { 
            title, 
            content 
          }
        } 
      });
    } catch (err) {
      // This catch block is for network errors not caught by Apollo's onError
      console.error("Failed to create post:", err);
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  // If not authenticated, don't show form button
  if (!isAuthenticated) {
    return (
      <div className="mb-8 p-4 bg-blue-50 rounded-md border border-blue-200 text-center">
        <p className="text-blue-800">Please log in to create posts.</p>
      </div>
    );
  }

  return (
    <div className="mb-8 flex justify-center">
      {!isFormVisible ? (
        <button
          onClick={() => setIsFormVisible(true)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Create New Post
        </button>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md w-full">
          <h2 className="text-xl font-bold mb-4">Create a New Post</h2>
          
          {errorMessage && (
            <ErrorMessage
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
              type="error"
            />
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter post title"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={6}
                placeholder="Write your post content here..."
                required
              ></textarea>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsFormVisible(false);
                  setTitle('');
                  setContent('');
                  setErrorMessage(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreatePostForm;
