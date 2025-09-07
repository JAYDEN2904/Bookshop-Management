-- Fix RLS Policy Recursion Issues
-- Run this in your Supabase SQL Editor

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

-- Step 2: Create simplified RLS policies that don't cause recursion

-- Users policies (simplified to avoid recursion)
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update users" ON users
FOR UPDATE USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
);

-- Books policies (simplified)
CREATE POLICY "Authenticated users can view books" ON books
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage books" ON books
FOR ALL USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
);

-- Students policies (simplified)
CREATE POLICY "Authenticated users can view students" ON students
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage students" ON students
FOR ALL USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
);

-- Suppliers policies (simplified)
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage suppliers" ON suppliers
FOR ALL USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
);

-- Purchases policies (simplified)
CREATE POLICY "Authenticated users can view purchases" ON purchases
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create purchases" ON purchases
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage purchases" ON purchases
FOR ALL USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
);

-- Stock history policies (simplified)
CREATE POLICY "Authenticated users can view stock history" ON stock_history
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage stock history" ON stock_history
FOR ALL USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
);

-- File attachments policies (simplified)
CREATE POLICY "Authenticated users can view file attachments" ON file_attachments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create file attachments" ON file_attachments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage file attachments" ON file_attachments
FOR ALL USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
);

-- Reports policies (simplified)
CREATE POLICY "Authenticated users can view reports" ON reports
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage reports" ON reports
FOR ALL USING (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE role = 'ADMIN'
  )
);

-- Step 3: Verify RLS is enabled and policies are created
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'books', 'students', 'suppliers', 'purchases', 'stock_history', 'file_attachments', 'reports')
ORDER BY tablename;

-- Step 4: Show created policies
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
