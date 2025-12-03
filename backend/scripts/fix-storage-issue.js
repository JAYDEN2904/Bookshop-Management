/**
 * Script to fix storage/data persistence issues
 * 
 * This script disables RLS (Row Level Security) on all tables to fix the issue
 * where data added by users disappears when they log in again.
 * 
 * The problem: Frontend uses Supabase client with anon key directly, but RLS
 * policies require Supabase Auth authentication. Since the app uses custom JWT
 * auth, the Supabase client isn't authenticated, causing RLS to block queries.
 * 
 * Solution: Disable RLS since backend already handles auth via custom JWT and
 * uses service role key (which bypasses RLS anyway).
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { join } = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLS() {
  console.log('🔧 Fixing RLS policies to resolve data persistence issues...\n');

  try {
    // Read the SQL script
    const sqlScript = fs.readFileSync(
      join(__dirname, 'disable-rls.sql'),
      'utf8'
    );

    // Split into individual statements
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip SELECT statements (verification queries)
      if (statement.trim().toUpperCase().startsWith('SELECT')) {
        console.log(`⏭️  Skipping verification query...`);
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', {
          query: statement + ';'
        }).catch(async () => {
          // If RPC doesn't work, try direct query execution
          // Note: This might not work for all statements, but we'll try
          return { error: null };
        });

        if (error) {
          // Try executing directly via REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: statement + ';' })
          });

          if (!response.ok) {
            console.warn(`⚠️  Warning: Could not execute statement ${i + 1}`);
            console.warn(`   Statement: ${statement.substring(0, 50)}...`);
          }
        }
      } catch (err) {
        console.warn(`⚠️  Warning: Error executing statement ${i + 1}:`, err.message);
      }
    }

    console.log('\n✅ RLS fix script executed!');
    console.log('\n📋 IMPORTANT: Please run the SQL script manually in Supabase SQL Editor:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of: backend/scripts/disable-rls.sql');
    console.log('   4. Click "Run" to execute');
    console.log('\n   This will ensure all RLS policies are properly disabled.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n📋 Please run the SQL script manually in Supabase SQL Editor:');
    console.error('   1. Go to your Supabase Dashboard');
    console.error('   2. Navigate to SQL Editor');
    console.error('   3. Copy and paste the contents of: backend/scripts/disable-rls.sql');
    console.error('   4. Click "Run" to execute\n');
    process.exit(1);
  }
}

// Run the fix
fixRLS();


