-- Cleanup script to remove is_admin function and its dependencies
-- Run this in your Supabase SQL Editor

-- Drop storage policies that depend on is_admin function
DROP POLICY IF EXISTS "Admins can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from documents" ON storage.objects;

-- Drop the is_admin function
DROP FUNCTION IF EXISTS public.is_admin();

-- Recreate storage policies for Supabase Auth
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

-- Verify cleanup
SELECT 'is_admin function cleanup completed' as status;
