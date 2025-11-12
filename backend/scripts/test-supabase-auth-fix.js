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

async function testSupabaseAuthFix() {
  console.log('🧪 Testing Supabase Auth Fix...\n');

  try {
    // Step 1: Test authentication flow
    console.log('1️⃣ Testing authentication flow...');
    
    // Create a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`   Creating test user: ${testEmail}`);
    const { data: signUpData, error: signUpError } = await supabaseAuth.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Sign up error:', signUpError);
      return;
    }

    console.log('✅ Test user created:', signUpData.user?.email);

    // Wait for trigger to create user profile
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Sign in with the test user
    console.log('   Signing in with test user...');
    const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('❌ Sign in error:', signInError);
      return;
    }

    console.log('✅ User signed in successfully');
    const accessToken = signInData.session.access_token;

    // Step 2: Test API calls with the token
    console.log('\n2️⃣ Testing API calls with Supabase auth token...');
    
    // Test books endpoint
    console.log('   Testing books endpoint...');
    try {
      const booksResponse = await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/books`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (booksResponse.ok) {
        const books = await booksResponse.json();
        console.log('✅ Books endpoint working:', books.success ? 'Success' : 'Failed');
      } else {
        console.log('❌ Books endpoint failed:', booksResponse.status, booksResponse.statusText);
      }
    } catch (error) {
      console.log('❌ Books endpoint error:', error.message);
    }

    // Test students endpoint
    console.log('   Testing students endpoint...');
    try {
      const studentsResponse = await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/students`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (studentsResponse.ok) {
        const students = await studentsResponse.json();
        console.log('✅ Students endpoint working:', students.success ? 'Success' : 'Failed');
      } else {
        console.log('❌ Students endpoint failed:', studentsResponse.status, studentsResponse.statusText);
      }
    } catch (error) {
      console.log('❌ Students endpoint error:', error.message);
    }

    // Test suppliers endpoint
    console.log('   Testing suppliers endpoint...');
    try {
      const suppliersResponse = await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/suppliers`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (suppliersResponse.ok) {
        const suppliers = await suppliersResponse.json();
        console.log('✅ Suppliers endpoint working:', suppliers.success ? 'Success' : 'Failed');
      } else {
        console.log('❌ Suppliers endpoint failed:', suppliersResponse.status, suppliersResponse.statusText);
      }
    } catch (error) {
      console.log('❌ Suppliers endpoint error:', error.message);
    }

    // Step 3: Test direct database access with RLS
    console.log('\n3️⃣ Testing direct database access with RLS...');
    
    // Create a client with the user's token
    const supabaseUser = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );

    // Test reading books
    console.log('   Testing books table access...');
    const { data: books, error: booksError } = await supabaseUser
      .from('books')
      .select('*')
      .limit(5);

    if (booksError) {
      console.log('❌ Books table access failed:', booksError.message);
    } else {
      console.log('✅ Books table access working:', books?.length || 0, 'books found');
    }

    // Test reading students
    console.log('   Testing students table access...');
    const { data: students, error: studentsError } = await supabaseUser
      .from('students')
      .select('*')
      .limit(5);

    if (studentsError) {
      console.log('❌ Students table access failed:', studentsError.message);
    } else {
      console.log('✅ Students table access working:', students?.length || 0, 'students found');
    }

    // Test reading suppliers
    console.log('   Testing suppliers table access...');
    const { data: suppliers, error: suppliersError } = await supabaseUser
      .from('suppliers')
      .select('*')
      .limit(5);

    if (suppliersError) {
      console.log('❌ Suppliers table access failed:', suppliersError.message);
    } else {
      console.log('✅ Suppliers table access working:', suppliers?.length || 0, 'suppliers found');
    }

    // Step 4: Clean up test user
    console.log('\n4️⃣ Cleaning up test user...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
    
    if (deleteError) {
      console.log('⚠️ Could not delete test user:', deleteError.message);
    } else {
      console.log('✅ Test user cleaned up');
    }

    console.log('\n🎉 Supabase Auth Fix Test Completed!');
    console.log('If all tests passed, the infinite recursion issue should be resolved.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSupabaseAuthFix();





