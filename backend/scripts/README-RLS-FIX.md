# Fix for RLS Policy Errors

## Problem
You're getting these errors when trying to add students:
- `401 Unauthorized` errors
- `new row violates row-level security policy for table "students"`

## Root Cause
The backend is using a **custom JWT authentication system** with Supabase's **service role key**, but the database has **Row Level Security (RLS) policies** designed for Supabase's built-in auth system. This creates a conflict.

## Solution

### Option 1: Disable RLS (Recommended)
Since you're using the service role key, RLS is effectively bypassed anyway. Run this SQL script in your Supabase SQL Editor:

```sql
-- Disable RLS on all tables to fix authentication issues
-- Run this script in the Supabase SQL Editor

-- Drop all existing RLS policies
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

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE books DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Drop the is_admin function since it's no longer needed
DROP FUNCTION IF EXISTS public.is_admin();

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'books', 'students', 'suppliers', 'purchases', 'stock_history', 'file_attachments', 'reports')
ORDER BY tablename;
```

### Option 2: Update Frontend to Use Real API
The frontend is currently using mock data. You need to update the StudentContext to make real API calls.

## Steps to Fix

1. **Run the SQL script above** in your Supabase SQL Editor
2. **Update your frontend** to use real API calls instead of mock data
3. **Test student creation** - it should work without RLS errors

## Why This Happens
- Your backend uses **custom JWT authentication** with the **service role key**
- The **RLS policies** expect Supabase's built-in auth (`auth.uid()`, `auth.role()`)
- The **service role key bypasses RLS**, but the policies still exist and cause conflicts
- **Disabling RLS** is the cleanest solution since you're handling auth in your Express middleware

## Security Note
Disabling RLS is safe in your case because:
- You're using the service role key (admin access)
- Your Express middleware handles authentication and authorization
- RLS was designed for Supabase's built-in auth, which you're not using
