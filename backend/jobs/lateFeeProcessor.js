// Late Fee Processor Job (Feature #26)
// Runs daily to check for overdue payments and automatically add late fees

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Process late fees for all clubs
 * Should be run daily via cron job or scheduler
 */
async function processLateFees() {
  console.log('[Late Fee Processor] Starting daily late fee processing...');

  try {
    // Get all active clubs with late fees enabled
    const clubs = await prisma.club.findMany({
      where: {
        lateFeeEnabled: true,
        subscriptionStatus: 'active'
      },
      select: {
        id: true,
        name: true,
        lateFeeAmount: true,
        lateFeeGraceDays: true,
        lateFeeFrequency: true
      }
    });

    console.log(`[Late Fee Processor] Processing ${clubs.length} clubs...`);

    let totalFeesAdded = 0;
    let totalEntertainersAffected = 0;

    for (const club of clubs) {
      const result = await processClubLateFees(club);
      totalFeesAdded += result.feesAdded;
      totalEntertainersAffected += result.entertainersAffected;
    }

    console.log(`[Late Fee Processor] Complete! Added ${totalFeesAdded} late fees affecting ${totalEntertainersAffected} entertainers.`);

    return {
      success: true,
      clubsProcessed: clubs.length,
      totalFeesAdded,
      totalEntertainersAffected
    };

  } catch (error) {
    console.error('[Late Fee Processor] Error:', error);
    throw error;
  }
}

/**
 * Process late fees for a specific club
 */
async function processClubLateFees(club) {
  console.log(`[Late Fee Processor] Processing club: ${club.name}`);

  // Calculate the cutoff date (today - grace period)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const gracePeriodDate = new Date(today);
  gracePeriodDate.setDate(gracePeriodDate.getDate() - club.lateFeeGraceDays);

  // Find all overdue pending transactions
  const overdueTransactions = await prisma.financialTransaction.findMany({
    where: {
      clubId: club.id,
      status: 'PENDING',
      dueDate: {
        lte: gracePeriodDate
      },
      // Exclude transactions that are already late fees
      NOT: {
        category: 'LATE_FEE'
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

  console.log(`[Late Fee Processor] Found ${overdueTransactions.length} overdue transactions for ${club.name}`);

  if (overdueTransactions.length === 0) {
    return { feesAdded: 0, entertainersAffected: 0 };
  }

  // Group by entertainer to avoid duplicate late fees
  const entertainerMap = new Map();

  for (const transaction of overdueTransactions) {
    if (!transaction.entertainerId) continue;

    if (!entertainerMap.has(transaction.entertainerId)) {
      entertainerMap.set(transaction.entertainerId, {
        entertainer: transaction.entertainer,
        overdueTransactions: []
      });
    }

    entertainerMap.get(transaction.entertainerId).overdueTransactions.push(transaction);
  }

  let feesAdded = 0;
  const notificationPromises = [];

  // Process each entertainer
  for (const [entertainerId, data] of entertainerMap) {
    // Check if late fee was already added today for this entertainer
    const existingLateFeeToday = await prisma.financialTransaction.findFirst({
      where: {
        clubId: club.id,
        entertainerId,
        category: 'LATE_FEE',
        createdAt: {
          gte: today
        }
      }
    });

    // Skip if already charged today (prevents duplicate charges)
    if (existingLateFeeToday && club.lateFeeFrequency === 'ONE_TIME') {
      console.log(`[Late Fee Processor] Skipping ${data.entertainer.stageName} - already charged today`);
      continue;
    }

    // For ONE_TIME frequency, check if any late fee exists for these specific transactions
    if (club.lateFeeFrequency === 'ONE_TIME') {
      const overdueIds = data.overdueTransactions.map(t => t.id);

      const existingLateFee = await prisma.financialTransaction.findFirst({
        where: {
          clubId: club.id,
          entertainerId,
          category: 'LATE_FEE',
          description: {
            contains: overdueIds[0] // Check if this transaction already has a late fee
          }
        }
      });

      if (existingLateFee) {
        console.log(`[Late Fee Processor] Skipping ${data.entertainer.stageName} - late fee already exists`);
        continue;
      }
    }

    // Calculate total overdue amount
    const totalOverdue = data.overdueTransactions.reduce((sum, tx) => {
      return sum + parseFloat(tx.amount);
    }, 0);

    // Create late fee transaction
    const lateFee = await prisma.financialTransaction.create({
      data: {
        clubId: club.id,
        entertainerId,
        transactionType: 'LATE_FEE',
        category: 'LATE_FEE',
        amount: club.lateFeeAmount,
        description: `Late fee - ${data.overdueTransactions.length} overdue payment(s) totaling $${totalOverdue.toFixed(2)}`,
        paymentMethod: 'cash',
        status: 'PENDING',
        dueDate: today,
        sourceType: 'LATE_FEE_AUTO',
        sourceId: null
      }
    });

    feesAdded++;
    console.log(`[Late Fee Processor] Added $${club.lateFeeAmount} late fee for ${data.entertainer.stageName}`);

    // Send notification (async, don't wait)
    notificationPromises.push(
      sendLateFeeNotification(club, data.entertainer, lateFee, totalOverdue)
        .catch(err => console.error('[Late Fee Processor] Notification error:', err))
    );
  }

  // Wait for all notifications to complete
  await Promise.allSettled(notificationPromises);

  return {
    feesAdded,
    entertainersAffected: entertainerMap.size
  };
}

/**
 * Send notification to entertainer about late fee
 */
async function sendLateFeeNotification(club, entertainer, lateFee, totalOverdue) {
  // Create in-app notification (if ShiftNotification table is available)
  // For now, just log
  console.log(`[Late Fee Processor] Would notify ${entertainer.stageName}:`);
  console.log(`  - Late fee: $${lateFee.amount}`);
  console.log(`  - Total overdue: $${totalOverdue.toFixed(2)}`);
  console.log(`  - Phone: ${entertainer.phone || 'N/A'}`);
  console.log(`  - Email: ${entertainer.email || 'N/A'}`);

  // TODO: Integrate with notification system
  // - Send SMS via Twilio
  // - Send email notification
  // - Create in-app notification

  return true;
}

/**
 * Manual trigger for late fee processing (for testing or manual runs)
 */
async function processLateFeeManual(clubId) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      name: true,
      lateFeeEnabled: true,
      lateFeeAmount: true,
      lateFeeGraceDays: true,
      lateFeeFrequency: true
    }
  });

  if (!club) {
    throw new Error('Club not found');
  }

  if (!club.lateFeeEnabled) {
    throw new Error('Late fees are not enabled for this club');
  }

  return await processClubLateFees(club);
}

module.exports = {
  processLateFees,
  processClubLateFees,
  processLateFeeManual
};
