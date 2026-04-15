// Patron Count System API - Feature #49
// Real-time patron counting with hardware integration

const express = require('express');
const publicRouter = express.Router(); // Webhook route (no JWT auth)
const protectedRouter = express.Router(); // All other routes (require JWT)
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

// ==============================================
// HMAC WEBHOOK AUTHENTICATION
// ==============================================

function verifyWebhookSignature(req, res, next) {
  const receivedSignature = req.headers['x-clubflow-signature'];
  const clubId = req.body.clubId;

  if (!clubId) {
    return res.status(400).json({ error: 'Missing clubId in request body' });
  }

  // Fetch club's webhook secret
  prisma.club.findUnique({
    where: { id: clubId },
    select: { doorCountWebhookSecret: true }
  })
    .then(club => {
      if (!club || !club.doorCountWebhookSecret) {
        return res.status(401).json({ error: 'Webhook not configured for this club' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', club.doorCountWebhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (receivedSignature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }

      next();
    })
    .catch(error => {
      console.error('Webhook verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
}

// ==============================================
// WEBHOOK ENDPOINT (POST /api/patron-count/webhook)
// ==============================================

publicRouter.post('/webhook', verifyWebhookSignature, async (req, res) => {
  try {
    const { clubId, deviceId, eventType, count, entries, exits, metadata, zone } = req.body;

    // Fetch current club data
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        currentPatronCount: true,
        capacityLimit: true,
        trackExits: true,
        enableMultiZone: true
      }
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    // Calculate delta based on event type
    let delta = 0;
    if (eventType === 'ENTRY') {
      delta = count || 1;
    } else if (eventType === 'EXIT' && club.trackExits) {
      delta = -(count || 1);
    } else if (entries !== undefined && exits !== undefined) {
      // Batch update (e.g., from infrared sensor)
      delta = entries - (club.trackExits ? exits : 0);
    }

    const previousCount = club.currentPatronCount;
    const newCount = Math.max(0, previousCount + delta); // Never go negative

    // Update club patron count atomically
    await prisma.club.update({
      where: { id: clubId },
      data: {
        currentPatronCount: newCount,
        lastCountUpdate: new Date()
      }
    });

    // Log the event
    await prisma.patronCountLog.create({
      data: {
        clubId,
        timestamp: new Date(),
        previousCount,
        newCount,
        delta,
        source: 'HARDWARE_WEBHOOK',
        deviceId: deviceId || null,
        zone: (club.enableMultiZone && zone) ? zone : null,
        metadata: metadata || {},
        notes: null
      }
    });

    // Check capacity and create alerts if needed
    if (club.capacityLimit) {
      const percentFull = (newCount / club.capacityLimit) * 100;

      // 80% capacity warning
      if (percentFull >= 80 && percentFull < 100) {
        await createOrUpdateAlert(clubId, 'CAPACITY_WARNING',
          `Capacity at ${percentFull.toFixed(0)}% (${newCount}/${club.capacityLimit})`,
          'MEDIUM');
      }

      // Over capacity alert
      if (percentFull >= 100) {
        await createOrUpdateAlert(clubId, 'CAPACITY_EXCEEDED',
          `OVER CAPACITY: ${newCount}/${club.capacityLimit} patrons`,
          'HIGH');
      }
    }

    // Emit WebSocket event (if Socket.IO is available)
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`club-${clubId}`).emit('patron-count-update', {
        clubId,
        previousCount,
        newCount,
        delta,
        percentFull: club.capacityLimit ? (newCount / club.capacityLimit) * 100 : null,
        timestamp: new Date(),
        source: 'HARDWARE_WEBHOOK',
        zone: zone || null
      });
    }

    res.json({
      success: true,
      previousCount,
      newCount,
      delta,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// GET CURRENT COUNT (GET /api/patron-count/current/:clubId)
// ==============================================

protectedRouter.get('/current/:clubId', async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        currentPatronCount: true,
        capacityLimit: true,
        lastCountUpdate: true,
        doorCountEnabled: true
      }
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    if (!club.doorCountEnabled) {
      return res.status(403).json({ error: 'Door count system not enabled' });
    }

    // Calculate trend (last 10 minutes vs previous 10 minutes)
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

    const recentLogs = await prisma.patronCountLog.findMany({
      where: {
        clubId,
        timestamp: { gte: tenMinutesAgo }
      },
      orderBy: { timestamp: 'desc' }
    });

    const olderLogs = await prisma.patronCountLog.findMany({
      where: {
        clubId,
        timestamp: { gte: twentyMinutesAgo, lt: tenMinutesAgo }
      },
      orderBy: { timestamp: 'desc' }
    });

    const recentDelta = recentLogs.reduce((sum, log) => sum + log.delta, 0);
    const olderDelta = olderLogs.reduce((sum, log) => sum + log.delta, 0);

    let trend = 'STABLE';
    if (recentDelta > olderDelta + 5) trend = 'INCREASING';
    if (recentDelta < olderDelta - 5) trend = 'DECREASING';

    const percentFull = club.capacityLimit ? (club.currentPatronCount / club.capacityLimit) * 100 : null;

    res.json({
      currentCount: club.currentPatronCount,
      capacityLimit: club.capacityLimit,
      percentFull,
      lastUpdate: club.lastCountUpdate,
      trend
    });

  } catch (error) {
    console.error('Get current count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// MANUAL ADJUSTMENT (POST /api/patron-count/manual-adjust)
// ==============================================

protectedRouter.post('/manual-adjust', async (req, res) => {
  try {
    const { clubId, newCount, reason } = req.body;
    const user = req.user;

    // Authorization check (Manager or Owner only)
    if (!['OWNER', 'SUPER_MANAGER', 'MANAGER'].includes(user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Validation
    if (newCount < 0) {
      return res.status(400).json({ error: 'Count cannot be negative' });
    }

    // Fetch current count
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { currentPatronCount: true, capacityLimit: true }
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const previousCount = club.currentPatronCount;
    const delta = newCount - previousCount;

    // Update count
    await prisma.club.update({
      where: { id: clubId },
      data: {
        currentPatronCount: newCount,
        lastCountUpdate: new Date()
      }
    });

    // Log adjustment
    await prisma.patronCountLog.create({
      data: {
        clubId,
        timestamp: new Date(),
        previousCount,
        newCount,
        delta,
        source: 'MANUAL_OVERRIDE',
        deviceId: null,
        zone: null,
        metadata: { adjustedBy: user.id, adjustedByName: user.email },
        notes: reason || 'Manual adjustment by staff'
      }
    });

    // Emit WebSocket event
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`club-${clubId}`).emit('patron-count-update', {
        clubId,
        previousCount,
        newCount,
        delta,
        percentFull: club.capacityLimit ? (newCount / club.capacityLimit) * 100 : null,
        timestamp: new Date(),
        source: 'MANUAL_OVERRIDE'
      });
    }

    res.json({
      success: true,
      previousCount,
      newCount,
      delta,
      adjustedBy: user.email
    });

  } catch (error) {
    console.error('Manual adjustment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// UPDATE SETTINGS (POST /api/patron-count/settings)
// ==============================================

protectedRouter.post('/settings', async (req, res) => {
  try {
    const {
      clubId,
      capacityLimit,
      enabled,
      trackExits,
      enableMultiZone,
      reEntryFeeEnabled,
      reEntryFeeAmount,
      autoResetOnShiftChange
    } = req.body;

    const user = req.user;

    // Authorization check (Owner only for settings)
    if (user?.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only club owners can update settings' });
    }

    // Generate webhook secret if enabling for the first time
    let webhookSecret = undefined;
    if (enabled) {
      const currentClub = await prisma.club.findUnique({
        where: { id: clubId },
        select: { doorCountWebhookSecret: true }
      });

      if (!currentClub.doorCountWebhookSecret) {
        webhookSecret = crypto.randomBytes(32).toString('hex');
      }
    }

    // Update settings
    const updateData = {
      doorCountEnabled: enabled,
      capacityLimit,
      trackExits,
      enableMultiZone,
      reEntryFeeEnabled,
      reEntryFeeAmount,
      autoResetOnShiftChange
    };

    if (webhookSecret) {
      updateData.doorCountWebhookSecret = webhookSecret;
    }

    const club = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      select: {
        doorCountEnabled: true,
        capacityLimit: true,
        doorCountWebhookSecret: true,
        trackExits: true,
        enableMultiZone: true,
        reEntryFeeEnabled: true,
        reEntryFeeAmount: true,
        autoResetOnShiftChange: true
      }
    });

    res.json({
      success: true,
      settings: club
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// GET HISTORY (GET /api/patron-count/history/:clubId)
// ==============================================

protectedRouter.get('/history/:clubId', async (req, res) => {
  try {
    const { clubId } = req.params;
    const { startDate, endDate, interval } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const logs = await prisma.patronCountLog.findMany({
      where: {
        clubId,
        timestamp: {
          gte: start,
          lte: end
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Group by hour or day based on interval
    const grouped = {};

    logs.forEach(log => {
      let key;
      if (interval === 'daily') {
        key = log.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        // Hourly (default)
        const hour = new Date(log.timestamp);
        hour.setMinutes(0, 0, 0);
        key = hour.toISOString();
      }

      if (!grouped[key]) {
        grouped[key] = {
          timestamp: key,
          avgCount: 0,
          peakCount: 0,
          totalLogs: 0,
          counts: []
        };
      }

      grouped[key].counts.push(log.newCount);
      grouped[key].totalLogs++;
    });

    // Calculate averages and peaks
    const data = Object.values(grouped).map(group => {
      const avgCount = Math.round(group.counts.reduce((a, b) => a + b, 0) / group.counts.length);
      const peakCount = Math.max(...group.counts);

      return {
        timestamp: group.timestamp,
        avgCount,
        peakCount
      };
    });

    res.json({ data });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// HELPER: CREATE OR UPDATE ALERT
// ==============================================

async function createOrUpdateAlert(clubId, alertType, message, severity) {
  // Check if alert already exists and is open
  const existingAlert = await prisma.verificationAlert.findFirst({
    where: {
      clubId,
      alertType,
      status: 'OPEN'
    }
  });

  if (existingAlert) {
    // Update existing alert
    await prisma.verificationAlert.update({
      where: { id: existingAlert.id },
      data: {
        description: message,
        severity,
        updatedAt: new Date()
      }
    });
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
  }
}

module.exports = {
  public: publicRouter,
  protected: protectedRouter
};
