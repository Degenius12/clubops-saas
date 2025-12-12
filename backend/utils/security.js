// ClubOps - Audit & Security Utilities
// Functions for audit logging, hash chains, and anomaly detection

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Create an audit log entry with hash chain
 */
async function createAuditLog({
  clubId,
  userId,
  action,
  entityType,
  entityId,
  previousData,
  newData,
  ipAddress,
  userAgent,
  sessionId,
  isHighRisk = false,
  flaggedReason = null
}) {
  // Get the previous audit log entry for hash chain
  const previousLog = await prisma.auditLog.findFirst({
    where: { clubId },
    orderBy: { createdAt: 'desc' },
    select: { currentHash: true }
  });

  const previousHash = previousLog?.currentHash || null;

  // Generate changes summary
  let changesSummary = '';
  if (action === 'UPDATE' && previousData && newData) {
    const changes = [];
    for (const key of Object.keys(newData)) {
      if (previousData[key] !== newData[key]) {
        changes.push(`${key}: ${previousData[key]} → ${newData[key]}`);
      }
    }
    changesSummary = changes.join(', ');
  } else if (action === 'CREATE') {
    changesSummary = `Created ${entityType}`;
  } else if (action === 'DELETE') {
    changesSummary = `Deleted ${entityType}`;
  }

  // Generate current hash (includes previous hash for chain integrity)
  const hashData = {
    previousHash,
    clubId,
    userId,
    action,
    entityType,
    entityId,
    timestamp: Date.now(),
    newData
  };
  const currentHash = crypto.createHash('sha256')
    .update(JSON.stringify(hashData))
    .digest('hex');

  // Create the audit log
  return prisma.auditLog.create({
    data: {
      clubId,
      userId,
      action,
      entityType,
      entityId,
      previousData,
      newData,
      changesSummary,
      ipAddress,
      userAgent,
      sessionId,
      previousHash,
      currentHash,
      isHighRisk,
      flaggedReason
    }
  });
}

/**
 * Verify audit log chain integrity
 */
async function verifyAuditChain(clubId, startDate = null, endDate = null) {
  const where = { clubId };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      previousHash: true,
      currentHash: true,
      createdAt: true
    }
  });

  const issues = [];
  let isValid = true;

  for (let i = 1; i < logs.length; i++) {
    const currentLog = logs[i];
    const previousLog = logs[i - 1];

    if (currentLog.previousHash !== previousLog.currentHash) {
      isValid = false;
      issues.push({
        logId: currentLog.id,
        timestamp: currentLog.createdAt,
        expected: previousLog.currentHash,
        found: currentLog.previousHash,
        message: 'Hash chain broken - possible tampering detected'
      });
    }
  }

  return {
    isValid,
    totalLogs: logs.length,
    issues
  };
}

/**
 * Create a verification alert
 */
async function createVerificationAlert({
  clubId,
  alertType,
  severity = 'MEDIUM',
  entityType,
  entityId,
  title,
  description,
  expectedValue,
  actualValue,
  discrepancy,
  involvedUserId,
  involvedDancerId,
  visibleToOwnerOnly = false
}) {
  return prisma.verificationAlert.create({
    data: {
      clubId,
      alertType,
      severity,
      entityType,
      entityId,
      title,
      description,
      expectedValue,
      actualValue,
      discrepancy,
      involvedUserId,
      involvedDancerId,
      visibleToOwnerOnly
    }
  });
}

/**
 * Cross-verify dancer in DJ queue vs checked in
 */
