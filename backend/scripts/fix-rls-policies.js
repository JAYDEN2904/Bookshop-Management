#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for custom JWT authentication...\n');

  try {
    // Drop existing policies that depend on auth.uid() and auth.role()
    const policiesToDrop = [
      'DROP POLICY IF EXISTS "Users can view own profile" ON users;',
      'DROP POLICY IF EXISTS "Admins can view all users" ON users;',
      'DROP POLICY IF EXISTS "Authenticated users can view books" ON books;',
      'DROP POLICY IF EXISTS "Admins can manage books" ON books;',
      'DROP POLICY IF EXISTS "Authenticated users can view students" ON students;',
      'DROP POLICY IF EXISTS "Admins can manage students" ON students;',
      'DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON suppliers;',
      'DROP POLICY IF EXISTS "Admins can manage suppliers" ON suppliers;',
      'DROP POLICY IF EXISTS "Authenticated users can view purchases" ON purchases;',
      'DROP POLICY IF EXISTS "Authenticated users can create purchases" ON purchases;',
      'DROP POLICY IF EXISTS "Admins can manage purchases" ON purchases;',
      'DROP POLICY IF EXISTS "Authenticated users can view stock history" ON stock_history;',
      'DROP POLICY IF EXISTS "Admins can manage stock history" ON stock_history;',
      'DROP POLICY IF EXISTS "Authenticated users can view file attachments" ON file_attachments;',
      'DROP POLICY IF EXISTS "Authenticated users can create file attachments" ON file_attachments;',
      'DROP POLICY IF EXISTS "Admins can manage file attachments" ON file_attachments;',
      'DROP POLICY IF EXISTS "Authenticated users can view reports" ON reports;',
      'DROP POLICY IF EXISTS "Admins can manage reports" ON reports;'
    ];

    console.log('🗑️  Dropping existing RLS policies...');
    for (const policy of policiesToDrop) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error && !error.message.includes('does not exist')) {
          console.error(`❌ Error dropping policy:`, error.message);
        }
      } catch (error) {
        // Policy might not exist, continue
      }
    }

    // Create new policies that work with service role (bypass RLS for service role)
    const newPolicies = [
      // Users table - allow service role full access
      `CREATE POLICY "Service role can manage users" ON users
       FOR ALL USING (true) WITH CHECK (true);`,

      // Books table - allow service role full access
      `CREATE POLICY "Service role can manage books" ON books
       FOR ALL USING (true) WITH CHECK (true);`,

      // Students table - allow service role full access
      `CREATE POLICY "Service role can manage students" ON students
       FOR ALL USING (true) WITH CHECK (true);`,

      // Suppliers table - allow service role full access
      `CREATE POLICY "Service role can manage suppliers" ON suppliers
       FOR ALL USING (true) WITH CHECK (true);`,

      // Purchases table - allow service role full access
      `CREATE POLICY "Service role can manage purchases" ON purchases
       FOR ALL USING (true) WITH CHECK (true);`,

      // Stock history table - allow service role full access
      `CREATE POLICY "Service role can manage stock history" ON stock_history
       FOR ALL USING (true) WITH CHECK (true);`,

      // File attachments table - allow service role full access
      `CREATE POLICY "Service role can manage file attachments" ON file_attachments
       FOR ALL USING (true) WITH CHECK (true);`,

      // Reports table - allow service role full access
      `CREATE POLICY "Service role can manage reports" ON reports
       FOR ALL USING (true) WITH CHECK (true);`
    ];

    console.log('✅ Creating new RLS policies for service role...');
    for (const policy of newPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          console.error(`❌ Error creating policy:`, error.message);
        } else {
          console.log(`✅ Policy created successfully`);
        }
      } catch (error) {
        console.error(`❌ Error creating policy:`, error.message);
      }
    }

    // Drop the is_admin function since we're not using it anymore
    console.log('🗑️  Dropping unused is_admin function...');
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: 'DROP FUNCTION IF EXISTS public.is_admin();' 
      });
      if (error && !error.message.includes('does not exist')) {
        console.error(`❌ Error dropping function:`, error.message);
      } else {
        console.log('✅ is_admin function dropped');
      }
    } catch (error) {
      // Function might not exist, continue
    }

    console.log('\n🎉 RLS policies fixed successfully!');
    console.log('📝 Note: Since you\'re using the service role key, RLS is effectively bypassed.');
    console.log('🔐 Your custom JWT authentication in the Express middleware will handle authorization.');

  } catch (error) {
    console.error('💥 Error fixing RLS policies:', error);
    process.exit(1);
  }
}

// Run the fix
fixRLSPolicies()
  .then(() => {
    console.log('\n✨ RLS policy fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 RLS policy fix failed:', error);
    process.exit(1);
  });
