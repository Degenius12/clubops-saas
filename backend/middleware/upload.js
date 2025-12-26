// File Upload Middleware for Compliance Documents
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { s3Client, S3_BUCKET, generateS3Key } = require('../config/aws');

// Allowed MIME types for compliance documents
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf'
];

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * File filter for multer - validates file type
 * @param {object} req - Express request
 * @param {object} file - Multer file object
 * @param {function} cb - Callback function
 */
function fileFilter(req, file, cb) {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(
        `Invalid file type. Allowed types: JPEG, PNG, PDF. Got: ${file.mimetype}`
      ),
      false
    );
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];

  if (!allowedExts.includes(ext)) {
    return cb(
      new Error(
        `Invalid file extension. Allowed: ${allowedExts.join(', ')}. Got: ${ext}`
      ),
      false
    );
  }

  cb(null, true);
}

/**
 * Configure multer-s3 storage for compliance documents
 */
const s3Storage = multerS3({
  s3: s3Client,
  bucket: S3_BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: req.user?.id || 'unknown',
      clubId: req.user?.clubId || 'unknown',
      uploadedAt: new Date().toISOString()
    });
  },
  key: function (req, file, cb) {
    // Extract parameters from request
    const clubId = req.user?.clubId || 'unknown';
    const entertainerId = req.body.entertainerId || req.params.entertainerId;
    const documentType = req.body.documentType || 'OTHER_COMPLIANCE';

    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase().substring(1);

    // Generate S3 key
    const s3Key = generateS3Key(clubId, entertainerId, documentType, ext);

    // Store key in request for later use
    req.s3Key = s3Key;

    cb(null, s3Key);
  }
});

/**
 * Multer configuration for single file upload
 */
const uploadSingle = multer({
  storage: s3Storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
}).single('document');

/**
 * Multer configuration for multiple file uploads (up to 5)
 */
const uploadMultiple = multer({
  storage: s3Storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  }
}).array('documents', 5);

/**
 * Error handler middleware for multer errors
 * @param {Error} err - Error object
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Next middleware
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `Maximum file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 5 files allowed per upload',
        code: 'TOO_MANY_FILES'
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        message: 'Use "document" field for single upload or "documents" for multiple',
        code: 'UNEXPECTED_FIELD'
      });
    }

    return res.status(400).json({
      error: 'Upload error',
      message: err.message,
      code: err.code
    });
  }

  if (err) {
    // Other errors (file filter, S3, etc.)
    return res.status(400).json({
      error: 'Upload failed',
      message: err.message,
      code: 'UPLOAD_FAILED'
    });
  }

  next();
}

/**
 * Middleware to validate that file was uploaded
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Next middleware
 */
function requireFile(req, res, next) {
  if (!req.file && !req.files) {
    return res.status(400).json({
      error: 'No file uploaded',
      message: 'Please attach a document to upload',
      code: 'FILE_REQUIRED'
    });
  }

  next();
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension
 */
function getExtensionFromMimeType(mimeType) {
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'application/pdf': 'pdf'
  };

  return mimeMap[mimeType] || 'bin';
}

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  requireFile,
  fileFilter,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  getExtensionFromMimeType
};
