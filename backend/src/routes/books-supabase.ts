import express from 'express';
import { supabase } from '../config/supabase';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// @desc    Get all books
// @route   GET /api/books
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, class_level, subject, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('books')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%,class_level.ilike.%${search}%`);
    }

    if (class_level) {
      query = query.eq('class_level', class_level);
    }

    if (subject) {
      query = query.eq('subject', subject);
    }

    // Apply pagination
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: books, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Get books error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.json({
      success: true,
      data: books,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get low stock books
// @route   GET /api/books/low-stock
// @access  Private
router.get('/low-stock', protect, async (req: any, res) => {
  try {
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .lte('stock_quantity', 10)
      .order('stock_quantity', { ascending: true });

    if (error) {
      console.error('Get low stock books error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.json({
      success: true,
      data: books
    });
  } catch (error) {
    console.error('Get low stock books error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    // Get stock history
    const { data: stockHistory } = await supabase
      .from('stock_history')
      .select('*')
      .eq('book_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return res.json({
      success: true,
      data: {
        ...book,
        stock_history: stockHistory || []
      }
    });
  } catch (error) {
    console.error('Get book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create book
// @route   POST /api/books
// @access  Private (Admin only)
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { title, class_level, subject, price, stock_quantity } = req.body;

    // Validate required fields
    if (!title || !class_level || !subject || !price) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, class_level, subject, and price'
      });
    }

    const { data: book, error } = await supabase
      .from('books')
      .insert([{
        title,
        class_level,
        subject,
        price: Number(price),
        stock_quantity: stock_quantity || 0
      }])
      .select()
      .single();

    if (error) {
      console.error('Create book error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Create book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { title, class_level, subject, price, stock_quantity } = req.body;

    const { data: book, error } = await supabase
      .from('books')
      .update({
        title,
        class_level,
        subject,
        price: Number(price),
        stock_quantity: Number(stock_quantity),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    return res.json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Update book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete book error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update book stock
// @route   PUT /api/books/:id/stock
// @access  Private (Admin only)
router.put('/:id/stock', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { quantity, reason } = req.body;

    if (!quantity || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Please provide quantity and reason'
      });
    }

    // Update book stock
    const { data: book, error: bookError } = await supabase
      .from('books')
      .update({
        stock_quantity: supabase.rpc('update_book_stock', {
          book_uuid: req.params.id,
          quantity_change: Number(quantity),
          change_reason: reason
        }),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (bookError) {
      console.error('Update stock error:', bookError);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('Update stock error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
