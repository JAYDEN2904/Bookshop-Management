import { supabase } from '../config/supabase';
import { STORAGE_BUCKETS } from '../config/storage';

export async function setupStorageBuckets() {
  console.log('Setting up Supabase storage buckets...');

  const buckets = [
    {
      name: STORAGE_BUCKETS.RECEIPTS,
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      fileSizeLimit: 10485760 // 10MB
    },
    {
      name: STORAGE_BUCKETS.REPORTS,
      public: false,
      allowedMimeTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      fileSizeLimit: 52428800 // 50MB
    },
    {
      name: STORAGE_BUCKETS.DOCUMENTS,
      public: true,
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'],
      fileSizeLimit: 20971520 // 20MB
    }
  ];

  for (const bucket of buckets) {
    try {
      console.log(`Creating bucket: ${bucket.name}`);
      
      // Create bucket
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        allowedMimeTypes: bucket.allowedMimeTypes,
        fileSizeLimit: bucket.fileSizeLimit
      });

      if (bucketError) {
        if (bucketError.message.includes('already exists')) {
          console.log(`Bucket ${bucket.name} already exists, skipping...`);
        } else {
          console.error(`Error creating bucket ${bucket.name}:`, bucketError);
          continue;
        }
      } else {
        console.log(`Successfully created bucket: ${bucket.name}`);
      }

      // Set up storage policies
      await setupStoragePolicies(bucket.name, bucket.public);

    } catch (error) {
      console.error(`Error setting up bucket ${bucket.name}:`, error);
    }
  }

  console.log('Storage buckets setup completed!');
}

async function setupStoragePolicies(bucketName: string, isPublic: boolean) {
  try {
    // Policy for authenticated users to upload files
    const uploadPolicy = `
      CREATE POLICY "Authenticated users can upload to ${bucketName}" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = '${bucketName}' AND 
        auth.role() = 'authenticated'
      );
    `;

    // Policy for viewing files
    const viewPolicy = isPublic 
      ? `
        CREATE POLICY "Public access to ${bucketName}" ON storage.objects
        FOR SELECT USING (bucket_id = '${bucketName}');
      `
      : `
        CREATE POLICY "Authenticated users can view ${bucketName}" ON storage.objects
        FOR SELECT USING (
          bucket_id = '${bucketName}' AND 
          auth.role() = 'authenticated'
        );
      `;

    // Policy for updating files (only admins)
    const updatePolicy = `
      CREATE POLICY "Admins can update ${bucketName}" ON storage.objects
      FOR UPDATE USING (
        bucket_id = '${bucketName}' AND 
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
      );
    `;

    // Policy for deleting files (only admins)
    const deletePolicy = `
      CREATE POLICY "Admins can delete from ${bucketName}" ON storage.objects
      FOR DELETE USING (
        bucket_id = '${bucketName}' AND 
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
      );
    `;

    // Execute policies
    const policies = [uploadPolicy, viewPolicy, updatePolicy, deletePolicy];
    
    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error && !error.message.includes('already exists')) {
          console.error(`Error creating policy for ${bucketName}:`, error);
        }
      } catch (error) {
        // Policy might already exist, continue
        console.log(`Policy for ${bucketName} might already exist, continuing...`);
      }
    }

    console.log(`Storage policies set up for bucket: ${bucketName}`);

  } catch (error) {
    console.error(`Error setting up storage policies for ${bucketName}:`, error);
  }
}

// Function to clean up storage buckets (for testing/development)
export async function cleanupStorageBuckets() {
  console.log('Cleaning up storage buckets...');

  for (const bucketName of Object.values(STORAGE_BUCKETS)) {
    try {
      // List all files in the bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list();

      if (listError) {
        console.error(`Error listing files in ${bucketName}:`, listError);
        continue;
      }

      if (files && files.length > 0) {
        // Delete all files
        const fileNames = files.map(file => file.name);
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove(fileNames);

        if (deleteError) {
          console.error(`Error deleting files from ${bucketName}:`, deleteError);
        } else {
          console.log(`Deleted ${fileNames.length} files from ${bucketName}`);
        }
      }

      // Delete the bucket
      const { error: bucketError } = await supabase.storage.deleteBucket(bucketName);
      
      if (bucketError) {
        console.error(`Error deleting bucket ${bucketName}:`, bucketError);
      } else {
        console.log(`Successfully deleted bucket: ${bucketName}`);
      }

    } catch (error) {
      console.error(`Error cleaning up bucket ${bucketName}:`, error);
    }
  }

  console.log('Storage buckets cleanup completed!');
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupStorageBuckets()
    .then(() => {
      console.log('Storage setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Storage setup failed:', error);
      process.exit(1);
    });
}
