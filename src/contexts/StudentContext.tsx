import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, Purchase } from '../types';
import { useAuth } from './AuthContext';

interface StudentContextType {
  students: Student[];
  isLoading: boolean;
  error: string | null;
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  editStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  importStudentsFromExcel: (file: File) => Promise<void>;
  getStudentsByClass: (className: string) => Student[];
  searchStudents: (query: string) => Student[];
  getStudentById: (id: string) => Student | undefined;
  getPurchaseHistory: (studentId: string) => Purchase[];
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const useStudentContext = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudentContext must be used within a StudentProvider');
  }
  return context;
};

// Mock data for demonstration
const mockStudents: Student[] = [
  { id: '1', name: 'Rahul Kumar', class: 'Class 10', rollNumber: '10A01', createdAt: '2024-01-01' },
  { id: '2', name: 'Priya Sharma', class: 'Class 10', rollNumber: '10A02', createdAt: '2024-01-02' },
  { id: '3', name: 'Amit Singh', class: 'Class 9', rollNumber: '9B15', createdAt: '2024-01-03' },
  { id: '4', name: 'Sneha Patel', class: 'Class 9', rollNumber: '9B16', createdAt: '2024-01-04' },
  { id: '5', name: 'Ravi Gupta', class: 'Class 8', rollNumber: '8C22', createdAt: '2024-01-05' },
  { id: '6', name: 'Anita Verma', class: 'Class 8', rollNumber: '8C23', createdAt: '2024-01-06' },
];

const mockPurchases: Purchase[] = [
  {
    id: 'p1',
    studentId: '1',
    studentName: 'Rahul Kumar',
    items: [
      { bookId: '1', title: 'Mathematics Class 10', quantity: 1, price: 150, total: 150 }
    ],
    total: 150,
    discount: 0,
    paymentMode: 'cash',
    cashierId: '2',
    cashierName: 'Sarah Cashier',
    createdAt: '2024-01-10'
  },
  {
    id: 'p2',
    studentId: '2',
    studentName: 'Priya Sharma',
    items: [
      { bookId: '2', title: 'English Grammar', quantity: 1, price: 120, total: 120 }
    ],
    total: 120,
    discount: 0,
    paymentMode: 'card',
    cashierId: '2',
    cashierName: 'Sarah Cashier',
    createdAt: '2024-01-12'
  }
];

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setStudents(mockStudents);
    setIsLoading(false);
  }, []);

  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      const newStudent: Student = {
        ...studentData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setStudents(prev => [...prev, newStudent]);
    } catch (err) {
      setError('Failed to add student');
      throw err;
    }
  };

  const editStudent = async (id: string, updates: Partial<Student>) => {
    try {
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err) {
      setError('Failed to edit student');
      throw err;
    }
  };

  // Simulate Excel import (admin only)
  const importStudentsFromExcel = async (file: File) => {
    if (user?.role !== 'admin') {
      setError('Permission denied');
      throw new Error('Permission denied');
    }
    // In a real app, parse the Excel file here
    // For now, just simulate a delay
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Simulate import by adding a mock student
        setStudents(prev => ([
          ...prev,
          { id: Date.now().toString(), name: 'Imported Student', class: 'Class 7', rollNumber: '7A99', createdAt: new Date().toISOString() }
        ]));
        resolve();
      }, 1000);
    });
  };

  const getStudentsByClass = (className: string) => {
    return students.filter(s => s.class === className);
  };

  const searchStudents = (query: string) => {
    return students.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getStudentById = (id: string) => {
    return students.find(s => s.id === id);
  };

  const getPurchaseHistory = (studentId: string) => {
    return mockPurchases.filter(p => p.studentId === studentId);
  };

  return (
    <StudentContext.Provider value={{
      students,
      isLoading,
      error,
      addStudent,
      editStudent,
      importStudentsFromExcel,
      getStudentsByClass,
      searchStudents,
      getStudentById,
      getPurchaseHistory
    }}>
      {children}
    </StudentContext.Provider>
  );
}; 