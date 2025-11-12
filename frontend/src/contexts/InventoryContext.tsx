import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, StockHistory } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../config/supabase';
import { api } from '../config/api';

interface InventoryContextType {
  books: Book[];
  stockHistory: StockHistory[];
  isLoading: boolean;
  error: string | null;
  
  // Book operations
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  
  // Stock operations
  addStock: (bookId: string, quantity: number, reference?: string, note?: string) => Promise<void>;
  markWastage: (bookId: string, quantity: number, note?: string) => Promise<void>;
  markReturn: (bookId: string, quantity: number, note?: string) => Promise<void>;
  
  // Stock history
  getStockHistory: (bookId: string) => StockHistory[];
  
  // Utilities
  getLowStockBooks: () => Book[];
  getBookById: (id: string) => Book | undefined;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

// Mock data for demonstration
const mockBooks: Book[] = [
  // Basic 9 Books
  {
    id: 'b1',
    author: 'John Smith',
    class: 'Basic 9',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 50,
    costPrice: 35,
    stock: 10,
    minStock: 5,
    supplier: 'ABC Publishers',
    description: 'Comprehensive mathematics textbook for Basic 9',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: 'b2',
    author: 'Jane Doe',
    class: 'Basic 9',
    subject: 'English Grammar',
    type: 'textbook',
    sellingPrice: 40,
    costPrice: 28,
    stock: 5,
    minStock: 3,
    supplier: 'XYZ Publications',
    description: 'English grammar textbook for Basic 9',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-10'
  },
  {
    id: 'b3',
    author: 'Dr. Robert Wilson',
    class: 'Basic 9',
    subject: 'Science',
    type: 'textbook',
    sellingPrice: 60,
    costPrice: 42,
    stock: 0,
    minStock: 5,
    supplier: 'Science Publishers Ltd',
    description: 'Science textbook for Basic 9',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-12'
  },
  {
    id: 'b4',
    author: 'Mary Johnson',
    class: 'Basic 9',
    subject: 'Social Studies',
    type: 'textbook',
    sellingPrice: 45,
    costPrice: 32,
    stock: 8,
    minStock: 4,
    supplier: 'History Press',
    description: 'Social studies textbook for Basic 9',
    createdAt: '2024-01-04',
    updatedAt: '2024-01-08'
  },
  {
    id: 'b5',
    author: 'Pierre Dubois',
    class: 'Basic 9',
    subject: 'French',
    type: 'textbook',
    sellingPrice: 35,
    costPrice: 25,
    stock: 12,
    minStock: 6,
    supplier: 'French Language Books',
    description: 'French language textbook for Basic 9',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-09'
  },
  {
    id: 'b6',
    author: 'Tech Solutions',
    class: 'Basic 9',
    subject: 'ICT',
    type: 'textbook',
    sellingPrice: 55,
    costPrice: 40,
    stock: 15,
    minStock: 7,
    supplier: 'Tech Publishers',
    description: 'Information and Communication Technology for Basic 9',
    createdAt: '2024-01-06',
    updatedAt: '2024-01-11'
  },
  
  // Basic 8 Books
  {
    id: 'b7',
    author: 'John Smith',
    class: 'Basic 8',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 45,
    costPrice: 32,
    stock: 8,
    minStock: 4,
    supplier: 'ABC Publishers',
    description: 'Mathematics textbook for Basic 8',
    createdAt: '2024-01-07',
    updatedAt: '2024-01-13'
  },
  {
    id: 'b8',
    author: 'Jane Doe',
    class: 'Basic 8',
    subject: 'English Grammar',
    type: 'textbook',
    sellingPrice: 38,
    costPrice: 27,
    stock: 12,
    minStock: 6,
    supplier: 'XYZ Publications',
    description: 'English grammar textbook for Basic 8',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-14'
  },
  {
    id: 'b9',
    author: 'Dr. Robert Wilson',
    class: 'Basic 8',
    subject: 'Science',
    type: 'textbook',
    sellingPrice: 55,
    costPrice: 39,
    stock: 3,
    minStock: 5,
    supplier: 'Science Publishers Ltd',
    description: 'Science textbook for Basic 8',
    createdAt: '2024-01-09',
    updatedAt: '2024-01-15'
  },
  {
    id: 'b10',
    author: 'Mary Johnson',
    class: 'Basic 8',
    subject: 'Social Studies',
    type: 'textbook',
    sellingPrice: 42,
    costPrice: 30,
    stock: 10,
    minStock: 5,
    supplier: 'History Press',
    description: 'Social studies textbook for Basic 8',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-16'
  },
  {
    id: 'b11',
    author: 'Pierre Dubois',
    class: 'Basic 8',
    subject: 'French',
    type: 'textbook',
    sellingPrice: 32,
    costPrice: 23,
    stock: 7,
    minStock: 4,
    supplier: 'French Language Books',
    description: 'French language textbook for Basic 8',
    createdAt: '2024-01-11',
    updatedAt: '2024-01-17'
  },
  {
    id: 'b12',
    author: 'Tech Solutions',
    class: 'Basic 8',
    subject: 'ICT',
    type: 'textbook',
    sellingPrice: 50,
    costPrice: 36,
    stock: 13,
    minStock: 6,
    supplier: 'Tech Publishers',
    description: 'Information and Communication Technology for Basic 8',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-18'
  },
  
  // Basic 7 Books
  {
    id: 'b13',
    author: 'John Smith',
    class: 'Basic 7',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 42,
    costPrice: 30,
    stock: 15,
    minStock: 7,
    supplier: 'ABC Publishers',
    description: 'Mathematics textbook for Basic 7',
    createdAt: '2024-01-13',
    updatedAt: '2024-01-19'
  },
  {
    id: 'b14',
    author: 'Jane Doe',
    class: 'Basic 7',
    subject: 'English Grammar',
    type: 'textbook',
    sellingPrice: 35,
    costPrice: 25,
    stock: 9,
    minStock: 5,
    supplier: 'XYZ Publications',
    description: 'English grammar textbook for Basic 7',
    createdAt: '2024-01-14',
    updatedAt: '2024-01-20'
  },
  {
    id: 'b15',
    author: 'Dr. Robert Wilson',
    class: 'Basic 7',
    subject: 'Science',
    type: 'textbook',
    sellingPrice: 48,
    costPrice: 34,
    stock: 11,
    minStock: 6,
    supplier: 'Science Publishers Ltd',
    description: 'Science textbook for Basic 7',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-21'
  },
  {
    id: 'b16',
    author: 'Mary Johnson',
    class: 'Basic 7',
    subject: 'Social Studies',
    type: 'textbook',
    sellingPrice: 38,
    costPrice: 27,
    stock: 6,
    minStock: 4,
    supplier: 'History Press',
    description: 'Social studies textbook for Basic 7',
    createdAt: '2024-01-16',
    updatedAt: '2024-01-22'
  },
  {
    id: 'b17',
    author: 'Pierre Dubois',
    class: 'Basic 7',
    subject: 'French',
    type: 'textbook',
    sellingPrice: 30,
    costPrice: 21,
    stock: 14,
    minStock: 7,
    supplier: 'French Language Books',
    description: 'French language textbook for Basic 7',
    createdAt: '2024-01-17',
    updatedAt: '2024-01-23'
  },
  {
    id: 'b18',
    author: 'Tech Solutions',
    class: 'Basic 7',
    subject: 'ICT',
    type: 'textbook',
    sellingPrice: 45,
    costPrice: 32,
    stock: 8,
    minStock: 4,
    supplier: 'Tech Publishers',
    description: 'Information and Communication Technology for Basic 7',
    createdAt: '2024-01-18',
    updatedAt: '2024-01-24'
  },
  
  // Basic 6 Books
  {
    id: 'b19',
    author: 'John Smith',
    class: 'Basic 6',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 40,
    costPrice: 28,
    stock: 12,
    minStock: 6,
    supplier: 'ABC Publishers',
    description: 'Mathematics textbook for Basic 6',
    createdAt: '2024-01-19',
    updatedAt: '2024-01-25'
  },
  {
    id: 'b20',
    author: 'Jane Doe',
    class: 'Basic 6',
    subject: 'English Grammar',
    type: 'textbook',
    sellingPrice: 32,
    costPrice: 23,
    stock: 16,
    minStock: 8,
    supplier: 'XYZ Publications',
    description: 'English grammar textbook for Basic 6',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-26'
  },
  {
    id: 'b21',
    author: 'Dr. Robert Wilson',
    class: 'Basic 6',
    subject: 'Science',
    type: 'textbook',
    sellingPrice: 45,
    costPrice: 32,
    stock: 7,
    minStock: 4,
    supplier: 'Science Publishers Ltd',
    description: 'Science textbook for Basic 6',
    createdAt: '2024-01-21',
    updatedAt: '2024-01-27'
  },
  {
    id: 'b22',
    author: 'Mary Johnson',
    class: 'Basic 6',
    subject: 'Social Studies',
    type: 'textbook',
    sellingPrice: 35,
    costPrice: 25,
    stock: 9,
    minStock: 5,
    supplier: 'History Press',
    description: 'Social studies textbook for Basic 6',
    createdAt: '2024-01-22',
    updatedAt: '2024-01-28'
  },
  {
    id: 'b23',
    author: 'Pierre Dubois',
    class: 'Basic 6',
    subject: 'French',
    type: 'textbook',
    sellingPrice: 28,
    costPrice: 20,
    stock: 11,
    minStock: 6,
    supplier: 'French Language Books',
    description: 'French language textbook for Basic 6',
    createdAt: '2024-01-23',
    updatedAt: '2024-01-29'
  },
  {
    id: 'b24',
    author: 'Tech Solutions',
    class: 'Basic 6',
    subject: 'ICT',
    type: 'textbook',
    sellingPrice: 40,
    costPrice: 28,
    stock: 10,
    minStock: 5,
    supplier: 'Tech Publishers',
    description: 'Information and Communication Technology for Basic 6',
    createdAt: '2024-01-24',
    updatedAt: '2024-01-30'
  },
  
  // Basic 5 Books
  {
    id: 'b25',
    author: 'John Smith',
    class: 'Basic 5',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 38,
    costPrice: 27,
    stock: 18,
    minStock: 9,
    supplier: 'ABC Publishers',
    description: 'Mathematics textbook for Basic 5',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-31'
  },
  {
    id: 'b26',
    author: 'Jane Doe',
    class: 'Basic 5',
    subject: 'English Grammar',
    type: 'textbook',
    sellingPrice: 30,
    costPrice: 21,
    stock: 14,
    minStock: 7,
    supplier: 'XYZ Publications',
    description: 'English grammar textbook for Basic 5',
    createdAt: '2024-01-26',
    updatedAt: '2024-02-01'
  },
  {
    id: 'b27',
    author: 'Dr. Robert Wilson',
    class: 'Basic 5',
    subject: 'Science',
    type: 'textbook',
    sellingPrice: 42,
    costPrice: 30,
    stock: 13,
    minStock: 7,
    supplier: 'Science Publishers Ltd',
    description: 'Science textbook for Basic 5',
    createdAt: '2024-01-27',
    updatedAt: '2024-02-02'
  },
  {
    id: 'b28',
    author: 'Mary Johnson',
    class: 'Basic 5',
    subject: 'Social Studies',
    type: 'textbook',
    sellingPrice: 32,
    costPrice: 23,
    stock: 8,
    minStock: 4,
    supplier: 'History Press',
    description: 'Social studies textbook for Basic 5',
    createdAt: '2024-01-28',
    updatedAt: '2024-02-03'
  },
  {
    id: 'b29',
    author: 'Pierre Dubois',
    class: 'Basic 5',
    subject: 'French',
    type: 'textbook',
    sellingPrice: 25,
    costPrice: 18,
    stock: 12,
    minStock: 6,
    supplier: 'French Language Books',
    description: 'French language textbook for Basic 5',
    createdAt: '2024-01-29',
    updatedAt: '2024-02-04'
  },
  {
    id: 'b30',
    author: 'Tech Solutions',
    class: 'Basic 5',
    subject: 'ICT',
    type: 'textbook',
    sellingPrice: 38,
    costPrice: 27,
    stock: 9,
    minStock: 5,
    supplier: 'Tech Publishers',
    description: 'Information and Communication Technology for Basic 5',
    createdAt: '2024-01-30',
    updatedAt: '2024-02-05'
  },
  
  // Basic 4 Books
  {
    id: 'b31',
    author: 'John Smith',
    class: 'Basic 4',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 35,
    costPrice: 25,
    stock: 20,
    minStock: 10,
    supplier: 'ABC Publishers',
    description: 'Mathematics textbook for Basic 4',
    createdAt: '2024-01-31',
    updatedAt: '2024-02-06'
  },
  {
    id: 'b32',
    author: 'Jane Doe',
    class: 'Basic 4',
    subject: 'English Grammar',
    type: 'textbook',
    sellingPrice: 28,
    costPrice: 20,
    stock: 17,
    minStock: 9,
    supplier: 'XYZ Publications',
    description: 'English grammar textbook for Basic 4',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-07'
  },
  {
    id: 'b33',
    author: 'Dr. Robert Wilson',
    class: 'Basic 4',
    subject: 'Science',
    type: 'textbook',
    sellingPrice: 40,
    costPrice: 28,
    stock: 15,
    minStock: 8,
    supplier: 'Science Publishers Ltd',
    description: 'Science textbook for Basic 4',
    createdAt: '2024-02-02',
    updatedAt: '2024-02-08'
  },
  {
    id: 'b34',
    author: 'Mary Johnson',
    class: 'Basic 4',
    subject: 'Social Studies',
    type: 'textbook',
    sellingPrice: 30,
    costPrice: 21,
    stock: 11,
    minStock: 6,
    supplier: 'History Press',
    description: 'Social studies textbook for Basic 4',
    createdAt: '2024-02-03',
    updatedAt: '2024-02-09'
  },
  {
    id: 'b35',
    author: 'Pierre Dubois',
    class: 'Basic 4',
    subject: 'French',
    type: 'textbook',
    sellingPrice: 22,
    costPrice: 15,
    stock: 13,
    minStock: 7,
    supplier: 'French Language Books',
    description: 'French language textbook for Basic 4',
    createdAt: '2024-02-04',
    updatedAt: '2024-02-10'
  },
  {
    id: 'b36',
    author: 'Tech Solutions',
    class: 'Basic 4',
    subject: 'ICT',
    type: 'textbook',
    sellingPrice: 35,
    costPrice: 25,
    stock: 12,
    minStock: 6,
    supplier: 'Tech Publishers',
    description: 'Information and Communication Technology for Basic 4',
    createdAt: '2024-02-05',
    updatedAt: '2024-02-11'
  },
  
  // Basic 3 Books
  {
    id: 'b37',
    author: 'John Smith',
    class: 'Basic 3',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 32,
    costPrice: 23,
    stock: 22,
    minStock: 11,
    supplier: 'ABC Publishers',
    description: 'Mathematics textbook for Basic 3',
    createdAt: '2024-02-06',
    updatedAt: '2024-02-12'
  },
  {
    id: 'b38',
    author: 'Jane Doe',
    class: 'Basic 3',
    subject: 'English Grammar',
    type: 'textbook',
    sellingPrice: 25,
    costPrice: 18,
    stock: 19,
    minStock: 10,
    supplier: 'XYZ Publications',
    description: 'English grammar textbook for Basic 3',
    createdAt: '2024-02-07',
    updatedAt: '2024-02-13'
  },
  {
    id: 'b39',
    author: 'Dr. Robert Wilson',
    class: 'Basic 3',
    subject: 'Science',
    type: 'textbook',
    sellingPrice: 38,
    costPrice: 27,
    stock: 16,
    minStock: 8,
    supplier: 'Science Publishers Ltd',
    description: 'Science textbook for Basic 3',
    createdAt: '2024-02-08',
    updatedAt: '2024-02-14'
  },
  {
    id: 'b40',
    author: 'Mary Johnson',
    class: 'Basic 3',
    subject: 'Social Studies',
    type: 'textbook',
    sellingPrice: 28,
    costPrice: 20,
    stock: 14,
    minStock: 7,
    supplier: 'History Press',
    description: 'Social studies textbook for Basic 3',
    createdAt: '2024-02-09',
    updatedAt: '2024-02-15'
  },
  {
    id: 'b41',
    author: 'Pierre Dubois',
    class: 'Basic 3',
    subject: 'French',
    type: 'textbook',
    sellingPrice: 20,
    costPrice: 14,
    stock: 15,
    minStock: 8,
    supplier: 'French Language Books',
    description: 'French language textbook for Basic 3',
    createdAt: '2024-02-10',
    updatedAt: '2024-02-16'
  },
  {
    id: 'b42',
    author: 'Tech Solutions',
    class: 'Basic 3',
    subject: 'ICT',
    type: 'textbook',
    sellingPrice: 32,
    costPrice: 23,
    stock: 13,
    minStock: 7,
    supplier: 'Tech Publishers',
    description: 'Information and Communication Technology for Basic 3',
    createdAt: '2024-02-11',
    updatedAt: '2024-02-17'
  },
  
  // Basic 2 Books
  {
    id: 'b43',
    author: 'John Smith',
    class: 'Basic 2',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 30,
    costPrice: 21,
    stock: 25,
    minStock: 13,
    supplier: 'ABC Publishers',
    description: 'Mathematics textbook for Basic 2',
    createdAt: '2024-02-12',
    updatedAt: '2024-02-18'
  },
  {
    id: 'b44',
    author: 'Jane Doe',
    class: 'Basic 2',
    subject: 'English Grammar',
    type: 'textbook',
    sellingPrice: 22,
    costPrice: 15,
    stock: 21,
    minStock: 11,
    supplier: 'XYZ Publications',
    description: 'English grammar textbook for Basic 2',
    createdAt: '2024-02-13',
    updatedAt: '2024-02-19'
  },
  {
    id: 'b45',
    author: 'Dr. Robert Wilson',
    class: 'Basic 2',
    subject: 'Science',
    type: 'textbook',
    sellingPrice: 35,
    costPrice: 25,
    stock: 18,
    minStock: 9,
    supplier: 'Science Publishers Ltd',
    description: 'Science textbook for Basic 2',
    createdAt: '2024-02-14',
    updatedAt: '2024-02-20'
  },
  {
    id: 'b46',
    author: 'Mary Johnson',
    class: 'Basic 2',
    subject: 'Social Studies',
    type: 'textbook',
    sellingPrice: 25,
    costPrice: 18,
    stock: 16,
    minStock: 8,
    supplier: 'History Press',
    description: 'Social studies textbook for Basic 2',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-21'
  },
  {
    id: 'b47',
    author: 'Pierre Dubois',
    class: 'Basic 2',
    subject: 'French',
    type: 'textbook',
    sellingPrice: 18,
    costPrice: 13,
    stock: 17,
    minStock: 9,
    supplier: 'French Language Books',
    description: 'French language textbook for Basic 2',
    createdAt: '2024-02-16',
    updatedAt: '2024-02-22'
  },
  {
    id: 'b48',
    author: 'Tech Solutions',
    class: 'Basic 2',
    subject: 'ICT',
    type: 'textbook',
    sellingPrice: 30,
    costPrice: 21,
    stock: 14,
    minStock: 7,
    supplier: 'Tech Publishers',
    description: 'Information and Communication Technology for Basic 2',
    createdAt: '2024-02-17',
    updatedAt: '2024-02-23'
  },
  
  // Basic 1 Books
  {
    id: 'b49',
    author: 'John Smith',
    class: 'Basic 1',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 28,
    costPrice: 20,
    stock: 28,
    minStock: 14,
    supplier: 'ABC Publishers',
    description: 'Mathematics textbook for Basic 1',
    createdAt: '2024-02-18',
    updatedAt: '2024-02-24'
  },
  {
    id: 'b50',
    author: 'Jane Doe',
    class: 'Basic 1',
    subject: 'English Grammar',
    type: 'textbook',
    sellingPrice: 20,
    costPrice: 14,
    stock: 24,
    minStock: 12,
    supplier: 'XYZ Publications',
    description: 'English grammar textbook for Basic 1',
    createdAt: '2024-02-19',
    updatedAt: '2024-02-25'
  },
  {
    id: 'b51',
    author: 'Dr. Robert Wilson',
    class: 'Basic 1',
    subject: 'Science',
    type: 'textbook',
    sellingPrice: 32,
    costPrice: 23,
    stock: 20,
    minStock: 10,
    supplier: 'Science Publishers Ltd',
    description: 'Science textbook for Basic 1',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-26'
  },
  {
    id: 'b52',
    author: 'Mary Johnson',
    class: 'Basic 1',
    subject: 'Social Studies',
    type: 'textbook',
    sellingPrice: 22,
    costPrice: 15,
    stock: 18,
    minStock: 9,
    supplier: 'History Press',
    description: 'Social studies textbook for Basic 1',
    createdAt: '2024-02-21',
    updatedAt: '2024-02-27'
  },
  {
    id: 'b53',
    author: 'Pierre Dubois',
    class: 'Basic 1',
    subject: 'French',
    type: 'textbook',
    sellingPrice: 15,
    costPrice: 11,
    stock: 19,
    minStock: 10,
    supplier: 'French Language Books',
    description: 'French language textbook for Basic 1',
    createdAt: '2024-02-22',
    updatedAt: '2024-02-28'
  },
  {
    id: 'b54',
    author: 'Tech Solutions',
    class: 'Basic 1',
    subject: 'ICT',
    type: 'textbook',
    sellingPrice: 28,
    costPrice: 20,
    stock: 16,
    minStock: 8,
    supplier: 'Tech Publishers',
    description: 'Information and Communication Technology for Basic 1',
    createdAt: '2024-02-23',
    updatedAt: '2024-02-29'
  }
];

const mockStockHistory: StockHistory[] = [
  {
    id: '1',
    bookId: '1',
    type: 'addition',
    quantity: 50,
    previousStock: 0,
    newStock: 50,
    reference: 'Initial stock',
    note: 'Initial inventory setup',
    userId: '1',
    userName: 'John Admin',
    createdAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    bookId: '1',
    type: 'reduction',
    quantity: 5,
    previousStock: 50,
    newStock: 45,
    reference: 'Sales',
    note: 'Sold to students',
    userId: '2',
    userName: 'Sarah Cashier',
    createdAt: '2024-01-15T14:30:00Z'
  },
  {
    id: '3',
    bookId: '2',
    type: 'addition',
    quantity: 20,
    previousStock: 0,
    newStock: 20,
    reference: 'Supplier delivery',
    note: 'New stock received',
    userId: '1',
    userName: 'John Admin',
    createdAt: '2024-01-05T09:15:00Z'
  },
  {
    id: '4',
    bookId: '2',
    type: 'reduction',
    quantity: 17,
    previousStock: 20,
    newStock: 3,
    reference: 'Sales',
    note: 'High demand period',
    userId: '2',
    userName: 'Sarah Cashier',
    createdAt: '2024-01-10T16:45:00Z'
  }
];

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load books from Supabase
  const mapBookRecord = (record: any): Book => ({
    id: record.id,
    author: record.author || 'Unknown',
    class: record.class_level,
    subject: record.subject,
    type: record.type || 'textbook',
    sellingPrice: Number(record.price) || 0,
    costPrice: Number(record.cost_price ?? 0) || 0,
    stock: Number(record.stock_quantity ?? 0) || 0,
    minStock: Number(record.min_stock ?? 0) || 0,
    supplier: record.supplier_name || '',
    description: record.description || '',
    createdAt: record.created_at,
    updatedAt: record.updated_at
  });

