import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

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

export interface AuthRequest extends Request {
  user?: {
    id: string;
    auth_user_id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
  headers: Request['headers'];
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // Verify token with Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !authUser) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Get user profile from public.users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      return res.status(401).json({ success: false, error: 'User profile not found' });
    }

    // Attach user to request
    req.user = {
      ...userProfile,
      auth_user_id: authUser.id
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `User role ${req.user.role} is not authorized to access this route` 
      });
    }

    return next();
  };
};