-- Fix RLS Policies for Supabase Auth Integration
-- This script fixes the infinite recursion by creating proper RLS policies
-- that work with your Supabase auth setup

-- Step 1: Drop all existing RLS policies to break the recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view books" ON books;
DROP POLICY IF EXISTS "Admins can manage books" ON books;
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;
DROP POLICY IF EXISTS "Admins can manage students" ON students;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can view purchases" ON purchases;
DROP POLICY IF EXISTS "Authenticated users can create purchases" ON purchases;
DROP POLICY IF EXISTS "Admins can manage purchases" ON purchases;
DROP POLICY IF EXISTS "Authenticated users can view stock history" ON stock_history;
DROP POLICY IF EXISTS "Admins can manage stock history" ON stock_history;
DROP POLICY IF EXISTS "Authenticated users can view file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Authenticated users can create file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Admins can manage file attachments" ON file_attachments;
DROP POLICY IF EXISTS "Authenticated users can view reports" ON reports;
DROP POLICY IF EXISTS "Admins can manage reports" ON reports;

-- Step 2: Drop the problematic is_admin function
DROP FUNCTION IF EXISTS public.is_admin();

-- Step 3: Create a new is_admin function that doesn't cause recursion
-- This function uses SECURITY DEFINER to bypass RLS when checking admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user exists in public.users and is admin
  -- Using SECURITY DEFINER to bypass RLS for this check
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
      AND role = 'ADMIN'
  );
END;
$$;

-- Step 4: Create new RLS policies that work with Supabase auth

-- Users policies
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update users" ON users
FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Books policies
CREATE POLICY "Authenticated users can view books" ON books
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage books" ON books
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Students policies
CREATE POLICY "Authenticated users can view students" ON students
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage students" ON students
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage suppliers" ON suppliers
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Purchases policies
CREATE POLICY "Authenticated users can view purchases" ON purchases
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create purchases" ON purchases
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage purchases" ON purchases
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Stock history policies
CREATE POLICY "Authenticated users can view stock history" ON stock_history
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage stock history" ON stock_history
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- File attachments policies
CREATE POLICY "Authenticated users can view file attachments" ON file_attachments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create file attachments" ON file_attachments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage file attachments" ON file_attachments
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Reports policies
CREATE POLICY "Authenticated users can view reports" ON reports
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage reports" ON reports
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Step 5: Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Step 6: Verify RLS is enabled and policies are created
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'books', 'students', 'suppliers', 'purchases', 'stock_history', 'file_attachments', 'reports')
ORDER BY tablename;

-- Step 7: Show created policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 8: Test the is_admin function
SELECT 'Testing is_admin function' as test, public.is_admin() as result;





