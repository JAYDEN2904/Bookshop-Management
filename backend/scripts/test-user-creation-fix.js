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

async function testUserCreationFix() {
  console.log('🧪 Testing User Creation Fix...\n');

  try {
    // Step 1: Check current users
    console.log('1️⃣ Checking current users...');
    const { data: currentUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, auth_user_id')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`✅ Found ${currentUsers.length} users:`);
    currentUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - Auth ID: ${user.auth_user_id ? '✅' : '❌'}`);
    });

    // Step 2: Test new user creation
    console.log('\n2️⃣ Testing new user creation...');
    const testEmail = `test-fix-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log(`   Creating user: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabaseAuth.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test Fix User',
          role: 'CASHIER'
        }
      }
    });

    if (signUpError) {
      console.log('❌ Signup failed:');
      console.log('   Error:', signUpError.message);
      console.log('   Status:', signUpError.status);
      return;
    }

    console.log('✅ Signup successful!');
    console.log('   Auth User ID:', signUpData.user?.id);
    console.log('   Email:', signUpData.user?.email);

    // Step 3: Wait for trigger and check public user creation
    console.log('\n3️⃣ Checking public user creation...');
    console.log('   Waiting for trigger to fire...');
    
    // Wait up to 10 seconds for the trigger
    let publicUser = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: newPublicUser, error: newUserError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_user_id', signUpData.user.id)
        .single();

      if (!newUserError && newPublicUser) {
        publicUser = newPublicUser;
        break;
      }
      
      console.log(`   Attempt ${i + 1}/10: Still waiting...`);
    }

    if (!publicUser) {
      console.log('❌ Public user was not created by trigger');
      console.log('   This means the trigger is still not working properly');
    } else {
      console.log('✅ Public user created successfully!');
      console.log('   ID:', publicUser.id);
      console.log('   Name:', publicUser.name);
      console.log('   Email:', publicUser.email);
      console.log('   Role:', publicUser.role);
      console.log('   Auth User ID:', publicUser.auth_user_id);
    }

    // Step 4: Test login with the new user
    console.log('\n4️⃣ Testing login...');
    const { data: loginData, error: loginError } = await supabaseAuth.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.log('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log('   Session token received:', !!loginData.session?.access_token);
    }

    // Step 5: Clean up test user
    console.log('\n5️⃣ Cleaning up test user...');
    try {
      // Delete from public.users first
      if (publicUser) {
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', publicUser.id);
        console.log('   ✅ Public user deleted');
      }

      // Delete from auth.users
      await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
      console.log('   ✅ Auth user deleted');
      console.log('🧹 Test user cleaned up successfully');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup error:', cleanupError.message);
    }

    // Step 6: Final status
    console.log('\n6️⃣ Final Status:');
    if (publicUser && loginData.session) {
      console.log('🎉 SUCCESS: User creation and authentication are working!');
      console.log('   ✅ Supabase Auth signup works');
      console.log('   ✅ Trigger creates public user');
      console.log('   ✅ Login works');
      console.log('   ✅ Authentication flow is complete');
    } else {
      console.log('❌ ISSUES FOUND:');
      if (!publicUser) {
        console.log('   ❌ Trigger is not creating public users');
      }
      if (!loginData.session) {
        console.log('   ❌ Login is not working');
      }
    }

  } catch (error) {
    console.error('❌ Test script error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
testUserCreationFix().then(() => {
  console.log('\n🏁 Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
