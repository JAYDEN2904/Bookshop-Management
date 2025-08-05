import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, StockHistory } from '../types';
import { useAuth } from './AuthContext';

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
  {
    id: '1',
    title: 'Mathematics Textbook',
    author: 'John Smith',
    isbn: '978-1234567890',
    class: 'Class 10',
    subject: 'Mathematics',
    type: 'textbook',
    sellingPrice: 250,
    costPrice: 180,
    stock: 45,
    minStock: 10,
    supplier: 'ABC Publishers',
    description: 'Comprehensive mathematics textbook for Class 10',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'English Workbook',
    author: 'Jane Doe',
    isbn: '978-0987654321',
    class: 'Class 9',
    subject: 'English',
    type: 'workbook',
    sellingPrice: 120,
    costPrice: 85,
    stock: 3,
    minStock: 5,
    supplier: 'XYZ Publications',
    description: 'Practice workbook for English grammar and composition',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-10'
  },
  {
    id: '3',
    title: 'Science Reference Book',
    author: 'Dr. Robert Wilson',
    isbn: '978-1122334455',
    class: 'Class 11',
    subject: 'Science',
    type: 'reference',
    sellingPrice: 350,
    costPrice: 250,
    stock: 15,
    minStock: 8,
    supplier: 'Science Publishers Ltd',
    description: 'Advanced science reference for higher secondary students',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-12'
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

  useEffect(() => {
    // Load mock data
    setBooks(mockBooks);
    setStockHistory(mockStockHistory);
    setIsLoading(false);
  }, []);

  const addBook = async (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      const newBook: Book = {
        ...bookData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setBooks(prev => [...prev, newBook]);
      
      // Add initial stock history entry
      const initialHistory: StockHistory = {
        id: Date.now().toString(),
        bookId: newBook.id,
        type: 'addition',
        quantity: newBook.stock,
        previousStock: 0,
        newStock: newBook.stock,
        reference: 'Initial stock',
        note: 'Book added to inventory',
        userId: user?.id || '',
        userName: user?.name || '',
        createdAt: new Date().toISOString()
      };
      
      setStockHistory(prev => [...prev, initialHistory]);
    } catch (err) {
      setError('Failed to add book');
      throw err;
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>): Promise<void> => {
    try {
      setBooks(prev => prev.map(book => 
        book.id === id 
          ? { ...book, ...updates, updatedAt: new Date().toISOString() }
          : book
      ));
    } catch (err) {
      setError('Failed to update book');
      throw err;
    }
  };

  const deleteBook = async (id: string): Promise<void> => {
    try {
      setBooks(prev => prev.filter(book => book.id !== id));
      setStockHistory(prev => prev.filter(history => history.bookId !== id));
    } catch (err) {
      setError('Failed to delete book');
      throw err;
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