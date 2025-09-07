import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, Purchase } from '../types';
import { useAuth } from './AuthContext';
import apiConfig from '../config/api';

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
  refreshStudents: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const useStudentContext = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudentContext must be used within a StudentProvider');
  }
  return context;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('bookshop_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error);
  if (error.response?.data?.error) {
    throw new Error(error.response.data.error);
  }
  if (error.message) {
    throw new Error(error.message);
  }
  throw new Error(defaultMessage);
};

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch students from API
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${apiConfig.baseURL}${apiConfig.endpoints.students}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Transform API data to match frontend format
        const transformedStudents = data.data.map((student: any) => ({
          id: student.id,
          name: student.name,
          class: student.class_level,
          studentId: student.student_id,
          email: student.email,
          phone: student.phone,
          createdAt: student.created_at,
        }));
        setStudents(transformedStudents);
      } else {
        throw new Error(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch students';
      setError(errorMessage);
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load students on mount
  useEffect(() => {
    if (user) {
      fetchStudents();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Add student
  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      
      const response = await fetch(`${apiConfig.baseURL}${apiConfig.endpoints.students}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: studentData.name,
          class_level: studentData.class,
          email: studentData.email,
          phone: studentData.phone,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to add students.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Transform and add the new student
        const newStudent = {
          id: data.data.id,
          name: data.data.name,
          class: data.data.class_level,
          studentId: data.data.student_id,
          email: data.data.email,
          phone: data.data.phone,
          createdAt: data.data.created_at,
        };
        setStudents(prev => [...prev, newStudent]);
      } else {
        throw new Error(data.error || 'Failed to add student');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add student';
      setError(errorMessage);
      throw error;
    }
  };

  // Edit student
  const editStudent = async (id: string, updates: Partial<Student>) => {
    try {
      setError(null);
      
      const response = await fetch(`${apiConfig.baseURL}${apiConfig.endpoints.students}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: updates.name,
          class_level: updates.class,
          email: updates.email,
          phone: updates.phone,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to edit students.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Update the student in the list
        setStudents(prev => prev.map(student => 
          student.id === id 
            ? {
                ...student,
                name: data.data.name,
                class: data.data.class_level,
                studentId: data.data.student_id,
                email: data.data.email,
                phone: data.data.phone,
              }
            : student
        ));
      } else {
        throw new Error(data.error || 'Failed to update student');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update student';
      setError(errorMessage);
      throw error;
    }
  };

  // Delete student
  const deleteStudent = async (id: string) => {
    try {
      setError(null);
      
      const response = await fetch(`${apiConfig.baseURL}${apiConfig.endpoints.students}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to delete students.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setStudents(prev => prev.filter(student => student.id !== id));
      } else {
        throw new Error(data.error || 'Failed to delete student');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete student';
      setError(errorMessage);
      throw error;
    }
  };

  // Import students from Excel
  const importStudentsFromExcel = async (file: File) => {
    try {
      setError(null);
      
      // Parse Excel file
      const workbook = await import('xlsx').then(module => module.readFile(file));
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = await import('xlsx').then(module => module.utils.sheet_to_json(worksheet));
      
      // Transform data
      const studentsToImport = jsonData.map((row: any) => ({
        name: row.Name || row.name,
        class_level: row.Class || row.class || row.Class_Level || row.class_level,
        email: row.Email || row.email,
        phone: row.Phone || row.phone,
      }));

      const response = await fetch(`${apiConfig.baseURL}${apiConfig.endpoints.students}/import`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ students: studentsToImport }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to import students.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Refresh the students list
        await fetchStudents();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to import students');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import students';
      setError(errorMessage);
      throw error;
    }
  };

  // Get students by class
  const getStudentsByClass = (className: string) => {
    return students.filter(student => student.class === className);
  };

  // Search students
  const searchStudents = (query: string) => {
    if (!query.trim()) return students;
    
    const lowercaseQuery = query.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(lowercaseQuery) ||
      student.studentId?.toLowerCase().includes(lowercaseQuery) ||
      student.class.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Get student by ID
  const getStudentById = (id: string) => {
    return students.find(student => student.id === id);
  };

  // Get purchase history (placeholder - would need API endpoint)
  const getPurchaseHistory = async (studentId: string): Promise<Purchase[]> => {
    // This would need a proper API endpoint
    // For now, return empty array
    return [];
  };

  // Refresh students
  const refreshStudents = async () => {
    await fetchStudents();
  };

  const value: StudentContextType = {
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
    getPurchaseHistory,
    refreshStudents,
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};
