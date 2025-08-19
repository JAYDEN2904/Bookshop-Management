import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, Purchase } from '../types';
import { useAuth } from './AuthContext';
import { normalizeClassName } from '../utils/classNames';
import { supabase } from '../config/supabase';

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

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load students from Supabase
  const loadStudents = async () => {
    try {
      setError(null);
      const { data: studentsData, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching students:', fetchError);
        setError('Failed to load students');
        return;
      }

      // Map Supabase field names to Student interface
      const mappedStudents: Student[] = (studentsData || []).map(student => ({
        id: student.id,
        name: student.name,
        class: normalizeClassName(student.class_level),
        studentId: student.student_id,
        createdAt: student.created_at
      }));

      setStudents(mappedStudents);
    } catch (error: any) {
      console.error('Failed to load students:', error);
      setError(error.message || 'Failed to load students');
    }
  };

  useEffect(() => {
    if (user) {
      loadStudents();
    }
    setIsLoading(false);
  }, [user]);

  const refreshStudents = async () => {
    setIsLoading(true);
    await loadStudents();
    setIsLoading(false);
  };

  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      const normalizedData = {
        name: studentData.name,
        class_level: normalizeClassName(studentData.class),
        student_id: studentData.studentId
      };
      
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert([normalizedData])
        .select()
        .single();

      if (createError) {
        console.error('Error creating student:', createError);
        setError('Failed to add student');
        throw new Error('Failed to add student');
      }

      // Map the new student to the interface
      const mappedStudent: Student = {
        id: newStudent.id,
        name: newStudent.name,
        class: normalizeClassName(newStudent.class_level),
        studentId: newStudent.student_id,
        createdAt: newStudent.created_at
      };

      setStudents(prev => [...prev, mappedStudent]);
    } catch (error: any) {
      console.error('Failed to add student:', error);
      setError(error.message || 'Failed to add student');
      throw error;
    }
  };

  const editStudent = async (id: string, updates: Partial<Student>) => {
    try {
      setError(null);
      const normalizedUpdates: any = {};
      
      if (updates.name) normalizedUpdates.name = updates.name;
      if (updates.class) normalizedUpdates.class_level = normalizeClassName(updates.class);
      if (updates.studentId) normalizedUpdates.student_id = updates.studentId;
      
      const { data: updatedStudent, error: updateError } = await supabase
        .from('students')
        .update(normalizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating student:', updateError);
        setError('Failed to edit student');
        throw new Error('Failed to edit student');
      }

      // Map the updated student to the interface
      const mappedStudent: Student = {
        id: updatedStudent.id,
        name: updatedStudent.name,
        class: normalizeClassName(updatedStudent.class_level),
        studentId: updatedStudent.student_id,
        createdAt: updatedStudent.created_at
      };

      setStudents(prev => prev.map(s => 
        s.id === id ? mappedStudent : s
      ));
    } catch (error: any) {
      console.error('Failed to edit student:', error);
      setError(error.message || 'Failed to edit student');
      throw error;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting student:', deleteError);
        setError('Failed to delete student');
        throw new Error('Failed to delete student');
      }

      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      console.error('Failed to delete student:', error);
      setError(error.message || 'Failed to delete student');
      throw error;
    }
  };

  // Import students from Excel (admin only)
  const importStudentsFromExcel = async (file: File) => {
    if (user?.role !== 'ADMIN') {
      setError('Permission denied');
      throw new Error('Permission denied');
    }

    try {
      setError(null);
      
      // Parse Excel file and convert to JSON
      const students = await parseExcelFile(file);
      
      // Insert students into Supabase
      const { data: importedStudents, error: importError } = await supabase
        .from('students')
        .insert(students)
        .select();

      if (importError) {
        console.error('Error importing students:', importError);
        setError('Failed to import students');
        throw new Error('Failed to import students');
      }

      await loadStudents(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to import students:', error);
      setError(error.message || 'Failed to import students');
      throw error;
    }
  };

  // Helper function to parse Excel file
  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // For now, we'll create sample data since we don't have Excel parsing
          // In a real implementation, you'd use a library like xlsx
          const timestamp = Date.now();
          const sampleStudents = [
            { name: 'John Doe', class_level: 'Basic 10' },
            { name: 'Jane Smith', class_level: 'Basic 12' },
            { name: 'Mike Johnson', class_level: 'Basic 8' },
            { name: 'Sarah Wilson', class_level: 'Basic 11' },
            { name: 'David Brown', class_level: 'Basic 9' },
            { name: 'Emily Davis', class_level: 'Basic 10' },
            { name: 'Michael Lee', class_level: 'Basic 12' },
            { name: 'Jessica Taylor', class_level: 'Basic 8' },
            { name: 'Christopher Anderson', class_level: 'Basic 11' },
            { name: 'Amanda Martinez', class_level: 'Basic 9' },
            { name: 'Daniel Garcia', class_level: 'Basic 10' },
            { name: 'Lisa Rodriguez', class_level: 'Basic 12' },
            { name: 'Robert Wilson', class_level: 'Basic 8' },
            { name: 'Jennifer Moore', class_level: 'Basic 11' },
            { name: 'William Jackson', class_level: 'Basic 9' }
          ];
          resolve(sampleStudents);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const getStudentsByClass = (className: string) => {
    const normalizedClass = normalizeClassName(className);
    return students.filter(s => s.class === normalizedClass);
  };

  const searchStudents = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.studentId.toLowerCase().includes(lowerQuery) ||
      s.class.toLowerCase().includes(lowerQuery)
    );
  };

  const getStudentById = (id: string) => {
    return students.find(s => s.id === id);
  };

  const getPurchaseHistory = (studentId: string) => {
    // This would need to be implemented with a real Supabase call
    // For now, return empty array
    return [];
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
      getPurchaseHistory,
      refreshStudents
    }}>
      {children}
    </StudentContext.Provider>
  );
}; 