'use client';

import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import PostItem, { PostItemProps } from './PostItem';
import EditPostForm from './EditPostForm';

// Define the GraphQL query
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
      likesCount
      commentsCount
      isLiked
      __typename
    }
  }
`;

// Define the GraphQL mutation for deleting posts
const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
`;

interface AllPostsData {
  allPosts: PostItemProps[];
}

const PostList: React.FC = () => {
  const [postToEdit, setPostToEdit] = useState<PostItemProps | null>(null);

  const { loading, error, data } = useQuery<AllPostsData>(GET_ALL_POSTS, {
    fetchPolicy: 'network-only', // Always fetch from network, bypass cache
    onCompleted: (data) => {
      console.log("PostList query completed, received data:", data);
    },
    onError: (error) => {
      console.error("PostList query error:", error);
    }
  });

  const [deletePostMutation] = useMutation(DELETE_POST_MUTATION, {
    refetchQueries: [{ query: GET_ALL_POSTS }],
    awaitRefetchQueries: true
  });

  if (loading) return (
    <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{ 
        display: 'inline-block',
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}></div>
      <p>Loading posts...</p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (error) return (
    <div role="alert" style={{
      padding: '20px',
      margin: '20px',
      backgroundColor: '#ffebee',
      border: '1px solid #ffcdd2',
      borderRadius: '4px',
      color: '#c62828'
    }}>
      <h3>Error Loading Posts</h3>
      <p>{error.message}</p>
      <p>Please check your network connection and try refreshing the page.</p>
    </div>
  );

  if (!data || !data.allPosts || data.allPosts.length === 0) {
    console.log("No posts found in the data:", data);
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h2>No Posts Found</h2>
        <p>Be the first to create a post using the form above!</p>
      </div>
    );
  }

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePostMutation({ variables: { id } });
        alert('Post deleted successfully!');
      } catch (e) {
        console.error("Error deleting post:", e);
        alert("Failed to delete post.");
      }
    }
  };

  const handleEditPost = (id: string) => {
    const post = data.allPosts.find(p => p.id === id);
    if (post) {
      setPostToEdit(post);
    }
  };

  console.log("Rendering posts:", data.allPosts);

  return (
    <div>
      <h1 style={{ 
        textAlign: 'center',
        color: '#333',
        marginBottom: '30px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '10px'
      }}>
        Latest Posts
      </h1>

      {postToEdit ? (
        <EditPostForm 
          post={postToEdit} 
          onCancel={() => setPostToEdit(null)} 
        />
      ) : (
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          width: '100%',
          padding: '0 15px',
          boxSizing: 'border-box'
        }}>
          {data.allPosts.map((post) => (
            <PostItem 
              key={post.id} 
              {...post} 
              onEdit={handleEditPost} 
              onDelete={handleDeletePost} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList;
