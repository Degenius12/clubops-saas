// Entertainer Onboarding Routes (State-Specific Workflows)
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const {
  getStateRequirements,
  getRequiredDocuments,
  validateAge
} = require('../config/stateCompliance');

const prisma = new PrismaClient();

// ==============================================
// GET STATE REQUIREMENTS
// ==============================================

/**
 * GET /api/onboarding/requirements
 * Get state-specific onboarding requirements for the club's jurisdiction
 *
 * Access: All authenticated users
 */
router.get('/requirements',
  auth,
  async (req, res) => {
    try {
      // Get club details
      const club = await prisma.club.findUnique({
        where: { id: req.user.clubId }
      });

      if (!club) {
        return res.status(404).json({ error: 'Club not found' });
      }

      // Extract state from club settings (fallback to DEFAULT)
      const stateCode = club.settings?.state || 'DEFAULT';

      // Get state-specific requirements
      const requirements = getStateRequirements(stateCode);

      res.json({
        success: true,
        state: stateCode,
        requirements: {
          name: requirements.name,
          requiresEntertainerLicense: requirements.requiresEntertainerLicense,
          licensingAuthority: requirements.licensingAuthority,
          minimumAge: requirements.minimumAge,
          requiredDocuments: requirements.requiredDocuments,
          licenseExpiryWarningDays: requirements.licenseExpiryWarningDays,
          contractTypePreference: requirements.contractTypePreference,
          notes: requirements.notes,
          regulatoryReferences: requirements.regulatoryReferences
        }
      });

    } catch (error) {
      console.error('Requirements retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve requirements' });
    }
  }
);

// ==============================================
// START ONBOARDING
// ==============================================

/**
 * POST /api/onboarding/start
 * Initialize onboarding for an entertainer and create placeholder documents
 *
 * Body:
 * - entertainerId: UUID
 *
 * Access: OWNER, SUPER_MANAGER, MANAGER
 */
router.post('/start',
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'),
  async (req, res) => {
    try {
      const { entertainerId } = req.body;

      if (!entertainerId) {
        return res.status(400).json({ error: 'entertainerId is required' });
      }

      // Get entertainer
      const entertainer = await prisma.entertainer.findUnique({
        where: { id: entertainerId }
      });

      if (!entertainer) {
        return res.status(404).json({ error: 'Entertainer not found' });
      }

      if (entertainer.clubId !== req.user.clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if already onboarded
      if (entertainer.onboardingStatus === 'COMPLETED') {
        return res.status(400).json({ error: 'Entertainer already onboarded' });
      }

      // Get club state
      const club = await prisma.club.findUnique({
        where: { id: req.user.clubId }
      });

      const stateCode = club.settings?.state || 'DEFAULT';
      const requiredDocs = getRequiredDocuments(stateCode);

      // Create placeholder ComplianceDocument records for each required document
      const placeholderDocs = await Promise.all(
        requiredDocs.map(docType =>
          prisma.complianceDocument.create({
            data: {
              clubId: req.user.clubId,
              entertainerId,
              documentType: docType,
              documentStatus: 'PENDING_UPLOAD',
              notes: 'Created during onboarding initialization'
            }
          })
        )
      );

      // Update entertainer onboarding status
      const updated = await prisma.entertainer.update({
        where: { id: entertainerId },
        data: {
          onboardingStatus: 'IN_PROGRESS'
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'ONBOARDING_STARTED',
          entityType: 'ENTERTAINER',
          entityId: entertainerId,
          newData: {
            onboardingStatus: 'IN_PROGRESS',
            requiredDocuments: requiredDocs,
            placeholderDocsCreated: placeholderDocs.length
          },
          ipAddress: req.ip,
          currentHash: '' // TODO: Implement hash chain
        }
      });

      res.status(201).json({
        success: true,
        entertainer: {
          id: updated.id,
          stageName: updated.stageName,
          onboardingStatus: updated.onboardingStatus
        },
        onboarding: {
          state: stateCode,
          requiredDocuments: requiredDocs,
          placeholderDocuments: placeholderDocs.map(doc => ({
            id: doc.id,
            documentType: doc.documentType,
            documentStatus: doc.documentStatus
          }))
        }
      });

    } catch (error) {
      console.error('Onboarding start error:', error);
      res.status(500).json({ error: 'Failed to start onboarding' });
    }
  }
);

// ==============================================
// CHECK ONBOARDING PROGRESS
// ==============================================

/**
 * GET /api/onboarding/:entertainerId/progress
 * Check onboarding completion status
 *
 * Access: OWNER, SUPER_MANAGER, MANAGER
 */
router.get('/:entertainerId/progress',
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

      // Get club state requirements
      const club = await prisma.club.findUnique({
        where: { id: req.user.clubId }
      });

      const stateCode = club.settings?.state || 'DEFAULT';
      const requirements = getStateRequirements(stateCode);
      const requiredDocs = requirements.requiredDocuments;

      // Get compliance documents
      const documents = await prisma.complianceDocument.findMany({
        where: {
          clubId: req.user.clubId,
          entertainerId
        }
      });

      // Check document statuses
      const documentProgress = requiredDocs.map(docType => {
        const doc = documents.find(d => d.documentType === docType);

        return {
          documentType: docType,
          status: doc ? doc.documentStatus : 'PENDING_UPLOAD',
          isComplete: doc?.documentStatus === 'APPROVED'
        };
      });

      const allDocsApproved = documentProgress.every(d => d.isComplete);

      // Get contracts
      const contracts = await prisma.entertainerContract.findMany({
        where: {
          clubId: req.user.clubId,
          entertainerId,
          isActive: true
        }
      });

      const hasSignedContract = contracts.length > 0 && entertainer.hasSignedContract;

      // Age verification check
      let ageValid = false;
      if (entertainer.dateOfBirth) {
        const ageCheck = validateAge(entertainer.dateOfBirth, stateCode);
        ageValid = ageCheck.isValid;
      }

      // Calculate overall completion
      const progress = {
        onboardingStatus: entertainer.onboardingStatus,
        documents: {
          total: requiredDocs.length,
          approved: documentProgress.filter(d => d.isComplete).length,
          progress: documentProgress
        },
        contract: {
          hasSigned: hasSignedContract,
          contractType: entertainer.contractType
        },
        ageVerification: {
          isVerified: ageValid,
          minimumAge: requirements.minimumAge,
          dateOfBirth: entertainer.dateOfBirth
        },
        isComplete: allDocsApproved && hasSignedContract && ageValid,
        completedAt: entertainer.onboardingCompletedAt
      };

      res.json({
        success: true,
        entertainerId,
        stageName: entertainer.stageName,
        state: stateCode,
        progress
      });

    } catch (error) {
      console.error('Progress check error:', error);
      res.status(500).json({ error: 'Failed to check progress' });
    }
  }
);

