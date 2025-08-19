import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUsers() {
  try {
    console.log('🔐 Creating admin users...');

    // Hash passwords
    const amaPassword = await bcrypt.hash('AmaOduro2024!', 12);
    const katePassword = await bcrypt.hash('KateOsafo2024!', 12);

    // Helper to find auth user by email via admin API
    const findAuthUserByEmail = async (email: string) => {
      let page = 1;
      const perPage = 100;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await (supabase as any).auth.admin.listUsers({ page, perPage });
        if (error) throw error;
        const found = data.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (found) return found;
        if (data.users.length < perPage) return null; // no more pages
        page += 1;
      }
    };

    // Ensure Supabase Auth user exists and upsert into public.users with matching ID
    const ensureAdmin = async (name: string, email: string, plainPassword: string, passwordHash: string) => {
      // Create auth user if needed
      let authUser = await findAuthUserByEmail(email);
      if (!authUser) {
        const { data: created, error: createAuthErr } = await (supabase as any).auth.admin.createUser({
          email,
          password: plainPassword,
          email_confirm: true
        });
        if (createAuthErr) {
          console.error(`Error creating auth user for ${email}:`, createAuthErr);
        } else {
          authUser = created.user;
          console.log(`✅ Created auth user for ${email}`);
        }
      }

      if (!authUser) {
        throw new Error(`Unable to ensure auth user for ${email}`);
      }

      // Check for existing row by email
      const { data: existingByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingByEmail && existingByEmail.id !== authUser.id) {
        // Update existing row's primary key id to match auth user's id and sync fields
        const { error: updateErr } = await supabase
          .from('users')
          .update({
            id: authUser.id,
            name,
            password_hash: passwordHash,
            role: 'ADMIN'
          })
          .eq('email', email);

        if (updateErr) {
          console.error(`Error aligning IDs for ${email}:`, updateErr);
        } else {
          console.log(`🔄 Updated existing app user to match auth id for ${email}`);
        }
      } else if (!existingByEmail) {
        // Insert fresh row with matching id
        const { error: insertErr } = await supabase
          .from('users')
          .insert([
            {
              id: authUser.id,
              name,
              email,
              password_hash: passwordHash,
              role: 'ADMIN'
            }
          ]);
        if (insertErr) {
          console.error(`Error inserting app user for ${email}:`, insertErr);
        } else {
          console.log(`✅ Inserted app user for ${email}`);
        }
      } else {
        // IDs already aligned; just ensure fields are up to date
        const { error: touchErr } = await supabase
          .from('users')
          .update({ name, password_hash: passwordHash, role: 'ADMIN' })
          .eq('id', authUser.id);
        if (touchErr) {
          console.error(`Error updating fields for ${email}:`, touchErr);
        } else {
          console.log(`✅ Ensured app user fields for ${email}`);
        }
      }
    };

    await ensureAdmin('Ama Oduro', 'ama.oduro@bookshop.com', 'AmaOduro2024!', amaPassword);
    await ensureAdmin('Kate Oduro Osafo', 'kate.osafo@bookshop.com', 'KateOsafo2024!', katePassword);

    console.log('\n📋 Admin Credentials:');
    console.log('Admin (Ama): ama.oduro@bookshop.com / AmaOduro2024!');
    console.log('Admin (Kate): kate.osafo@bookshop.com / KateOsafo2024!');
    console.log('\n🎉 Admin users created successfully!');

  } catch (error) {
    console.error('❌ Error creating admin users:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUsers();
}

export default createAdminUsers;
