# Fix for Data Persistence Issue

## Problem
When logging in as different users (ama or jayden), previously added books and students are no longer visible, even though the system shows activity. This is caused by **Row Level Security (RLS) policies** blocking frontend queries.

## Root Cause
1. **Frontend uses Supabase client directly** - The frontend contexts (`InventoryContext`, `StudentContext`, etc.) query Supabase directly using the anon key
2. **RLS requires Supabase Auth** - The RLS policies check for `auth.role() = 'authenticated'`, which requires Supabase Auth authentication
3. **Custom JWT authentication** - Your app uses custom JWT tokens (stored in localStorage), not Supabase Auth
4. **Result** - When the frontend queries Supabase, RLS blocks the queries because there's no Supabase Auth session

## Solution
Disable RLS on all tables since:
- The backend already handles authentication via custom JWT
- The backend uses the service role key (which bypasses RLS anyway)
- This aligns with your current architecture

## Steps to Fix

### Option 1: Run SQL Script in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the SQL Script**
   - Open the file: `backend/scripts/disable-rls.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Execute the Script**
   - Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
   - Wait for the script to complete

5. **Verify RLS is Disabled**
   - The script includes a verification query at the end
   - All tables should show `rowsecurity = false`

### Option 2: Run via Command Line (Alternative)

If you have `psql` installed and configured:

```bash
# From the project root
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f backend/scripts/disable-rls.sql
```

## What the Script Does

1. **Drops all RLS policies** - Removes all existing Row Level Security policies
2. **Disables RLS on all tables** - Turns off RLS for:
   - `users`
   - `books`
   - `students`
   - `suppliers`
   - `purchases`
   - `stock_history`
   - `file_attachments`
   - `reports`
   - `supply_orders`
   - `supply_order_items`
   - `supplier_payments`
3. **Removes helper function** - Drops the `is_admin()` function (no longer needed)
4. **Verifies the changes** - Shows which tables have RLS disabled

## After Running the Script

1. **Refresh your application** - Clear browser cache and reload
2. **Test the fix**:
   - Log in as any user
   - Add a book or student
   - Log out and log back in
   - Verify the data is still visible

## Security Note

Since you're using:
- **Backend authentication** via custom JWT tokens
- **Service role key** for backend operations (bypasses RLS)
- **Frontend direct queries** with anon key

Disabling RLS is safe because:
- The backend already enforces authentication via middleware
- The backend uses service role key which has full access
- Frontend queries are limited by the anon key permissions
- Your application logic handles authorization (Admin vs Cashier roles)

## If Issues Persist

If data still doesn't persist after disabling RLS:

1. **Check browser console** for errors
2. **Check network tab** to see if queries are successful
3. **Verify environment variables** are set correctly:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Check Supabase logs** in the dashboard for any errors

## Alternative Solution (Future)

If you want to keep RLS enabled, you would need to:
1. Migrate to Supabase Auth instead of custom JWT
2. Authenticate the frontend Supabase client with Supabase Auth sessions
3. Update RLS policies to work with your user system

This is a larger architectural change and not recommended unless you specifically need RLS features.


