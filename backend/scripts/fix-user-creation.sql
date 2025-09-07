-- Fix User Creation Issues
-- Run this in your Supabase SQL Editor

-- Step 1: Make password_hash column nullable since we're using Supabase Auth
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Step 2: Ensure the handle_new_user function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'CASHIER'),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Update existing users to have proper auth_user_id
-- This will help with existing users who have null auth_user_id
UPDATE users 
SET auth_user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = users.email 
  LIMIT 1
)
WHERE auth_user_id IS NULL;

-- Step 5: Verify the setup
SELECT 
  'Users with auth_user_id' as check_type,
  COUNT(*) as count
FROM users 
WHERE auth_user_id IS NOT NULL

UNION ALL

SELECT 
  'Users without auth_user_id' as check_type,
  COUNT(*) as count
FROM users 
WHERE auth_user_id IS NULL

UNION ALL

SELECT 
  'Total users' as check_type,
  COUNT(*) as count
FROM users;
