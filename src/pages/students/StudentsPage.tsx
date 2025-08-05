import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  GraduationCap,
  Edit,
  Trash2,
  FileSpreadsheet,
  Users,
  Loader2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Student } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentContext } from '../../contexts/StudentContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const PAGE_SIZE = 10;

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const {
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
  } = useStudentContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    studentId: ''
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Student[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const classes = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

  // Filtering and searching
  const filteredStudents = (searchTerm ? searchStudents(searchTerm) : students)
    .filter(student => !selectedClass || student.class === selectedClass);

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Bulk selection logic
  const isAllSelected = paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds(selectedStudentIds.filter(id => !paginatedStudents.some(s => s.id === id)));
    } else {
      setSelectedStudentIds([
        ...selectedStudentIds,
        ...paginatedStudents.filter(s => !selectedStudentIds.includes(s.id)).map(s => s.id)
      ]);
    }
  };
  const toggleSelectOne = (id: string) => {
    setSelectedStudentIds(selectedStudentIds.includes(id)
      ? selectedStudentIds.filter(sid => sid !== id)
      : [...selectedStudentIds, id]);
  };
  const clearSelection = () => setSelectedStudentIds([]);

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the selected students?')) return;
    setBulkActionLoading(true);
    try {
      for (const id of selectedStudentIds) {
        await deleteStudent(id);
      }
      toast.success('Selected students deleted');
      clearSelection();
    } catch {
      toast.error('Failed to delete students');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk edit (change class)
  const handleBulkEditClass = async (newClass: string) => {
    setBulkActionLoading(true);
    try {
      for (const id of selectedStudentIds) {
        await editStudent(id, { class: newClass });
      }
      toast.success('Class updated for selected students');
      clearSelection();
    } catch {
      toast.error('Failed to update class');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredStudents.map(s => ({
      Name: s.name,
      Class: s.class,
      'Student ID': s.studentId || 'N/A',
      'Joined': s.createdAt
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'students.xlsx');
  };

  const isAdmin = user?.role === 'admin';

  // Handlers
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.class || !formData.studentId) {
      toast.error('Please fill all fields');
      return;
    }
    setActionLoading(true);
    try {
      await addStudent(formData);
      toast.success('Student added successfully');
      setShowAddModal(false);
      setFormData({ name: '', class: '', studentId: '' });
    } catch {
      toast.error('Failed to add student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setActionLoading(true);
    try {
      await editStudent(selectedStudent.id, formData);
      toast.success('Student updated successfully');
      setShowEditModal(false);
      setSelectedStudent(null);
      setFormData({ name: '', class: '', studentId: '' });
    } catch {
      toast.error('Failed to update student');
    } finally {
      setActionLoading(false);
    }
  };

  // Excel parsing and preview
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportPreview([]);
    const file = e.target.files?.[0] || null;
    setImportFile(file);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        
        // Try different XLSX reading options for better compatibility
        let workbook;
        try {
          workbook = XLSX.read(data, { 
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false,
            raw: false
          });
        } catch (err) {
          console.log('First attempt failed, trying with different options:', err);
          try {
            workbook = XLSX.read(data, { 
              type: 'array',
              cellDates: false,
              cellNF: false,
              cellText: true,
              raw: true
            });
          } catch (err2) {
            console.log('Second attempt failed, trying basic options:', err2);
            workbook = XLSX.read(data, { type: 'array' });
          }
        }
        const preview: Student[] = [];
        
        console.log('Available sheets:', workbook.SheetNames);
        console.log('Workbook structure:', workbook);
        console.log('Workbook keys:', Object.keys(workbook));
        console.log('Workbook Sheets:', workbook.Sheets);
        
        workbook.SheetNames.forEach((sheetName) => {
          const ws = workbook.Sheets[sheetName];
          console.log(`Processing sheet: ${sheetName}`);
          console.log(`Sheet object:`, ws);
          
          // Get the sheet range
          const range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
          console.log(`Sheet range:`, range);
          
          // Extract all cell data directly
          const rows: any[][] = [];
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const row: any[] = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cell_address = XLSX.utils.encode_cell({r: R, c: C});
              const cell = ws[cell_address];
              if (cell) {
                console.log(`Cell ${cell_address}:`, cell);
                // Handle different cell value formats
                let cellValue = '';
                if (typeof cell.v === 'string') {
                  cellValue = cell.v;
                } else if (typeof cell.v === 'number') {
                  cellValue = cell.v.toString();
                } else if (cell.v !== undefined && cell.v !== null) {
                  cellValue = cell.v.toString();
                }
                row.push(cellValue);
              } else {
                row.push('');
              }
            }
            if (row.some(cell => cell !== '')) {
              rows.push(row);
            }
          }
          
          console.log(`Extracted rows from "${sheetName}":`, rows);
          
          // If no rows found, try alternative parsing method
          if (rows.length === 0) {
            console.log(`No rows found, trying alternative parsing method`);
            try {
              // Try using sheet_to_json method
              const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
              console.log(`Alternative method - JSON data:`, jsonData);
              
              if (jsonData.length > 0) {
                rows.push(...jsonData);
                console.log(`Added ${jsonData.length} rows from alternative method`);
              }
            } catch (altErr) {
              console.log(`Alternative method failed:`, altErr);
            }
          }
          
          if (rows.length < 2) {
            console.log(`Skipping sheet "${sheetName}" - not enough rows`);
            return;
          }
          
          // Find the actual header row by looking for meaningful headers
          let headerRowIndex = 0;
          let headers: string[] = [];
          
          // Look for a row that contains header-like text
          for (let i = 0; i < Math.min(5, rows.length); i++) {
            const potentialHeaders = rows[i].map((h: any) => (h || '').toString().toLowerCase());
            console.log(`Row ${i} potential headers:`, potentialHeaders);
            
            // Check if this row contains header-like text
            const hasNameHeader = potentialHeaders.some(h => 
              h.includes('name') || h.includes('student') || h.includes('full') || h.includes('first')
            );
            const hasIdHeader = potentialHeaders.some(h => 
              h.includes('student') && h.includes('id') || h.includes('id') || h.includes('roll')
            );
            
            if (hasNameHeader || hasIdHeader) {
              headerRowIndex = i;
              headers = potentialHeaders;
              console.log(`Found header row at index ${i}:`, headers);
              break;
            }
          }
          
          // If no proper headers found, assume first row is headers
          if (headers.length === 0 || headers.every(h => h === '')) {
            headers = rows[0].map((h: any) => (h || '').toString().toLowerCase());
            console.log(`Using first row as headers:`, headers);
          }
          
          console.log(`Final headers in "${sheetName}":`, headers);
          
          // More flexible column detection for your specific format
          const nameIdx = headers.findIndex((h: string) => 
            h.includes('name') && h.includes('of') && h.includes('student')
          );
          const studentIdIdx = headers.findIndex((h: string) => 
            h.includes('student') && h.includes('id') && !h.includes('name')
          );
          const classIdx = headers.findIndex((h: string) => 
            h.includes('class') || h.includes('grade') || h.includes('section') || h.includes('group')
          );
          
          console.log(`Column mapping - nameIdx: ${nameIdx}, studentIdIdx: ${studentIdIdx}, classIdx: ${classIdx}`);
          console.log(`Headers found: ${headers.join(', ')}`);
          console.log(`Headers with indices:`);
          headers.forEach((header, index) => {
            if (header.trim()) {
              console.log(`  Index ${index}: "${header}"`);
            }
          });
          
          console.log(`Found nameIdx: ${nameIdx}, studentIdIdx: ${studentIdIdx}, classIdx: ${classIdx}`);
          
          // Check if we have the required columns
          if (nameIdx === -1) {
            const errorMsg = `Sheet "${sheetName}" missing "Name" column. Found: ${headers.join(', ')}.`;
            console.log(errorMsg);
            setImportError(errorMsg);
            return;
          }
          
          // If we have student ID but no class, use student ID as class
          if (studentIdIdx !== -1 && classIdx === -1) {
            console.log(`Using Student ID as class identifier`);
          } else if (classIdx === -1) {
            const errorMsg = `Sheet "${sheetName}" missing "Class" column. Found: ${headers.join(', ')}. Need a column for class/grade/student id.`;
            console.log(errorMsg);
            setImportError(errorMsg);
            return;
          }
          
          for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            
            // If we can't find proper headers, try to infer from data
            if (nameIdx === -1 && studentIdIdx === -1) {
              console.log('No proper headers found, using inferred column order...');
              // Assume first column is Student ID, second is Class, third is Name
              const inferredNameIdx = 2; // Third column
              const inferredStudentIdIdx = 0; // First column
              
              if (!row[inferredNameIdx] || !row[inferredStudentIdIdx]) {
                console.log(`Skipping row ${i} - missing data:`, row);
                continue;
              }
              
              const studentName = row[inferredNameIdx].toString().trim();
              const studentId = row[inferredStudentIdIdx].toString().trim();
              
              const student = {
                id: `${sheetName}-${i}-${studentId}`,
                name: studentName,
                class: sheetName, // Use sheet name as class
                studentId: studentId, // Store the actual student ID from Excel
                createdAt: new Date().toISOString()
              };
              
              console.log(`Adding student with inferred mapping:`, student);
              preview.push(student);
              continue;
            }
            
            // Use student ID as the class identifier
            const classColumnIdx = studentIdIdx;
            
            if (!row[nameIdx] || !row[classColumnIdx]) {
              console.log(`Skipping row ${i} - missing data:`, row);
              continue;
            }
            
            const studentName = row[nameIdx].toString().trim();
            const studentId = row[classColumnIdx].toString().trim();
            
            const student = {
              id: `${sheetName}-${i}-${studentId}`,
              name: studentName,
              class: sheetName, // Use sheet name as class
              studentId: studentId, // Store the actual student ID from Excel
              createdAt: new Date().toISOString()
            };
            
            console.log(`Adding student:`, student);
            preview.push(student);
          }
        });
        
        console.log(`Total students found: ${preview.length}`);
        
        if (preview.length === 0) {
          setImportError('No valid students found in the file. Please check that your Excel file has columns for "Name" and "Class".');
        } else {
          setImportPreview(preview);
        }
      } catch (err) {
        console.error('Excel parsing error:', err);
        setImportError(`Failed to parse Excel file: ${err}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile || importPreview.length === 0) {
      toast.error('Please select a valid file and preview students.');
      return;
    }
    setImportLoading(true);
    try {
      // Simulate import for each student in preview
      for (const student of importPreview) {
        await addStudent({ name: student.name, class: student.class, studentId: student.studentId });
      }
      toast.success('Students imported successfully');
      setShowImportModal(false);
      setImportFile(null);
      setImportPreview([]);
    } catch {
      toast.error('Failed to import students');
    } finally {
      setImportLoading(false);
    }
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
            setFormData({
          name: student.name,
          class: student.class,
          studentId: student.studentId || ''
        });
    setShowEditModal(true);
  };

  const openHistoryModal = (student: Student) => {
    setSelectedStudent(student);
    setShowHistoryModal(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to delete ${student.name}?`)) return;
    setActionLoading(true);
    try {
      await deleteStudent(student.id);
      toast.success('Student deleted successfully');
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-600">{isAdmin ? 'Manage student information and class lists' : 'View students by class'}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportExcel} title="Export students to Excel">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setShowImportModal(true)} title="Import students from Excel">
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </Button>
              <Button onClick={() => setShowAddModal(true)} title="Add a new student">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {isAdmin && selectedStudentIds.length > 0 && (
        <div className="flex items-center space-x-4 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
          <span>{selectedStudentIds.length} selected</span>
          <Button size="sm" variant="danger" loading={bulkActionLoading} onClick={handleBulkDelete} title="Delete selected students">Delete</Button>
          <select
            className="px-2 py-1 border border-gray-300 rounded-md"
            onChange={e => e.target.value && handleBulkEditClass(e.target.value)}
            defaultValue=""
            title="Change class for selected students"
          >
            <option value="">Change Class</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={clearSelection}>Clear</Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            icon={<Search className="h-4 w-4 text-gray-400" />}
          />
        </div>
        <select
          value={selectedClass}
          onChange={(e) => { setSelectedClass(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Button variant="outline" title="Filter students by class or search">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Students Table (paginated, with checkboxes) */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {isAdmin && <th className="px-4 py-3"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} /></th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedStudents.length ? (
              paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  {isAdmin && <td className="px-4 py-4"><input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleSelectOne(student.id)} /></td>}
                  <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.studentId || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {isAdmin && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openEditModal(student)} title="Edit student">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteStudent(student)} title="Delete student" loading={actionLoading}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openHistoryModal(student)} title="View purchase history">
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-6 py-4 text-gray-400 text-center">No students found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button size="sm" variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({ name: '', class: '', studentId: '' });
        }}
        title="Add Student"
        size="md"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          <Input
            label="Name"
            placeholder="Enter student name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            value={formData.class}
            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
            required
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Input
            label="Student ID"
            placeholder="Enter student ID"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              setShowAddModal(false);
              setFormData({ name: '', class: '', studentId: '' });
            }}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>Add Student</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStudent(null);
          setFormData({ name: '', class: '', studentId: '' });
        }}
        title="Edit Student"
        size="md"
      >
        <form onSubmit={handleEditStudent} className="space-y-4">
          <Input
            label="Name"
            placeholder="Enter student name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            value={formData.class}
            onChange={(e) => setFormData({ ...formData, class: e.target.value })}
            required
          >
            <option value="">Select Class</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Input
            label="Student ID"
            placeholder="Enter student ID"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              setShowEditModal(false);
              setSelectedStudent(null);
              setFormData({ name: '', class: '', studentId: '' });
            }}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading}>Update Student</Button>
          </div>
        </form>
      </Modal>

      {/* Import Students Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportPreview([]);
          setImportError(null);
        }}
        title="Import Students from Excel"
        size="md"
      >
        <form onSubmit={handleImportExcel} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Excel Format Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Each sheet name represents the class (e.g., "Class 1", "Class 10")</li>
              <li>• Each row should contain: Name, Student ID</li>
              <li>• First row should be headers: "Name", "Student ID"</li>
              <li>• All students in a sheet will be assigned to that class</li>
              <li>• Save file as .xlsx or .xls format</li>
            </ul>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            required
          />
          {importError && <div className="text-red-600 text-sm">{importError}</div>}
          {importPreview.length > 0 && !importError && (
            <div className="max-h-48 overflow-y-auto border rounded-md mt-2">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1">Name</th>
                    <th className="px-2 py-1">Class</th>
                    <th className="px-2 py-1">Student ID</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((s, i) => (
                    <tr key={s.id + i}>
                      <td className="px-2 py-1">{s.name}</td>
                      <td className="px-2 py-1">{s.class}</td>
                      <td className="px-2 py-1">{s.studentId || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              setShowImportModal(false);
              setImportFile(null);
              setImportPreview([]);
              setImportError(null);
            }}>
              Cancel
            </Button>
            <Button type="submit" loading={importLoading} disabled={!!importError || importPreview.length === 0}>Import</Button>
          </div>
        </form>
      </Modal>

      {/* Student Purchase History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedStudent(null);
        }}
        title={`Purchase History - ${selectedStudent?.name || ''}`}
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900">{selectedStudent.name}</h4>
              <p className="text-gray-600">Class: {selectedStudent.class} | Student ID: {selectedStudent.studentId || 'N/A'}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPurchaseHistory(selectedStudent.id).length ? (
                    getPurchaseHistory(selectedStudent.id).map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(purchase.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {purchase.items.map(item => `${item.title} (x${item.quantity})`).join(', ')}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">₵{purchase.total}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.paymentMode}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.cashierName}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-gray-400 text-center">No purchases found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => {
                setShowHistoryModal(false);
                setSelectedStudent(null);
              }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentsPage;