import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../config/api';
import apiConfig from '../config/api';

export interface User {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from backend using stored token
  const fetchUserProfile = async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem('bookshop_token');
      if (!token) {
        return null;
      }

      const data = await apiCall(apiConfig.endpoints.auth.me, {
        method: 'GET',
      });

      if (data.success && data.user) {
        return data.user;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      // If token is invalid, clear it
      if (error.message?.includes('401') || error.message?.includes('Invalid token')) {
        localStorage.removeItem('bookshop_token');
        localStorage.removeItem('bookshop_user');
      }
      return null;
    }
  };

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem('bookshop_user');
        const token = localStorage.getItem('bookshop_token');

        if (storedUser && token) {
          // Verify token is still valid by fetching user profile
          const userProfile = await fetchUserProfile();
          if (userProfile) {
            setUser(userProfile);
            // Update stored user data
            localStorage.setItem('bookshop_user', JSON.stringify(userProfile));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('bookshop_user');
            localStorage.removeItem('bookshop_token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use backend API directly - it handles Supabase auth and user profile in one call
      const data = await apiCall(apiConfig.endpoints.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, apiConfig.authTimeout);

      if (data.success && data.user && data.token) {
        setUser(data.user);
        localStorage.setItem('bookshop_user', JSON.stringify(data.user));
        localStorage.setItem('bookshop_token', data.token);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to call backend logout endpoint (optional, but good practice)
      try {
        await apiCall(apiConfig.endpoints.auth.logout, {
          method: 'POST',
        });
      } catch (error) {
        // Ignore logout errors - we'll clear local state anyway
        console.warn('Logout API call failed, clearing local state:', error);
      }
      
      // Clear local state immediately for better UX
      setUser(null);
      localStorage.removeItem('bookshop_user');
      localStorage.removeItem('bookshop_token');
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure state is cleared even on error
      setUser(null);
      localStorage.removeItem('bookshop_user');
      localStorage.removeItem('bookshop_token');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: string = 'CASHIER'): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use backend API for registration
      const data = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
      }, apiConfig.authTimeout);

      if (data.success) {
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
