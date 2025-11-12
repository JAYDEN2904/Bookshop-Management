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
        books (id, title, class_level, subject, price, cost_price)
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
    
    // Calculate profit (revenue - cost)
    const totalProfit = filteredPurchases.reduce((sum, p) => {
      const costPrice = Number(p.books?.cost_price || 0);
      const revenue = Number(p.total_amount);
      const cost = costPrice * Number(p.quantity);
      return sum + (revenue - cost);
    }, 0);

    // Group by book
    const bookSales = filteredPurchases.reduce((acc, purchase) => {
      const bookId = purchase.book_id;
      if (!acc[bookId]) {
        acc[bookId] = {
          book: purchase.books,
          quantity: 0,
          revenue: 0,
          profit: 0,
          purchases: 0
        };
      }
      const costPrice = Number(purchase.books?.cost_price || 0);
      const revenue = Number(purchase.total_amount);
      const cost = costPrice * Number(purchase.quantity);
      const profit = revenue - cost;
      
      acc[bookId].quantity += Number(purchase.quantity);
      acc[bookId].revenue += revenue;
      acc[bookId].profit += profit;
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

    // Group by month for trend data
    const monthlySales = filteredPurchases.reduce((acc, purchase) => {
      const date = new Date(purchase.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          period: monthLabel,
          sales: 0,
          transactions: 0,
          profit: 0
        };
      }
      
      const costPrice = Number(purchase.books?.cost_price || 0);
      const revenue = Number(purchase.total_amount);
      const cost = costPrice * Number(purchase.quantity);
      const profit = revenue - cost;
      
      acc[monthKey].sales += revenue;
      acc[monthKey].transactions += 1;
      acc[monthKey].profit += profit;
      
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalQuantity,
          totalPurchases,
          totalProfit,
          averageOrderValue: totalPurchases > 0 ? totalSales / totalPurchases : 0
        },
        bookSales: Object.values(bookSales),
        studentSales: Object.values(studentSales),
        monthlySales: Object.values(monthlySales).sort((a: any, b: any) => a.period.localeCompare(b.period)),
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

// @desc    Get supplier report
// @route   GET /api/reports/suppliers
// @access  Private (Admin only)
router.get('/suppliers', protect, authorize('ADMIN'), async (req: any, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Get all suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (suppliersError) {
      console.error('Get suppliers error:', suppliersError);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Get supply orders
    let ordersQuery = supabase
      .from('supply_orders')
      .select(`
        *,
        suppliers (id, name),
        supply_order_items (
          id,
          quantity,
          cost_price,
          total,
          books (id, title, subject)
        )
      `);

    if (start_date) {
      ordersQuery = ordersQuery.gte('supply_date', start_date);
    }

    if (end_date) {
      ordersQuery = ordersQuery.lte('supply_date', end_date);
    }

    const { data: supplyOrders, error: ordersError } = await ordersQuery.order('supply_date', { ascending: false });

    if (ordersError) {
      console.error('Get supply orders error:', ordersError);
      // Continue even if supply_orders table doesn't exist
    }

    // Get supplier payments
    let paymentsQuery = supabase
      .from('supplier_payments')
      .select('*');

    if (start_date) {
      paymentsQuery = paymentsQuery.gte('payment_date', start_date);
    }

    if (end_date) {
      paymentsQuery = paymentsQuery.lte('payment_date', end_date);
    }

    const { data: payments, error: paymentsError } = await paymentsQuery.order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Get supplier payments error:', paymentsError);
      // Continue even if supplier_payments table doesn't exist
    }

    // Calculate supplier performance
    const supplierPerformance = (suppliers || []).map(supplier => {
      const supplierOrders = (supplyOrders || []).filter((o: any) => o.supplier_id === supplier.id);
      const supplierPayments = (payments || []).filter((p: any) => p.supplier_id === supplier.id);
      
      const totalOrders = supplierOrders.length;
      const totalOrderValue = supplierOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
      const totalPaid = supplierPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const outstanding = totalOrderValue - totalPaid;
      
      // Calculate on-time delivery (simplified - assume received orders are on-time)
      const receivedOrders = supplierOrders.filter((o: any) => o.status === 'received').length;
      const onTimeRate = totalOrders > 0 ? (receivedOrders / totalOrders) * 100 : 0;
      
      // Calculate average rating (placeholder - can be enhanced with actual rating system)
      const rating = totalOrders > 0 ? Math.min(5, 3.5 + (onTimeRate / 100) * 1.5) : 0;

      return {
        supplier,
        orders: totalOrders,
        totalOrderValue,
        totalPaid,
        outstanding,
        onTimeRate: Math.round(onTimeRate),
        rating: Math.round(rating * 10) / 10
      };
    });

    // Calculate payment status summary
    const totalOutstanding = supplierPerformance.reduce((sum, s) => sum + s.outstanding, 0);
    const totalPaid = supplierPerformance.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalOrderValue = supplierPerformance.reduce((sum, s) => sum + s.totalOrderValue, 0);

    return res.json({
      success: true,
      data: {
        summary: {
          totalSuppliers: suppliers?.length || 0,
          totalOrders: supplyOrders?.length || 0,
          totalOrderValue,
          totalPaid,
          totalOutstanding
        },
        supplierPerformance,
        paymentStatus: {
          paid: totalPaid,
          outstanding: totalOutstanding,
          total: totalOrderValue
        }
      }
    });
  } catch (error) {
    console.error('Get supplier report error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get financial report
// @route   GET /api/reports/finance
// @access  Private (Admin only)
router.get('/finance', protect, authorize('ADMIN'), async (req: any, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Get sales (purchases)
    let salesQuery = supabase
      .from('purchases')
      .select(`
        *,
        books (id, cost_price, price)
      `);

    if (start_date) {
      salesQuery = salesQuery.gte('created_at', start_date);
    }

    if (end_date) {
      salesQuery = salesQuery.lte('created_at', end_date);
    }

    const { data: purchases, error: purchasesError } = await salesQuery.order('created_at', { ascending: false });

    if (purchasesError) {
      console.error('Get purchases error:', purchasesError);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Calculate revenue and cost of goods sold
    const totalRevenue = (purchases || []).reduce((sum, p) => sum + Number(p.total_amount), 0);
    const costOfGoodsSold = (purchases || []).reduce((sum, p) => {
      const costPrice = Number(p.books?.cost_price || 0);
      return sum + (costPrice * Number(p.quantity));
    }, 0);
    const grossProfit = totalRevenue - costOfGoodsSold;

    // Get supplier expenses (supply orders)
    let expensesQuery = supabase
      .from('supply_orders')
      .select('total_amount, supply_date, status');

    if (start_date) {
      expensesQuery = expensesQuery.gte('supply_date', start_date);
    }

    if (end_date) {
      expensesQuery = expensesQuery.lte('supply_date', end_date);
    }

    const { data: supplyOrders, error: ordersError } = await expensesQuery;

    // Calculate inventory purchase expenses (only received orders)
    const inventoryPurchaseExpense = (supplyOrders || [])
      .filter((o: any) => o.status === 'received')
      .reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

    // For now, we'll use a placeholder for other expenses
    // In a real system, you'd have an expenses table
    const operatingExpenses = 0; // Placeholder - can be enhanced with actual expenses table
    const netProfit = grossProfit - inventoryPurchaseExpense - operatingExpenses;

    // Expense breakdown
    const expenseBreakdown = [
      {
        category: 'Inventory Purchase',
        amount: inventoryPurchaseExpense,
        percentage: totalRevenue > 0 ? (inventoryPurchaseExpense / totalRevenue) * 100 : 0
      },
      {
        category: 'Operating Expenses',
        amount: operatingExpenses,
        percentage: totalRevenue > 0 ? (operatingExpenses / totalRevenue) * 100 : 0
      }
    ].filter(e => e.amount > 0);

    return res.json({
      success: true,
      data: {
        profitAndLoss: {
          totalRevenue,
          costOfGoodsSold,
          grossProfit,
          operatingExpenses: inventoryPurchaseExpense + operatingExpenses,
          netProfit
        },
        expenseBreakdown,
        summary: {
          totalRevenue,
          totalExpenses: inventoryPurchaseExpense + operatingExpenses,
          netProfit,
          profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Get financial report error:', error);
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
