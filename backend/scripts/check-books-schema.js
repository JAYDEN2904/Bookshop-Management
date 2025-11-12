/**
 * Check if the books table has the required columns (cost_price, min_stock, etc.)
 * Run this script to verify your database schema is up to date.
 * 
 * Usage: node backend/scripts/check-books-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBooksSchema() {
  console.log('🔍 Checking books table schema...\n');

  try {
    // Query the information_schema to check for required columns
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'books'
        AND column_name IN ('cost_price', 'min_stock', 'supplier_name', 'description', 'type')
        ORDER BY column_name;
      `
    }).catch(async () => {
      // If RPC doesn't work, try a direct query to books table structure
      // by attempting to select the columns
      const testQuery = await supabase
        .from('books')
        .select('id, cost_price, min_stock, supplier_name, description, type')
        .limit(0);
      
      return testQuery;
    });

    // Alternative: Try to query the table with a simple select to see what columns exist
    const { data: sampleBook, error: sampleError } = await supabase
      .from('books')
      .select('*')
      .limit(1)
      .single();

    if (sampleError && sampleError.message?.includes('cost_price')) {
      console.log('❌ Missing column: cost_price');
      console.log('❌ Missing column: min_stock');
      console.log('❌ Missing column: supplier_name');
      console.log('❌ Missing column: description');
      console.log('❌ Missing column: type');
      console.log('\n📋 Solution:');
      console.log('   1. Open your Supabase Dashboard');
      console.log('   2. Go to SQL Editor');
      console.log('   3. Copy and paste the contents of: backend/scripts/add-book-metadata-columns.sql');
      console.log('   4. Run the SQL script');
      console.log('   5. Restart your backend server\n');
      return;
    }

    // Check if we can read a book (if any exist)
    if (sampleBook) {
      const requiredColumns = ['cost_price', 'min_stock', 'supplier_name', 'description', 'type'];
      const missingColumns = [];

      for (const col of requiredColumns) {
        if (!(col in sampleBook)) {
          missingColumns.push(col);
        }
      }

      if (missingColumns.length > 0) {
        console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
        console.log('\n📋 Solution:');
        console.log('   1. Open your Supabase Dashboard');
        console.log('   2. Go to SQL Editor');
        console.log('   3. Copy and paste the contents of: backend/scripts/add-book-metadata-columns.sql');
        console.log('   4. Run the SQL script');
        console.log('   5. Restart your backend server\n');
      } else {
        console.log('✅ All required columns exist in the books table:');
        console.log('   - cost_price');
        console.log('   - min_stock');
        console.log('   - supplier_name');
        console.log('   - description');
        console.log('   - type\n');
      }
    } else {
      // No books exist, try to check schema differently
      console.log('⚠️  No books found in database. Checking schema...');
      console.log('   (This is normal if you haven\'t added any books yet)');
      console.log('\n💡 To verify the schema, run the migration script:');
      console.log('   1. Open your Supabase Dashboard → SQL Editor');
      console.log('   2. Run: backend/scripts/add-book-metadata-columns.sql\n');
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    console.log('\n📋 Manual Check:');
    console.log('   1. Open your Supabase Dashboard');
    console.log('   2. Go to Table Editor → books table');
    console.log('   3. Check if these columns exist:');
    console.log('      - cost_price (DECIMAL)');
    console.log('      - min_stock (INTEGER)');
    console.log('      - supplier_name (VARCHAR)');
    console.log('      - description (TEXT)');
    console.log('      - type (VARCHAR)');
    console.log('   4. If any are missing, run: backend/scripts/add-book-metadata-columns.sql\n');
  }
}

checkBooksSchema();

