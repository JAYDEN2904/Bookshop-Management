import React, { useState, useEffect } from 'react';
import { storageService, FileAttachment } from '../../services/storageService';
import { Button } from './Button';

interface FileAttachmentsProps {
  entityType: string;
  entityId: string;
  bucket: string;
  onAttachmentDeleted?: (attachmentId: string) => void;
  onAttachmentAdded?: (attachment: FileAttachment) => void;
  className?: string;
  showUpload?: boolean;
  showDelete?: boolean;
  maxAttachments?: number;
}

export const FileAttachments: React.FC<FileAttachmentsProps> = ({
  entityType,
  entityId,
  bucket,
  onAttachmentDeleted,
  onAttachmentAdded,
  className = '',
  showUpload = true,
  showDelete = true,
  maxAttachments = 5
}) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAttachments();
  }, [entityType, entityId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await storageService.getAttachments(entityType, entityId);
      setAttachments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load attachments');
      console.error('Error loading attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (attachments.length >= maxAttachments) {
      setError(`Maximum ${maxAttachments} attachments allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await storageService.uploadFile(bucket, file, entityType, entityId);
      
      // Reload attachments to get the new one
      await loadAttachments();
      
      onAttachmentAdded?.({
        id: response.fileName, // This will be updated when we reload
        entity_type: entityType,
        entity_id: entityId,
        file_name: response.fileName,
        file_url: response.publicUrl,
        file_type: response.fileType,
        file_size: response.fileSize,
        bucket_name: bucket,
        uploaded_by: '', // Will be filled by the backend
        created_at: new Date().toISOString()
      });
    } catch (err) {
      setError('Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await storageService.deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      onAttachmentDeleted?.(attachmentId);
    } catch (err) {
      setError('Failed to delete attachment');
      console.error('Delete error:', err);
    }
  };

  const handleDownload = async (attachment: FileAttachment) => {
    try {
      const blob = await storageService.downloadFile(attachment.bucket_name, attachment.file_name);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download file');
      console.error('Download error:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (loading) {
    return (
      <div className={`file-attachments ${className}`}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Loading attachments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-attachments ${className}`}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {showUpload && attachments.length < maxAttachments && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Attachment
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading && (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-600">Uploading...</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {attachments.length} of {maxAttachments} attachments used
          </p>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📎</div>
          <p className="text-sm">No attachments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Attachments ({attachments.length})</h4>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {storageService.getFileIcon(attachment.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {storageService.formatFileSize(attachment.file_size)} • 
                    {new Date(attachment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {attachment.file_type.startsWith('image/') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(attachment.file_url, '_blank')}
                  >
                    View
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                >
                  Download
                </Button>
                
                {showDelete && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
