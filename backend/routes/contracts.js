// Entertainer Contract Management Routes
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();

// Contract templates (in production, these would be in database or separate files)
const CONTRACT_TEMPLATES = {
  INDEPENDENT_CONTRACTOR_1099: {
    version: '1.0',
    title: 'Independent Contractor Agreement (1099)',
    description: 'Adult entertainer as independent contractor - receives 1099',
    template: `
INDEPENDENT CONTRACTOR AGREEMENT

This Independent Contractor Agreement ("Agreement") is entered into as of {effective_date}
between {club_name} ("Club") and {entertainer_name} ("Entertainer").

1. INDEPENDENT CONTRACTOR STATUS
Entertainer is an independent contractor and not an employee of the Club. Entertainer is solely
responsible for all taxes, insurance, and business expenses.

2. SERVICES
Entertainer will provide adult entertainment services at the Club's establishment located at
{club_address}.

3. COMPENSATION
- House Fee: ${house_fee} per shift
- Stage Performance: Entertainer retains 100% of stage tips
- Private Room: Entertainer retains percentage per Club policy
- Payment Schedule: {payment_schedule}

4. INDEPENDENT CONTROL
Entertainer has complete control over:
- When and how often to work (no minimum shift requirements)
- Performance style and music selection
- Customer interactions (subject to Club rules)

5. CLUB RULES
Entertainer agrees to follow Club safety and conduct policies while on premises.

6. TERMINATION
Either party may terminate this agreement at any time with or without cause.

7. COMPLIANCE
Entertainer certifies they are at least 18 years of age (21 in Nevada) and will maintain all
required licenses and certifications.

8. 1099 REPORTING
Club will issue Form 1099-NEC for house fees and other reportable payments.

By signing below, both parties agree to the terms of this Agreement.
    `.trim()
  },

  EMPLOYEE_W2: {
    version: '1.0',
    title: 'Employment Agreement (W-2)',
    description: 'Adult entertainer as employee - receives W-2',
    template: `
EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into as of {effective_date}
between {club_name} ("Employer") and {entertainer_name} ("Employee").

1. EMPLOYMENT STATUS
Employee is hired as a W-2 employee of the Employer. Employer will withhold taxes and provide
applicable benefits.

2. POSITION
Employee's position is: Adult Entertainer

3. COMPENSATION
- Hourly Rate: ${hourly_rate}/hour
- Stage Performance Bonus: Per performance
- Commission: {commission_structure}
- Pay Schedule: {pay_schedule}

4. WORK SCHEDULE
- Standard Schedule: {schedule}
- Overtime: Time and a half over 40 hours/week (if applicable by state)

5. EMPLOYEE BENEFITS
- Workers' Compensation Insurance: Provided
- Unemployment Insurance: Eligible
- Other Benefits: {benefits_list}

6. DUTIES AND RESPONSIBILITIES
Employee will:
- Arrive on time for scheduled shifts
- Follow Employer's direction and club policies
- Maintain professional appearance and conduct
- Complete required training

7. TERMINATION
Employment is at-will. Either party may terminate with or without cause, subject to applicable
labor laws.

8. COMPLIANCE
Employee certifies they are at least 18 years of age (21 in Nevada) and will maintain all
required licenses and certifications.

9. W-2 REPORTING
Employer will issue Form W-2 for all compensation and withhold applicable taxes.

By signing below, both parties agree to the terms of this Agreement.
    `.trim()
  }
};

// ==============================================
// CREATE CONTRACT
// ==============================================

/**
 * POST /api/contracts/create
 * Create a new contract for an entertainer
 *
 * Body:
 * - entertainerId: UUID
 * - contractType: INDEPENDENT_CONTRACTOR_1099 | EMPLOYEE_W2
 * - effectiveDate: ISO 8601 date
 * - expiresAt: ISO 8601 date (optional)
 * - customTerms: object (optional) - Override default terms
 *
 * Access: OWNER, SUPER_MANAGER
 */
