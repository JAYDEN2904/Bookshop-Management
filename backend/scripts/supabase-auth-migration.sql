-- Migration Script: Switch to Supabase Auth
-- Run this in your Supabase SQL Editor

-- Step 1: Add auth_user_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Step 2: Create function to handle new user creation
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

-- Step 3: Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
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

-- Step 5: Create new RLS policies for Supabase Auth

-- Users policies
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

-- Books policies
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

-- Students policies
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

-- Suppliers policies
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage suppliers" ON suppliers
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

-- Purchases policies
CREATE POLICY "Authenticated users can view purchases" ON purchases
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create purchases" ON purchases
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage purchases" ON purchases
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

-- Stock history policies
CREATE POLICY "Authenticated users can view stock history" ON stock_history
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage stock history" ON stock_history
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

-- File attachments policies
CREATE POLICY "Authenticated users can view file attachments" ON file_attachments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create file attachments" ON file_attachments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage file attachments" ON file_attachments
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

-- Reports policies
CREATE POLICY "Authenticated users can view reports" ON reports
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage reports" ON reports
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

-- Step 6: Drop storage policies that depend on is_admin function
DROP POLICY IF EXISTS "Admins can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from documents" ON storage.objects;

-- Step 7: Drop the old is_admin function
DROP FUNCTION IF EXISTS public.is_admin();

-- Step 8: Create new storage policies for Supabase Auth
CREATE POLICY "Admins can update receipts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'receipts' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can delete from receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update reports" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'reports' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can delete from reports" ON storage.objects
FOR DELETE USING (
  bucket_id = 'reports' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

CREATE POLICY "Admins can delete from documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- Step 9: Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'books', 'students', 'suppliers', 'purchases', 'stock_history', 'file_attachments', 'reports')
ORDER BY tablename;
