import express, { Request, Response } from 'express';
import multer from 'multer';
import { StorageService, STORAGE_BUCKETS } from '../config/storage';
import { supabase } from '../config/supabase';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Upload file to a specific bucket
router.post('/upload/:bucket', protect, upload.single('file'), async (req: Request & AuthRequest, res: Response) => {
  try {
    const { bucket } = req.params;
    const file = req.file;
    const { entityType, entityId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket as any)) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }

    // Generate unique filename
    const fileName = StorageService.generateFileName(file.originalname, entityId);

    // Upload file to Supabase storage
    const uploadResult = await StorageService.uploadFile(
      bucket as keyof typeof STORAGE_BUCKETS,
      file.buffer,
      fileName,
      file.mimetype
    );

    if (!uploadResult) {
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    // Get public URL
    const publicUrl = StorageService.getPublicUrl(bucket as keyof typeof STORAGE_BUCKETS, fileName);

    // Save file attachment record if entity info provided
    if (entityType && entityId) {
      const { error: attachmentError } = await supabase
        .from('file_attachments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          file_name: fileName,
          file_url: publicUrl,
          file_type: file.mimetype,
          file_size: file.size,
          bucket_name: bucket,
          uploaded_by: req.user.id
        });

      if (attachmentError) {
        console.error('Error saving file attachment:', attachmentError);
      }
    }

    return res.json({
      success: true,
      fileName,
      publicUrl,
      fileSize: file.size,
      fileType: file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file attachments for an entity
router.get('/attachments/:entityType/:entityId', protect, async (req: Request & AuthRequest, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    const { data: attachments, error } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch attachments' });
    }

    return res.json(attachments);

  } catch (error) {
    console.error('Error fetching attachments:', error);
    return res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Delete file attachment
router.delete('/attachments/:attachmentId', protect, async (req: Request & AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;

    // Get attachment details
    const { data: attachment, error: fetchError } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Delete file from storage
    await StorageService.deleteFile(
      attachment.bucket_name as keyof typeof STORAGE_BUCKETS,
      attachment.file_name
    );

    // Delete attachment record
    const { error: deleteError } = await supabase
      .from('file_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to delete attachment' });
    }

    return res.json({ success: true, message: 'Attachment deleted successfully' });

  } catch (error) {
    console.error('Error deleting attachment:', error);
    return res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

// Download file
router.get('/download/:bucket/:fileName', protect, async (req: Request & AuthRequest, res: Response) => {
  try {
    const { bucket, fileName } = req.params;

    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket as any)) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }

    const fileData = await StorageService.downloadFile(
      bucket as keyof typeof STORAGE_BUCKETS,
      fileName
    );

    if (!fileData) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Convert Blob to Buffer and send
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.send(buffer);

  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({ error: 'Failed to download file' });
  }
});

// List files in a bucket
router.get('/list/:bucket', protect, async (req: Request & AuthRequest, res: Response) => {
  try {
    const { bucket } = req.params;
    const { folder } = req.query;

    // Validate bucket
    if (!Object.values(STORAGE_BUCKETS).includes(bucket as any)) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }

    const files = await StorageService.listFiles(
      bucket as keyof typeof STORAGE_BUCKETS,
      folder as string
    );

    return res.json(files);

  } catch (error) {
    console.error('List files error:', error);
    return res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get storage bucket info
router.get('/buckets', protect, async (req: Request & AuthRequest, res: Response) => {
  try {
    const buckets = Object.values(STORAGE_BUCKETS).map(bucket => ({
      name: bucket,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      maxSize: bucket === 'reports' ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    }));

    return res.json(buckets);

  } catch (error) {
    console.error('Error fetching bucket info:', error);
    return res.status(500).json({ error: 'Failed to fetch bucket information' });
  }
});

export default router;
