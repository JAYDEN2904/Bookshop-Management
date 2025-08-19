import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../config/supabase';
import { api } from '../config/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
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

  // Check for stored session and validate it
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('bookshop_token');
        if (token) {
          // Prefer backend session if present
          const me = await api.getCurrentUser();
          if (me?.user) {
            const u = me.user;
            setUser({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              createdAt: u.created_at,
              lastActive: u.updated_at
            });
            return;
          }
        }

        // Fallback to Supabase session/profile
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && !error) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email, role, created_at, updated_at')
            .eq('id', session.user.id)
            .single();

          if (userData && !userError) {
            setUser({
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              createdAt: userData.created_at,
              lastActive: userData.updated_at
            });
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Sign in first to satisfy RLS
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError || !signInData.user) {
        setError('Invalid credentials');
        return false;
      }

      // Obtain backend JWT and user profile from backend
      const backendAuth = await api.login({ email, password });
      if (backendAuth?.token && backendAuth?.user) {
        localStorage.setItem('bookshop_token', backendAuth.token);
        const u = backendAuth.user;
        setUser({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.created_at,
          lastActive: u.updated_at
        });
        return true;
      }

      // Fallback: fetch user profile from Supabase table
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role, created_at, updated_at')
        .eq('id', signInData.user.id)
        .single();

      if (userError || !userRow) {
        setError('User profile not found');
        return false;
      }

      setUser({
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        role: userRow.role,
        createdAt: userRow.created_at,
        lastActive: userRow.updated_at
      });
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      localStorage.removeItem('bookshop_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};