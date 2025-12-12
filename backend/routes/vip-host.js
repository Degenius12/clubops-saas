// ClubOps - VIP Host Routes
// Handles VIP booth sessions, song counting, and customer confirmation

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const crypto = require('crypto');

const prisma = new PrismaClient();
const router = express.Router();

// ===========================================
// VIP BOOTH MANAGEMENT
// ===========================================

// @route   GET /api/vip-host/booths
// @desc    Get all VIP booths with current status
// @access  Private
router.get('/booths', auth, async (req, res) => {
  try {
    const booths = await prisma.vipBooth.findMany({
      where: {
        clubId: req.user.clubId,
        isActive: true
      },
      include: {
        sessions: {
          where: { status: 'ACTIVE' },
          include: {
            dancer: {
              select: { id: true, stageName: true, photoUrl: true }
            },
            startedBy: {
              select: { firstName: true, lastName: true }
            }
          },
          take: 1
        }
      },
      orderBy: { boothNumber: 'asc' }
    });

    // Format response with occupancy status
    const boothsWithStatus = booths.map(booth => ({
      ...booth,
      isOccupied: booth.sessions.length > 0,
      currentSession: booth.sessions[0] || null
    }));

    res.json(boothsWithStatus);
  } catch (error) {
    console.error('Get booths error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/vip-host/available-dancers
// @desc    Get dancers currently checked in (available for VIP)
// @access  Private
router.get('/available-dancers', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get checked-in dancers not currently in VIP session
    const checkedInDancers = await prisma.dancerCheckIn.findMany({
      where: {
        clubId: req.user.clubId,
        checkedInAt: { gte: today },
        status: 'CHECKED_IN'
      },
      include: {
        dancer: {
          select: {
            id: true,
            stageName: true,
            legalName: true,
            photoUrl: true
          }
        }
      }
    });

    // Get dancers currently in active VIP sessions
    const activeVipDancerIds = await prisma.vipSession.findMany({
      where: {
        clubId: req.user.clubId,
        status: 'ACTIVE'
      },
      select: { dancerId: true }
    });

    const busyDancerIds = new Set(activeVipDancerIds.map(s => s.dancerId));

    // Filter to available dancers
    const availableDancers = checkedInDancers
      .filter(ci => !busyDancerIds.has(ci.dancerId))
      .map(ci => ({
        ...ci.dancer,
        checkInId: ci.id,
        checkedInAt: ci.checkedInAt
      }));

    res.json(availableDancers);
  } catch (error) {
    console.error('Get available dancers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// VIP SESSION MANAGEMENT
// ===========================================

// @route   GET /api/vip-host/sessions/active
// @desc    Get all active VIP sessions
// @access  Private
router.get('/sessions/active', auth, async (req, res) => {
  try {
    const sessions = await prisma.vipSession.findMany({
      where: {
        clubId: req.user.clubId,
        status: 'ACTIVE'
      },
      include: {
        booth: { select: { boothName: true, boothNumber: true } },
        dancer: { select: { id: true, stageName: true, photoUrl: true } },
        startedBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { startedAt: 'desc' }
    });

    // Calculate running time for each session
    const sessionsWithRuntime = sessions.map(session => {
      const runtime = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
      return {
        ...session,
        runtimeSeconds: runtime,
        estimatedSongs: Math.floor(runtime / 210) // avg 3.5 min songs
      };
    });

    res.json(sessionsWithRuntime);
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/vip-host/sessions/start
// @desc    Start a new VIP session
// @access  Private (VIP Host, Manager, Owner)
router.post('/sessions/start', [
  auth,
  body('boothId').notEmpty().isUUID(),
  body('dancerId').notEmpty().isUUID(),
  body('customerName').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { boothId, dancerId, customerName, customerPhone } = req.body;

    // Verify booth is available
    const booth = await prisma.vipBooth.findFirst({
      where: {
        id: boothId,
        clubId: req.user.clubId,
        isActive: true
      },
      include: {
        sessions: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!booth) {
      return res.status(404).json({ error: 'Booth not found' });
    }

    if (booth.sessions.length > 0) {
      return res.status(400).json({ 
        error: 'Booth occupied',
        message: 'This booth already has an active session'
      });
    }

    // Verify dancer is checked in and not in another session
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dancerCheckIn = await prisma.dancerCheckIn.findFirst({
      where: {
        clubId: req.user.clubId,
        dancerId,
        checkedInAt: { gte: today },
        status: 'CHECKED_IN'
      },
      include: {
        dancer: { select: { stageName: true } }
      }
    });

    if (!dancerCheckIn) {
      // Create alert for unchecked dancer
      await prisma.verificationAlert.create({
        data: {
          clubId: req.user.clubId,
          alertType: 'VIP_SESSION_NOT_CHECKED_IN',
          severity: 'HIGH',
          entityType: 'VIP_SESSION',
          title: 'VIP session started for non-checked-in dancer',
          description: `Dancer ID ${dancerId} was added to VIP without door check-in`,
          involvedDancerId: dancerId,
          involvedUserId: req.user.id
        }
      });

      return res.status(400).json({
        error: 'Dancer not checked in',
        message: 'This dancer must be checked in at the door before starting a VIP session'
      });
    }

    // Check if dancer is already in active VIP
    const existingSession = await prisma.vipSession.findFirst({
      where: {
        clubId: req.user.clubId,
        dancerId,
        status: 'ACTIVE'
      }
    });

    if (existingSession) {
      return res.status(400).json({
        error: 'Dancer busy',
        message: 'This dancer is already in an active VIP session'
      });
    }

    // Get club settings for song rate
    const club = await prisma.club.findUnique({
      where: { id: req.user.clubId },
      select: { vipSongRate: true }
    });

    const songRate = booth.songRate || club.vipSongRate;

    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        clubId: req.user.clubId,
        userId: req.user.id,
        status: 'ACTIVE'
      }
    });

    // Create session
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.vipSession.create({
        data: {
          clubId: req.user.clubId,
          boothId,
          dancerId,
          shiftId: activeShift?.id,
          startedById: req.user.id,
          customerName,
          customerPhone,
          songRate,
          verificationStatus: 'PENDING_REVIEW'
        },
        include: {
          booth: { select: { boothName: true, boothNumber: true } },
          dancer: { select: { stageName: true, photoUrl: true } }
        }
      });

      // Update booth availability
      await tx.vipBooth.update({
        where: { id: boothId },
        data: { isAvailable: false }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'CREATE',
          entityType: 'VIP_SESSION',
          entityId: newSession.id,
          newData: {
            boothId,
            dancerId,
            stageName: dancerCheckIn.dancer.stageName,
            customerName,
            songRate: parseFloat(songRate)
          },
          ipAddress: req.ip,
          currentHash: crypto.createHash('sha256')
            .update(JSON.stringify({ sessionId: newSession.id, timestamp: Date.now() }))
            .digest('hex')
        }
      });

      return newSession;
    });

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(`club-${req.user.clubId}`).emit('vip-session-started', {
        session,
        boothId,
        dancerId
      });
    }

    res.status(201).json({
      message: 'VIP session started',
      session
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/vip-host/sessions/:id/songs
// @desc    Update manual song count for session
// @access  Private
router.put('/sessions/:id/songs', [
  auth,
  body('songCount').isInt({ min: 0 })
], async (req, res) => {
  try {
    const session = await prisma.vipSession.findFirst({
      where: {
        id: req.params.id,
        clubId: req.user.clubId,
        status: 'ACTIVE'
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    const updated = await prisma.vipSession.update({
      where: { id: req.params.id },
      data: { songCountManual: req.body.songCount }
    });

    // Emit socket event for real-time sync
    if (req.app.get('io')) {
      req.app.get('io').to(`club-${req.user.clubId}`).emit('vip-song-count-updated', {
        sessionId: req.params.id,
        songCount: req.body.songCount
      });
    }

    res.json({ 
      message: 'Song count updated',
      songCount: req.body.songCount,
      session: updated
    });
  } catch (error) {
    console.error('Update songs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/vip-host/sessions/:id/end
// @desc    End a VIP session
// @access  Private
router.post('/sessions/:id/end', [
  auth,
  body('finalSongCount').isInt({ min: 0 }),
  body('paymentMethod').optional().isIn(['CASH', 'CARD', 'DEFERRED'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const session = await prisma.vipSession.findFirst({
      where: {
        id: req.params.id,
        clubId: req.user.clubId,
        status: 'ACTIVE'
      },
      include: {
        booth: { select: { boothName: true, boothNumber: true } },
        dancer: { select: { stageName: true } }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    const { finalSongCount, paymentMethod, notes } = req.body;
    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - session.startedAt.getTime()) / 60000);
    
    // Calculate time-based song estimate (avg 3.5 min per song)
    const club = await prisma.club.findUnique({
      where: { id: req.user.clubId },
      select: { avgSongDuration: true }
    });
    const avgSongDuration = club.avgSongDuration || 210; // seconds
    const songCountByTime = Math.floor((durationMinutes * 60) / avgSongDuration);

    // Check for discrepancy
    const discrepancy = Math.abs(finalSongCount - songCountByTime);
    let verificationStatus = 'VERIFIED';
    
    if (discrepancy > 2) {
      verificationStatus = discrepancy > 5 ? 'MISMATCH' : 'PENDING_REVIEW';
    }

    // Calculate fees
    const songRate = parseFloat(session.songRate);
    const houseFeeOwed = finalSongCount * songRate;

    const result = await prisma.$transaction(async (tx) => {
      // Update session
      const updated = await tx.vipSession.update({
        where: { id: req.params.id },
        data: {
          status: 'COMPLETED',
          endedAt: endTime,
          endedById: req.user.id,
          durationMinutes,
          songCountFinal: finalSongCount,
          songCountByTime,
          verificationStatus,
          discrepancyAmount: discrepancy,
          houseFeeOwed,
          houseFeeStatus: paymentMethod ? 'PAID' : 'PENDING',
          houseFeePaidAt: paymentMethod ? endTime : null,
          paymentMethod,
          notes
        }
      });

      // Release booth
      await tx.vipBooth.update({
        where: { id: session.boothId },
        data: { isAvailable: true }
      });

      // Create financial transaction for house fee
      if (houseFeeOwed > 0) {
        await tx.financialTransaction.create({
          data: {
            clubId: req.user.clubId,
            dancerId: session.dancerId,
            transactionType: 'VIP_HOUSE_FEE',
            category: 'VIP_HOUSE_FEE',
            amount: houseFeeOwed,
            description: `VIP ${finalSongCount} songs - ${session.dancer.stageName} (${session.booth.boothName})`,
            paymentMethod: paymentMethod || 'PENDING',
            status: paymentMethod ? 'PAID' : 'PENDING',
            paidAt: paymentMethod ? endTime : null,
            sourceType: 'VIP_SESSION',
            sourceId: session.id,
            recordedBy: req.user.id
          }
        });
      }

      // Create verification alert if discrepancy
      if (verificationStatus !== 'VERIFIED') {
        await tx.verificationAlert.create({
          data: {
            clubId: req.user.clubId,
            alertType: 'VIP_SONG_MISMATCH',
            severity: discrepancy > 5 ? 'HIGH' : 'MEDIUM',
            entityType: 'VIP_SESSION',
            entityId: session.id,
            title: `Song count discrepancy: ${session.booth.boothName}`,
            description: `Manual count (${finalSongCount}) differs from time estimate (${songCountByTime}) by ${discrepancy} songs`,
            expectedValue: songCountByTime.toString(),
            actualValue: finalSongCount.toString(),
            discrepancy: discrepancy.toString(),
            involvedUserId: req.user.id,
            involvedDancerId: session.dancerId
          }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          clubId: req.user.clubId,
          userId: req.user.id,
          action: 'UPDATE',
          entityType: 'VIP_SESSION',
          entityId: session.id,
          previousData: {
            status: 'ACTIVE',
            songCountManual: session.songCountManual
          },
          newData: {
            status: 'COMPLETED',
            finalSongCount,
            songCountByTime,
            verificationStatus,
            houseFeeOwed: parseFloat(houseFeeOwed)
          },
          ipAddress: req.ip,
          isHighRisk: verificationStatus === 'MISMATCH',
          flaggedReason: verificationStatus === 'MISMATCH' ? 'Significant song count discrepancy' : null,
          currentHash: crypto.createHash('sha256')
            .update(JSON.stringify({ sessionId: session.id, timestamp: Date.now() }))
            .digest('hex')
        }
      });

      return updated;
    });

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(`club-${req.user.clubId}`).emit('vip-session-ended', {
        sessionId: req.params.id,
        boothId: session.boothId,
        dancerId: session.dancerId
      });
    }

    res.json({
      message: 'VIP session ended',
      session: result,
      summary: {
        durationMinutes,
        finalSongCount,
        songCountByTime,
        verificationStatus,
        houseFeeOwed,
        discrepancy
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// CUSTOMER CONFIRMATION
// ===========================================

// @route   GET /api/vip-host/sessions/:id/confirm-display
// @desc    Get session details for customer confirmation display
// @access  Private
router.get('/sessions/:id/confirm-display', auth, async (req, res) => {
  try {
    const session = await prisma.vipSession.findFirst({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      },
      include: {
        booth: { select: { boothName: true, boothNumber: true } },
        dancer: { select: { stageName: true } }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const songCount = session.songCountFinal || session.songCountManual;
    const songRate = parseFloat(session.songRate);
    const totalAmount = songCount * songRate;

    res.json({
      sessionId: session.id,
      boothName: session.booth.boothName,
      dancerName: session.dancer.stageName,
      songCount,
      songRate,
      totalAmount,
      customerName: session.customerName,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      status: session.status,
      isConfirmed: session.customerConfirmed,
      isDisputed: session.customerDisputed
    });
  } catch (error) {
    console.error('Get confirm display error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/vip-host/sessions/:id/customer-confirm
// @desc    Record customer confirmation of song count
// @access  Private
router.post('/sessions/:id/customer-confirm', auth, async (req, res) => {
  try {
    const session = await prisma.vipSession.findFirst({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updated = await prisma.vipSession.update({
      where: { id: req.params.id },
      data: {
        customerConfirmed: true,
        customerConfirmedAt: new Date(),
        verificationStatus: 'VERIFIED'
      }
    });

    res.json({
      message: 'Customer confirmed session',
      session: updated
    });
  } catch (error) {
    console.error('Customer confirm error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/vip-host/sessions/:id/customer-dispute
// @desc    Record customer dispute of song count
// @access  Private
router.post('/sessions/:id/customer-dispute', [
  auth,
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const session = await prisma.vipSession.findFirst({
      where: {
        id: req.params.id,
        clubId: req.user.clubId
      },
      include: {
        booth: { select: { boothName: true } },
        dancer: { select: { stageName: true } }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.vipSession.update({
        where: { id: req.params.id },
        data: {
          customerDisputed: true,
          disputeReason: req.body.reason,
          status: 'DISPUTED',
          verificationStatus: 'PENDING_REVIEW'
        }
      });

      // Create high-priority alert
      await tx.verificationAlert.create({
        data: {
          clubId: req.user.clubId,
          alertType: 'CUSTOMER_DISPUTE',
          severity: 'HIGH',
          entityType: 'VIP_SESSION',
          entityId: session.id,
          title: `Customer dispute: ${session.booth.boothName}`,
          description: `Customer disputed ${session.songCountFinal || session.songCountManual} songs. Reason: ${req.body.reason || 'Not provided'}`,
          involvedUserId: session.startedById,
          involvedDancerId: session.dancerId
        }
      });

      return updated;
    });

    res.json({
      message: 'Dispute recorded for manager review',
      session: result
    });
  } catch (error) {
    console.error('Customer dispute error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// VIP HOST SHIFT SUMMARY
// ===========================================

// @route   GET /api/vip-host/summary
// @desc    Get VIP host shift summary
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        clubId: req.user.clubId,
        userId: req.user.id,
        status: 'ACTIVE'
      },
      include: {
        cashDrawer: true,
        vipSessions: true
      }
    });

    if (!activeShift) {
      return res.json({
        hasActiveShift: false,
        summary: null
      });
    }

    // Calculate stats
    const sessions = activeShift.vipSessions;
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
    const activeSessions = sessions.filter(s => s.status === 'ACTIVE');
    
    const totalSongs = completedSessions.reduce((sum, s) => sum + (s.songCountFinal || 0), 0);
    const totalHouseFees = completedSessions.reduce((sum, s) => sum + parseFloat(s.houseFeeOwed || 0), 0);
    const collectedFees = completedSessions
      .filter(s => s.houseFeeStatus === 'PAID')
      .reduce((sum, s) => sum + parseFloat(s.houseFeeOwed || 0), 0);
    const pendingFees = completedSessions
      .filter(s => s.houseFeeStatus === 'PENDING')
      .reduce((sum, s) => sum + parseFloat(s.houseFeeOwed || 0), 0);
    
    const flaggedCount = completedSessions.filter(s => 
      s.verificationStatus === 'MISMATCH' || s.customerDisputed
    ).length;

    // Performance metrics
    const avgSongsPerSession = completedSessions.length > 0 
      ? (totalSongs / completedSessions.length).toFixed(1) 
      : 0;
    const avgFeePerSession = completedSessions.length > 0 
      ? (totalHouseFees / completedSessions.length).toFixed(2) 
      : 0;

    res.json({
      hasActiveShift: true,
      shift: {
        id: activeShift.id,
        startedAt: activeShift.startedAt,
        role: activeShift.role
      },
      summary: {
        totalSessions: completedSessions.length,
        activeSessions: activeSessions.length,
        totalSongs,
        houseFees: {
          total: totalHouseFees,
          collected: collectedFees,
          pending: pendingFees
        },
        flaggedDiscrepancies: flaggedCount,
        performance: {
          avgSongsPerSession,
          avgFeePerSession
        },
        cashDrawer: activeShift.cashDrawer ? {
          openingBalance: parseFloat(activeShift.cashDrawer.openingBalance),
          currentBalance: parseFloat(activeShift.cashDrawer.openingBalance) + collectedFees
        } : null
      }
    });
  } catch (error) {
    console.error('Get VIP summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// SESSION HISTORY
// ===========================================

// @route   GET /api/vip-host/sessions/history
// @desc    Get VIP session history
// @access  Private
router.get('/sessions/history', auth, async (req, res) => {
  try {
    const { startDate, endDate, dancerId, boothId, status, limit = 50 } = req.query;

    const where = { clubId: req.user.clubId };
    
    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) where.startedAt.gte = new Date(startDate);
      if (endDate) where.startedAt.lte = new Date(endDate);
    }
    if (dancerId) where.dancerId = dancerId;
    if (boothId) where.boothId = boothId;
    if (status) where.status = status;

    const sessions = await prisma.vipSession.findMany({
      where,
      include: {
        booth: { select: { boothName: true, boothNumber: true } },
        dancer: { select: { stageName: true, photoUrl: true } },
        startedBy: { select: { firstName: true, lastName: true } },
        endedBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(sessions);
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
