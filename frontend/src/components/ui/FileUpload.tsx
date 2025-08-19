import React, { useState, useRef, useCallback } from 'react';
import { storageService, FileUploadResponse } from '../../services/storageService';
import { Button } from './Button';

interface FileUploadProps {
  bucket: string;
  entityType?: string;
  entityId?: string;
  allowedTypes?: string[];
  maxSize?: number;
  onUploadSuccess?: (response: FileUploadResponse) => void;
  onUploadError?: (error: string) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  placeholder?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  entityType,
  entityId,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUploadSuccess,
  onUploadError,
  onFileSelect,
  className = '',
  disabled = false,
  multiple = false,
  accept,
  placeholder = 'Choose a file or drag it here'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    // Validate file
    const validation = storageService.validateFile(file, allowedTypes, maxSize);
    if (!validation.valid) {
      onUploadError?.(validation.error!);
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = storageService.createImagePreview(file);
      setPreviewUrl(url);
    }

    onFileSelect?.(file);

    // Upload file
    setIsUploading(true);
    try {
      const response = await storageService.uploadFile(bucket, file, entityType, entityId);
      onUploadSuccess?.(response);
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [bucket, entityType, entityId, allowedTypes, maxSize, onUploadSuccess, onUploadError, onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      storageService.revokeImagePreview(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        storageService.revokeImagePreview(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={disabled ? undefined : handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={accept || allowedTypes.join(',')}
          multiple={multiple}
          disabled={disabled}
        />

        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="mx-auto max-h-32 max-w-full rounded object-contain"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
            >
              Remove Preview
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-500">
              Allowed types: {allowedTypes.join(', ')}
            </p>
            <p className="text-xs text-gray-500">
              Max size: {storageService.formatFileSize(maxSize)}
            </p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Uploading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
