-- Fix Migration Issues Script
-- Run this in your Supabase SQL Editor to fix any remaining issues

-- Step 1: Check if the trigger function exists and recreate it if needed
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Clean up any existing users that don't have profiles
-- This will create profiles for any existing auth users
INSERT INTO public.users (auth_user_id, name, email, role, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  au.email,
  'CASHIER',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL
ON CONFLICT (auth_user_id) DO NOTHING;

-- Step 4: Fix any RLS policies that might be missing
-- Drop and recreate all policies to ensure they're correct

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update users" ON users
FOR UPDATE USING (
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

-- Students policies
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;
DROP POLICY IF EXISTS "Admins can manage students" ON students;

CREATE POLICY "Authenticated users can view students" ON students
FOR SELECT USING (auth.role() = 'authenticated');

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

-- Books policies
DROP POLICY IF EXISTS "Authenticated users can view books" ON books;
DROP POLICY IF EXISTS "Admins can manage books" ON books;

CREATE POLICY "Authenticated users can view books" ON books
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage books" ON books
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

-- Step 5: Verify the setup
SELECT 'Migration fixes completed successfully' as status;

-- Check if we have any users
SELECT COUNT(*) as total_users FROM public.users;
SELECT COUNT(*) as total_auth_users FROM auth.users;