async function verifyDancerQueueCheckIn(clubId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get dancers in DJ queue
  const queuedDancers = await prisma.djQueue.findMany({
    where: {
      clubId,
      status: { in: ['queued', 'active'] }
    },
    select: { dancerId: true }
  });

  // Get checked-in dancers
  const checkedInDancers = await prisma.dancerCheckIn.findMany({
    where: {
      clubId,
      checkedInAt: { gte: today },
      status: 'CHECKED_IN'
    },
    select: { dancerId: true }
  });

  const checkedInIds = new Set(checkedInDancers.map(d => d.dancerId));
  const alerts = [];

  for (const queued of queuedDancers) {
    if (!checkedInIds.has(queued.dancerId)) {
      // Get dancer info
      const dancer = await prisma.dancer.findUnique({
        where: { id: queued.dancerId },
        select: { stageName: true }
      });

      const alert = await createVerificationAlert({
        clubId,
        alertType: 'DJ_QUEUE_NOT_CHECKED_IN',
        severity: 'HIGH',
        entityType: 'DJ_QUEUE',
        title: `DJ Queue: ${dancer?.stageName || 'Unknown'} not checked in`,
        description: 'Dancer appears in DJ queue but was not checked in at door',
        involvedDancerId: queued.dancerId
      });

      alerts.push(alert);
    }
  }

  return alerts;
}

/**
 * Check for VIP session song count discrepancies
 */
async function analyzeVipSongDiscrepancies(clubId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const sessions = await prisma.vipSession.findMany({
    where: {
      clubId,
      status: 'COMPLETED',
      endedAt: { gte: startDate }
    },
    include: {
      startedBy: { select: { id: true, firstName: true, lastName: true } },
      booth: { select: { boothName: true } }
    }
  });

  const analysis = {
    totalSessions: sessions.length,
    matchingSessions: 0,
    minorDiscrepancies: 0,
    significantDiscrepancies: 0,
    criticalDiscrepancies: 0,
    byAttendant: {}
  };

  for (const session of sessions) {
    const manual = session.songCountManual || 0;
    const timeEstimate = session.songCountByTime || 0;
    const variance = Math.abs(manual - timeEstimate);

    // Categorize
    if (variance <= 1) analysis.matchingSessions++;
    else if (variance <= 3) analysis.minorDiscrepancies++;
    else if (variance <= 5) analysis.significantDiscrepancies++;
    else analysis.criticalDiscrepancies++;

    // Track by attendant
    const attendantId = session.startedBy.id;
    const attendantName = `${session.startedBy.firstName} ${session.startedBy.lastName}`;
    
    if (!analysis.byAttendant[attendantId]) {
      analysis.byAttendant[attendantId] = {
        name: attendantName,
        sessions: 0,
        totalVariance: 0,
        criticalCount: 0
      };
    }
    
    analysis.byAttendant[attendantId].sessions++;
    analysis.byAttendant[attendantId].totalVariance += variance;
    if (variance > 5) analysis.byAttendant[attendantId].criticalCount++;
  }

  // Calculate averages
  for (const id of Object.keys(analysis.byAttendant)) {
    const data = analysis.byAttendant[id];
    data.avgVariance = (data.totalVariance / data.sessions).toFixed(2);
  }

  return analysis;
}

/**
 * Check for license expiration alerts
 */
