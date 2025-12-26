import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileText, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
  existingFileUrl?: string;
  existingFileName?: string;
}

export function FileUpload({
  onFileSelect,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  maxSizeMB = 10,
  label = 'Upload Document',
  description = 'Drag and drop or click to browse',
  disabled = false,
  existingFileUrl,
  existingFileName
}: FileUploadProps): JSX.Element {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      const allowedFormats = acceptedTypes
        .map(type => type.split('/')[1].toUpperCase())
        .join(', ');
      return `Invalid file type. Allowed formats: ${allowedFormats}`;
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit. Selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    setUploadSuccess(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    onFileSelect(file);
    setUploadSuccess(true);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderFileIcon = () => {
    if (selectedFile?.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    } else if (selectedFile?.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <Upload className="w-8 h-8 text-gray-400" />;
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${uploadSuccess ? 'border-green-300 bg-green-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded border border-gray-200"
                />
              ) : (
                renderFileIcon()
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {uploadSuccess && (
                  <div className="flex items-center mt-1 text-green-600 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready to upload
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearFile();
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={disabled}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        ) : existingFileUrl ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {existingFileName || 'Existing Document'}
                </p>
                <a
                  href={existingFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  View current document
                </a>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Click to replace
            </p>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">
              {description}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-start space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!error && !selectedFile && !existingFileUrl && (
        <p className="mt-2 text-xs text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}
