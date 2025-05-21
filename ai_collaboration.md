# AI Collaboration Documentation

This document outlines the AI assistance used throughout the development of the Newsfeed application.

## Setting Up The Project

### Prompt:
```
I needed help setting up a newsfeed application using Next.js for the frontend and Django (with Ariadne for GraphQL) for the backend because I was running into some python version error
```

### Outcome:
The AI provided a step-by-step guide for initializing both the frontend and backend projects, including:
- Creating a Next.js app with `npx create-next-app`
- Setting up Poetry for the Django project
- Adding necessary dependencies
- Creating the initial Django app structure

## Debugging CORS Issues

### Prompt:
```
For localhost:3000 I can see author ID 1 test post. But on localhost:3001 I get Error loading posts: NetworkError when attempting to fetch resource.
```

### Outcome:
The AI identified that the issue was related to CORS settings in the Django backend. It provided a solution to update `settings.py` to include the new port:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
```

## Implementing Post Editing

### Prompt:
```
I created a post, but I still see "No posts found."
```

### Outcome:
The AI diagnosed and fixed issues with Apollo Client's caching and refetching behavior. It improved the mutation configuration by adding `awaitRefetchQueries: true` and implementing an `onCompleted` callback.

## Enhancing UI

### Prompt:
```
Run the frontend and backend, then flesh out the UI
```

### Outcome:
The AI implemented:
1. A responsive UI design
2. Toggle functionality for the create post form
3. Edit post functionality
4. Improved styling for all components
5. Added loading and error states

## Lessons Learned from AI Collaboration

### Effective Prompting Strategies

1. **Provide Context**: Include relevant files and code snippets when asking questions.
2. **Be Specific**: Clearly state the issue rather than asking general questions.
3. **Show Error Messages**: Sharing exact error messages helps the AI diagnose issues precisely.

### Ineffective Approaches

1. **Ambiguous Requests**: Vague requests like "fix my code" without specific details led to less helpful responses.
2. **Omitting Technology Context**: Not mentioning which tech stack was being used resulted in generic solutions.

### Value Added by AI

1. **Debug Assistance**: Helped identify and fix CORS issues, caching problems, and hydration warnings.
2. **Code Generation**: Created boilerplate components that saved development time.
3. **UI Enhancement**: Suggested improvements for accessibility and responsiveness.

## Conclusion

AI tools like GitHub Copilot served as valuable collaborators in this project, especially for:
- Setting up project infrastructure
- Debugging complex issues
- Generating UI components with proper styling

The most successful pattern was using AI to generate an initial implementation, then manually reviewing and refining the code to ensure it met requirements and followed best practices.
