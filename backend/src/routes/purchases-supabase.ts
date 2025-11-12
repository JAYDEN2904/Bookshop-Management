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

    // Build select query - try to include cashier if column exists
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
router.post('/', protect, async (req: any, res) => {
  try {
    const { student_id, book_id, quantity, unit_price, receipt_number } = req.body;
    const cashier_id = req.user?.id; // Get cashier from authenticated user

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

    // Use provided receipt number or generate a new one
    let receiptNumber = receipt_number;
    if (!receiptNumber) {
      const { data: generatedReceiptNumber, error: receiptError } = await supabase.rpc('generate_receipt_number');
      
      if (receiptError) {
        console.error('Generate receipt number error:', receiptError);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate receipt number'
        });
      }
      
      receiptNumber = generatedReceiptNumber;
    }

    const total_amount = quantity * unit_price;

    // Create purchase
    const purchaseData: any = {
      student_id,
      book_id,
      quantity,
      unit_price,
      total_amount,
      receipt_number: receiptNumber
    };
    
    // Add cashier_id if available (will be ignored if column doesn't exist)
    // Run backend/scripts/add-cashier-to-purchases.sql to add this column
    if (cashier_id) {
      purchaseData.cashier_id = cashier_id;
    }
    
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([purchaseData])
      .select(`
        *,
        students (id, name, student_id, class_level),
        books (id, title, class_level, subject)
      `)
      .single();

    if (purchaseError) {
      console.error('Create purchase error:', purchaseError);
      return res.status(500).json({
        success: false,
        error: purchaseError.message || 'Failed to create purchase'
      });
    }

    // Update book stock using RPC function (handles stock update and history logging)
    const { error: stockError } = await supabase.rpc('update_book_stock', {
      book_uuid: book_id,
      quantity_change: -quantity, // Negative because we're reducing stock
      change_reason: `Purchase: ${receiptNumber || 'N/A'}`
    });

    if (stockError) {
      console.error('Update stock error:', stockError);
      // Try to delete the purchase if stock update failed
      await supabase.from('purchases').delete().eq('id', purchase.id);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to update inventory. Purchase was not completed.'
      });
    }

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

    // Update book stock if quantity or book changed
    const bookChanged = book_id !== currentPurchase.book_id;
    const quantityChanged = quantity !== currentPurchase.quantity;
    
    if (bookChanged || quantityChanged) {
      // If book changed, restore stock for old book and reduce stock for new book
      if (bookChanged && currentPurchase.book_id) {
        // Restore stock for old book
        const { error: restoreError } = await supabase.rpc('update_book_stock', {
          book_uuid: currentPurchase.book_id,
          quantity_change: currentPurchase.quantity,
          change_reason: `Purchase update: Restored from ${currentPurchase.receipt_number}`
        });
        
        if (restoreError) {
          console.error('Restore stock error:', restoreError);
        }
        
        // Check if new book has enough stock
        const { data: newBook, error: newBookError } = await supabase
          .from('books')
          .select('stock_quantity')
          .eq('id', book_id)
          .single();
          
        if (newBookError || !newBook) {
          return res.status(404).json({
            success: false,
            error: 'New book not found'
          });
        }
        
        if (newBook.stock_quantity < quantity) {
          return res.status(400).json({
            success: false,
            error: 'Insufficient stock for new book'
          });
        }
        
        // Reduce stock for new book
        const { error: reduceError } = await supabase.rpc('update_book_stock', {
          book_uuid: book_id,
          quantity_change: -quantity,
          change_reason: `Purchase update: ${currentPurchase.receipt_number}`
        });
        
        if (reduceError) {
          console.error('Reduce stock error:', reduceError);
          return res.status(500).json({
            success: false,
            error: 'Failed to update inventory'
          });
        }
      } else if (quantityChanged) {
        // Only quantity changed, adjust stock difference
        const quantityDifference = currentPurchase.quantity - quantity;
        
        const { error: stockError } = await supabase.rpc('update_book_stock', {
          book_uuid: book_id || currentPurchase.book_id,
          quantity_change: quantityDifference, // Positive if reducing purchase, negative if increasing
          change_reason: `Purchase update: ${currentPurchase.receipt_number}`
        });
        
        if (stockError) {
          console.error('Update stock error:', stockError);
          return res.status(500).json({
            success: false,
            error: 'Failed to update inventory'
          });
        }
      }
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

    // Restore book stock first (before deleting purchase)
    if (purchase.book_id) {
      const { error: stockError } = await supabase.rpc('update_book_stock', {
        book_uuid: purchase.book_id,
        quantity_change: purchase.quantity, // Positive to restore stock
        change_reason: `Purchase cancelled: ${purchase.receipt_number || 'N/A'}`
      });

      if (stockError) {
        console.error('Restore stock error:', stockError);
        return res.status(500).json({
          success: false,
          error: 'Failed to restore inventory. Purchase was not deleted.'
        });
      }
    }

    // Delete purchase
    const { error: deleteError } = await supabase
      .from('purchases')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      console.error('Delete purchase error:', deleteError);
      return res.status(500).json({
        success: false,
        error: deleteError.message || 'Failed to delete purchase'
      });
    }

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
