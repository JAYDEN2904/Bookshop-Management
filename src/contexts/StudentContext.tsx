import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, Purchase } from '../types';
import { useAuth } from './AuthContext';
import { normalizeClassName } from '../utils/classNames';

interface StudentContextType {
  students: Student[];
  isLoading: boolean;
  error: string | null;
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  editStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
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
  { id: '1', name: 'Rahul Kumar', class: 'Basic 9', studentId: '10A01', createdAt: '2024-01-01' },
  { id: '2', name: 'Priya Sharma', class: 'Basic 9', studentId: '10A02', createdAt: '2024-01-02' },
      { id: '3', name: 'Amit Singh', class: 'Basic 8', studentId: '9B15', createdAt: '2024-01-03' },
    { id: '4', name: 'Sneha Patel', class: 'Basic 8', studentId: '9B16', createdAt: '2024-01-04' },
      { id: '5', name: 'Ravi Gupta', class: 'Basic 7', studentId: '8C22', createdAt: '2024-01-05' },
    { id: '6', name: 'Anita Verma', class: 'Basic 7', studentId: '8C23', createdAt: '2024-01-06' },
];

const mockPurchases: Purchase[] = [
  {
    id: 'p1',
    studentId: '1',
    studentName: 'Rahul Kumar',
    items: [
      { bookId: '1', title: 'Mathematics Basic 9', quantity: 1, price: 150, total: 150 }
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

  // Load students from localStorage on mount
  useEffect(() => {
    try {
      const savedStudents = localStorage.getItem('students');
      if (savedStudents) {
        const parsedStudents = JSON.parse(savedStudents);
        const migratedStudents = parsedStudents.map((student: any) => {
          const normalizedClass = normalizeClassName(student.class);
          const normalized = { ...student, class: normalizedClass };
          if (!normalized.studentId) {
            normalized.studentId = student.rollNumber || `ID-${student.id}`;
          }
          return normalized;
        });
        setStudents(migratedStudents);
      } else {
        // Normalize mock data too
        setStudents(mockStudents.map(s => ({ ...s, class: normalizeClassName(s.class) })));
      }
    } catch (err) {
      console.error('Error loading students from localStorage:', err);
      setStudents(mockStudents.map(s => ({ ...s, class: normalizeClassName(s.class) })));
    }
    setIsLoading(false);
  }, []);

  // Save students to localStorage whenever students change
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('students', JSON.stringify(students));
    }
  }, [students]);

  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      const newStudent: Student = {
        ...studentData,
        class: normalizeClassName(studentData.class),
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
      setStudents(prev => prev.map(s => {
        if (s.id !== id) return s;
        const nextClass = updates.class !== undefined ? normalizeClassName(updates.class) : s.class;
        return { ...s, ...updates, class: nextClass } as Student;
      }));
    } catch (err) {
      setError('Failed to edit student');
      throw err;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError('Failed to delete student');
      throw err;
    }
  };

  // Simulate Excel import (admin only)
  const importStudentsFromExcel = async (_file: File) => {
    if (user?.role !== 'admin') {
      setError('Permission denied');
      throw new Error('Permission denied');
    }
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setStudents(prev => ([
          ...prev,
          { id: Date.now().toString(), name: 'Imported Student', class: normalizeClassName('Basic 6'), studentId: '7A99', createdAt: new Date().toISOString() }
        ]));
        resolve();
      }, 1000);
    });
  };

  const getStudentsByClass = (className: string) => {
    const normalized = normalizeClassName(className);
    return students.filter(s => normalizeClassName(s.class) === normalized);
  };

  const searchStudents = (query: string) => {
    return students.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(query.toLowerCase()))
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
      deleteStudent,
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