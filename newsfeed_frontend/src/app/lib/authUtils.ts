// Authentication utility functions for the newsfeed app
import client from './apolloClient';
import { gql } from '@apollo/client';

// GraphQL mutation for refreshing tokens
export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token)
  }
`;

// Cookie management functions
export const setCookie = (name: string, value: string, days?: number) => {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value || ''}${expires}; path=/`;
};

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null; // For SSR
  
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const eraseCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=-99999999; path=/`;
};

// Auth management
export const setAuthToken = (token: string) => {
  setCookie('authToken', token, 7); // Store token for 7 days
};

export const getAuthToken = (): string | null => {
  return getCookie('authToken');
};

export const clearAuthToken = () => {
  eraseCookie('authToken');
};

// User data management
// User interface for type safety
export interface UserData {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export const setUserData = (user: UserData) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userData', JSON.stringify(user));
  }
};

export const getUserData = (): UserData | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        return JSON.parse(userData) as UserData;
      } catch {
        // Silently handle parsing error
        return null;
      }
    }
  }
  return null;
};

export const clearUserData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userData');
  }
};

// Auth state
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const refreshAuthToken = async (): Promise<string | null> => {
  const currentToken = getAuthToken();
  
  if (!currentToken) {
    return null;
  }
  
  try {
    const { data } = await client.mutate({
      mutation: REFRESH_TOKEN_MUTATION,
      variables: { token: currentToken }
    });
    
    if (data?.refreshToken) {
      setAuthToken(data.refreshToken);
      return data.refreshToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    logout(); // Logout on refresh failure
    return null;
  }
};

export const logout = () => {
  clearAuthToken();
  clearUserData();
};
