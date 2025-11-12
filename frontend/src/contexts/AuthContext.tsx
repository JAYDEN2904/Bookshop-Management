import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import apiConfig from '../config/api';

// Create Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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

  // Fetch user profile from backend
  const fetchUserProfile = async (authUserId: string): Promise<User | null> => {
    try {
      const response = await fetch(`${apiConfig.baseURL}${apiConfig.endpoints.auth.me}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          return data.user;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
            // Store in localStorage for persistence
            localStorage.setItem('bookshop_user', JSON.stringify(userProfile));
            localStorage.setItem('bookshop_token', session.access_token);
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          // User signed in
          const userProfile = await fetchUserProfile(session.user.id);
          if (userProfile) {
            setUser(userProfile);
            localStorage.setItem('bookshop_user', JSON.stringify(userProfile));
            localStorage.setItem('bookshop_token', session.access_token);
          }
          setIsLoading(false);
        } else {
          // User signed out or no session
          setUser(null);
          localStorage.removeItem('bookshop_user');
          localStorage.removeItem('bookshop_token');
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return false;
      }

      if (data.user && data.session) {
        // Fetch user profile from backend
        const userProfile = await fetchUserProfile(data.user.id);
        if (userProfile) {
          setUser(userProfile);
          localStorage.setItem('bookshop_user', JSON.stringify(userProfile));
          localStorage.setItem('bookshop_token', data.session.access_token);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear local state immediately for better UX
      setUser(null);
      localStorage.removeItem('bookshop_user');
      localStorage.removeItem('bookshop_token');
      
      // Sign out from Supabase Auth
      // The onAuthStateChange listener will also handle state cleanup
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error.message);
      }
      
      // Ensure loading is false
      setIsLoading(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure state is cleared even on error
      setUser(null);
      localStorage.removeItem('bookshop_user');
      localStorage.removeItem('bookshop_token');
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: string = 'CASHIER'): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        console.error('Registration error:', error.message);
        return false;
      }

      if (data.user) {
        // Registration successful - user will need to confirm email
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
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
