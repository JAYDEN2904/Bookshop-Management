-- Storage Policies for Bookshop Management System
-- Run this script in your Supabase SQL editor

-- Enable storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage" SCHEMA "extensions";

-- Create function to check if user is admin
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

-- Books bucket policies
CREATE POLICY "Authenticated users can upload to books" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'books' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Public access to books" ON storage.objects
FOR SELECT USING (bucket_id = 'books');

CREATE POLICY "Admins can update books" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'books' AND 
  public.is_admin()
);

CREATE POLICY "Admins can delete from books" ON storage.objects
FOR DELETE USING (
  bucket_id = 'books' AND 
  public.is_admin()
);

-- Students bucket policies
CREATE POLICY "Authenticated users can upload to students" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'students' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Public access to students" ON storage.objects
FOR SELECT USING (bucket_id = 'students');

CREATE POLICY "Admins can update students" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'students' AND 
  public.is_admin()
);

CREATE POLICY "Admins can delete from students" ON storage.objects
FOR DELETE USING (
  bucket_id = 'students' AND 
  public.is_admin()
);

-- Receipts bucket policies
CREATE POLICY "Authenticated users can upload to receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Public access to receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

CREATE POLICY "Admins can update receipts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'receipts' AND 
  public.is_admin()
);

CREATE POLICY "Admins can delete from receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' AND 
  public.is_admin()
);

-- Purchases bucket policies
CREATE POLICY "Authenticated users can upload to purchases" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'purchases' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Public access to purchases" ON storage.objects
FOR SELECT USING (bucket_id = 'purchases');

CREATE POLICY "Admins can update purchases" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'purchases' AND 
  public.is_admin()
);

CREATE POLICY "Admins can delete from purchases" ON storage.objects
FOR DELETE USING (
  bucket_id = 'purchases' AND 
  public.is_admin()
);

-- Suppliers bucket policies
CREATE POLICY "Authenticated users can upload to suppliers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'suppliers' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Public access to suppliers" ON storage.objects
FOR SELECT USING (bucket_id = 'suppliers');

CREATE POLICY "Admins can update suppliers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'suppliers' AND 
  public.is_admin()
);

CREATE POLICY "Admins can delete from suppliers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'suppliers' AND 
  public.is_admin()
);

-- Users bucket policies
CREATE POLICY "Authenticated users can upload to users" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'users' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Public access to users" ON storage.objects
FOR SELECT USING (bucket_id = 'users');

CREATE POLICY "Admins can update users" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'users' AND 
  public.is_admin()
);

CREATE POLICY "Admins can delete from users" ON storage.objects
FOR DELETE USING (
  bucket_id = 'users' AND 
  public.is_admin()
);

-- Reports bucket policies (private)
CREATE POLICY "Authenticated users can upload to reports" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'reports' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view reports" ON storage.objects
FOR SELECT USING (
  bucket_id = 'reports' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can update reports" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'reports' AND 
  public.is_admin()
);

CREATE POLICY "Admins can delete from reports" ON storage.objects
FOR DELETE USING (
  bucket_id = 'reports' AND 
  public.is_admin()
);
