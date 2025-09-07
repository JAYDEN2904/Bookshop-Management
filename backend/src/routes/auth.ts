import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { protect } from '../middleware/auth';

const router = express.Router();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variables. Please check your .env file.');
}

// Create Supabase client for auth operations
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Create Supabase client for database operations (with service role)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// @desc    Login user with Supabase Auth
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    // Get user profile from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(401).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Update last active
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('auth_user_id', data.user.id);

    return res.json({
      success: true,
      token: data.session.access_token,
      user: userProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Register new user with Supabase Auth
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'CASHIER' } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, password, and name'
      });
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (!data.user) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create user'
      });
    }

    // Update user role in public.users table (created by trigger)
    const { error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('auth_user_id', data.user.id);

    if (updateError) {
      console.error('Error updating user role:', updateError);
    }

    return res.status(201).json({
      success: true,
      message: 'User created successfully. Please check your email to confirm your account.',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name,
        role: role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req: any, res) => {
  try {
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req: any, res) => {
  try {
    // With Supabase Auth, logout is handled on the client side
    // The server doesn't need to do anything special
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', protect, async (req: any, res) => {
  try {
    // With Supabase Auth, token refresh is handled automatically
    // This endpoint is mainly for compatibility
    return res.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;