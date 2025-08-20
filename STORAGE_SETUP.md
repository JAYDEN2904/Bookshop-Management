# Storage System Setup Guide

This document provides a comprehensive guide for setting up and using the Supabase storage system for the Bookshop Management System.

## Overview

The storage system provides file management capabilities for:
- **Books**: Cover images and PDF files
- **Students**: Profile images
- **Suppliers**: Logo images
- **Purchases**: Receipt images and documents
- **Users**: Profile images
- **Reports**: Generated PDF and Excel files

## Storage Buckets

The system uses the following Supabase storage buckets:

| Bucket | Purpose | Public | Max Size | Allowed Types |
|--------|---------|--------|----------|---------------|
| `books` | Book covers and PDFs | Yes | 5MB | Images, PDF |
| `students` | Student profile images | Yes | 2MB | Images only |
| `receipts` | Receipt images and scans | Yes | 10MB | Images, PDF |
| `purchases` | Purchase documents | Yes | 10MB | Images, PDF |
| `suppliers` | Supplier logos | Yes | 2MB | Images only |
| `users` | User profile images | Yes | 2MB | Images only |
| `reports` | Generated reports | No | 50MB | PDF, Excel |

## Setup Instructions

### 1. Environment Variables

Ensure your `.env` file contains the required Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Create Storage Buckets

Run the storage setup script:

```bash
# From the backend directory
npm run setup-storage
```

Or manually run:

```bash
node scripts/setup-storage.js
```

### 3. Database Schema Updates

The database schema has been updated to include file references:

```sql
-- Books table now includes:
cover_image_url TEXT,
pdf_url TEXT

-- Students table now includes:
profile_image_url TEXT

-- Suppliers table now includes:
logo_url TEXT

-- Purchases table now includes:
receipt_image_url TEXT

-- Users table now includes:
profile_image_url TEXT

-- New tables:
file_attachments - tracks all file uploads
reports - stores generated reports
```

### 4. API Endpoints

The storage system provides the following API endpoints:

#### Upload File
```
POST /api/storage/upload/:bucket
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: File
- entityType: string (optional)
- entityId: string (optional)
```

#### Get Attachments
```
GET /api/storage/attachments/:entityType/:entityId
Authorization: Bearer <token>
```

#### Delete Attachment
```
DELETE /api/storage/attachments/:attachmentId
Authorization: Bearer <token>
```

#### Download File
```
GET /api/storage/download/:bucket/:fileName
Authorization: Bearer <token>
```

#### List Files
```
GET /api/storage/list/:bucket?folder=optional
Authorization: Bearer <token>
```

#### Get Bucket Info
```
GET /api/storage/buckets
Authorization: Bearer <token>
```

## Frontend Usage

### File Upload Component

```tsx
import { FileUpload } from '../components/ui/FileUpload';

<FileUpload
  bucket="books"
  entityType="book"
  entityId={bookId}
  allowedTypes={['image/jpeg', 'image/png', 'application/pdf']}
  maxSize={5 * 1024 * 1024}
  onUploadSuccess={(response) => {
    console.log('Upload successful:', response);
  }}
  onUploadError={(error) => {
    console.error('Upload failed:', error);
  }}
/>
```

### File Attachments Component

```tsx
import { FileAttachments } from '../components/ui/FileAttachments';

<FileAttachments
  entityType="book"
  entityId={bookId}
  bucket="books"
  showUpload={true}
  showDelete={true}
  maxAttachments={5}
  onAttachmentAdded={(attachment) => {
    console.log('New attachment:', attachment);
  }}
  onAttachmentDeleted={(attachmentId) => {
    console.log('Deleted attachment:', attachmentId);
  }}
/>
```

### Storage Service

```tsx
import { storageService } from '../services/storageService';

// Upload a file
const response = await storageService.uploadFile(
  'books',
  file,
  'book',
  bookId
);

// Get attachments
const attachments = await storageService.getAttachments('book', bookId);

// Download a file
const blob = await storageService.downloadFile('books', fileName);

// Get public URL
const publicUrl = storageService.getPublicUrl('books', fileName);
```

## Security Policies

The storage system implements the following security policies:

### Public Buckets (books, students, receipts, purchases, suppliers, users)
- **View**: Public access
- **Upload**: Authenticated users only
- **Update/Delete**: Admin users only

### Private Buckets (reports)
- **View**: Authenticated users only
- **Upload**: Authenticated users only
- **Update/Delete**: Admin users only

## File Validation

The system validates files based on:

1. **File Type**: Only allowed MIME types are accepted
2. **File Size**: Maximum size limits per bucket
3. **File Name**: Unique names generated to prevent conflicts

## Error Handling

Common error scenarios and solutions:

### File Too Large
```
Error: File size exceeds maximum allowed size for bucket books
Solution: Compress the file or use a smaller file
```

### Invalid File Type
```
Error: File type application/zip not allowed for bucket books
Solution: Use an allowed file type (image/jpeg, image/png, application/pdf)
```

### Upload Failed
```
Error: Upload failed
Solution: Check network connection and try again
```

## Best Practices

### 1. File Naming
- Use descriptive file names
- Avoid special characters
- Include version numbers if needed

### 2. File Organization
- Use appropriate buckets for different file types
- Consider using folders for better organization
- Clean up unused files regularly

### 3. Performance
- Compress images before upload
- Use appropriate file formats
- Monitor storage usage

### 4. Security
- Validate files on both frontend and backend
- Implement proper access controls
- Regularly audit file access

## Troubleshooting

### Storage Buckets Not Created
1. Check Supabase credentials in `.env`
2. Ensure service role key has admin permissions
3. Run setup script with verbose logging

### File Upload Fails
1. Check file size and type restrictions
2. Verify authentication token
3. Check network connectivity
4. Review server logs for detailed errors

### Files Not Accessible
1. Verify bucket public/private settings
2. Check storage policies
3. Ensure proper authentication
4. Verify file URLs are correct

## Monitoring and Maintenance

### Storage Usage
Monitor storage usage through Supabase dashboard:
1. Go to Storage section
2. Check bucket sizes and file counts
3. Set up alerts for storage limits

### Cleanup Procedures
Regular cleanup tasks:
1. Remove orphaned file attachments
2. Delete unused files
3. Archive old reports
4. Update file references

## Support

For issues related to the storage system:
1. Check this documentation
2. Review server logs
3. Test with different file types/sizes
4. Contact system administrator

## Future Enhancements

Potential improvements:
1. Image resizing and optimization
2. File versioning
3. Advanced search and filtering
4. Bulk upload/download
5. Integration with CDN
6. File encryption
