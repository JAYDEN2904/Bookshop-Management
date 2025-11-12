import express from 'express';
import { supabase } from '../config/supabase';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
router.get('/', protect, async (req: any, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: suppliers, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Get suppliers error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.json({
      success: true,
      data: suppliers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    return res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private (Admin only)
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide supplier name'
      });
    }

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert([{
        name,
        email,
        phone,
        address
      }])
      .select()
      .single();

    if (error) {
      console.error('Create supplier error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Database error: Failed to create supplier'
      });
    }

    return res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update({
        name,
        email,
        phone,
        address,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found'
      });
    }

    return res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete supplier error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
