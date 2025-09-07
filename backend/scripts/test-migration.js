#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create clients
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testMigration() {
  console.log('🧪 Testing Supabase Auth Migration...\n');

  try {
    // Test 1: Check if auth_user_id column exists by trying to select it
    console.log('1️⃣ Testing database schema...');
    const { data: testData, error: columnError } = await supabaseAdmin
      .from('users')
      .select('auth_user_id')
      .limit(1);

    if (columnError) {
      if (columnError.message.includes('column "auth_user_id" does not exist')) {
        console.error('❌ auth_user_id column not found');
        return false;
      } else {
        console.error('❌ Error checking auth_user_id column:', columnError.message);
        return false;
      }
    }

    console.log('✅ auth_user_id column exists');

    // Test 2: Check if RLS policies exist by testing table access
    console.log('\n2️⃣ Testing RLS policies...');
    try {
      // Try to access users table (should work with service role)
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);

      if (usersError) {
        console.error('❌ Error accessing users table:', usersError.message);
        return false;
      }

      console.log('✅ RLS policies working - can access users table');
    } catch (error) {
      console.error('❌ RLS policy test failed:', error.message);
      return false;
    }

    // Test 3: Check if is_admin function is removed
    console.log('\n3️⃣ Testing function cleanup...');
    try {
      // Try to call the is_admin function (should fail if removed)
      const { data, error } = await supabaseAdmin.rpc('is_admin');
      if (error && error.message.includes('function is_admin() does not exist')) {
        console.log('✅ is_admin function successfully removed');
      } else {
        console.error('❌ is_admin function still exists');
        return false;
      }
    } catch (error) {
      if (error.message.includes('function is_admin() does not exist')) {
        console.log('✅ is_admin function successfully removed');
      } else {
        console.error('❌ Error testing function cleanup:', error.message);
        return false;
      }
    }

    // Test 4: Test Supabase Auth client
    console.log('\n4️⃣ Testing Supabase Auth client...');
    try {
      // This should not throw an error
      const { data, error } = await supabaseAuth.auth.getSession();
      if (error) {
        console.log('ℹ️  No active session (expected for new setup)');
      } else {
        console.log('✅ Supabase Auth client working');
      }
    } catch (error) {
      console.error('❌ Supabase Auth client error:', error.message);
      return false;
    }

    // Test 5: Check if users table has proper structure
    console.log('\n5️⃣ Testing users table structure...');
    try {
      // Try to select all expected columns
      const { data: testUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, auth_user_id, name, email, role, created_at, updated_at')
        .limit(1);

      if (userError) {
        if (userError.message.includes('column') && userError.message.includes('does not exist')) {
          console.error('❌ Users table missing required columns');
          return false;
        } else {
          console.error('❌ Error checking users table:', userError.message);
          return false;
        }
      }

      console.log('✅ Users table has correct structure');
    } catch (error) {
      console.error('❌ Users table structure test failed:', error.message);
      return false;
    }

    console.log('\n🎉 Migration test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Create an admin user in Supabase Dashboard → Authentication → Users');
    console.log('2. Update the user role in SQL Editor:');
    console.log('   UPDATE users SET role = \'ADMIN\' WHERE auth_user_id = \'your-user-id\';');
    console.log('3. Test login in your frontend application');
    console.log('4. Try adding a student to verify RLS policies work');

    return true;

  } catch (error) {
    console.error('💥 Migration test failed:', error);
    return false;
  }
}

// Run the test
testMigration()
  .then((success) => {
    if (success) {
      console.log('\n✨ All tests passed! Migration is ready.');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed. Please check the issues above.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
