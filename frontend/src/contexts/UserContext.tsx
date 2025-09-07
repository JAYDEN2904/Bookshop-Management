import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../config/supabase';
import { api, apiCall } from '../config/api';
import { useAuth } from './AuthContext';

interface UserContextType {
  users: User[];
  isLoading: boolean;
  error: string | null;
  addUser: (userData: { name: string; email: string; role: 'ADMIN' | 'CASHIER'; tempPassword: string }) => Promise<boolean>;
  updateUser: (id: string, userData: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  resetUserPassword: (id: string) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: authUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setError(null);
      // Only admins are allowed to view all users (per RLS policies)
      if (!authUser || authUser.role !== 'ADMIN') {
        setUsers([]);
        setIsLoading(false);
        return;
      }
      // Use backend API for admin listing to avoid RLS recursion on users table
      const token = localStorage.getItem('bookshop_token');
      if (!token) {
        setUsers([]);
        setIsLoading(false);
        return;
      }
      const response = await api.getUsers();
      const list: any[] = response?.data || [];
      const mappedUsers: User[] = list.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.created_at,
        lastActive: u.updated_at
      }));
      setUsers(mappedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?.role === 'ADMIN' && localStorage.getItem('bookshop_token')) {
      setIsLoading(true);
      fetchUsers();
    } else {
      setUsers([]);
      setIsLoading(false);
    }
  }, [authUser]);

  const addUser = async (userData: { name: string; email: string; role: 'ADMIN' | 'CASHIER'; tempPassword: string }): Promise<boolean> => {
    try {
      setError(null);
      // Use backend admin API to create user (handles hashing and bypasses RLS via service role)
      await api.createUser({
        name: userData.name,
        email: userData.email,
        password: userData.tempPassword,
        role: userData.role
      });

      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error adding user:', error);
      setError(error.message || 'Failed to add user');
      return false;
    }
  };

  const updateUser = async (id: string, userData: Partial<User>): Promise<boolean> => {
    try {
      setError(null);
      const payload: any = {};
      if (userData.name) payload.name = userData.name;
      if (userData.email) payload.email = userData.email;
      if (userData.role) payload.role = userData.role;

      await api.updateUser(id, payload);

      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Failed to update user');
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      await api.deleteUser(id);
      await fetchUsers();
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
      return false;
    }
  };

  const resetUserPassword = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const tempPassword = Math.random().toString(36).slice(-8);
      await apiCall(`/api/users/${id}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({ password: tempPassword })
      });
      console.log('Temporary password for user:', id, 'is:', tempPassword);
      return true;
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password');
      return false;
    }
  };

  const refreshUsers = async () => {
    await fetchUsers();
  };

  return (
    <UserContext.Provider value={{
      users,
      isLoading,
      error,
      addUser,
      updateUser,
      deleteUser,
      resetUserPassword,
      refreshUsers
    }}>
      {children}
    </UserContext.Provider>
  );
};