async function checkLicenseExpirations(clubId) {
  const today = new Date();
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(today.getDate() + 14);

  // Get dancers with expiring licenses
  const expiringDancers = await prisma.dancer.findMany({
    where: {
      clubId,
      isActive: true,
      licenseExpiryDate: {
        gte: today,
        lte: twoWeeksFromNow
      }
    }
  });

  // Get dancers with expired licenses
  const expiredDancers = await prisma.dancer.findMany({
    where: {
      clubId,
      isActive: true,
      licenseExpiryDate: { lt: today }
    }
  });

  const alerts = [];

  for (const dancer of expiringDancers) {
    const daysUntilExpiry = Math.ceil((dancer.licenseExpiryDate - today) / (1000 * 60 * 60 * 24));
    
    // Check if alert already exists
    const existingAlert = await prisma.verificationAlert.findFirst({
      where: {
        clubId,
        alertType: 'LICENSE_EXPIRING',
        involvedDancerId: dancer.id,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] }
      }
    });

    if (!existingAlert) {
      const alert = await createVerificationAlert({
        clubId,
        alertType: 'LICENSE_EXPIRING',
        severity: daysUntilExpiry <= 7 ? 'HIGH' : 'MEDIUM',
        entityType: 'DANCER',
        entityId: dancer.id,
        title: `License expiring: ${dancer.stageName}`,
        description: `License expires in ${daysUntilExpiry} days (${dancer.licenseExpiryDate.toLocaleDateString()})`,
        involvedDancerId: dancer.id
      });
      alerts.push(alert);
    }
  }

  for (const dancer of expiredDancers) {
    // Check if alert already exists
    const existingAlert = await prisma.verificationAlert.findFirst({
      where: {
        clubId,
        alertType: 'LICENSE_EXPIRED',
        involvedDancerId: dancer.id,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] }
      }
    });

    if (!existingAlert) {
      const alert = await createVerificationAlert({
        clubId,
        alertType: 'LICENSE_EXPIRED',
        severity: 'CRITICAL',
        entityType: 'DANCER',
        entityId: dancer.id,
        title: `License EXPIRED: ${dancer.stageName}`,
        description: `License expired on ${dancer.licenseExpiryDate.toLocaleDateString()}. Dancer cannot work until renewed.`,
        involvedDancerId: dancer.id
      });
      alerts.push(alert);
    }
  }

  return {
    expiring: expiringDancers.length,
    expired: expiredDancers.length,
    alertsCreated: alerts.length
  };
}

/**
 * Generate nightly anomaly report
 */
async function generateAnomalyReport(clubId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Run all analyses
  const vipAnalysis = await analyzeVipSongDiscrepancies(clubId, 1);
  
  // Get flagged users
  const flaggedUserIds = Object.entries(vipAnalysis.byAttendant)
    .filter(([_, data]) => parseFloat(data.avgVariance) > 3 || data.criticalCount > 0)
    .map(([id]) => id);

  // Calculate overall risk
  let overallRisk = 'LOW';
  if (vipAnalysis.criticalDiscrepancies > 0 || flaggedUserIds.length > 2) {
    overallRisk = 'HIGH';
  } else if (vipAnalysis.significantDiscrepancies > 3 || flaggedUserIds.length > 0) {
    overallRisk = 'MEDIUM';
  }

  // Create report
  const report = await prisma.anomalyReport.upsert({
    where: {
      clubId_reportDate_analysisType: {
        clubId,
        reportDate: today,
        analysisType: 'VIP_ATTENDANT_VARIANCE'
      }
    },
    update: {
      findingsSummary: `${vipAnalysis.totalSessions} sessions analyzed. ${vipAnalysis.matchingSessions} matching, ${vipAnalysis.criticalDiscrepancies} critical variances.`,
      dataPoints: vipAnalysis,
      anomaliesFound: vipAnalysis.criticalDiscrepancies + vipAnalysis.significantDiscrepancies,
      flaggedUserIds,
      overallRisk
    },
    create: {
      clubId,
      reportDate: today,
      periodStart: yesterday,
      periodEnd: today,
      analysisType: 'VIP_ATTENDANT_VARIANCE',
      findingsSummary: `${vipAnalysis.totalSessions} sessions analyzed. ${vipAnalysis.matchingSessions} matching, ${vipAnalysis.criticalDiscrepancies} critical variances.`,
      dataPoints: vipAnalysis,
      anomaliesFound: vipAnalysis.criticalDiscrepancies + vipAnalysis.significantDiscrepancies,
      flaggedUserIds,
      overallRisk
    }
  });

  return report;
}

module.exports = {
  createAuditLog,
  verifyAuditChain,
  createVerificationAlert,
  verifyDancerQueueCheckIn,
  analyzeVipSongDiscrepancies,
  checkLicenseExpirations,
  generateAnomalyReport
};
