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

async function testEmergencyFix() {
  console.log('🚨 Testing Emergency RLS Fix...\n');

  try {
    // Test 1: Service role access (should work)
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

    const { data: suppliers, error: suppliersError } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .limit(1);

    if (suppliersError) {
      console.log('❌ Service role access failed:', suppliersError.message);
    } else {
      console.log('✅ Service role can access suppliers table');
    }

    // Test 2: Anon key access (should work now that RLS is disabled)
    console.log('\n2️⃣ Testing anon key access...');
    
    const { data: anonBooks, error: anonBooksError } = await supabaseAuth
      .from('books')
      .select('*')
      .limit(1);

    if (anonBooksError) {
      console.log('❌ Anon key access failed:', anonBooksError.message);
    } else {
      console.log('✅ Anon key can access books (RLS disabled)');
    }

    const { data: anonStudents, error: anonStudentsError } = await supabaseAuth
      .from('students')
      .select('*')
      .limit(1);

    if (anonStudentsError) {
      console.log('❌ Anon key access failed:', anonStudentsError.message);
    } else {
      console.log('✅ Anon key can access students (RLS disabled)');
    }

    const { data: anonSuppliers, error: anonSuppliersError } = await supabaseAuth
      .from('suppliers')
      .select('*')
      .limit(1);

    if (anonSuppliersError) {
      console.log('❌ Anon key access failed:', anonSuppliersError.message);
    } else {
      console.log('✅ Anon key can access suppliers (RLS disabled)');
    }

    // Test 3: Backend API simulation
    console.log('\n3️⃣ Testing backend API simulation...');
    
    // Simulate what your backend does - use service role
    const { data: backendBooks, error: backendBooksError } = await supabaseAdmin
      .from('books')
      .select('*')
      .limit(5);

    if (backendBooksError) {
      console.log('❌ Backend API simulation failed:', backendBooksError.message);
    } else {
      console.log(`✅ Backend API can fetch ${backendBooks.length} books`);
    }

    const { data: backendStudents, error: backendStudentsError } = await supabaseAdmin
      .from('students')
      .select('*')
      .limit(5);

    if (backendStudentsError) {
      console.log('❌ Backend API simulation failed:', backendStudentsError.message);
    } else {
      console.log(`✅ Backend API can fetch ${backendStudents.length} students`);
    }

    const { data: backendSuppliers, error: backendSuppliersError } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .limit(5);

    if (backendSuppliersError) {
      console.log('❌ Backend API simulation failed:', backendSuppliersError.message);
    } else {
      console.log(`✅ Backend API can fetch ${backendSuppliers.length} suppliers`);
    }

    // Test 4: Check if recursion error is gone
    console.log('\n4️⃣ Checking for recursion errors...');
    
    // Try to access users table (this was causing the recursion)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ Users table access failed:', usersError.message);
      if (usersError.message.includes('infinite recursion')) {
        console.log('   ⚠️ Recursion error still exists!');
      }
    } else {
      console.log('✅ Users table accessible - no recursion error');
    }

    console.log('\n🎉 Emergency fix test complete!');
    console.log('If all tests passed, your deployed site should work now.');

  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the test
testEmergencyFix().then(() => {
  console.log('\n🏁 Emergency fix test complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
