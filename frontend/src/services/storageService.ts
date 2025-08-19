import { supabase } from '../config/supabase';

export interface FileUploadResponse {
  success: boolean;
  fileName: string;
  publicUrl: string;
  fileSize: number;
  fileType: string;
}

export interface FileAttachment {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  bucket_name: string;
  uploaded_by: string;
  created_at: string;
}

export interface StorageBucket {
  name: string;
  allowedTypes: string[];
  maxSize: number;
}

class StorageService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }

  /**
   * Upload a file to a specific bucket
   */
  async uploadFile(
    bucket: string,
    file: File,
    entityType?: string,
    entityId?: string
  ): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (entityType) {
        formData.append('entityType', entityType);
      }
      
      if (entityId) {
        formData.append('entityId', entityId);
      }

      const token = localStorage.getItem('bookshop_token');
      
      const response = await fetch(`${this.apiUrl}/storage/upload/${bucket}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  /**
   * Get file attachments for an entity
   */
  async getAttachments(entityType: string, entityId: string): Promise<FileAttachment[]> {
    try {
      const token = localStorage.getItem('bookshop_token');
      
      const response = await fetch(`${this.apiUrl}/storage/attachments/${entityType}/${entityId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch attachments');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching attachments:', error);
      throw error;
    }
  }

  /**
   * Delete a file attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    try {
      const token = localStorage.getItem('bookshop_token');
      
      const response = await fetch(`${this.apiUrl}/storage/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete attachment');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  }

  /**
   * Download a file
   */
  async downloadFile(bucket: string, fileName: string): Promise<Blob> {
    try {
      const token = localStorage.getItem('bookshop_token');
      
      const response = await fetch(`${this.apiUrl}/storage/download/${bucket}/${fileName}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download file');
      }

      return await response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  /**
   * Get storage bucket information
   */
  async getBuckets(): Promise<StorageBucket[]> {
    try {
      const token = localStorage.getItem('bookshop_token');
      
      const response = await fetch(`${this.apiUrl}/storage/buckets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch bucket information');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching buckets:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, fileName: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  }

  /**
   * Validate file type and size
   */
  validateFile(file: File, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Generate a preview URL for an image file
   */
  createImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke a preview URL to free memory
   */
  revokeImagePreview(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType === 'application/pdf') {
      return '📄';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return '📊';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return '📝';
    } else {
      return '📎';
    }
  }
}

export const storageService = new StorageService();
export default storageService;
