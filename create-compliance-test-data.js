// Create Test Data for Contract & Compliance System
// Populates database with sample entertainers, documents, and contracts

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating Contract & Compliance Test Data...\n');

  try {
    // Get the demo club
    const club = await prisma.club.findFirst({
      where: { subdomain: 'demo' }
    });

    if (!club) {
      console.error('❌ Demo club not found. Please run database seed first.');
      process.exit(1);
    }

    console.log(`✅ Found club: ${club.name} (ID: ${club.id})\n`);

    // Get manager user for audit trail
    const manager = await prisma.clubUser.findFirst({
      where: {
        clubId: club.id,
        role: 'MANAGER'
      }
    });

    if (!manager) {
      console.error('❌ Manager user not found.');
      process.exit(1);
    }

    console.log(`✅ Found manager: ${manager.name} (ID: ${manager.id})\n`);

    // Create 5 test entertainers
    console.log('👤 Creating test entertainers...');

    const entertainers = [];
    const entertainerData = [
      {
        stageName: 'Crystal Rose',
        legalName: 'Sarah Johnson',
        dateOfBirth: new Date('1995-03-15'),
        contractType: 'INDEPENDENT_CONTRACTOR_1099',
        hasSignedContract: true,
        onboardingStatus: 'COMPLETED',
        ageVerifiedAt: new Date(),
        ageVerifiedBy: manager.id
      },
      {
        stageName: 'Diamond Star',
        legalName: 'Emily Chen',
        dateOfBirth: new Date('1993-07-22'),
        contractType: 'INDEPENDENT_CONTRACTOR_1099',
        hasSignedContract: true,
        onboardingStatus: 'COMPLETED',
        ageVerifiedAt: new Date(),
        ageVerifiedBy: manager.id
      },
      {
        stageName: 'Emerald Sky',
        legalName: 'Jessica Martinez',
        dateOfBirth: new Date('1996-11-08'),
        contractType: 'INDEPENDENT_CONTRACTOR_1099',
        hasSignedContract: false,
        onboardingStatus: 'DOCUMENTS_PENDING'
      },
      {
        stageName: 'Ruby Moon',
        legalName: 'Ashley Williams',
        dateOfBirth: new Date('1994-05-30'),
        contractType: 'EMPLOYEE_W2',
        hasSignedContract: true,
        onboardingStatus: 'COMPLETED',
        ageVerifiedAt: new Date(),
        ageVerifiedBy: manager.id
      },
      {
        stageName: 'Sapphire Dreams',
        legalName: 'Amanda Brown',
        dateOfBirth: new Date('1997-09-12'),
        contractType: 'INDEPENDENT_CONTRACTOR_1099',
        hasSignedContract: false,
        onboardingStatus: 'IN_PROGRESS'
      }
    ];

    for (const data of entertainerData) {
      const entertainer = await prisma.entertainer.create({
        data: {
          clubId: club.id,
          ...data,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      entertainers.push(entertainer);
      console.log(`  ✅ Created: ${entertainer.stageName} (${entertainer.legalName})`);
    }

    console.log(`\n✅ Created ${entertainers.length} entertainers\n`);

    // Create compliance documents with varying expiry dates
    console.log('📄 Creating compliance documents...');

    const documentData = [
      // HIGH SEVERITY - Expiring in 5 days
      {
        entertainerId: entertainers[0].id,
        documentType: 'ENTERTAINER_LICENSE',
        documentStatus: 'APPROVED',
        fileUrl: 'https://example.com/docs/license-crystal-rose.pdf',
        s3Bucket: 'clubflow-compliance-docs',
        s3Key: `club-${club.id}/entertainer-${entertainers[0].id}/license-001.pdf`,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        uploadedAt: new Date(),
        uploadedById: manager.id,
        reviewedAt: new Date(),
        reviewedById: manager.id
      },
      {
        entertainerId: entertainers[1].id,
        documentType: 'ENTERTAINER_LICENSE',
        documentStatus: 'APPROVED',
        fileUrl: 'https://example.com/docs/license-diamond-star.pdf',
        s3Bucket: 'clubflow-compliance-docs',
        s3Key: `club-${club.id}/entertainer-${entertainers[1].id}/license-001.pdf`,
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days
        uploadedAt: new Date(),
        uploadedById: manager.id,
        reviewedAt: new Date(),
        reviewedById: manager.id
      },

      // MEDIUM SEVERITY - Expiring in 15-20 days
      {
        entertainerId: entertainers[0].id,
        documentType: 'GOVERNMENT_ID',
        documentStatus: 'APPROVED',
        fileUrl: 'https://example.com/docs/id-crystal-rose.pdf',
        s3Bucket: 'clubflow-compliance-docs',
        s3Key: `club-${club.id}/entertainer-${entertainers[0].id}/id-001.pdf`,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        uploadedAt: new Date(),
        uploadedById: manager.id,
        reviewedAt: new Date(),
        reviewedById: manager.id
      },
      {
        entertainerId: entertainers[3].id,
        documentType: 'ENTERTAINER_LICENSE',
        documentStatus: 'APPROVED',
        fileUrl: 'https://example.com/docs/license-ruby-moon.pdf',
        s3Bucket: 'clubflow-compliance-docs',
        s3Key: `club-${club.id}/entertainer-${entertainers[3].id}/license-001.pdf`,
        expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days
        uploadedAt: new Date(),
        uploadedById: manager.id,
        reviewedAt: new Date(),
        reviewedById: manager.id
      },

      // LOW SEVERITY - Expiring in 35-45 days
      {
        entertainerId: entertainers[1].id,
        documentType: 'GOVERNMENT_ID',
        documentStatus: 'APPROVED',
        fileUrl: 'https://example.com/docs/id-diamond-star.pdf',
        s3Bucket: 'clubflow-compliance-docs',
        s3Key: `club-${club.id}/entertainer-${entertainers[1].id}/id-001.pdf`,
        expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days
        uploadedAt: new Date(),
        uploadedById: manager.id,
        reviewedAt: new Date(),
        reviewedById: manager.id
      },
      {
        entertainerId: entertainers[3].id,
        documentType: 'GOVERNMENT_ID',
        documentStatus: 'APPROVED',
        fileUrl: 'https://example.com/docs/id-ruby-moon.pdf',
        s3Bucket: 'clubflow-compliance-docs',
        s3Key: `club-${club.id}/entertainer-${entertainers[3].id}/id-001.pdf`,
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        uploadedAt: new Date(),
        uploadedById: manager.id,
        reviewedAt: new Date(),
        reviewedById: manager.id
      },

      // PENDING DOCUMENTS (no expiry yet)
      {
        entertainerId: entertainers[2].id,
        documentType: 'ENTERTAINER_LICENSE',
        documentStatus: 'PENDING_UPLOAD',
        fileUrl: null,
        s3Bucket: null,
        s3Key: null,
        expiresAt: null,
        uploadedAt: null,
        uploadedById: null
      },
      {
        entertainerId: entertainers[4].id,
        documentType: 'GOVERNMENT_ID',
        documentStatus: 'UNDER_REVIEW',
        fileUrl: 'https://example.com/docs/id-sapphire-dreams.pdf',
        s3Bucket: 'clubflow-compliance-docs',
        s3Key: `club-${club.id}/entertainer-${entertainers[4].id}/id-001.pdf`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        uploadedAt: new Date(),
        uploadedById: manager.id
      }
    ];

    let documentsCreated = 0;
    for (const data of documentData) {
      await prisma.complianceDocument.create({
        data: {
          clubId: club.id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      documentsCreated++;
    }

    console.log(`✅ Created ${documentsCreated} compliance documents`);
    console.log('  - 2 HIGH severity (expiring in 5-6 days)');
    console.log('  - 2 MEDIUM severity (expiring in 15-20 days)');
    console.log('  - 2 LOW severity (expiring in 35-45 days)');
    console.log('  - 2 PENDING/UNDER_REVIEW documents\n');

    // Create signed contracts
    console.log('📝 Creating signed contracts...');

    const contractData = [
      // 1099 Independent Contractor
      {
        entertainerId: entertainers[0].id,
        contractType: 'INDEPENDENT_CONTRACTOR_1099',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signedAt: new Date(),
        signedIpAddress: '192.168.1.100',
        termsHash: 'a1b2c3d4e5f6g7h8i9j0',
        agreedTerms: {
          contractType: 'INDEPENDENT_CONTRACTOR_1099',
          houseFee: '$150 per shift',
          stageTips: '100% retained by entertainer',
          vipRevenue: '100% retained by entertainer',
          terms: ['Independent contractor status', 'Responsible for own taxes', 'No employee benefits']
        },
        effectiveDate: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isActive: true,
        createdById: manager.id
      },
      {
        entertainerId: entertainers[1].id,
        contractType: 'INDEPENDENT_CONTRACTOR_1099',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signedAt: new Date(),
        signedIpAddress: '192.168.1.101',
        termsHash: 'a1b2c3d4e5f6g7h8i9j0',
        agreedTerms: {
          contractType: 'INDEPENDENT_CONTRACTOR_1099',
          houseFee: '$150 per shift',
          stageTips: '100% retained by entertainer',
          vipRevenue: '100% retained by entertainer',
          terms: ['Independent contractor status', 'Responsible for own taxes', 'No employee benefits']
        },
        effectiveDate: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdById: manager.id
      },

      // W-2 Employee
      {
        entertainerId: entertainers[3].id,
        contractType: 'EMPLOYEE_W2',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signedAt: new Date(),
        signedIpAddress: '192.168.1.103',
        termsHash: 'z9y8x7w6v5u4t3s2r1q0',
        agreedTerms: {
          contractType: 'EMPLOYEE_W2',
          hourlyRate: '$25/hour',
          performanceBonus: 'Per performance',
          benefits: ['Health insurance', 'Paid time off', '401(k) matching'],
          terms: ['W-2 employee status', 'Taxes withheld', 'Employee benefits included']
        },
        effectiveDate: new Date(),
        expiresAt: null, // W-2 typically doesn't expire
        isActive: true,
        createdById: manager.id
      }
    ];

    let contractsCreated = 0;
    for (const data of contractData) {
      const { entertainerId, createdById, ...contractFields } = data;
      await prisma.entertainerContract.create({
        data: {
          ...contractFields,
          club: {
            connect: { id: club.id }
          },
          entertainer: {
            connect: { id: entertainerId }
          },
          creator: {
            connect: { id: createdById }
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      contractsCreated++;
    }

    console.log(`✅ Created ${contractsCreated} signed contracts`);
    console.log('  - 2 Independent Contractor (1099)');
    console.log('  - 1 Employee (W-2)\n');

    // Create verification alerts for expiring documents
    console.log('🔔 Skipping verification alerts (not critical for testing)...');

    const alertsCreated = 0;
    /*
    const now = new Date();
    const alertData = [
      {
        entertainerId: entertainers[0].id,
        entityType: 'ENTERTAINER',
        alertType: 'LICENSE_EXPIRING',
        severity: 'HIGH',
        title: 'License Expiring Soon',
        message: 'Entertainer license expires in 5 days',
        isResolved: false,
        createdAt: now
      },
      {
        entertainerId: entertainers[1].id,
        entityType: 'ENTERTAINER',
        alertType: 'LICENSE_EXPIRING',
        severity: 'HIGH',
        title: 'License Expiring Soon',
        message: 'Entertainer license expires in 6 days',
        isResolved: false,
        createdAt: now
      },
      {
        entertainerId: entertainers[0].id,
        entityType: 'ENTERTAINER',
        alertType: 'ID_EXPIRING',
        severity: 'MEDIUM',
        title: 'ID Expiring',
        message: 'Government ID expires in 15 days',
        isResolved: false,
        createdAt: now
      },
      {
        entertainerId: entertainers[3].id,
        entityType: 'ENTERTAINER',
        alertType: 'LICENSE_EXPIRING',
        severity: 'MEDIUM',
        title: 'License Expiring',
        message: 'Entertainer license expires in 20 days',
        isResolved: false,
        createdAt: now
      }
    ];

    // Commented out - alert schema needs updating
    // let alertsCreated = 0;
    // for (const data of alertData) {
    //   await prisma.verificationAlert.create({
    //     data: {
    //       clubId: club.id,
    //       ...data,
    //       updatedAt: now
    //     }
    //   });
    //   alertsCreated++;
    // }
    */

    console.log(`✅ Skipped ${4} verification alerts (schema needs update)\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TEST DATA CREATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('Created:');
    console.log(`  • ${entertainers.length} entertainers`);
    console.log(`  • ${documentsCreated} compliance documents`);
    console.log(`  • ${contractsCreated} signed contracts`);
    console.log(`  • ${alertsCreated} verification alerts`);
    console.log('');
    console.log('Severity Distribution:');
    console.log('  • HIGH:   2 documents expiring in 5-6 days');
    console.log('  • MEDIUM: 2 documents expiring in 15-20 days');
    console.log('  • LOW:    2 documents expiring in 35-45 days');
    console.log('');
    console.log('Contract Types:');
    console.log('  • 1099 Independent Contractor: 2');
    console.log('  • W-2 Employee: 1');
    console.log('');
    console.log('Onboarding Status:');
    console.log('  • COMPLETED: 3 entertainers');
    console.log('  • DOCUMENTS_PENDING: 1 entertainer');
    console.log('  • IN_PROGRESS: 1 entertainer');
    console.log('');
    console.log('🎯 Ready for testing!');
    console.log('   Run: node test-compliance-system.js');
    console.log('   Run: node test-compliance-frontend.js');
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
