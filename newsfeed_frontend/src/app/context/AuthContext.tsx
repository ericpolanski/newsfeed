'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getAuthToken, setAuthToken, getUserData, setUserData, logout as logoutUtil, refreshAuthToken, UserData } from '../lib/authUtils';
import { ApolloClient, gql } from '@apollo/client';

// Define the context interface
interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, email: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  refreshToken: async () => false,
});

// Login mutation
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        firstName
        lastName
        email
      }
    }
  }
`;

// Signup mutation
const SIGNUP_MUTATION = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      token
      user {
        id
        username
        firstName
        lastName
        email
      }
    }
  }
`;

// Create a provider component
export const AuthProvider = ({ 
  children, 
  client 
}: { 
  children: ReactNode, 
  client: ApolloClient<object> 
}) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      const userData = getUserData();
      
      if (token && userData) {
        setUser(userData);
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  // Refresh token function
  const handleRefreshToken = useCallback(async (): Promise<boolean> => {
    const newToken = await refreshAuthToken();
    return !!newToken;
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      const { data } = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: {
          input: { username, password }
        }
      });
      
      if (data?.login?.token && data?.login?.user) {
        setAuthToken(data.login.token);
        setUserData(data.login.user);
        setUser(data.login.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Signup function
  const signup = async (username: string, password: string, email: string, firstName?: string, lastName?: string) => {
    try {
      const { data } = await client.mutate({
        mutation: SIGNUP_MUTATION,
        variables: {
          input: { 
            username, 
            password, 
            email,
            firstName,
            lastName
          }
        }
      });
      
      if (data?.signup?.token && data?.signup?.user) {
        setAuthToken(data.signup.token);
        setUserData(data.signup.user);
        setUser(data.signup.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  // Logout function
  const handleLogout = () => {
    logoutUtil(); // Clear token and user data
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading,
        login,
        signup,
        logout: handleLogout,
        refreshToken: handleRefreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
