#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigrationStatus() {
  console.log('🔍 Checking Supabase Auth Migration Status...\n');

  try {
    // Check 1: auth_user_id column
    console.log('1️⃣ Checking auth_user_id column...');
    const { data: testData, error: columnError } = await supabase
      .from('users')
      .select('auth_user_id')
      .limit(1);

    if (columnError && columnError.message.includes('column "auth_user_id" does not exist')) {
      console.log('❌ auth_user_id column NOT found - SQL migration not run yet');
      console.log('📋 Action needed: Run the SQL migration script in Supabase SQL Editor');
    } else if (columnError) {
      console.log('❌ Error checking auth_user_id:', columnError.message);
    } else {
      console.log('✅ auth_user_id column exists');
    }

    // Check 2: is_admin function
    console.log('\n2️⃣ Checking is_admin function...');
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error && error.message.includes('function is_admin() does not exist')) {
        console.log('✅ is_admin function removed');
      } else {
        console.log('❌ is_admin function still exists - SQL migration not complete');
        console.log('📋 Action needed: Run the SQL migration script in Supabase SQL Editor');
      }
    } catch (error) {
      if (error.message.includes('function is_admin() does not exist')) {
        console.log('✅ is_admin function removed');
      } else {
        console.log('❌ Error checking is_admin function:', error.message);
      }
    }

    // Check 3: Test table access
    console.log('\n3️⃣ Testing table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .limit(1);

    if (usersError) {
      console.log('❌ Error accessing users table:', usersError.message);
    } else {
      console.log('✅ Can access users table');
      if (users && users.length > 0) {
        console.log(`   Found ${users.length} user(s) in database`);
      } else {
        console.log('   No users found in database');
      }
    }

    // Check 4: Test students table
    console.log('\n4️⃣ Testing students table access...');
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, class_level')
      .limit(1);

    if (studentsError) {
      console.log('❌ Error accessing students table:', studentsError.message);
    } else {
      console.log('✅ Can access students table');
      if (students && students.length > 0) {
        console.log(`   Found ${students.length} student(s) in database`);
      } else {
        console.log('   No students found in database');
      }
    }

    console.log('\n📋 Migration Status Summary:');
    console.log('============================');
    
    if (columnError && columnError.message.includes('column "auth_user_id" does not exist')) {
      console.log('❌ SQL Migration: NOT RUN');
      console.log('📋 Next step: Run the SQL migration script in Supabase SQL Editor');
      console.log('   File: backend/scripts/supabase-auth-migration.sql');
    } else {
      console.log('✅ SQL Migration: COMPLETED');
      console.log('📋 Next step: Test the authentication system');
    }

  } catch (error) {
    console.error('💥 Error checking migration status:', error);
  }
}

checkMigrationStatus();