// ==============================================
// COMPLETE ONBOARDING
// ==============================================

/**
 * POST /api/onboarding/:entertainerId/complete
 * Finalize onboarding after all requirements are met
 *
 * Access: OWNER, SUPER_MANAGER, MANAGER
 */
router.post('/:entertainerId/complete',
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

      // Check progress to ensure all requirements met
      const progressResponse = await fetch(
        `${req.protocol}://${req.get('host')}/api/onboarding/${entertainerId}/progress`,
        {
          headers: {
            'Authorization': req.headers.authorization
          }
        }
      );

      const progressData = await progressResponse.json();

      if (!progressData.progress.isComplete) {
        return res.status(400).json({
          error: 'Onboarding incomplete',
          message: 'All requirements must be met before completing onboarding',
          progress: progressData.progress
        });
      }

      // Update entertainer to completed status
      const updated = await prisma.entertainer.update({
        where: { id: entertainerId },
        data: {
          onboardingStatus: 'COMPLETED',
          onboardingCompletedAt: new Date(),
          isActive: true // Activate entertainer
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'ONBOARDING_COMPLETED',
          entityType: 'ENTERTAINER',
          entityId: entertainerId,
          newData: {
            onboardingStatus: 'COMPLETED',
            onboardingCompletedAt: updated.onboardingCompletedAt,
            isActive: true
          },
          ipAddress: req.ip,
          currentHash: '' // TODO: Implement hash chain
        }
      });

      res.json({
        success: true,
        entertainer: {
          id: updated.id,
          stageName: updated.stageName,
          onboardingStatus: updated.onboardingStatus,
          onboardingCompletedAt: updated.onboardingCompletedAt,
          isActive: updated.isActive
        },
        message: 'Onboarding completed successfully'
      });

    } catch (error) {
      console.error('Onboarding completion error:', error);
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  }
);

// ==============================================
// VALIDATE AGE
// ==============================================

/**
 * POST /api/onboarding/validate-age
 * Validate entertainer age for state requirements
 *
 * Body:
 * - dateOfBirth: ISO 8601 date
 *
 * Access: All authenticated users
 */
router.post('/validate-age',
  auth,
  async (req, res) => {
    try {
      const { dateOfBirth } = req.body;

      if (!dateOfBirth) {
        return res.status(400).json({ error: 'dateOfBirth is required' });
      }

      // Get club state
      const club = await prisma.club.findUnique({
        where: { id: req.user.clubId }
      });

      const stateCode = club.settings?.state || 'DEFAULT';

      // Validate age
      const validation = validateAge(dateOfBirth, stateCode);

      res.json({
        success: true,
        state: stateCode,
        validation: {
          isValid: validation.isValid,
          minimumAge: validation.minimumAge,
          actualAge: validation.actualAge,
          message: validation.isValid
            ? `Age requirement met (${validation.actualAge} >= ${validation.minimumAge})`
            : `Age requirement not met (${validation.actualAge} < ${validation.minimumAge})`
        }
      });

    } catch (error) {
      console.error('Age validation error:', error);
      res.status(500).json({ error: 'Failed to validate age' });
    }
  }
);

module.exports = router;
