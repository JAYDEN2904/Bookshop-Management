import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Admin',
    email: 'admin@school.com',
    role: 'admin',
    createdAt: '2024-01-01',
    lastActive: '2024-01-15'
  },
  {
    id: '2',
    name: 'Sarah Cashier',
    email: 'cashier@school.com',
    role: 'cashier',
    createdAt: '2024-01-05',
    lastActive: '2024-01-15'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('bookshop_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password') {
      setUser(foundUser);
      localStorage.setItem('bookshop_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bookshop_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};