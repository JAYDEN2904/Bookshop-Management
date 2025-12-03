-- Disable RLS on all tables to fix authentication issues
-- This fixes the problem where frontend direct Supabase queries fail due to RLS policies
-- The backend uses service role key (bypasses RLS) and handles auth via custom JWT
-- Run this script in the Supabase SQL Editor

-- Drop all existing RLS policies
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
DROP POLICY IF EXISTS "Authenticated users can view supply orders" ON supply_orders;
DROP POLICY IF EXISTS "Authenticated users can create supply orders" ON supply_orders;
DROP POLICY IF EXISTS "Admins can manage supply orders" ON supply_orders;
DROP POLICY IF EXISTS "Authenticated users can view supply order items" ON supply_order_items;
DROP POLICY IF EXISTS "Authenticated users can create supply order items" ON supply_order_items;
DROP POLICY IF EXISTS "Admins can manage supply order items" ON supply_order_items;
DROP POLICY IF EXISTS "Authenticated users can view supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Authenticated users can create supplier payments" ON supplier_payments;
DROP POLICY IF EXISTS "Admins can manage supplier payments" ON supplier_payments;

-- Disable RLS on all tables
-- Note: If a table doesn't exist, the statement will be skipped with a warning
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'books') THEN
    ALTER TABLE books DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
    ALTER TABLE students DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers') THEN
    ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchases') THEN
    ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_history') THEN
    ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'file_attachments') THEN
    ALTER TABLE file_attachments DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reports') THEN
    ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supply_orders') THEN
    ALTER TABLE supply_orders DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supply_order_items') THEN
    ALTER TABLE supply_order_items DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'supplier_payments') THEN
    ALTER TABLE supplier_payments DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop the is_admin function since it's no longer needed
DROP FUNCTION IF EXISTS public.is_admin();

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'books', 'students', 'suppliers', 'purchases', 
    'stock_history', 'file_attachments', 'reports',
    'supply_orders', 'supply_order_items', 'supplier_payments'
  )
ORDER BY tablename;
