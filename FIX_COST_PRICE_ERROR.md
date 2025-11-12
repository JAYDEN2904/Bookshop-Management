# Fix: "Could not find the 'cost_price' column" Error

## Problem
When trying to add a new book, you get this error:
```
Error: Could not not find the 'cost_price' column of 'books' in the schema cache
```

## Cause
The `cost_price` column (and related columns) don't exist in your database table yet. The migration script needs to be run.

## Solution

### Step 1: Run the Migration Script

1. **Open your Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration Script**
   - Open the file: `backend/scripts/add-book-metadata-columns.sql`
   - Copy the entire contents
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

4. **Verify the Migration**
   - You should see a success message
   - The script adds these columns to the `books` table:
     - `cost_price` (DECIMAL)
     - `min_stock` (INTEGER)
     - `supplier_name` (VARCHAR)
     - `description` (TEXT)
     - `type` (VARCHAR)

### Step 2: Refresh PostgREST Schema Cache (if needed)

If you still get the error after running the migration:

1. **Wait a few seconds** - PostgREST usually refreshes automatically
2. **Or restart your backend server** - This forces a refresh
3. **Or** go to Supabase Dashboard → Settings → API → Click "Reload Schema Cache" (if available)

### Step 3: Test

1. Restart your backend server (if it's running)
2. Try adding a book again
3. The error should be resolved

## Alternative: Verify Schema

You can verify if the columns exist by:

1. **Using Supabase Dashboard:**
   - Go to Table Editor → `books` table
   - Check if you see the columns: `cost_price`, `min_stock`, `supplier_name`, `description`, `type`

2. **Using SQL:**
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'books'
   AND column_name IN ('cost_price', 'min_stock', 'supplier_name', 'description', 'type');
   ```

## Still Having Issues?

If the error persists after running the migration:

1. **Check the error message** - It should now say which column is missing
2. **Verify the migration ran successfully** - Check for any error messages in the SQL Editor
3. **Check your database connection** - Make sure you're connected to the correct Supabase project
4. **Restart your backend server** - Sometimes the schema cache needs to be refreshed

## What Was Fixed

- ✅ Backend code now handles `cost_price` correctly
- ✅ Better error messages to guide you to the solution
- ✅ Improved migration script that matches the schema exactly
- ✅ Migration script is idempotent (safe to run multiple times)

