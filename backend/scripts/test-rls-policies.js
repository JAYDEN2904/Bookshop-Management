const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase clients
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRLSPolicies() {
  console.log('🧪 Testing RLS Policies...\n');

  try {
    // Step 1: Check if we can access tables with service role (should work)
    console.log('1️⃣ Testing service role access...');
    
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('*')
      .limit(1);

    if (booksError) {
      console.log('❌ Service role access failed:', booksError.message);
    } else {
      console.log('✅ Service role can access books table');
    }

    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('*')
      .limit(1);

    if (studentsError) {
      console.log('❌ Service role access failed:', studentsError.message);
    } else {
      console.log('✅ Service role can access students table');
    }

    // Step 2: Test with anon key (should be restricted)
    console.log('\n2️⃣ Testing anon key access...');
    
    const { data: anonBooks, error: anonBooksError } = await supabaseAuth
      .from('books')
      .select('*')
      .limit(1);

    if (anonBooksError) {
      console.log('✅ Anon key properly restricted:', anonBooksError.message);
    } else {
      console.log('⚠️ Anon key can access books (might be expected if RLS is disabled)');
    }

    // Step 3: Test authenticated access
    console.log('\n3️⃣ Testing authenticated access...');
    
    // Create a test user
    const testEmail = `test-rls-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signUpData, error: signUpError } = await supabaseAuth.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test RLS User',
          role: 'CASHIER'
        }
      }
    });

    if (signUpError) {
      console.log('❌ Test user creation failed:', signUpError.message);
      return;
    }

    console.log('✅ Test user created:', signUpData.user?.email);

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Sign in with the test user
    const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.log('❌ Test user signin failed:', signInError.message);
    } else {
      console.log('✅ Test user signed in successfully');

      // Test accessing tables with authenticated user
      const { data: authBooks, error: authBooksError } = await supabaseAuth
        .from('books')
        .select('*')
        .limit(1);

      if (authBooksError) {
        console.log('❌ Authenticated access to books failed:', authBooksError.message);
      } else {
        console.log('✅ Authenticated user can access books');
      }

      const { data: authStudents, error: authStudentsError } = await supabaseAuth
        .from('students')
        .select('*')
        .limit(1);

      if (authStudentsError) {
        console.log('❌ Authenticated access to students failed:', authStudentsError.message);
      } else {
        console.log('✅ Authenticated user can access students');
      }

      // Test accessing users table
      const { data: authUsers, error: authUsersError } = await supabaseAuth
        .from('users')
        .select('*')
        .limit(1);

      if (authUsersError) {
        console.log('❌ Authenticated access to users failed:', authUsersError.message);
      } else {
        console.log('✅ Authenticated user can access users');
      }
    }

    // Step 4: Clean up test user
    console.log('\n4️⃣ Cleaning up test user...');
    try {
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
      console.log('✅ Test user cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup error:', cleanupError.message);
    }

    // Step 5: Test backend API access
    console.log('\n5️⃣ Testing backend API access...');
    
    // Test if backend can access tables (should work with service role)
    const { data: backendBooks, error: backendBooksError } = await supabaseAdmin
      .from('books')
      .select('*')
      .limit(1);

    if (backendBooksError) {
      console.log('❌ Backend API access failed:', backendBooksError.message);
    } else {
      console.log('✅ Backend API can access books table');
    }

  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the test
testRLSPolicies().then(() => {
  console.log('\n🏁 RLS Policy test complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
