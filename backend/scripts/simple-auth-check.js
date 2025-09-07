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

async function simpleAuthCheck() {
  console.log('🔍 Simple Authentication Check...\n');

  try {
    // Step 1: Check if users table has auth_user_id column
    console.log('1️⃣ Checking users table structure...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ Error accessing users table:', usersError.message);
      return;
    }

    console.log('✅ Users table accessible');
    console.log('   Columns:', Object.keys(users.length > 0 ? users[0] : {}));
    
    if (users.length > 0) {
      const user = users[0];
      console.log('   Has auth_user_id:', 'auth_user_id' in user);
      console.log('   Sample user:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        auth_user_id: user.auth_user_id
      });
    }

    // Step 2: Check existing users count
    const { count: userCount, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error counting users:', countError.message);
    } else {
      console.log(`✅ Total users in public.users: ${userCount}`);
    }

    // Step 3: Test user creation with detailed error
    console.log('\n2️⃣ Testing user creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log(`   Creating user: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabaseAuth.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          role: 'CASHIER'
        }
      }
    });

    if (signUpError) {
      console.log('❌ Signup failed:');
      console.log('   Error code:', signUpError.status);
      console.log('   Error message:', signUpError.message);
      console.log('   Full error:', JSON.stringify(signUpError, null, 2));
    } else {
      console.log('✅ Signup successful!');
      console.log('   User ID:', signUpData.user?.id);
      console.log('   Email:', signUpData.user?.email);
      
      // Wait for trigger
      console.log('   Waiting for trigger to fire...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if public user was created
      const { data: newPublicUser, error: newUserError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_user_id', signUpData.user.id)
        .single();

      if (newUserError) {
        console.log('❌ Public user not created by trigger:');
        console.log('   Error:', newUserError.message);
        console.log('   This suggests the trigger is not working');
      } else {
        console.log('✅ Public user created by trigger:');
        console.log('   Name:', newPublicUser.name);
        console.log('   Role:', newPublicUser.role);
      }

      // Clean up
      try {
        await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
        console.log('🧹 Test user cleaned up');
      } catch (cleanupError) {
        console.log('⚠️ Cleanup failed:', cleanupError.message);
      }
    }

    // Step 4: Check if we can manually create a user in public.users
    console.log('\n3️⃣ Testing manual user creation in public.users...');
    const { data: manualUser, error: manualError } = await supabaseAdmin
      .from('users')
      .insert({
        name: 'Manual Test User',
        email: `manual-${Date.now()}@example.com`,
        role: 'CASHIER',
        auth_user_id: null // No auth user ID
      })
      .select()
      .single();

    if (manualError) {
      console.log('❌ Manual user creation failed:', manualError.message);
    } else {
      console.log('✅ Manual user creation successful:', manualUser.name);
      
      // Clean up
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', manualUser.id);
      console.log('🧹 Manual test user cleaned up');
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the check
simpleAuthCheck().then(() => {
  console.log('\n🏁 Check complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