  const loadBooks = async () => {
    try {
      setError(null);
      const { data: booksData, error: fetchError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching books:', fetchError);
        setError('Failed to load books');
        return;
      }

      // Map Supabase field names to Book interface
      const mappedBooks: Book[] = (booksData || []).map(mapBookRecord);

      setBooks(mappedBooks);
    } catch (error: any) {
      console.error('Failed to load books:', error);
      setError(error.message || 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBooks();
    }
    setIsLoading(false);
  }, [user]);

  const addBook = async (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      setError(null);
      const subjectValue = (bookData.subject || '').trim();
      const classValue = (bookData.class || '').trim();
      const payload = {
        title: classValue ? `${subjectValue} (${classValue})` : subjectValue || 'Untitled',
        class_level: bookData.class,
        subject: bookData.subject,
        type: bookData.type,
        price: bookData.sellingPrice,
        cost_price: bookData.costPrice,
        stock_quantity: bookData.stock,
        min_stock: bookData.minStock,
        supplier_name: bookData.supplier,
        description: bookData.description
      };

      const response = await api.createBook(payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add book');
      }

      const mappedBook = mapBookRecord(response.data);
      setBooks(prev => [...prev, mappedBook]);
    } catch (error: any) {
      console.error('Failed to add book:', error);
      setError(error.message || 'Failed to add book');
      throw error;
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>): Promise<void> => {
    try {
      setError(null);
      const existingBook = books.find(book => book.id === id);
      const nextClass = (updates.class ?? existingBook?.class ?? '').trim();
      const nextSubject = (updates.subject ?? existingBook?.subject ?? '').trim();

      const payload: Record<string, any> = {
        title: nextClass ? `${nextSubject} (${nextClass})` : nextSubject || 'Untitled'
      };

      if (updates.class !== undefined) payload.class_level = updates.class;
      if (updates.subject !== undefined) payload.subject = updates.subject;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.sellingPrice !== undefined) payload.price = updates.sellingPrice;
      if (updates.costPrice !== undefined) payload.cost_price = updates.costPrice;
      if (updates.stock !== undefined) payload.stock_quantity = updates.stock;
      if (updates.minStock !== undefined) payload.min_stock = updates.minStock;
      if (updates.supplier !== undefined) payload.supplier_name = updates.supplier;
      if (updates.description !== undefined) payload.description = updates.description;

      const response = await api.updateBook(id, payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update book');
      }

      const mappedBook = mapBookRecord(response.data);

      setBooks(prev => prev.map(book =>
        book.id === id ? mappedBook : book
      ));
    } catch (error: any) {
      console.error('Failed to update book:', error);
      setError(error.message || 'Failed to update book');
      throw error;
    }
  };

  const deleteBook = async (id: string): Promise<void> => {
    try {
      setError(null);
      const response = await api.deleteBook(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete book');
      }

      setBooks(prev => prev.filter(book => book.id !== id));
      setStockHistory(prev => prev.filter(history => history.bookId !== id));
    } catch (error: any) {
      console.error('Error deleting book:', error);
      setError(error.message || 'Failed to delete book');
      throw error;
    }
  };

  const addStock = async (bookId: string, quantity: number, reference?: string, note?: string): Promise<void> => {
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) throw new Error('Book not found');

      const previousStock = book.stock;
      const newStock = previousStock + quantity;

      // Update book stock
      setBooks(prev => prev.map(b => 
        b.id === bookId 
          ? { ...b, stock: newStock, updatedAt: new Date().toISOString() }
          : b
      ));

      // Add stock history entry
      const historyEntry: StockHistory = {
        id: Date.now().toString(),
        bookId,
        type: 'addition',
        quantity,
        previousStock,
        newStock,
        reference,
        note,
        userId: user?.id || '',
        userName: user?.name || '',
        createdAt: new Date().toISOString()
      };

      setStockHistory(prev => [...prev, historyEntry]);
    } catch (err) {
      setError('Failed to add stock');
      throw err;
    }
  };

  const markWastage = async (bookId: string, quantity: number, note?: string): Promise<void> => {
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) throw new Error('Book not found');

      const previousStock = book.stock;
      const newStock = Math.max(0, previousStock - quantity);

      // Update book stock
      setBooks(prev => prev.map(b => 
        b.id === bookId 
          ? { ...b, stock: newStock, updatedAt: new Date().toISOString() }
          : b
      ));

      // Add stock history entry
      const historyEntry: StockHistory = {
        id: Date.now().toString(),
        bookId,
        type: 'wastage',
        quantity,
        previousStock,
        newStock,
        note,
        userId: user?.id || '',
        userName: user?.name || '',
        createdAt: new Date().toISOString()
      };

      setStockHistory(prev => [...prev, historyEntry]);
    } catch (err) {
      setError('Failed to mark wastage');
      throw err;
    }
  };

  const markReturn = async (bookId: string, quantity: number, note?: string): Promise<void> => {
    try {
      const book = books.find(b => b.id === bookId);
      if (!book) throw new Error('Book not found');

      const previousStock = book.stock;
      const newStock = previousStock + quantity;

      // Update book stock
      setBooks(prev => prev.map(b => 
        b.id === bookId 
          ? { ...b, stock: newStock, updatedAt: new Date().toISOString() }
          : b
      ));

      // Add stock history entry
      const historyEntry: StockHistory = {
        id: Date.now().toString(),
        bookId,
        type: 'return',
        quantity,
        previousStock,
        newStock,
        note,
        userId: user?.id || '',
        userName: user?.name || '',
        createdAt: new Date().toISOString()
      };

      setStockHistory(prev => [...prev, historyEntry]);
    } catch (err) {
      setError('Failed to mark return');
      throw err;
    }
  };

  const getStockHistory = (bookId: string): StockHistory[] => {
    return stockHistory.filter(history => history.bookId === bookId);
  };

  const getLowStockBooks = (): Book[] => {
    return books.filter(book => book.stock <= book.minStock);
  };

  const getBookById = (id: string): Book | undefined => {
    return books.find(book => book.id === id);
  };

  return (
    <InventoryContext.Provider value={{
      books,
      stockHistory,
      isLoading,
      error,
      addBook,
      updateBook,
      deleteBook,
      addStock,
      markWastage,
      markReturn,
      getStockHistory,
      getLowStockBooks,
      getBookById
    }}>
      {children}
    </InventoryContext.Provider>
  );
}; 