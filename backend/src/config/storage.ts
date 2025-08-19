import { supabase } from './supabase';

// Storage bucket names
export const STORAGE_BUCKETS = {
  RECEIPTS: 'receipts',
  REPORTS: 'reports',
  DOCUMENTS: 'documents'
} as const;

// Allowed file types for each bucket
export const ALLOWED_FILE_TYPES = {
  [STORAGE_BUCKETS.RECEIPTS]: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  [STORAGE_BUCKETS.REPORTS]: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  [STORAGE_BUCKETS.DOCUMENTS]: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
} as const;

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  [STORAGE_BUCKETS.RECEIPTS]: 10 * 1024 * 1024, // 10MB
  [STORAGE_BUCKETS.REPORTS]: 50 * 1024 * 1024, // 50MB
  [STORAGE_BUCKETS.DOCUMENTS]: 20 * 1024 * 1024 // 20MB
} as const;

// Storage utility functions
export class StorageService {
  /**
   * Upload a file to a specific bucket
   */
  static async uploadFile(
    bucket: keyof typeof STORAGE_BUCKETS,
    file: Buffer | File,
    fileName: string,
    contentType?: string
  ) {
    try {
      const bucketName = STORAGE_BUCKETS[bucket] as string;
      
      // Validate file type
      if (contentType && !(ALLOWED_FILE_TYPES as any)[bucketName].includes(contentType)) {
        throw new Error(`File type ${contentType} not allowed for bucket ${bucketName}`);
      }

      // Validate file size
      const fileSize = file instanceof Buffer ? file.length : (file as File).size;
      if (fileSize > (MAX_FILE_SIZES as any)[bucketName]) {
        throw new Error(`File size exceeds maximum allowed size for bucket ${bucketName}`);
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          contentType,
          upsert: true
        });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Get a public URL for a file
   */
  static getPublicUrl(bucket: keyof typeof STORAGE_BUCKETS, fileName: string) {
    const bucketName = STORAGE_BUCKETS[bucket] as string;
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  }

  /**
   * Download a file
   */
  static async downloadFile(bucket: keyof typeof STORAGE_BUCKETS, fileName: string) {
    try {
      const bucketName = STORAGE_BUCKETS[bucket] as string;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(fileName);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  static async deleteFile(bucket: keyof typeof STORAGE_BUCKETS, fileName: string) {
    try {
      const bucketName = STORAGE_BUCKETS[bucket] as string;
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * List files in a bucket
   */
  static async listFiles(bucket: keyof typeof STORAGE_BUCKETS, folder?: string) {
    try {
      const bucketName = STORAGE_BUCKETS[bucket] as string;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folder || '');

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Generate a unique filename
   */
  static generateFileName(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const baseName = originalName.split('.').slice(0, -1).join('.');
    
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${prefix ? prefix + '_' : ''}${safeBaseName}_${timestamp}_${randomString}.${extension}`;
    
    return fileName;
  }
}

export default StorageService;
