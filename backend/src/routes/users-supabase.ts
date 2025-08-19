import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', protect, authorize('ADMIN'), async (req: any, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    // Apply pagination
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Get users error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
router.get('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Create user
// @route   POST /api/users
// @access  Private (Admin only)
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, password, and role'
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create Supabase Auth user (so the cashier can log in)
    const { data: createdAuth, error: createAuthErr } = await (supabase as any).auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (createAuthErr || !createdAuth?.user?.id) {
      console.error('Create auth user error:', createAuthErr);
      return res.status(400).json({
        success: false,
        error: 'Failed to create auth user'
      });
    }

    const authUserId = createdAuth.user.id as string;

    // Hash password for local reference/compat
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert into application users with the same id as auth
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        id: authUserId,
        name,
        email,
        password_hash: passwordHash,
        role
      }])
      .select('id, name, email, role, created_at, updated_at')
      .single();

    if (error) {
      console.error('Create user error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    return res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        name,
        email,
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('id, name, email, role, created_at, updated_at')
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // If email was updated, reflect it in Auth as well
    if (email) {
      const { error: authUpdateErr } = await (supabase as any).auth.admin.updateUserById(req.params.id, { email });
      if (authUpdateErr) {
        console.warn('Auth email update failed:', authUpdateErr);
      }
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    // Delete the Supabase Auth user as well
    const { error: authDeleteErr } = await (supabase as any).auth.admin.deleteUser(req.params.id);
    if (authDeleteErr) {
      console.warn('Auth user delete failed:', authDeleteErr);
    }

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin only)
router.put('/:id/reset-password', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a new password'
      });
    }

    // Update Auth password first
    const { error: authErr } = await (supabase as any).auth.admin.updateUserById(req.params.id, { password });
    if (authErr) {
      console.error('Auth password reset error:', authErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to reset auth password'
      });
    }

    // Hash and update local password reference
    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('id, name, email, role, created_at, updated_at')
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: user,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;
