# Migration Plan: Custom JWT → Supabase Auth

## Why Switch to Supabase Auth?

### Problems with Current Custom JWT:
- ❌ Conflicts with RLS policies
- ❌ No automatic token refresh
- ❌ Manual password hashing/verification
- ❌ No built-in security features
- ❌ Fighting against Supabase's design

### Benefits of Supabase Auth:
- ✅ Native RLS support
- ✅ Automatic token refresh
- ✅ Built-in security features
- ✅ Email verification, password reset
- ✅ Social authentication ready
- ✅ Better token management

## Migration Steps

### Step 1: Update Database Schema
```sql
-- Enable Supabase Auth
-- This will create auth.users table and related functions

-- Update users table to reference auth.users
ALTER TABLE users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
CREATE UNIQUE INDEX idx_users_auth_user_id ON users(auth_user_id);

-- Create trigger to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'CASHIER', -- default role
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 2: Update RLS Policies
```sql
-- Update RLS policies to work with Supabase auth
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = auth_user_id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- All authenticated users can view students
CREATE POLICY "Authenticated users can view students" ON students
FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage students
CREATE POLICY "Admins can manage students" ON students
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);
```

### Step 3: Update Backend Code

#### Replace Custom Auth Middleware:
```typescript
// src/middleware/auth.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const protect = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Get user profile from public.users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ success: false, error: 'User profile not found' });
    }

    req.user = { ...profile, auth_user_id: user.id };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};
```

#### Update Auth Routes:
```typescript
// src/routes/auth.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Login with Supabase Auth
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    res.json({
      success: true,
      token: data.session.access_token,
      user: profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});
```

### Step 4: Update Frontend

#### Use Supabase Auth Client:
```typescript
// src/contexts/AuthContext.tsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // ... rest of implementation
};
```

## Migration Benefits

### Security Improvements:
- ✅ **Database-level security** with RLS
- ✅ **Automatic token refresh**
- ✅ **Built-in session management**
- ✅ **Secure password handling**

### Developer Experience:
- ✅ **Less custom code** to maintain
- ✅ **Better error handling**
- ✅ **Built-in features** (email verification, password reset)
- ✅ **Future-ready** for social auth, MFA, etc.

### Performance:
- ✅ **Faster authentication** (no custom JWT verification)
- ✅ **Better caching** with Supabase's built-in optimizations
- ✅ **Reduced server load**

## Recommendation

**Yes, switch to Supabase Auth!** It's the right architectural decision and will solve your RLS conflicts while providing better security and features.
