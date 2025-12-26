// Automated Compliance Alerts Job
// Runs daily to check for expiring licenses and create alerts

const { PrismaClient } = require('@prisma/client');
const { getWarningDays } = require('../config/stateCompliance');

const prisma = new PrismaClient();

/**
 * Process compliance alerts for all clubs
 * Checks for expiring documents and creates VerificationAlert records
 */
async function processComplianceAlerts() {
  console.log('[ComplianceAlerts] Starting automated compliance check...');

  const today = new Date();
  const alertsCreated = [];
  let errorCount = 0;

  try {
    // Get all active clubs
    const clubs = await prisma.club.findMany({
      where: {
        subscriptionStatus: {
          in: ['active', 'trialing']
        }
      }
    });

    console.log(`[ComplianceAlerts] Checking ${clubs.length} clubs...`);

    for (const club of clubs) {
      try {
        // Get state requirements
        const stateCode = club.settings?.state || 'DEFAULT';
        const warningDays = getWarningDays(stateCode);

        // Calculate warning date
        const warningDate = new Date(today);
        warningDate.setDate(today.getDate() + warningDays);

        // Find expiring documents for this club
        const expiringDocs = await prisma.complianceDocument.findMany({
          where: {
            clubId: club.id,
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
          }
        });

        console.log(
          `[ComplianceAlerts] Club ${club.name} (${stateCode}): ${expiringDocs.length} expiring documents`
        );

        // Create alerts for each expiring document
        for (const doc of expiringDocs) {
          // Calculate days until expiry
          const daysUntilExpiry = Math.ceil(
            (new Date(doc.expiresAt) - today) / (1000 * 60 * 60 * 24)
          );

          // Determine severity
          let severity = 'MEDIUM';
          if (daysUntilExpiry <= 7) {
            severity = 'HIGH';
          } else if (daysUntilExpiry <= 3) {
            severity = 'CRITICAL';
          }

          // Check if alert already exists for this document
          const existingAlert = await prisma.verificationAlert.findFirst({
            where: {
              clubId: club.id,
              entityType: 'COMPLIANCE_DOCUMENT',
              entityId: doc.id,
              status: {
                in: ['OPEN', 'ACKNOWLEDGED']
              }
            }
          });

          if (existingAlert) {
            // Update existing alert if severity changed
            if (existingAlert.severity !== severity) {
              await prisma.verificationAlert.update({
                where: { id: existingAlert.id },
                data: {
                  severity,
                  description: `${doc.documentType} expires in ${daysUntilExpiry} days for ${doc.entertainer.stageName}. Severity updated.`
                }
              });

              console.log(
                `[ComplianceAlerts] Updated alert ${existingAlert.id}: ${doc.documentType} (${severity})`
              );
            }

            continue; // Skip creating new alert
          }

          // Create new verification alert
          const alert = await prisma.verificationAlert.create({
            data: {
              clubId: club.id,
              alertType: 'LICENSE_EXPIRING',
              severity,
              status: 'OPEN',
              entityType: 'COMPLIANCE_DOCUMENT',
              entityId: doc.id,
              title: `${doc.documentType} Expiring Soon`,
              description: `${doc.documentType} for ${doc.entertainer.stageName} expires in ${daysUntilExpiry} days (${doc.expiresAt.toISOString().split('T')[0]}).`,
              expectedValue: `Valid until ${doc.expiresAt.toISOString().split('T')[0]}`,
              actualValue: `Expires in ${daysUntilExpiry} days`,
              discrepancy: `Document will be invalid in ${daysUntilExpiry} days`,
              involvedEntertainerId: doc.entertainerId,
              visibleToOwnerOnly: false
            }
          });

          alertsCreated.push({
            clubId: club.id,
            clubName: club.name,
            alertId: alert.id,
            severity,
            entertainerName: doc.entertainer.stageName,
            documentType: doc.documentType,
            daysUntilExpiry
          });

          console.log(
            `[ComplianceAlerts] Created ${severity} alert for ${doc.entertainer.stageName}: ${doc.documentType} (${daysUntilExpiry} days)`
          );

          // TODO: Send notification (email/SMS) to manager and entertainer
          // await sendExpiryNotification({
          //   club,
          //   entertainer: doc.entertainer,
          //   documentType: doc.documentType,
          //   daysUntilExpiry
          // });
        }

        // Also check for already expired documents
        const expiredDocs = await prisma.complianceDocument.findMany({
          where: {
            clubId: club.id,
            documentStatus: 'APPROVED',
            expiresAt: {
              lt: today
            }
          },
          include: {
            entertainer: {
              select: {
                id: true,
                stageName: true
              }
            }
          }
        });

        // Mark expired documents
        for (const doc of expiredDocs) {
          await prisma.complianceDocument.update({
            where: { id: doc.id },
            data: {
              documentStatus: 'EXPIRED'
            }
          });

          // Create CRITICAL alert if not already exists
          const existingExpiredAlert = await prisma.verificationAlert.findFirst({
            where: {
              clubId: club.id,
              entityType: 'COMPLIANCE_DOCUMENT',
              entityId: doc.id,
              alertType: 'LICENSE_EXPIRED',
              status: {
                in: ['OPEN', 'ACKNOWLEDGED']
              }
            }
          });

          if (!existingExpiredAlert) {
            const alert = await prisma.verificationAlert.create({
              data: {
                clubId: club.id,
                alertType: 'LICENSE_EXPIRED',
                severity: 'CRITICAL',
                status: 'OPEN',
                entityType: 'COMPLIANCE_DOCUMENT',
                entityId: doc.id,
                title: `${doc.documentType} EXPIRED`,
                description: `${doc.documentType} for ${doc.entertainer.stageName} is now EXPIRED. Entertainer cannot work until renewed.`,
                expectedValue: `Valid license`,
                actualValue: `Expired on ${doc.expiresAt.toISOString().split('T')[0]}`,
                discrepancy: `Document is no longer valid`,
                involvedEntertainerId: doc.entertainerId,
                visibleToOwnerOnly: false
              }
            });

            alertsCreated.push({
              clubId: club.id,
              clubName: club.name,
              alertId: alert.id,
              severity: 'CRITICAL',
              entertainerName: doc.entertainer.stageName,
              documentType: doc.documentType,
              status: 'EXPIRED'
            });

            console.log(
              `[ComplianceAlerts] Created CRITICAL alert for EXPIRED ${doc.documentType}: ${doc.entertainer.stageName}`
            );
          }
        }

      } catch (clubError) {
        console.error(`[ComplianceAlerts] Error processing club ${club.id}:`, clubError);
        errorCount++;
      }
    }

    // Log summary
    console.log('\n[ComplianceAlerts] Job completed');
    console.log(`  - Clubs checked: ${clubs.length}`);
    console.log(`  - Alerts created: ${alertsCreated.length}`);
    console.log(`  - Errors: ${errorCount}`);

    if (alertsCreated.length > 0) {
      console.log('\n[ComplianceAlerts] Alerts created:');
      alertsCreated.forEach(alert => {
        console.log(
          `  - ${alert.clubName}: ${alert.severity} - ${alert.entertainerName} (${alert.documentType})`
        );
      });
    }

    return {
      success: true,
      clubsChecked: clubs.length,
      alertsCreated: alertsCreated.length,
      errors: errorCount,
      alerts: alertsCreated
    };

  } catch (error) {
    console.error('[ComplianceAlerts] Job failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Manual trigger for testing
 * Can be called from API endpoint
 */
async function runComplianceAlertsManually() {
  console.log('[ComplianceAlerts] Manual trigger initiated');
  return await processComplianceAlerts();
}

module.exports = {
  processComplianceAlerts,
  runComplianceAlertsManually
};
