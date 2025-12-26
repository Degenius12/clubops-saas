// Compliance Document Management Routes
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const { uploadSingle, handleUploadError, requireFile } = require('../middleware/upload');
const { generateSignedUrl, deleteDocument } = require('../config/aws');

const prisma = new PrismaClient();

// ==============================================
// DOCUMENT UPLOAD
// ==============================================

/**
 * POST /api/compliance/documents/upload
 * Upload a compliance document to S3 and create database record
 *
 * Body (multipart/form-data):
 * - document: File (JPEG, PNG, PDF, max 10MB)
 * - entertainerId: UUID
 * - documentType: ENTERTAINER_LICENSE | GOVERNMENT_ID | PHOTO_ID_SELFIE | etc.
 * - expiresAt: ISO 8601 date (optional, for licenses)
 * - notes: string (optional)
 *
 * Access: OWNER, SUPER_MANAGER, MANAGER
 */
router.post('/documents/upload',
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'),
  (req, res, next) => {
    // Multer upload middleware
    uploadSingle(req, res, (err) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  requireFile,
  async (req, res) => {
    try {
      const { entertainerId, documentType, expiresAt, notes } = req.body;
      const file = req.file;

      // Validate required fields
      if (!entertainerId) {
        return res.status(400).json({ error: 'entertainerId is required' });
      }

      if (!documentType) {
        return res.status(400).json({ error: 'documentType is required' });
      }

      // Verify entertainer exists and belongs to club
      const entertainer = await prisma.entertainer.findUnique({
        where: { id: entertainerId }
      });

      if (!entertainer) {
        return res.status(404).json({ error: 'Entertainer not found' });
      }

      if (entertainer.clubId !== req.user.clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Create compliance document record
      const document = await prisma.complianceDocument.create({
        data: {
          clubId: req.user.clubId,
          entertainerId,
          documentType,
          documentStatus: 'UPLOADED',
          fileUrl: file.location,
          s3Bucket: file.bucket,
          s3Key: file.key,
          fileSize: file.size,
          mimeType: file.mimetype,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          uploadedById: req.user.id,
          uploadedAt: new Date(),
          notes
        },
        include: {
          entertainer: {
            select: {
              stageName: true,
              legalName: true
            }
          },
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // TODO: Emit Socket.IO event for real-time notification
      // io.to(`club-${req.user.clubId}`).emit('document-uploaded', { documentId: document.id });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'DOCUMENT_UPLOADED',
          entityType: 'COMPLIANCE_DOCUMENT',
          entityId: document.id,
          newData: {
            documentType,
            entertainerId,
            fileSize: file.size
          },
          ipAddress: req.ip,
          currentHash: '' // TODO: Implement hash chain
        }
      });

      res.status(201).json({
        success: true,
        document: {
          id: document.id,
          documentType: document.documentType,
          documentStatus: document.documentStatus,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          expiresAt: document.expiresAt,
          uploadedAt: document.uploadedAt,
          entertainer: document.entertainer,
          uploadedBy: document.uploadedBy
        }
      });

    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

// ==============================================
// DOCUMENT RETRIEVAL
// ==============================================

/**
 * GET /api/compliance/documents/:entertainerId
 * Get all compliance documents for an entertainer with signed URLs
 *
 * Access: OWNER, SUPER_MANAGER, MANAGER
 */
router.get('/documents/:entertainerId',
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'),
  async (req, res) => {
    try {
      const { entertainerId } = req.params;

      // Verify entertainer belongs to club
      const entertainer = await prisma.entertainer.findUnique({
        where: { id: entertainerId }
      });

      if (!entertainer) {
        return res.status(404).json({ error: 'Entertainer not found' });
      }

      if (entertainer.clubId !== req.user.clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get all documents
      const documents = await prisma.complianceDocument.findMany({
        where: {
          clubId: req.user.clubId,
          entertainerId
        },
        include: {
          uploadedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          reviewedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Generate signed URLs for each document
      const documentsWithSignedUrls = await Promise.all(
        documents.map(async (doc) => {
          let signedUrl = null;

          if (doc.s3Key) {
            try {
              signedUrl = await generateSignedUrl(doc.s3Key, 86400); // 24-hour expiry
            } catch (error) {
              console.error(`Failed to generate signed URL for ${doc.s3Key}:`, error);
            }
          }

          return {
            id: doc.id,
            documentType: doc.documentType,
            documentStatus: doc.documentStatus,
            signedUrl, // Temporary URL (24-hour expiry)
            fileSize: doc.fileSize,
            mimeType: doc.mimeType,
            expiresAt: doc.expiresAt,
            uploadedAt: doc.uploadedAt,
            uploadedBy: doc.uploadedBy,
            reviewedAt: doc.reviewedAt,
            reviewedBy: doc.reviewedBy,
            reviewNotes: doc.reviewNotes,
            notes: doc.notes
          };
        })
      );

      res.json({
        success: true,
        documents: documentsWithSignedUrls
      });

    } catch (error) {
      console.error('Document retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve documents' });
    }
  }
);

// ==============================================
// DOCUMENT STATUS UPDATE
// ==============================================

/**
 * PATCH /api/compliance/documents/:id/status
 * Approve or reject a compliance document
 *
 * Body:
 * - status: APPROVED | REJECTED
 * - reviewNotes: string (optional)
 * - rejectionReason: string (required if REJECTED)
 *
 * Access: OWNER, SUPER_MANAGER, MANAGER
 */
router.patch('/documents/:id/status',
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reviewNotes, rejectionReason } = req.body;

      // Validate status
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED' });
      }

      // Require rejection reason if rejecting
      if (status === 'REJECTED' && !rejectionReason) {
        return res.status(400).json({ error: 'rejectionReason is required when rejecting' });
      }

      // Get document
      const document = await prisma.complianceDocument.findUnique({
        where: { id }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (document.clubId !== req.user.clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update document status
      const updated = await prisma.complianceDocument.update({
        where: { id },
        data: {
          documentStatus: status,
          reviewedById: req.user.id,
          reviewedAt: new Date(),
          reviewNotes,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null
        },
        include: {
          entertainer: {
            select: {
              stageName: true
            }
          },
          reviewedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'DOCUMENT_REVIEWED',
          entityType: 'COMPLIANCE_DOCUMENT',
          entityId: id,
          previousData: { documentStatus: document.documentStatus },
          newData: { documentStatus: status },
          ipAddress: req.ip,
          currentHash: '' // TODO: Implement hash chain
        }
      });

      res.json({
        success: true,
        document: {
          id: updated.id,
          documentType: updated.documentType,
          documentStatus: updated.documentStatus,
          reviewedAt: updated.reviewedAt,
          reviewNotes: updated.reviewNotes,
          rejectionReason: updated.rejectionReason,
          entertainer: updated.entertainer,
          reviewedBy: updated.reviewedBy
        }
      });

    } catch (error) {
      console.error('Document status update error:', error);
      res.status(500).json({ error: 'Failed to update document status' });
    }
  }
);

// ==============================================
// EXPIRING DOCUMENTS
// ==============================================

/**
 * GET /api/compliance/documents/expiring
 * Get documents expiring soon (for alert generation)
 *
 * Query:
 * - days: number (default: 30) - Documents expiring in next N days
 *
 * Access: OWNER, SUPER_MANAGER, MANAGER
 */
router.get('/documents-expiring',
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'),
  async (req, res) => {
    try {
      const days = parseInt(req.query.days) || 30;
      const today = new Date();
      const warningDate = new Date();
      warningDate.setDate(today.getDate() + days);

      const expiringDocs = await prisma.complianceDocument.findMany({
        where: {
          clubId: req.user.clubId,
          documentStatus: 'APPROVED',
          expiresAt: {
            gte: today,
            lte: warningDate
          }
        },
        include: {
          entertainer: {
            select: {
              id: true,
              stageName: true,
              legalName: true,
              phone: true,
              email: true
            }
          }
        },
        orderBy: {
          expiresAt: 'asc'
        }
      });

      // Calculate days until expiry for each
      const documentsWithDaysLeft = expiringDocs.map(doc => {
        const daysUntilExpiry = Math.ceil(
          (new Date(doc.expiresAt) - today) / (1000 * 60 * 60 * 24)
        );

        return {
          id: doc.id,
          documentType: doc.documentType,
          expiresAt: doc.expiresAt,
          daysUntilExpiry,
          severity: daysUntilExpiry <= 7 ? 'HIGH' : 'MEDIUM',
          entertainer: doc.entertainer
        };
      });

      res.json({
        success: true,
        expiringDocuments: documentsWithDaysLeft,
        total: documentsWithDaysLeft.length
      });

    } catch (error) {
      console.error('Expiring documents query error:', error);
      res.status(500).json({ error: 'Failed to retrieve expiring documents' });
    }
  }
);

// ==============================================
// DELETE DOCUMENT
// ==============================================

/**
 * DELETE /api/compliance/documents/:id
 * Delete a compliance document from S3 and database
 *
 * Access: OWNER, SUPER_MANAGER
 */
router.delete('/documents/:id',
  auth,
  authorize('OWNER', 'SUPER_MANAGER'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get document
      const document = await prisma.complianceDocument.findUnique({
        where: { id }
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (document.clubId !== req.user.clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Delete from S3
      if (document.s3Key) {
        try {
          await deleteDocument(document.s3Key);
        } catch (error) {
          console.error('S3 deletion error:', error);
          // Continue with database deletion even if S3 fails
        }
      }

      // Delete from database
      await prisma.complianceDocument.delete({
        where: { id }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'DOCUMENT_DELETED',
          entityType: 'COMPLIANCE_DOCUMENT',
          entityId: id,
          previousData: {
            documentType: document.documentType,
            s3Key: document.s3Key
          },
          ipAddress: req.ip,
          currentHash: '' // TODO: Implement hash chain
        }
      });

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Document deletion error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
);

module.exports = router;
