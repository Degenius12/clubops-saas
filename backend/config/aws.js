// AWS S3 Configuration for Compliance Document Storage
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'clubflow-compliance-docs';

// Validate required environment variables
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️  AWS credentials not configured. Document upload will fail.');
  console.warn('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
}

// Initialize S3 Client
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Generate a signed URL for secure document access
 * @param {string} s3Key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 24 hours)
 * @returns {Promise<string>} Signed URL
 */
async function generateSignedUrl(s3Key, expiresIn = 86400) {
  const command = new GetObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: s3Key
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate S3 key for compliance document
 * @param {string} clubId - Club UUID
 * @param {string} entertainerId - Entertainer UUID
 * @param {string} documentType - Document type (ENTERTAINER_LICENSE, GOVERNMENT_ID, etc.)
 * @param {string} fileExtension - File extension (jpg, png, pdf)
 * @returns {string} S3 key
 */
function generateS3Key(clubId, entertainerId, documentType, fileExtension) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  return `club-${clubId}/entertainer-${entertainerId}/${documentType}-${timestamp}-${random}.${fileExtension}`;
}

/**
 * Delete document from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<void>}
 */
async function deleteDocument(s3Key) {
  const command = new DeleteObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: s3Key
  });

  await s3Client.send(command);
}

/**
 * Upload buffer to S3 (for base64 signatures converted to images)
 * @param {Buffer} buffer - File buffer
 * @param {string} s3Key - S3 object key
 * @param {string} contentType - MIME type
 * @returns {Promise<object>} Upload result with location
 */
async function uploadBuffer(buffer, s3Key, contentType) {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: AWS_S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType
    }
  });

  const result = await upload.done();

  return {
    bucket: AWS_S3_BUCKET,
    key: s3Key,
    location: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`
  };
}

/**
 * Check if AWS is configured
 * @returns {boolean}
 */
function isAwsConfigured() {
  return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);
}

module.exports = {
  s3Client,
  S3_BUCKET: AWS_S3_BUCKET,
  AWS_REGION,
  generateSignedUrl,
  generateS3Key,
  deleteDocument,
  uploadBuffer,
  isAwsConfigured
};
