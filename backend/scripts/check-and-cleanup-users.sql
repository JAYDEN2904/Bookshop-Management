-- Check and Cleanup Users Script
-- Run this in your Supabase SQL Editor to see current state and fix duplicates

-- Step 1: Check current state
SELECT 
  'Current Users State' as info,
  COUNT(*) as total_users,
  COUNT(auth_user_id) as users_with_auth_id,
  COUNT(*) - COUNT(auth_user_id) as users_without_auth_id
FROM users;

-- Step 2: Show users without auth_user_id
SELECT 
  'Users without auth_user_id' as info,
  id,
  name,
  email,
  role,
  created_at
FROM users 
WHERE auth_user_id IS NULL
ORDER BY created_at;

-- Step 3: Check for duplicate auth_user_id values
SELECT 
  'Duplicate auth_user_id check' as info,
  auth_user_id,
  COUNT(*) as count
FROM users 
WHERE auth_user_id IS NOT NULL
GROUP BY auth_user_id
HAVING COUNT(*) > 1;

-- Step 4: Show all users with their auth_user_id status
SELECT 
  'All users status' as info,
  id,
  name,
  email,
  role,
  auth_user_id,
  CASE 
    WHEN auth_user_id IS NULL THEN '❌ No Auth ID'
    ELSE '✅ Has Auth ID'
  END as status
FROM users 
ORDER BY created_at;

-- Step 5: If there are duplicates, this will help identify them
-- (Don't run this unless you see duplicates in step 3)
/*
-- Remove duplicate entries (keep the oldest one)
DELETE FROM users 
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY auth_user_id ORDER BY created_at) as rn
    FROM users 
    WHERE auth_user_id IS NOT NULL
  ) t 
  WHERE rn > 1
);
*/
