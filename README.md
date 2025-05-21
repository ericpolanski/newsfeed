[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/0fJ2wJF2)
[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=19495659)

# Newsfeed Application

A responsive newsfeed application built with Next.js frontend and Django GraphQL backend (using Ariadne). Includes user authentication to control post creation, editing and deletion.

## Features

- View all posts with author information and timestamps
- User authentication (login and signup)
- Create new posts (authenticated users only)
- Edit and delete posts (only by post author)
- Responsive design that works on various device sizes
- Error and loading state handling

## Project Structure

- **Frontend**: Next.js with Apollo Client in `newsfeed_frontend/`
- **Backend**: Django with Ariadne GraphQL in `newsfeed_backend/`

## Setup Instructions

### Quick Setup

The easiest way to run both servers simultaneously is using the provided script:

```bash
# Make the script executable if needed
chmod +x start-dev.sh

# Run both servers
./start-dev.sh
```

This script will:
- Start the Django backend server on http://localhost:8000
- Start the Next.js frontend server on http://localhost:3000
- Properly handle shutting down both servers when you press Ctrl+C

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd newsfeed_backend
   ```

2. Install Poetry if you haven't already:
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

3. Install dependencies:
   ```bash
   poetry install
   ```

4. Apply migrations:
   ```bash
   poetry run python manage.py migrate
   ```

5. Create a superuser for testing:
   ```bash
   poetry run python manage.py createsuperuser
   ```

6. Run the development server:
   ```bash
   poetry run python manage.py runserver
   ```

The Django server will run at http://localhost:8000 with the GraphQL endpoint at http://localhost:8000/graphql/

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd newsfeed_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The Next.js server will run at http://localhost:3000

## Generating Test Data

To quickly populate the application with fake data for testing purposes, the project includes a custom management command:

```bash
# Navigate to the backend directory
cd newsfeed_backend

# Run the seed data command
poetry run python manage.py seed_data
```

This command will:
1. Create test user accounts (if they don't exist)
2. Generate random posts with varying content
3. Add comments to the posts
4. Add likes to posts

The generated data includes:
- Multiple test users with predictable passwords
- A variety of posts with different lengths and content
- Comments on posts from different users
- Random like distribution on posts

This is particularly useful for:
- Testing the UI with a realistic amount of content
- Demonstrating social features like comments and likes
- Evaluating how the application handles different user permissions

You can run this command multiple times to add more data if needed.

## Project Documentation

For detailed information about the project design, architecture, and implementation details, see the [Design Documentation](design_doc.md).

### Technical Overview

This newsfeed application allows users to:

1. **Post Management**:
   - Create, view, edit, and delete posts
   - Like posts and see like counts
   - Add, edit, and delete comments on posts

2. **User Authentication**:
   - Register new accounts
   - Log in with existing accounts
   - Session persistence across page loads
   - Permission controls for post/comment management

3. **Responsive Design**:
   - Works well on desktop, tablet and mobile devices
   - Intuitive interface with clear feedback

### Architecture Summary

#### Frontend Architecture

- Built with Next.js for server-side rendering and optimized performance
- Implemented custom components without external UI libraries
- Used Apollo Client for efficient GraphQL integration
- Implemented real-time UI updates for social interactions

#### Backend Architecture

- Django with Ariadne for GraphQL API implementation
- Comprehensive data model:
  - `Post`, `Comment`, and `Like` models
  - JWT-based authentication system
- GraphQL schema with:
  - Queries: `allPosts`, `post`, `postComments`, `me`
  - Mutations: For posts, comments, likes, and authentication

## Authentication System

This application includes a full authentication system built with JWT tokens and GraphQL. Here are the key features:

### Authentication Features
- User signup and login
- JWT token-based authentication
- Authorization checks for create/edit/delete operations
- User-specific views (only showing edit/delete buttons on user's own posts)

For detailed testing instructions, see the [Authentication Testing Instructions](authentication-test-instructions.md) file. This includes step-by-step procedures to test the authentication system functionality.

## Social Features

The application includes interactive social elements:

### Like System
- Users can like and unlike posts
- Each post shows the current like count
- UI updates immediately on user interaction

### Comment System
- Users can add comments to any post
- Users can edit and delete their own comments
- Comments are displayed in chronological order
- Real-time comment count updates

## Running the Application

For convenience, a shell script is provided to run both servers simultaneously:
```bash
./start-dev.sh
```

This script will:
- Start the Django backend server on http://localhost:8000
- Start the Next.js frontend server on http://localhost:3000
- Properly handle shutting down both servers when you press Ctrl+C

## Future Enhancements

- Real-time updates with WebSockets or GraphQL subscriptions
- Enhanced user profiles and social connections
- Post filtering and search capabilities
- Pagination or infinite scrolling
- Media upload support for posts and comments
