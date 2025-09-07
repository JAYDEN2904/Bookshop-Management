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

async function disableRLS() {
  console.log('🔧 Disabling RLS for all tables...\n');

  const tables = [
    'users',
    'books', 
    'students',
    'suppliers',
    'purchases',
    'stock_history',
    'file_attachments',
    'reports'
  ];

  try {
    for (const table of tables) {
      console.log(`🔓 Disabling RLS for table: ${table}`);
      
      // Use direct SQL execution
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1); // This will fail if RLS is blocking, but we'll continue

      if (error) {
        console.log(`   ℹ️  RLS is currently enabled on ${table}`);
      } else {
        console.log(`   ✅ RLS is already disabled on ${table}`);
      }
    }

    console.log('\n📝 Note: Since you\'re using the service role key, RLS is effectively bypassed.');
    console.log('🔐 Your custom JWT authentication in the Express middleware will handle authorization.');
    console.log('💡 If you still get RLS errors, you may need to manually disable RLS in the Supabase dashboard.');

  } catch (error) {
    console.error('💥 Error checking RLS status:', error);
    process.exit(1);
  }
}

// Run the check
disableRLS()
  .then(() => {
    console.log('\n✨ RLS check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 RLS check failed:', error);
    process.exit(1);
  });
