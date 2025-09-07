#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create clients
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthSystem() {
  console.log('🔐 Testing Supabase Auth System...\n');

  try {
    // Test 1: Check if we can create a test user
    console.log('1️⃣ Testing user creation...');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testName = 'Test User';

    const { data: signUpData, error: signUpError } = await supabaseAuth.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName
        }
      }
    });

    if (signUpError) {
      console.log('❌ User creation failed:', signUpError.message);
      return false;
    }

    if (signUpData.user) {
      console.log('✅ Test user created successfully');
      console.log(`   User ID: ${signUpData.user.id}`);
      console.log(`   Email: ${testEmail}`);
    } else {
      console.log('❌ User creation failed - no user returned');
      return false;
    }

    // Test 2: Check if user profile was created in public.users
    console.log('\n2️⃣ Testing user profile creation...');
    
    // Wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('auth_user_id', signUpData.user.id)
      .single();

    if (profileError) {
      console.log('❌ User profile not found:', profileError.message);
      console.log('📋 This means the trigger might not be working');
      return false;
    }

    if (userProfile) {
      console.log('✅ User profile created successfully');
      console.log(`   Profile ID: ${userProfile.id}`);
      console.log(`   Name: ${userProfile.name}`);
      console.log(`   Role: ${userProfile.role}`);
    } else {
      console.log('❌ User profile not found');
      return false;
    }

    // Test 3: Test login
    console.log('\n3️⃣ Testing user login...');
    
    const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.log('❌ Login failed:', signInError.message);
      return false;
    }

    if (signInData.user && signInData.session) {
      console.log('✅ Login successful');
      console.log(`   Access Token: ${signInData.session.access_token.substring(0, 20)}...`);
    } else {
      console.log('❌ Login failed - no session returned');
      return false;
    }

    // Test 4: Test token validation (simulate backend middleware)
    console.log('\n4️⃣ Testing token validation...');
    
    const { data: { user: validatedUser }, error: validationError } = await supabaseAuth.auth.getUser(
      signInData.session.access_token
    );

    if (validationError) {
      console.log('❌ Token validation failed:', validationError.message);
      return false;
    }

    if (validatedUser) {
      console.log('✅ Token validation successful');
      console.log(`   Validated User ID: ${validatedUser.id}`);
    } else {
      console.log('❌ Token validation failed - no user returned');
      return false;
    }

    // Test 5: Test RLS policies with authenticated user
    console.log('\n5️⃣ Testing RLS policies...');
    
    // Create a client with the user's session
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`
        }
      }
    });

    const { data: students, error: studentsError } = await supabaseUser
      .from('students')
      .select('*')
      .limit(1);

    if (studentsError) {
      console.log('❌ RLS policy test failed:', studentsError.message);
      return false;
    }

    console.log('✅ RLS policies working - authenticated user can access students table');

    // Cleanup: Delete test user
    console.log('\n6️⃣ Cleaning up test user...');
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
    
    if (deleteError) {
      console.log('⚠️  Could not delete test user:', deleteError.message);
      console.log('📋 You may need to delete it manually from Supabase Dashboard');
    } else {
      console.log('✅ Test user deleted successfully');
    }

    console.log('\n🎉 Auth system test completed successfully!');
    console.log('\n📋 Your Supabase Auth migration is working correctly!');
    console.log('✅ User registration works');
    console.log('✅ User profiles are created automatically');
    console.log('✅ Login works');
    console.log('✅ Token validation works');
    console.log('✅ RLS policies work with authenticated users');

    return true;

  } catch (error) {
    console.error('💥 Auth system test failed:', error);
    return false;
  }
}

// Run the test
testAuthSystem()
  .then((success) => {
    if (success) {
      console.log('\n✨ All auth tests passed! Your system is ready.');
      process.exit(0);
    } else {
      console.log('\n💥 Some auth tests failed. Please check the issues above.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
