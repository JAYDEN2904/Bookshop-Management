-- Fix Infinite Recursion in RLS Policies
-- Run this script in your Supabase SQL Editor to resolve the 42P17 error
-- This script disables RLS since you're using custom JWT auth with service role

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

-- Step 2: Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop the problematic is_admin function
DROP FUNCTION IF EXISTS public.is_admin();

-- Step 4: Verify RLS is disabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'books', 'students', 'suppliers', 'purchases', 'stock_history', 'file_attachments', 'reports')
ORDER BY tablename;

-- Step 5: Test that tables are accessible (should return counts without errors)
SELECT 'Users table accessible' as status, COUNT(*) as user_count FROM users;
SELECT 'Books table accessible' as status, COUNT(*) as book_count FROM books;
SELECT 'Students table accessible' as status, COUNT(*) as student_count FROM students;
SELECT 'Suppliers table accessible' as status, COUNT(*) as supplier_count FROM suppliers;

-- Step 6: Show final status
SELECT 'RLS Disabled Successfully - Infinite Recursion Fixed' as message;





