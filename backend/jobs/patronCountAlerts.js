// Patron Count Capacity Alert Job (Feature #49)
// Monitors patron counts and creates alerts when approaching/exceeding capacity
// Runs every 5 minutes

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Check all clubs with patron counting enabled and create alerts for capacity issues
 */
async function checkCapacityAlerts() {
  try {
    console.log('[Patron Count Alerts] Running capacity check...');

    // Find all clubs with patron counting enabled
    const clubs = await prisma.club.findMany({
      where: {
        doorCountEnabled: true,
        capacityLimit: { not: null }
      },
      select: {
        id: true,
        name: true,
        currentPatronCount: true,
        capacityLimit: true,
        lastCountUpdate: true
      }
    });

    if (clubs.length === 0) {
      console.log('[Patron Count Alerts] No clubs with patron counting enabled');
      return;
    }

    console.log(`[Patron Count Alerts] Checking ${clubs.length} club(s)...`);

    let alertsCreated = 0;
    let alertsResolved = 0;

    for (const club of clubs) {
      const percentFull = (club.currentPatronCount / club.capacityLimit) * 100;

      console.log(`[Patron Count Alerts] ${club.name}: ${club.currentPatronCount}/${club.capacityLimit} (${percentFull.toFixed(1)}%)`);

      // Check for over-capacity (100%+)
      if (percentFull >= 100) {
        const created = await createOrUpdateAlert(
          club.id,
          'CAPACITY_EXCEEDED',
          `OVER CAPACITY: ${club.currentPatronCount}/${club.capacityLimit} patrons (${percentFull.toFixed(0)}%)`,
          'HIGH',
          club.name
        );
        if (created) alertsCreated++;
      }
      // Check for capacity warning (80-99%)
      else if (percentFull >= 80) {
        const created = await createOrUpdateAlert(
          club.id,
          'CAPACITY_WARNING',
          `Approaching capacity: ${club.currentPatronCount}/${club.capacityLimit} patrons (${percentFull.toFixed(0)}%)`,
          'MEDIUM',
          club.name
        );
        if (created) alertsCreated++;
      }
      // Below 80% - resolve any existing capacity alerts
      else {
        const resolved = await resolveCapacityAlerts(club.id, club.name);
        if (resolved > 0) alertsResolved += resolved;
      }
    }

    if (alertsCreated > 0 || alertsResolved > 0) {
      console.log(`[Patron Count Alerts] Created ${alertsCreated} alerts, resolved ${alertsResolved} alerts`);
    } else {
      console.log('[Patron Count Alerts] All clubs within normal capacity');
    }

  } catch (error) {
    console.error('[Patron Count Alerts] Error checking capacity:', error);
  }
}

/**
 * Create or update a capacity alert
 * @returns {boolean} - True if new alert was created, false if existing alert was updated
 */
async function createOrUpdateAlert(clubId, alertType, message, severity, clubName) {
  try {
    // Check if alert already exists and is open
    const existingAlert = await prisma.verificationAlert.findFirst({
      where: {
        clubId,
        alertType,
        status: 'OPEN'
      }
    });

    if (existingAlert) {
      // Update existing alert with latest message
      await prisma.verificationAlert.update({
        where: { id: existingAlert.id },
        data: {
          description: message,
          severity
        }
      });
      console.log(`[Patron Count Alerts] ${clubName}: Updated ${alertType} alert`);
      return false;
    } else {
      // Create new alert
      await prisma.verificationAlert.create({
        data: {
          clubId,
          alertType,
          severity,
          status: 'OPEN',
          entityType: 'CLUB',
          entityId: clubId,
          title: alertType === 'CAPACITY_WARNING' ? 'Approaching Capacity' : 'Over Capacity',
          description: message,
          expectedValue: null,
          actualValue: null,
          discrepancy: null,
          involvedUserId: null,
          involvedEntertainerId: null
        }
      });
      console.log(`[Patron Count Alerts] ${clubName}: Created ${alertType} alert`);
      return true;
    }
  } catch (error) {
    console.error(`[Patron Count Alerts] Error creating/updating alert for ${clubName}:`, error);
    return false;
  }
}

/**
 * Resolve capacity alerts when count drops below threshold
 * @returns {number} - Number of alerts resolved
 */
async function resolveCapacityAlerts(clubId, clubName) {
  try {
    // Find all open capacity alerts for this club
    const openAlerts = await prisma.verificationAlert.findMany({
      where: {
        clubId,
        alertType: {
          in: ['CAPACITY_WARNING', 'CAPACITY_EXCEEDED']
        },
        status: 'OPEN'
      }
    });

    if (openAlerts.length === 0) {
      return 0;
    }

    // Resolve all capacity alerts
    const alertIds = openAlerts.map(a => a.id);
    await prisma.verificationAlert.updateMany({
      where: {
        id: { in: alertIds }
      },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });

    console.log(`[Patron Count Alerts] ${clubName}: Resolved ${openAlerts.length} capacity alert(s)`);
    return openAlerts.length;

  } catch (error) {
    console.error(`[Patron Count Alerts] Error resolving alerts for ${clubName}:`, error);
    return 0;
  }
}

/**
 * Manual run function for testing
 */
async function runManualCheck() {
  console.log('Running manual patron count capacity check...\n');
  await checkCapacityAlerts();
  await prisma.$disconnect();
}

// Export the job function
module.exports = {
  checkCapacityAlerts,
  runManualCheck
};

// Allow running directly for testing
if (require.main === module) {
  runManualCheck();
}
