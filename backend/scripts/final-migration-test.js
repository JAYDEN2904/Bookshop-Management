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

async function finalMigrationTest() {
  console.log('🎯 Final Supabase Auth Migration Test\n');
  console.log('This test will verify that your migration is complete and working.\n');

  let allTestsPassed = true;

  try {
    // Test 1: Check database schema
    console.log('1️⃣ Testing database schema...');
    const { data: testData, error: columnError } = await supabaseAdmin
      .from('users')
      .select('auth_user_id')
      .limit(1);

    if (columnError && columnError.message.includes('column "auth_user_id" does not exist')) {
      console.log('❌ auth_user_id column not found');
      console.log('📋 Action: Run the SQL migration script in Supabase SQL Editor');
      console.log('   File: backend/scripts/supabase-auth-migration.sql');
      allTestsPassed = false;
    } else if (columnError) {
      console.log('❌ Error checking schema:', columnError.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Database schema is correct');
    }

    // Test 2: Check if is_admin function is removed
    console.log('\n2️⃣ Testing function cleanup...');
    try {
      const { data, error } = await supabaseAdmin.rpc('is_admin');
      if (error && error.message.includes('function is_admin() does not exist')) {
        console.log('✅ is_admin function removed');
      } else {
        console.log('❌ is_admin function still exists');
        console.log('📋 Action: Run the cleanup script in Supabase SQL Editor');
        console.log('   File: backend/scripts/cleanup-is-admin.sql');
        allTestsPassed = false;
      }
    } catch (error) {
      if (error.message.includes('function is_admin() does not exist')) {
        console.log('✅ is_admin function removed');
      } else {
        console.log('❌ Error checking function:', error.message);
        allTestsPassed = false;
      }
    }

    // Test 3: Check if we have any existing users
    console.log('\n3️⃣ Checking existing users...');
    const { data: existingUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, auth_user_id')
      .limit(5);

    if (usersError) {
      console.log('❌ Error checking users:', usersError.message);
      allTestsPassed = false;
    } else {
      console.log(`✅ Found ${existingUsers.length} existing user(s)`);
      if (existingUsers.length > 0) {
        console.log('   Users:');
        existingUsers.forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
        });
      }
    }

    // Test 4: Test table access
    console.log('\n4️⃣ Testing table access...');
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, name, class_level')
      .limit(1);

    if (studentsError) {
      console.log('❌ Error accessing students table:', studentsError.message);
      allTestsPassed = false;
    } else {
      console.log('✅ Can access students table');
      if (students && students.length > 0) {
        console.log(`   Found ${students.length} student(s)`);
      }
    }

    // Test 5: Test Supabase Auth client
    console.log('\n5️⃣ Testing Supabase Auth client...');
    try {
      const { data, error } = await supabaseAuth.auth.getSession();
      if (error) {
        console.log('ℹ️  No active session (expected)');
      } else {
        console.log('✅ Supabase Auth client working');
      }
    } catch (error) {
      console.log('❌ Supabase Auth client error:', error.message);
      allTestsPassed = false;
    }

    // Summary
    console.log('\n📋 Migration Test Summary');
    console.log('========================');
    
    if (allTestsPassed) {
      console.log('🎉 All tests passed! Your migration is complete.');
      console.log('\n✅ Next steps:');
      console.log('1. Create an admin user in Supabase Dashboard → Authentication → Users');
      console.log('2. Set the user role to ADMIN in SQL Editor:');
      console.log('   UPDATE users SET role = \'ADMIN\' WHERE auth_user_id = \'your-user-id\';');
      console.log('3. Test login in your frontend application');
      console.log('4. Try adding a student to verify everything works');
      
      console.log('\n🚀 Your system is ready for production!');
    } else {
      console.log('❌ Some tests failed. Please fix the issues above before proceeding.');
      console.log('\n📋 Required actions:');
      console.log('1. Run the SQL migration scripts in Supabase SQL Editor');
      console.log('2. Fix any database schema issues');
      console.log('3. Re-run this test to verify everything is working');
    }

    return allTestsPassed;

  } catch (error) {
    console.error('💥 Test execution failed:', error);
    return false;
  }
}

// Run the test
finalMigrationTest()
  .then((success) => {
    if (success) {
      console.log('\n✨ Migration test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Migration test failed. Please fix the issues above.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
