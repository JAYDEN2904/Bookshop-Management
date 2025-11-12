-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'CASHIER');

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'CASHIER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create books table
CREATE TABLE books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  class_level VARCHAR(20) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'textbook',
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  supplier_name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  class_level VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  receipt_number VARCHAR(50) UNIQUE,
  receipt_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock history table
CREATE TABLE stock_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  change_quantity INTEGER NOT NULL,
  change_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file attachments table
CREATE TABLE file_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'book', 'student', 'supplier', 'purchase', 'user', 'report'
  entity_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  bucket_name VARCHAR(50) NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL, -- 'sales', 'inventory', 'student', 'financial'
  file_url TEXT,
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_books_class_level ON books(class_level);
CREATE INDEX idx_books_subject ON books(subject);
CREATE INDEX idx_students_class_level ON students(class_level);
CREATE INDEX idx_purchases_created_at ON purchases(created_at);
CREATE INDEX idx_stock_history_book_id ON stock_history(book_id);
CREATE INDEX idx_file_attachments_entity ON file_attachments(entity_type, entity_id);
CREATE INDEX idx_reports_type ON reports(report_type);

-- Function to update book stock
CREATE OR REPLACE FUNCTION update_book_stock(
  book_uuid UUID,
  quantity_change INTEGER,
  change_reason TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update book stock
  UPDATE books 
  SET stock_quantity = stock_quantity + quantity_change,
      updated_at = NOW()
  WHERE id = book_uuid;
  
  -- Log stock change
  INSERT INTO stock_history (book_id, change_quantity, change_type, reason)
  VALUES (book_uuid, quantity_change, 
          CASE WHEN quantity_change > 0 THEN 'IN' ELSE 'OUT' END,
          change_reason);
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  receipt_num TEXT;
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get next sequence for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 8) AS INTEGER)), 0) + 1
  INTO seq_part
  FROM purchases
  WHERE receipt_number LIKE 'RCP' || year_part || '%';
  
  receipt_num := 'RCP' || year_part || LPAD(seq_part::TEXT, 4, '0');
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate student ID
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TEXT AS $$
DECLARE
  student_id TEXT;
  year_part TEXT;
  seq_part TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get next sequence for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 3) AS INTEGER)), 0) + 1
  INTO seq_part
  FROM students
  WHERE student_id LIKE 'ST' || year_part || '%';
  
  student_id := 'ST' || year_part || LPAD(seq_part::TEXT, 4, '0');
  RETURN student_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'ADMIN'
  );
END;
$$;

-- Create RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (public.is_admin());

-- All authenticated users can view books
CREATE POLICY "Authenticated users can view books" ON books
FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage books
CREATE POLICY "Admins can manage books" ON books
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- All authenticated users can view students
CREATE POLICY "Authenticated users can view students" ON students
FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage students
CREATE POLICY "Admins can manage students" ON students
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- All authenticated users can view suppliers
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage suppliers
CREATE POLICY "Admins can manage suppliers" ON suppliers
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- All authenticated users can view purchases
CREATE POLICY "Authenticated users can view purchases" ON purchases
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create purchases
CREATE POLICY "Authenticated users can create purchases" ON purchases
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Admins can manage all purchases
CREATE POLICY "Admins can manage purchases" ON purchases
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- All authenticated users can view stock history
CREATE POLICY "Authenticated users can view stock history" ON stock_history
FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage stock history
CREATE POLICY "Admins can manage stock history" ON stock_history
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- All authenticated users can view file attachments
CREATE POLICY "Authenticated users can view file attachments" ON file_attachments
FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create file attachments
CREATE POLICY "Authenticated users can create file attachments" ON file_attachments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Admins can manage file attachments
CREATE POLICY "Admins can manage file attachments" ON file_attachments
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- All authenticated users can view reports
CREATE POLICY "Authenticated users can view reports" ON reports
FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can manage reports
CREATE POLICY "Admins can manage reports" ON reports
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
