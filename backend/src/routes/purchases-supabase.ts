import express from 'express';
import { supabase } from '../config/supabase';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
router.get('/', protect, async (req: any, res) => {
  try {
    const { search, student_id, book_id, start_date, end_date, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('purchases')
      .select(`
        *,
        students (id, name, student_id, class_level),
        books (id, title, class_level, subject)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`students.name.ilike.%${search}%,books.title.ilike.%${search}%`);
    }

    if (student_id) {
      query = query.eq('student_id', student_id);
    }

    if (book_id) {
      query = query.eq('book_id', book_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Apply pagination
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: purchases, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Get purchases error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.json({
      success: true,
      data: purchases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select(`
        *,
        students (id, name, student_id, class_level, email, phone),
        books (id, title, class_level, subject, price)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    return res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create purchase
// @route   POST /api/purchases
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { student_id, book_id, quantity, unit_price } = req.body;

    // Validate required fields
    if (!student_id || !book_id || !quantity || !unit_price) {
      return res.status(400).json({
        success: false,
        error: 'Please provide student_id, book_id, quantity, and unit_price'
      });
    }

    // Check if book has enough stock
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('stock_quantity')
      .eq('id', book_id)
      .single();

    if (bookError || !book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    if (book.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock'
      });
    }

    // Generate receipt number
    const { data: receiptNumber, error: receiptError } = await supabase.rpc('generate_receipt_number');
    
    if (receiptError) {
      console.error('Generate receipt number error:', receiptError);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate receipt number'
      });
    }

    const total_amount = quantity * unit_price;

    // Create purchase
    const { data: purchase, error } = await supabase
      .from('purchases')
      .insert([{
        student_id,
        book_id,
        quantity,
        unit_price,
        total_amount,
        receipt_number: receiptNumber
      }])
      .select(`
        *,
        students (id, name, student_id, class_level),
        books (id, title, class_level, subject)
      `)
      .single();

    if (error) {
      console.error('Create purchase error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Update book stock
    await supabase
      .from('books')
      .update({
        stock_quantity: book.stock_quantity - quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', book_id);

    // Log stock change
    await supabase
      .from('stock_history')
      .insert([{
        book_id,
        change_quantity: -quantity,
        change_type: 'OUT',
        reason: `Purchase: ${receiptNumber}`
      }]);

    return res.status(201).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update purchase
// @route   PUT /api/purchases/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { student_id, book_id, quantity, unit_price } = req.body;

    // Get current purchase
    const { data: currentPurchase, error: currentError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (currentError || !currentPurchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    const total_amount = quantity * unit_price;

    // Update purchase
    const { data: purchase, error } = await supabase
      .from('purchases')
      .update({
        student_id,
        book_id,
        quantity,
        unit_price,
        total_amount
      })
      .eq('id', req.params.id)
      .select(`
        *,
        students (id, name, student_id, class_level),
        books (id, title, class_level, subject)
      `)
      .single();

    if (error) {
      console.error('Update purchase error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Update book stock if quantity changed
    if (quantity !== currentPurchase.quantity) {
      const quantityDifference = currentPurchase.quantity - quantity;
      
      await supabase
        .from('books')
        .update({
          stock_quantity: supabase.rpc('update_book_stock', {
            book_uuid: book_id,
            quantity_change: quantityDifference,
            change_reason: `Purchase update: ${currentPurchase.receipt_number}`
          })
        })
        .eq('id', book_id);
    }

    return res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Update purchase error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete purchase
// @route   DELETE /api/purchases/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    // Get current purchase
    const { data: purchase, error: currentError } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (currentError || !purchase) {
      return res.status(404).json({
        success: false,
        error: 'Purchase not found'
      });
    }

    // Delete purchase
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete purchase error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Restore book stock
    await supabase
      .from('books')
      .update({
        stock_quantity: supabase.rpc('update_book_stock', {
          book_uuid: purchase.book_id,
          quantity_change: purchase.quantity,
          change_reason: `Purchase cancelled: ${purchase.receipt_number}`
        })
      })
      .eq('id', purchase.book_id);

    return res.json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    console.error('Delete purchase error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
