# Newsfeed Application - Mini Design Document

## Overview/Background

This project implements a newsfeed application that allows users to view, create, edit, and delete posts. The application includes social features such as likes and comments, as well as a comprehensive authentication system.

## Technical Problem Statement

The project needs to solve several key problems:

1. **Efficient Data Fetching**: How to fetch and display posts with minimal loading time and network overhead
2. **Data Mutations**: How to create, update, and delete posts with proper validation and error handling
3. **State Management**: How to manage application state and ensure UI updates when data changes
4. **User Authentication**: How to securely manage user authentication and authorization
5. **Social Interactions**: How to implement like and comment functionality with real-time updates

## Design Approach

### Frontend Architecture

1. **Component Structure**:
   
   The application follows a domain-based component organization:
   
   - **Auth Components** (`/components/auth/`):
     - `AuthModal.tsx`: Modal container for authentication forms
     - `LoginForm.tsx`: Form for user login
     - `SignupForm.tsx`: Form for user registration

   - **Common Components** (`/components/common/`):
     - `ErrorMessage.tsx`: Reusable error message display
     - `ProtectedRoute.tsx`: Route wrapper for authentication protection
   
   - **Layout Components** (`/components/layout/`):
     - `Header.tsx`: Application header with navigation and auth controls
   
   - **Post Components** (`/components/posts/`):
     - `PostList.tsx`: Container component that fetches and displays all posts
     - `PostItem.tsx`: Presentational component for individual posts
     - `CreatePostForm.tsx`: Form component for creating new posts
     - `EditPostForm.tsx`: Form component for editing existing posts
     - `CommentList.tsx`: Component for displaying post comments
     - `CommentForm.tsx`: Form component for adding comments

2. **Data Fetching Strategy**:
   - Used Apollo Client for GraphQL integration
   - Implemented network-only fetch policy to ensure fresh data
   - Added proper loading and error states
   - Implemented optimistic UI updates for likes and comments

3. **UI/UX Considerations**:
   - Built custom styled components without UI libraries
   - Used responsive design principles (flexible layouts, relative units)
   - Implemented user-friendly error messages and confirmation dialogs
   - Added interactive elements for social features (like/comment buttons)

4. **Authentication Flow**:
   - Used JWT tokens stored in localStorage
   - Implemented token refresh mechanism
   - Added protected routes and conditional UI elements
   - Created AuthContext for global authentication state

### Backend Architecture

1. **Database Schema**:
   - `Post` model with fields: id, title, content, author, created_at, updated_at
   - `Comment` model with fields: post, author, content, created_at, updated_at
   - `Like` model with fields: post, user, created_at
   - Used built-in Django User model for authors

2. **GraphQL Schema**:
   - Types: Post, User, Comment, Like, AuthPayload
   - Queries: allPosts, post, postComments, me
   - Mutations: 
     - Post: createPost, updatePost, deletePost
     - Authentication: signup, login, verifyToken, refreshToken
     - Social: likePost, unlikePost, createComment, updateComment, deleteComment

3. **Security & Performance**:
   - Implemented CORS configuration to secure API access
   - Added JWT-based authentication
   - Implemented authorization checks in resolvers
   - Used select_related to optimize database queries

## Authentication System

I decided to add an authentication system since in my CS308: Foundations of Security course, we're talking about this very thing and I thought why not combine the work the two classes are doing.

The application features a complete authentication system with the following components:

1. **User Management**:
   - Registration (signup) with username, email, and password
   - Login with username and password
   - JWT token generation and validation

2. **Security Features**:
   - Token expiration and refresh mechanisms
   - Password hashing using Django's built-in security
   - Authorization checks for protected operations

3. **Frontend Integration**:
   - Global authentication context
   - Protected routes for authenticated users
   - Conditional UI based on authentication state
   - Token persistence across page reloads

For detailed on the authentication system, see the [Authentication Implementation Summary](documents/authentication-implementation-summary.md)

## Social Features

The application includes social interaction capabilities:

1. **Like System**:
   - Users can like and unlike posts
   - Like counts are displayed on each post
   - UI updates instantly with optimistic responses

2. **Comment System**:
   - Users can add comments to posts
   - Users can edit and delete their own comments
   - Comments are displayed chronologically
   - Real-time comment count updates

## Development Setup

The application can be run locally using the provided `start-dev.sh` script, which starts both the frontend and backend servers simultaneously:

```bash
# Make the script executable if needed
chmod +x start-dev.sh
# Run both servers
./start-dev.sh
```

The script handles both servers and properly manages shutdown when Ctrl+C is pressed:
- Django backend server runs on http://localhost:8000
- Next.js frontend server runs on http://localhost:3000

## Challenges & Solutions

### Challenge 1: CORS Configuration
**Problem**: The frontend couldn't connect to the backend due to CORS restrictions.
**Solution**: Updated Django settings with proper CORS_ALLOWED_ORIGINS.

### Challenge 2: Apollo Client Cache Updates
**Problem**: Created posts weren't showing up in the list immediately.
**Solution**: Implemented refetchQueries and awaitRefetchQueries in mutations.

### Challenge 3: React Hydration Errors
**Problem**: Date formatting caused hydration warnings.
**Solution**: Used consistent date formatting and added suppressHydrationWarning.

### Challenge 4: Authentication Context
**Problem**: Authentication state was lost on page refresh.
**Solution**: Implemented token persistence in localStorage and token verification on application load.

### Challenge 5: Real-Time UI Updates
**Problem**: Like/comment counts weren't updating instantly without a page refresh.
**Solution**: Implemented optimistic UI updates and proper cache manipulation.

### Challenge 6: Component Organization
**Problem**: As the application grew, the flat component structure became hard to navigate and maintain.
**Solution**: Refactored the component structure to use domain-based organization, grouping components by their function (auth, posts, layout, common).

### And many, many more...
But I won't bore you with them :)

## AI Utilization
For this project, I largely used Claude 3.7 Sonnet in Agent Mode since I've never used it before and wanted to give it a spin. It was first used to help setup the app, then it created the frontend design, with guidance on my end to make sure everything looked like how I wanted it to be. It was very good at following the prompts I provided it. The only issues with it were that it took a while to think and edit the code, and there were some implementations it made that would break the application. The back-end and authentication only had AI use when I was stuck.