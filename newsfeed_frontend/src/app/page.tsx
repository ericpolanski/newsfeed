'use client';

import React from 'react';
import PostList from './components/PostList';
import CreatePostForm from './components/CreatePostForm';

export default function Home() {
  return (
    <div className="app-container">
      <header style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        padding: '20px 0',
        borderBottom: '2px solid #f0f0f0'
      }}>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', // Responsive font size
          color: '#2C3E50',
          margin: '0'
        }}>Newsfeed Application</h1>
        <p style={{ 
          color: '#7F8C8D',
          margin: '10px 0 0 0',
          fontSize: 'clamp(0.9rem, 3vw, 1.1rem)' // Responsive font size
        }}>
          Share your thoughts and stay updated
        </p>
      </header>
      
      <main style={{ 
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '0 20px',
        fontFamily: 'Arial, sans-serif',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <section aria-labelledby="create-post-heading" style={{ marginBottom: '30px' }}>
          <h2 id="create-post-heading" className="sr-only">Create Post</h2>
          <CreatePostForm />
        </section>
        
        <section aria-labelledby="post-list-heading">
          <h2 id="post-list-heading" className="sr-only">Posts</h2>
          <PostList />
        </section>
      </main>

      <footer style={{
        textAlign: 'center',
        marginTop: '50px',
        padding: '20px',
        borderTop: '1px solid #eee',
        color: '#7F8C8D',
        fontSize: '0.9rem'
      }}>
        <p>© {new Date().getFullYear()} Newsfeed App - Project 2</p>
      </footer>

      {/* Add global styles for screen reader only class and responsive behavior */}
      <style jsx global>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        main {
          flex-grow: 1;
        }
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        @media (max-width: 768px) {
          main {
            padding: 0 10px;
          }
        }
      `}</style>
    </div>
  );
}