router.post('/create',
  auth,
  authorize('OWNER', 'SUPER_MANAGER'),
  async (req, res) => {
    try {
      const { entertainerId, contractType, effectiveDate, expiresAt, customTerms } = req.body;

      // Validate required fields
      if (!entertainerId) {
        return res.status(400).json({ error: 'entertainerId is required' });
      }

      if (!contractType) {
        return res.status(400).json({ error: 'contractType is required' });
      }

      if (!['INDEPENDENT_CONTRACTOR_1099', 'EMPLOYEE_W2'].includes(contractType)) {
        return res.status(400).json({ error: 'Invalid contractType' });
      }

      if (!effectiveDate) {
        return res.status(400).json({ error: 'effectiveDate is required' });
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

      // Get club details for contract terms
      const club = await prisma.club.findUnique({
        where: { id: req.user.clubId }
      });

      // Build contract terms
      const template = CONTRACT_TEMPLATES[contractType];
      const agreedTerms = {
        ...template,
        clubName: club.name,
        entertainerName: entertainer.legalName || entertainer.stageName,
        effectiveDate,
        expiresAt,
        barFeeAmount: club.barFeeAmount.toString(),
        customTerms: customTerms || {}
      };

      // Generate SHA-256 hash of terms for tamper detection
      const termsString = JSON.stringify(agreedTerms);
      const termsHash = crypto.createHash('sha256').update(termsString).digest('hex');

      // Create contract (unsigned)
      const contract = await prisma.entertainerContract.create({
        data: {
          clubId: req.user.clubId,
          entertainerId,
          createdBy: req.user.id,
          contractType,
          effectiveDate: new Date(effectiveDate),
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          agreedTerms,
          termsHash,
          isActive: false // Not active until signed
        },
        include: {
          entertainer: {
            select: {
              stageName: true,
              legalName: true,
              email: true
            }
          },
          creator: {
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
          action: 'CONTRACT_CREATED',
          entityType: 'ENTERTAINER_CONTRACT',
          entityId: contract.id,
          newData: {
            contractType,
            entertainerId,
            termsHash
          },
          ipAddress: req.ip,
          currentHash: '' // TODO: Implement hash chain
        }
      });

      res.status(201).json({
        success: true,
        contract: {
          id: contract.id,
          contractType: contract.contractType,
          effectiveDate: contract.effectiveDate,
          expiresAt: contract.expiresAt,
          termsHash: contract.termsHash,
          isSigned: false,
          isActive: false,
          entertainer: contract.entertainer,
          createdBy: contract.creator
        }
      });

    } catch (error) {
      console.error('Contract creation error:', error);
      res.status(500).json({ error: 'Failed to create contract' });
    }
  }
);

// ==============================================
// SIGN CONTRACT
// ==============================================

/**
 * POST /api/contracts/:id/sign
 * Sign a contract with digital signature
 *
 * Body:
 * - signatureData: string (base64 PNG from canvas)
 *
 * Access: OWNER, SUPER_MANAGER, MANAGER (signing on behalf of entertainer with permission)
 */
router.post('/:id/sign',
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { signatureData } = req.body;

      // Validate signature
      if (!signatureData) {
        return res.status(400).json({ error: 'signatureData is required' });
      }

      // Validate base64 PNG format
      if (!signatureData.startsWith('data:image/png;base64,')) {
        return res.status(400).json({ error: 'signatureData must be base64 PNG' });
      }

      // Get contract
      const contract = await prisma.entertainerContract.findUnique({
        where: { id },
        include: {
          entertainer: {
            select: {
              id: true,
              stageName: true,
              legalName: true
            }
          }
        }
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      if (contract.clubId !== req.user.clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if already signed
      if (contract.signedAt) {
        return res.status(400).json({ error: 'Contract already signed' });
      }

      // Update contract with signature
      const signed = await prisma.entertainerContract.update({
        where: { id },
        data: {
          signatureData,
          signedAt: new Date(),
          signedIpAddress: req.ip,
          isActive: true
        }
      });

      // Update entertainer status
      await prisma.entertainer.update({
        where: { id: contract.entertainerId },
        data: {
          hasSignedContract: true,
          contractType: contract.contractType,
          onboardingStatus: 'COMPLETED', // Mark onboarding complete
          onboardingCompletedAt: new Date()
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'CONTRACT_SIGNED',
          entityType: 'ENTERTAINER_CONTRACT',
          entityId: id,
          newData: {
            signedAt: signed.signedAt,
            signedIpAddress: signed.signedIpAddress
          },
          ipAddress: req.ip,
          currentHash: '' // TODO: Implement hash chain
        }
      });

      res.json({
        success: true,
        contract: {
          id: signed.id,
          contractType: signed.contractType,
          signedAt: signed.signedAt,
          effectiveDate: signed.effectiveDate,
          expiresAt: signed.expiresAt,
          isActive: signed.isActive,
          entertainer: contract.entertainer
        },
        message: 'Contract signed successfully'
      });

    } catch (error) {
      console.error('Contract signing error:', error);
      res.status(500).json({ error: 'Failed to sign contract' });
    }
  }
);

// ==============================================
// GET ENTERTAINER CONTRACTS
// ==============================================

/**
 * GET /api/contracts/:entertainerId
 * Get all contracts for an entertainer
 *
 * Access: OWNER, SUPER_MANAGER, MANAGER
 */
router.get('/:entertainerId',
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

      // Get all contracts
      const contracts = await prisma.entertainerContract.findMany({
        where: {
          clubId: req.user.clubId,
          entertainerId
        },
        include: {
          creator: {
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

      // Return contracts without signature data (privacy)
      const contractsWithoutSignature = contracts.map(contract => ({
        id: contract.id,
        contractType: contract.contractType,
        contractVersion: contract.contractVersion,
        effectiveDate: contract.effectiveDate,
        expiresAt: contract.expiresAt,
        isSigned: !!contract.signedAt,
        signedAt: contract.signedAt,
        isActive: contract.isActive,
        termsHash: contract.termsHash,
        createdAt: contract.createdAt,
        createdBy: contract.creator
      }));

      res.json({
        success: true,
        contracts: contractsWithoutSignature
      });

    } catch (error) {
      console.error('Contract retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve contracts' });
    }
  }
);

// ==============================================
// GET CONTRACT AUDIT TRAIL
// ==============================================

/**
 * GET /api/contracts/:id/audit-trail
 * Get signature audit log for a contract (legal compliance)
 *
 * Access: OWNER
 */
router.get('/:id/audit-trail',
  auth,
  authorize('OWNER'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get contract
      const contract = await prisma.entertainerContract.findUnique({
        where: { id },
        include: {
          entertainer: {
            select: {
              stageName: true,
              legalName: true
            }
          },
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      if (contract.clubId !== req.user.clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get related audit logs
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          clubId: req.user.clubId,
          entityType: 'ENTERTAINER_CONTRACT',
          entityId: id
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Build audit trail
      const auditTrail = {
        contract: {
          id: contract.id,
          contractType: contract.contractType,
          contractVersion: contract.contractVersion,
          termsHash: contract.termsHash,
          entertainer: contract.entertainer,
          createdBy: contract.creator,
          createdAt: contract.createdAt
        },
        signature: {
          isSigned: !!contract.signedAt,
          signedAt: contract.signedAt,
          signedIpAddress: contract.signedIpAddress,
          hasSignatureData: !!contract.signatureData
        },
        auditLogs: auditLogs.map(log => ({
          action: log.action,
          timestamp: log.createdAt,
          user: log.user,
          ipAddress: log.ipAddress,
          changes: log.changesSummary
        }))
      };

      res.json({
        success: true,
        auditTrail
      });

    } catch (error) {
      console.error('Audit trail retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit trail' });
    }
  }
);

module.exports = router;
