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

async function debugAuthFlow() {
  console.log('🔍 Debugging Authentication Flow...\n');

  try {
    // Step 1: Check if handle_new_user function exists
    console.log('1️⃣ Checking handle_new_user function...');
    const { data: functions, error: funcError } = await supabaseAdmin
      .rpc('exec_sql', { sql: `
        SELECT routine_name, routine_type 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
      ` });

    if (funcError) {
      console.log('❌ Error checking function:', funcError.message);
      // Try alternative method
      const { data: altCheck, error: altError } = await supabaseAdmin
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'handle_new_user')
        .limit(1);
      
      if (altError) {
        console.log('❌ Alternative check failed:', altError.message);
      } else {
        console.log('✅ Function exists:', altCheck.length > 0);
      }
    } else {
      console.log('✅ Function check result:', functions);
    }

    // Step 2: Check if trigger exists
    console.log('\n2️⃣ Checking trigger...');
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .rpc('exec_sql', { sql: `
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = 'on_auth_user_created'
      ` });

    if (triggerError) {
      console.log('❌ Error checking trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger check result:', triggers);
    }

    // Step 3: Check users table structure
    console.log('\n3️⃣ Checking users table structure...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ Error accessing users table:', usersError.message);
    } else {
      console.log('✅ Users table accessible, sample structure:', users.length > 0 ? Object.keys(users[0]) : 'No users found');
    }

    // Step 4: Check auth.users table
    console.log('\n4️⃣ Checking auth.users table...');
    const { data: authUsers, error: authUsersError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, created_at')
      .limit(3);

    if (authUsersError) {
      console.log('❌ Error accessing auth.users:', authUsersError.message);
    } else {
      console.log('✅ Auth users found:', authUsers.length);
      if (authUsers.length > 0) {
        console.log('   Sample auth user:', authUsers[0]);
      }
    }

    // Step 5: Check if public.users has corresponding entries
    console.log('\n5️⃣ Checking public.users entries...');
    if (authUsers && authUsers.length > 0) {
      for (const authUser of authUsers) {
        const { data: publicUser, error: publicUserError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single();

        if (publicUserError) {
          console.log(`❌ No public user found for auth user ${authUser.email}:`, publicUserError.message);
        } else {
          console.log(`✅ Public user found for ${authUser.email}:`, publicUser.name);
        }
      }
    }

    // Step 6: Test user creation manually
    console.log('\n6️⃣ Testing manual user creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    try {
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
        console.log('❌ Signup failed:', signUpError.message);
      } else {
        console.log('✅ Signup successful:', signUpData.user?.email);
        
        // Wait a moment for trigger to fire
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if public user was created
        const { data: newPublicUser, error: newUserError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('auth_user_id', signUpData.user.id)
          .single();

        if (newUserError) {
          console.log('❌ Public user not created by trigger:', newUserError.message);
        } else {
          console.log('✅ Public user created by trigger:', newPublicUser.name);
        }

        // Clean up test user
        await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
        console.log('🧹 Test user cleaned up');
      }
    } catch (testError) {
      console.log('❌ Test creation failed:', testError.message);
    }

    // Step 7: Check RLS policies
    console.log('\n7️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', { sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
      ` });

    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError.message);
    } else {
      console.log('✅ Users table policies:', policies);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

// Run the debug
debugAuthFlow().then(() => {
  console.log('\n🏁 Debug complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
