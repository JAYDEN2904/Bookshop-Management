import express from 'express';
import { supabase } from '../config/supabase';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private (Admin only)
router.get('/sales', protect, authorize('ADMIN'), async (req: any, res) => {
  try {
    const { start_date, end_date, class_level, subject } = req.query;

    let query = supabase
      .from('purchases')
      .select(`
        *,
        students (id, name, student_id, class_level),
        books (id, title, class_level, subject, price)
      `);

    // Apply date filters
    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: purchases, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Get sales report error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Filter by class level and subject if provided
    let filteredPurchases = purchases || [];
    
    if (class_level) {
      filteredPurchases = filteredPurchases.filter(p => p.books?.class_level === class_level);
    }

    if (subject) {
      filteredPurchases = filteredPurchases.filter(p => p.books?.subject === subject);
    }

    // Calculate totals
    const totalSales = filteredPurchases.reduce((sum, p) => sum + Number(p.total_amount), 0);
    const totalQuantity = filteredPurchases.reduce((sum, p) => sum + Number(p.quantity), 0);
    const totalPurchases = filteredPurchases.length;

    // Group by book
    const bookSales = filteredPurchases.reduce((acc, purchase) => {
      const bookId = purchase.book_id;
      if (!acc[bookId]) {
        acc[bookId] = {
          book: purchase.books,
          quantity: 0,
          revenue: 0,
          purchases: 0
        };
      }
      acc[bookId].quantity += Number(purchase.quantity);
      acc[bookId].revenue += Number(purchase.total_amount);
      acc[bookId].purchases += 1;
      return acc;
    }, {});

    // Group by student
    const studentSales = filteredPurchases.reduce((acc, purchase) => {
      const studentId = purchase.student_id;
      if (!acc[studentId]) {
        acc[studentId] = {
          student: purchase.students,
          quantity: 0,
          revenue: 0,
          purchases: 0
        };
      }
      acc[studentId].quantity += Number(purchase.quantity);
      acc[studentId].revenue += Number(purchase.total_amount);
      acc[studentId].purchases += 1;
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalQuantity,
          totalPurchases,
          averageOrderValue: totalPurchases > 0 ? totalSales / totalPurchases : 0
        },
        bookSales: Object.values(bookSales),
        studentSales: Object.values(studentSales),
        purchases: filteredPurchases
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private (Admin only)
router.get('/inventory', protect, authorize('ADMIN'), async (req: any, res) => {
  try {
    const { class_level, subject, low_stock } = req.query;

    let query = supabase
      .from('books')
      .select('*', { count: 'exact' });

    // Apply filters
    if (class_level) {
      query = query.eq('class_level', class_level);
    }

    if (subject) {
      query = query.eq('subject', subject);
    }

    if (low_stock === 'true') {
      query = query.lte('stock_quantity', 10);
    }

    const { data: books, error, count } = await query.order('stock_quantity', { ascending: true });

    if (error) {
      console.error('Get inventory report error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Calculate totals
    const totalBooks = books?.length || 0;
    const totalStock = books?.reduce((sum, book) => sum + Number(book.stock_quantity), 0) || 0;
    const totalValue = books?.reduce((sum, book) => sum + (Number(book.stock_quantity) * Number(book.price)), 0) || 0;
    const lowStockBooks = books?.filter(book => Number(book.stock_quantity) <= 10) || [];
    const outOfStockBooks = books?.filter(book => Number(book.stock_quantity) === 0) || [];

    // Group by class level
    const classLevelSummary = books?.reduce((acc, book) => {
      const level = book.class_level;
      if (!acc[level]) {
        acc[level] = {
          class_level: level,
          books: 0,
          stock: 0,
          value: 0
        };
      }
      acc[level].books += 1;
      acc[level].stock += Number(book.stock_quantity);
      acc[level].value += Number(book.stock_quantity) * Number(book.price);
      return acc;
    }, {}) || {};

    // Group by subject
    const subjectSummary = books?.reduce((acc, book) => {
      const subj = book.subject;
      if (!acc[subj]) {
        acc[subj] = {
          subject: subj,
          books: 0,
          stock: 0,
          value: 0
        };
      }
      acc[subj].books += 1;
      acc[subj].stock += Number(book.stock_quantity);
      acc[subj].value += Number(book.stock_quantity) * Number(book.price);
      return acc;
    }, {}) || {};

    return res.json({
      success: true,
      data: {
        summary: {
          totalBooks,
          totalStock,
          totalValue,
          lowStockCount: lowStockBooks.length,
          outOfStockCount: outOfStockBooks.length
        },
        classLevelSummary: Object.values(classLevelSummary),
        subjectSummary: Object.values(subjectSummary),
        lowStockBooks,
        outOfStockBooks,
        allBooks: books
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get student report
// @route   GET /api/reports/students
// @access  Private (Admin only)
router.get('/students', protect, authorize('ADMIN'), async (req: any, res) => {
  try {
    const { class_level } = req.query;

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' });

    if (class_level) {
      query = query.eq('class_level', class_level);
    }

    const { data: students, error, count } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Get student report error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Get purchase data for each student
    const studentsWithPurchases = await Promise.all(
      students?.map(async (student) => {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('*')
          .eq('student_id', student.id);

        const totalSpent = purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;
        const totalBooks = purchases?.reduce((sum, p) => sum + Number(p.quantity), 0) || 0;

        return {
          ...student,
          totalSpent,
          totalBooks,
          purchaseCount: purchases?.length || 0
        };
      }) || []
    );

    // Calculate totals
    const totalStudents = studentsWithPurchases.length;
    const totalSpent = studentsWithPurchases.reduce((sum, s) => sum + s.totalSpent, 0);
    const totalBooks = studentsWithPurchases.reduce((sum, s) => sum + s.totalBooks, 0);
    const activeStudents = studentsWithPurchases.filter(s => s.purchaseCount > 0).length;

    // Group by class level
    const classLevelSummary = studentsWithPurchases.reduce((acc, student) => {
      const level = student.class_level;
      if (!acc[level]) {
        acc[level] = {
          class_level: level,
          students: 0,
          totalSpent: 0,
          totalBooks: 0,
          activeStudents: 0
        };
      }
      acc[level].students += 1;
      acc[level].totalSpent += student.totalSpent;
      acc[level].totalBooks += student.totalBooks;
      if (student.purchaseCount > 0) {
        acc[level].activeStudents += 1;
      }
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        summary: {
          totalStudents,
          totalSpent,
          totalBooks,
          activeStudents,
          averageSpent: totalStudents > 0 ? totalSpent / totalStudents : 0
        },
        classLevelSummary: Object.values(classLevelSummary),
        students: studentsWithPurchases
      }
    });
  } catch (error) {
    console.error('Get student report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
