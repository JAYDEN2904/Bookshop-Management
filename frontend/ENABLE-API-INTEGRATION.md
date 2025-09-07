# Enable Real API Integration

## Current Issue
Your frontend is using **mock data** instead of making real API calls to the backend. This is why you're seeing errors when trying to add students on the deployed site.

## Solution

### Step 1: Fix RLS Policies (Backend)
First, run the SQL script in your Supabase SQL Editor to disable RLS policies:

```sql
-- Copy and paste the contents of backend/scripts/disable-rls.sql
-- into your Supabase SQL Editor and run it
```

### Step 2: Switch to Real API (Frontend)
Replace the mock StudentContext with the real API version:

1. **Backup your current StudentContext:**
   ```bash
   cp frontend/src/contexts/StudentContext.tsx frontend/src/contexts/StudentContext-mock.tsx
   ```

2. **Replace with API version:**
   ```bash
   cp frontend/src/contexts/StudentContext-API.tsx frontend/src/contexts/StudentContext.tsx
   ```

3. **Update your environment variables:**
   Make sure your frontend has the correct API URL:
   ```env
   VITE_API_URL=https://your-backend-url.com
   ```

### Step 3: Test the Integration
1. **Login to your app** with admin credentials
2. **Try adding a student** - it should now make real API calls
3. **Check the browser console** - you should see successful API requests instead of errors

## What This Fixes

### Before (Mock Data):
- ❌ Students stored in localStorage
- ❌ No real API calls
- ❌ Data doesn't persist across devices
- ❌ No server-side validation

### After (Real API):
- ✅ Students stored in Supabase database
- ✅ Real API calls with authentication
- ✅ Data persists across devices
- ✅ Server-side validation and error handling
- ✅ Proper user permissions (admin vs cashier)

## Authentication Flow
1. **User logs in** → Frontend gets JWT token
2. **API calls include token** → `Authorization: Bearer <token>`
3. **Backend validates token** → Checks user permissions
4. **Database operations** → Service role key bypasses RLS
5. **Response sent back** → Frontend updates UI

## Error Handling
The new API integration includes proper error handling for:
- **401 Unauthorized** → User needs to log in again
- **403 Forbidden** → User doesn't have permission
- **500 Server Error** → Backend/database issues
- **Network errors** → Connection problems

## Rollback Plan
If you need to go back to mock data:
```bash
cp frontend/src/contexts/StudentContext-mock.tsx frontend/src/contexts/StudentContext.tsx
```

## Next Steps
After enabling API integration, you should also update:
- **AuthContext** to use real API calls
- **InventoryContext** to use real API calls  
- **SupplierContext** to use real API calls
- **PurchaseContext** to use real API calls

This will give you a fully functional system with real data persistence.
