import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, StockHistory } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../config/supabase';

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
  refreshBooks: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load books from Supabase
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
      const mappedBooks: Book[] = (booksData || []).map(book => ({
        id: book.id,
        author: book.author,
        class: book.class_level,
        subject: book.subject,
        type: book.type,
        sellingPrice: book.price,
        costPrice: book.cost_price,
        stock: book.stock_quantity,
        minStock: book.min_stock,
        supplier: book.supplier_name,
        description: book.description,
        createdAt: book.created_at,
        updatedAt: book.updated_at
      }));

      setBooks(mappedBooks);
    } catch (error: any) {
      console.error('Failed to load books:', error);
      setError(error.message || 'Failed to load books');
    }
  };

  useEffect(() => {
    if (user) {
      loadBooks();
    }
    setIsLoading(false);
  }, [user]);

  const refreshBooks = async () => {
    setIsLoading(true);
    await loadBooks();
    setIsLoading(false);
  };

  const addBook = async (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      setError(null);
      const normalizedData = {
        title: bookData.author, // Using author as title for now
        author: bookData.author,
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

      const { data: newBook, error: createError } = await supabase
        .from('books')
        .insert([normalizedData])
        .select()
        .single();

      if (createError) {
        console.error('Error creating book:', createError);
        setError('Failed to add book');
        throw new Error('Failed to add book');
      }

      // Map the new book to the interface
      const mappedBook: Book = {
        id: newBook.id,
        author: newBook.author,
        class: newBook.class_level,
        subject: newBook.subject,
        type: newBook.type,
        sellingPrice: newBook.price,
        costPrice: newBook.cost_price,
        stock: newBook.stock_quantity,
        minStock: newBook.min_stock,
        supplier: newBook.supplier_name,
        description: newBook.description,
        createdAt: newBook.created_at,
        updatedAt: newBook.updated_at
      };

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
      const normalizedUpdates: any = {};
      
      if (updates.author) normalizedUpdates.author = updates.author;
      if (updates.class) normalizedUpdates.class_level = updates.class;
      if (updates.subject) normalizedUpdates.subject = updates.subject;
      if (updates.type) normalizedUpdates.type = updates.type;
      if (updates.sellingPrice) normalizedUpdates.price = updates.sellingPrice;
      if (updates.costPrice) normalizedUpdates.cost_price = updates.costPrice;
      if (updates.stock) normalizedUpdates.stock_quantity = updates.stock;
      if (updates.minStock) normalizedUpdates.min_stock = updates.minStock;
      if (updates.supplier) normalizedUpdates.supplier_name = updates.supplier;
      if (updates.description) normalizedUpdates.description = updates.description;

      const { data: updatedBook, error: updateError } = await supabase
        .from('books')
        .update(normalizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating book:', updateError);
        setError('Failed to update book');
        throw new Error('Failed to update book');
      }

      // Map the updated book to the interface
      const mappedBook: Book = {
        id: updatedBook.id,
        author: updatedBook.author,
        class: updatedBook.class_level,
        subject: updatedBook.subject,
        type: updatedBook.type,
        sellingPrice: updatedBook.price,
        costPrice: updatedBook.cost_price,
        stock: updatedBook.stock_quantity,
        minStock: updatedBook.min_stock,
        supplier: updatedBook.supplier_name,
        description: updatedBook.description,
        createdAt: updatedBook.created_at,
        updatedAt: updatedBook.updated_at
      };

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
      const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting book:', deleteError);
        setError('Failed to delete book');
        throw new Error('Failed to delete book');
      }

      setBooks(prev => prev.filter(book => book.id !== id));
      setStockHistory(prev => prev.filter(history => history.bookId !== id));
    } catch (error: any) {
      console.error('Failed to delete book:', error);
      setError(error.message || 'Failed to delete book');
      throw error;
    }
  };

  const addStock = async (bookId: string, quantity: number, reference?: string, note?: string): Promise<void> => {
    try {
      setError(null);
      const book = books.find(b => b.id === bookId);
      if (!book) throw new Error('Book not found');

      const previousStock = book.stock;
      const newStock = previousStock + quantity;

      // Update book stock using Supabase RPC function
      const { error: updateError } = await supabase.rpc('update_book_stock', {
        book_id: bookId,
        new_quantity: newStock
      });

      if (updateError) {
        console.error('Error updating stock:', updateError);
        setError('Failed to update stock');
        throw new Error('Failed to update stock');
      }

      setBooks(prev => prev.map(b => 
        b.id === bookId ? { ...b, stock: newStock } : b
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
    } catch (error: any) {
      console.error('Failed to add stock:', error);
      setError(error.message || 'Failed to add stock');
      throw error;
    }
  };

  const markWastage = async (bookId: string, quantity: number, note?: string): Promise<void> => {
    try {
      setError(null);
      const book = books.find(b => b.id === bookId);
      if (!book) throw new Error('Book not found');

      const previousStock = book.stock;
      const newStock = Math.max(0, previousStock - quantity);

      // Update book stock using Supabase RPC function
      const { error: updateError } = await supabase.rpc('update_book_stock', {
        book_id: bookId,
        new_quantity: newStock
      });

      if (updateError) {
        console.error('Error updating stock:', updateError);
        setError('Failed to mark wastage');
        throw new Error('Failed to mark wastage');
      }

      setBooks(prev => prev.map(b => 
        b.id === bookId ? { ...b, stock: newStock } : b
      ));

      // Add stock history entry
      const historyEntry: StockHistory = {
        id: Date.now().toString(),
        bookId,
        type: 'wastage',
        quantity,
        previousStock,
        newStock,
        reference: 'Wastage',
        note,
        userId: user?.id || '',
        userName: user?.name || '',
        createdAt: new Date().toISOString()
      };

      setStockHistory(prev => [...prev, historyEntry]);
    } catch (error: any) {
      console.error('Failed to mark wastage:', error);
      setError(error.message || 'Failed to mark wastage');
      throw error;
    }
  };

  const markReturn = async (bookId: string, quantity: number, note?: string): Promise<void> => {
    try {
      setError(null);
      const book = books.find(b => b.id === bookId);
      if (!book) throw new Error('Book not found');

      const previousStock = book.stock;
      const newStock = previousStock + quantity;

      // Update book stock using Supabase RPC function
      const { error: updateError } = await supabase.rpc('update_book_stock', {
        book_id: bookId,
        new_quantity: newStock
      });

      if (updateError) {
        console.error('Error updating stock:', updateError);
        setError('Failed to mark return');
        throw new Error('Failed to mark return');
      }

      setBooks(prev => prev.map(b => 
        b.id === bookId ? { ...b, stock: newStock } : b
      ));

      // Add stock history entry
      const historyEntry: StockHistory = {
        id: Date.now().toString(),
        bookId,
        type: 'return',
        quantity,
        previousStock,
        newStock,
        reference: 'Return',
        note,
        userId: user?.id || '',
        userName: user?.name || '',
        createdAt: new Date().toISOString()
      };

      setStockHistory(prev => [...prev, historyEntry]);
    } catch (error: any) {
      console.error('Failed to mark return:', error);
      setError(error.message || 'Failed to mark return');
      throw error;
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
      getBookById,
      refreshBooks
    }}>
      {children}
    </InventoryContext.Provider>
  );
}; 