# Authentication Testing Instructions

This document outlines the test procedures for the authentication system in the Newsfeed application.

## Prerequisites

1. Make sure the backend server is running: 
   ```
   cd newsfeed_backend
   poetry run python manage.py runserver
   ```

2. Make sure the frontend application is running:
   ```
   cd newsfeed-frontend
   npm run dev
   ```

## Test Cases for Authentication

### 1. User Registration (Signup)

1. Click on the "Log in / Sign up" button in the header
2. Click "Don't have an account? Sign up"
3. Fill in the registration form with valid information:
   - Username: `testuser`
   - Email: `testuser@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
   - First and Last Name are optional
4. Click on the "Sign up" button
5. **Expected Result**: 
   - You should see the username displayed in the header
   - The login/signup modal should close
   - You should have full access to create, edit, or delete posts

### 2. User Login

1. Click on the "Log in / Sign up" button in the header
2. Enter the username and password for a previously created account
3. Click "Log In"
4. **Expected Result**:
   - You should see the username displayed in the header
   - The login/signup modal should close
   - You should have full access to create, edit, or delete posts

### 3. Authentication Persistence

1. Log in to the application
2. Refresh the page
3. **Expected Result**:
   - You should remain logged in after the page refresh
   - Your username should still appear in the header

### 4. Logout

1. Log in to the application
2. Click on your username in the header
3. Click "Log out" in the dropdown menu
4. **Expected Result**:
   - The "Log in / Sign up" button should reappear
   - You should no longer be able to create posts
   - Edit and delete buttons on posts should no longer be visible

### 5. Failed Authentication

1. Click on the "Log in / Sign up" button in the header
2. Enter an incorrect username/password combination
3. Click "Log In"
4. **Expected Result**:
   - An error message should appear indicating invalid credentials
   - You should remain on the login screen

### 6. Post Creation Authentication

1. Log in to the application
2. Create a new post
3. Verify the post appears in the feed
4. Log out
5. **Expected Result**:
   - The "Create New Post" button should disappear
   - A message should appear indicating you need to log in to create posts

### 7. Post Editing/Deletion Authentication

1. Log in with a test user account
2. Create a post
3. Verify you can see edit and delete buttons on your post
4. Log out and log in with a different account
5. **Expected Result**:
   - Edit and delete buttons should not be visible on posts created by other users
   - You should only be able to edit and delete your own posts

### 8. Token Refresh

1. Log in to the application
2. Manually expire your token (this would normally happen after 7 days)
3. Try to perform an authenticated operation
4. **Expected Result**:
   - The system should automatically refresh your token
   - The operation should succeed without requiring re-login

## Common Issues and Troubleshooting

1. **CORS Errors**:
   - Ensure that the Django backend has the proper CORS settings
   - Check the browser console for specific CORS error messages

2. **Token Not Being Sent**:
   - Check that the token is properly stored in cookies
   - Verify that the Apollo Client is configured to include the token in requests

3. **Authentication State Issues**:
   - Clear your browser's local storage and cookies
   - Try logging in again with valid credentials

4. **Server-Side Errors**:
   - Check the Django server console for relevant error messages
   - Verify that GraphQL JWT is properly configured in Django settings

## Performance Considerations

- The token refresh mechanism is designed to work transparently without disrupting the user experience
- Authentication state is maintained in local storage and cookies for persistence across page refreshes
- Authenticated GraphQL operations include the JWT token in the Authorization header

For any issues not covered by these instructions, please refer to the source code or contact the development team.
