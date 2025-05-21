import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink, Observable } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { getAuthToken, refreshAuthToken } from './authUtils';

// Error handling link with token refresh capability
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const { message, locations, path } of graphQLErrors) {
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // If we get an authorization error, try to refresh the token
      if (message.toLowerCase().includes('not authenticated') || 
          message.toLowerCase().includes('unauthorized') || 
          message.toLowerCase().includes('token is expired')) {
            
        // Return a new observable to retry the request after token refresh
        return new Observable(observer => {
          // Attempt to refresh the token
          refreshAuthToken()
            .then(newToken => {
              if (newToken) {
                // Retry the operation with the new token
                const oldHeaders = operation.getContext().headers;
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: `JWT ${newToken}`
                  }
                });
                
                // Retry the request with new token
                forward(operation).subscribe({
                  next: observer.next.bind(observer),
                  error: observer.error.bind(observer),
                  complete: observer.complete.bind(observer)
                });
              } else {
                // Token refresh failed, pass the error along
                observer.error(graphQLErrors);
              }
            })
            .catch(error => {
              console.error('Token refresh failed:', error);
              observer.error(error);
            });
        });
      }
    }
  }

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

// Auth middleware - adds authentication token to requests if available
const authMiddleware = new ApolloLink((operation, forward) => {
  const token = getAuthToken();
  operation.setContext({
    headers: {
      authorization: token ? `JWT ${token}` : '',
    },
  });
  return forward(operation);
});

// HTTP link to the GraphQL server
const httpLink = new HttpLink({
  uri: "http://localhost:8000/graphql/", // Your Django GraphQL endpoint
  credentials: "same-origin", 
});

const client = new ApolloClient({
  link: from([errorLink, authMiddleware, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only", // Don't use the cache by default
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only", // Don't use the cache by default
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
  connectToDevTools: true, // For debugging with Apollo DevTools extension
});

export default client;