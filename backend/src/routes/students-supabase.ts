import express from 'express';
import { supabase } from '../config/supabase';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// @desc    Get all students
// @route   GET /api/students
// @access  Private
router.get('/', protect, async (req: any, res) => {
  try {
    const { search, class_level, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,student_id.ilike.%${search}%,class_level.ilike.%${search}%`);
    }

    if (class_level) {
      query = query.eq('class_level', class_level);
    }

    // Apply pagination
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: students, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Get students error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Get recent purchases for each student
    const studentsWithPurchases = await Promise.all(
      students?.map(async (student) => {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('*')
          .eq('student_id', student.id)
          .order('created_at', { ascending: false })
          .limit(5);

        return {
          ...student,
          purchases: purchases || []
        };
      }) || []
    );

    return res.json({
      success: true,
      data: studentsWithPurchases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Get student's purchases
    const { data: purchases } = await supabase
      .from('purchases')
      .select(`
        *,
        books (*)
      `)
      .eq('student_id', req.params.id)
      .order('created_at', { ascending: false });

    return res.json({
      success: true,
      data: {
        ...student,
        purchases: purchases || []
      }
    });
  } catch (error) {
    console.error('Get student error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create student
// @route   POST /api/students
// @access  Private (Admin only)
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, class_level, email, phone } = req.body;

    // Validate required fields
    if (!name || !class_level) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name and class_level'
      });
    }

    // Generate student ID
    const { data: studentId, error: idError } = await supabase.rpc('generate_student_id');
    
    if (idError) {
      console.error('Generate student ID error:', idError);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate student ID'
      });
    }

    const { data: student, error } = await supabase
      .from('students')
      .insert([{
        student_id: studentId,
        name,
        class_level,
        email,
        phone
      }])
      .select()
      .single();

    if (error) {
      console.error('Create student error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Create student error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, class_level, email, phone } = req.body;

    const { data: student, error } = await supabase
      .from('students')
      .update({
        name,
        class_level,
        email,
        phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    return res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Update student error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete student error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Import students from Excel
// @route   POST /api/students/import
// @access  Private (Admin only)
router.post('/import', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of students'
      });
    }

    const importedStudents: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      
      try {
        // Generate student ID
        const { data: studentId, error: idError } = await supabase.rpc('generate_student_id');
        
        if (idError) {
          errors.push(`Row ${i + 1}: Failed to generate student ID`);
          continue;
        }

        const { data: newStudent, error } = await supabase
          .from('students')
          .insert([{
            student_id: studentId,
            name: student.name,
            class_level: student.class_level,
            email: student.email,
            phone: student.phone
          }])
          .select()
          .single();

        if (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        } else {
          importedStudents.push(newStudent);
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error}`);
      }
    }

    return res.json({
      success: true,
      data: {
        imported: importedStudents,
        errors,
        total: students.length,
        successful: importedStudents.length
      }
    });
  } catch (error) {
    console.error('Import students error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
