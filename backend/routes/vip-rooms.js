// ClubOps - VIP Room Management Routes
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const prisma = new PrismaClient();

// @route   GET /api/vip-rooms
// @desc    Get all VIP booths for club
// @access  Private
router.get('/', async (req, res) => {
  try {
    const clubId = req.clubId;

    const booths = await prisma.vipBooth.findMany({
      where: { clubId },
      include: {
        sessions: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            entertainer: {
              select: {
                id: true,
                stageName: true,
                legalName: true
              }
            },
            items: {
              orderBy: {
                addedAt: 'desc'
              }
            }
          },
          orderBy: {
            startedAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        boothNumber: 'asc'
      }
    });

    // Format response for frontend
    const formattedBooths = booths.map(booth => {
      const activeSession = booth.sessions[0];

      let currentSession = null;
      if (activeSession) {
        const songTotal = activeSession.songCountManual * parseFloat(activeSession.songRate.toString());
        const itemsTotal = activeSession.items.reduce((sum, item) =>
          sum + parseFloat(item.totalPrice.toString()), 0
        );
        const grandTotal = songTotal + itemsTotal;
        const minimumSpend = activeSession.minimumSpend ? parseFloat(activeSession.minimumSpend.toString()) : 0;
        const remaining = Math.max(0, minimumSpend - grandTotal);
        const percentComplete = minimumSpend > 0 ? Math.min(100, (grandTotal / minimumSpend) * 100) : 100;

        currentSession = {
          id: activeSession.id,
          dancer_id: activeSession.entertainerId,
          dancer_name: activeSession.entertainer.stageName || activeSession.entertainer.legalName,
          customer_name: activeSession.customerName,
          started_at: activeSession.startedAt,
          song_count: activeSession.songCountManual,
          song_rate: parseFloat(activeSession.songRate.toString()),
          song_total: songTotal,
          items_count: activeSession.items.length,
          items_total: itemsTotal,
          grand_total: grandTotal,
          minimum_spend: minimumSpend,
          remaining: remaining,
          percent_complete: Math.round(percentComplete),
          meets_minimum: grandTotal >= minimumSpend
        };
      }

      return {
        id: booth.id,
        booth_name: booth.boothName,
        booth_number: booth.boothNumber,
        capacity: booth.capacity,
        song_rate: booth.songRate ? parseFloat(booth.songRate.toString()) : null,
        is_available: booth.isAvailable && !activeSession,
        is_active: booth.isActive,
        status: activeSession ? 'occupied' : (booth.isAvailable ? 'available' : 'unavailable'),
        current_session: currentSession,
        created_at: booth.createdAt
      };
    });

    res.json(formattedBooths);
  } catch (error) {
    console.error('Get VIP booths error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/vip-rooms/:id/start-session
// @desc    Start a new VIP session (create reservation)
// @access  Private
router.post('/:id/start-session', [
  body('dancer_id').notEmpty().withMessage('Dancer ID is required'),
  body('customer_name').optional().isString(),
  body('customer_phone').optional().isString(),
  body('song_rate').optional().isNumeric(),
  body('minimum_spend').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const clubId = req.clubId;
    const boothId = req.params.id;
    const { dancer_id, customer_name, customer_phone, song_rate, minimum_spend } = req.body;

    // Get the booth
    const booth = await prisma.vipBooth.findFirst({
      where: {
        id: boothId,
        clubId
      }
    });

    if (!booth) {
      return res.status(404).json({ error: 'VIP booth not found' });
    }

    if (!booth.isAvailable || !booth.isActive) {
      return res.status(400).json({ error: 'Booth is not available' });
    }

    // Check if booth already has an active session
    const existingSession = await prisma.vipSession.findFirst({
      where: {
        boothId,
        status: 'ACTIVE'
      }
    });

    if (existingSession) {
      return res.status(400).json({ error: 'Booth already has an active session' });
    }

    // Get the dancer
    const dancer = await prisma.entertainer.findFirst({
      where: {
        id: dancer_id,
        clubId
      }
    });

    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    // Get active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        clubId,
        status: 'ACTIVE'
      }
    });

    // Get club's default song rate if not provided
    const club = await prisma.club.findUnique({
      where: { id: clubId }
    });

    const sessionSongRate = song_rate || booth.songRate || club?.vipSongRate || 50;

    // Create the VIP session
    const session = await prisma.vipSession.create({
      data: {
        clubId,
        boothId,
        entertainerId: dancer_id,
        shiftId: activeShift?.id || null,
        startedById: req.user.id,
        customerName: customer_name || null,
        customerPhone: customer_phone || null,
        songRate: sessionSongRate,
        minimumSpend: minimum_spend || null,
        status: 'ACTIVE'
      },
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            legalName: true
          }
        },
        booth: true
      }
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('vip:session-started', {
        boothId,
        session: {
          id: session.id,
          dancer_name: session.entertainer.stageName || session.entertainer.legalName,
          customer_name: session.customerName,
          started_at: session.startedAt
        }
      });
    }

    res.status(201).json({
      id: session.id,
      booth_id: session.boothId,
      dancer_id: session.entertainerId,
      dancer_name: session.entertainer.stageName || session.entertainer.legalName,
      customer_name: session.customerName,
      customer_phone: session.customerPhone,
      started_at: session.startedAt,
      song_rate: parseFloat(session.songRate.toString()),
      song_count: session.songCountManual,
      status: session.status
    });
  } catch (error) {
    console.error('Start VIP session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/vip-rooms/:id/update-song-count
// @desc    Update song count for active session
// @access  Private
router.put('/:id/update-song-count', [
  body('song_count').isInt({ min: 0 }).withMessage('Song count must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const clubId = req.clubId;
    const boothId = req.params.id;
    const { song_count } = req.body;

    // Get active session for this booth
    const session = await prisma.vipSession.findFirst({
      where: {
        boothId,
        clubId,
        status: 'ACTIVE'
      },
      include: {
        entertainer: {
          select: {
            stageName: true,
            legalName: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'No active session found for this booth' });
    }

    // Update song count
    const updatedSession = await prisma.vipSession.update({
      where: { id: session.id },
      data: {
        songCountManual: song_count
      }
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('vip:song-count-updated', {
        boothId,
        sessionId: session.id,
        songCount: song_count
      });
    }

    res.json({
      id: updatedSession.id,
      song_count: updatedSession.songCountManual,
      dancer_name: session.entertainer.stageName || session.entertainer.legalName,
      customer_name: updatedSession.customerName
    });
  } catch (error) {
    console.error('Update song count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/vip-rooms/:id/end-session
// @desc    End VIP session and calculate charges
// @access  Private
router.post('/:id/end-session', async (req, res) => {
  try {
    const clubId = req.clubId;
    const boothId = req.params.id;

    // Get active session
    const session = await prisma.vipSession.findFirst({
      where: {
        boothId,
        clubId,
        status: 'ACTIVE'
      },
      include: {
        entertainer: {
          select: {
            stageName: true,
            legalName: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'No active session found for this booth' });
    }

    const endTime = new Date();
    const durationMs = endTime - new Date(session.startedAt);
    const durationMinutes = Math.ceil(durationMs / 1000 / 60);

    // Calculate song count by time (average 3 min per song)
    const songCountByTime = Math.floor(durationMinutes / 3);

    // Update session
    const updatedSession = await prisma.vipSession.update({
      where: { id: session.id },
      data: {
        endedAt: endTime,
        endedById: req.user.id,
        durationMinutes,
        songCountByTime,
        songCountFinal: session.songCountManual || songCountByTime,
        status: 'COMPLETED'
      }
    });

    // Calculate charges
    const finalSongCount = updatedSession.songCountFinal || 0;
    const totalCharge = finalSongCount * parseFloat(updatedSession.songRate.toString());

    // Emit real-time event
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('vip:session-ended', {
        boothId,
        sessionId: session.id
      });
    }

    res.json({
      id: updatedSession.id,
      dancer_name: session.entertainer.stageName || session.entertainer.legalName,
      customer_name: updatedSession.customerName,
      started_at: updatedSession.startedAt,
      ended_at: updatedSession.endedAt,
      duration_minutes: updatedSession.durationMinutes,
      song_count_manual: updatedSession.songCountManual,
      song_count_by_time: updatedSession.songCountByTime,
      song_count_final: updatedSession.songCountFinal,
      song_rate: parseFloat(updatedSession.songRate.toString()),
      total_charge: totalCharge,
      status: updatedSession.status
    });
  } catch (error) {
    console.error('End VIP session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/vip-rooms/:id/sessions
// @desc    Get session history for a booth
// @access  Private
router.get('/:id/sessions', async (req, res) => {
  try {
    const clubId = req.clubId;
    const boothId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    const sessions = await prisma.vipSession.findMany({
      where: {
        boothId,
        clubId
      },
      include: {
        entertainer: {
          select: {
            stageName: true,
            legalName: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit
    });

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      dancer_name: session.entertainer.stageName || session.entertainer.legalName,
      customer_name: session.customerName,
      started_at: session.startedAt,
      ended_at: session.endedAt,
      duration_minutes: session.durationMinutes,
      song_count: session.songCountFinal || session.songCountManual,
      song_rate: parseFloat(session.songRate.toString()),
      total_charge: (session.songCountFinal || session.songCountManual) * parseFloat(session.songRate.toString()),
      status: session.status
    }));

    res.json(formattedSessions);
  } catch (error) {
    console.error('Get booth sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/vip-rooms/:id/add-item
// @desc    Add item (bottle, service, etc.) to active VIP session
// @access  Private
router.post('/:id/add-item', [
  body('item_type').isIn(['BOTTLE', 'SERVICE', 'FOOD', 'OTHER']).withMessage('Invalid item type'),
  body('item_name').notEmpty().withMessage('Item name is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const clubId = req.clubId;
    const boothId = req.params.id;
    const { item_type, item_name, quantity, unit_price, notes } = req.body;

    // Get active session for this booth
    const session = await prisma.vipSession.findFirst({
      where: {
        boothId,
        clubId,
        status: 'ACTIVE'
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'No active session found for this booth' });
    }

    const totalPrice = quantity * parseFloat(unit_price);

    // Create session item
    const item = await prisma.vipSessionItem.create({
      data: {
        sessionId: session.id,
        itemType: item_type,
        itemName: item_name,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unit_price),
        totalPrice,
        addedById: req.user.id,
        notes: notes || null
      }
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('vip:item-added', {
        boothId,
        sessionId: session.id,
        item: {
          id: item.id,
          type: item.itemType,
          name: item.itemName,
          quantity: item.quantity,
          price: parseFloat(item.totalPrice.toString())
        }
      });
    }

    res.status(201).json({
      id: item.id,
      item_type: item.itemType,
      item_name: item.itemName,
      quantity: item.quantity,
      unit_price: parseFloat(item.unitPrice.toString()),
      total_price: parseFloat(item.totalPrice.toString()),
      added_at: item.addedAt
    });
  } catch (error) {
    console.error('Add item to VIP session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/vip-rooms/:id/current-spending
// @desc    Get current spending for active session (songs + items)
// @access  Private
router.get('/:id/current-spending', async (req, res) => {
  try {
    const clubId = req.clubId;
    const boothId = req.params.id;

    // Get active session with items
    const session = await prisma.vipSession.findFirst({
      where: {
        boothId,
        clubId,
        status: 'ACTIVE'
      },
      include: {
        items: {
          orderBy: {
            addedAt: 'desc'
          }
        },
        entertainer: {
          select: {
            stageName: true,
            legalName: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'No active session found for this booth' });
    }

    // Calculate totals
    const songTotal = session.songCountManual * parseFloat(session.songRate.toString());
    const itemsTotal = session.items.reduce((sum, item) =>
      sum + parseFloat(item.totalPrice.toString()), 0
    );
    const grandTotal = songTotal + itemsTotal;
    const minimumSpend = session.minimumSpend ? parseFloat(session.minimumSpend.toString()) : 0;
    const remaining = Math.max(0, minimumSpend - grandTotal);
    const percentComplete = minimumSpend > 0 ? Math.min(100, (grandTotal / minimumSpend) * 100) : 100;

    res.json({
      session_id: session.id,
      dancer_name: session.entertainer.stageName || session.entertainer.legalName,
      customer_name: session.customerName,
      started_at: session.startedAt,

      // Song charges
      song_count: session.songCountManual,
      song_rate: parseFloat(session.songRate.toString()),
      song_total: songTotal,

      // Additional items
      items: session.items.map(item => ({
        id: item.id,
        type: item.itemType,
        name: item.itemName,
        quantity: item.quantity,
        unit_price: parseFloat(item.unitPrice.toString()),
        total_price: parseFloat(item.totalPrice.toString()),
        added_at: item.addedAt
      })),
      items_total: itemsTotal,

      // Totals and minimum
      grand_total: grandTotal,
      minimum_spend: minimumSpend,
      remaining: remaining,
      percent_complete: Math.round(percentComplete),
      meets_minimum: grandTotal >= minimumSpend
    });
  } catch (error) {
    console.error('Get current spending error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/vip-rooms/check-minimum-spend-alerts
// @desc    Check all active sessions for minimum spend alerts
// @access  Private
router.get('/check-minimum-spend-alerts', async (req, res) => {
  try {
    const clubId = req.clubId;

    // Get all active sessions with minimum spend set
    const sessions = await prisma.vipSession.findMany({
      where: {
        clubId,
        status: 'ACTIVE',
        minimumSpend: {
          not: null
        }
      },
      include: {
        items: true,
        booth: {
          select: {
            boothName: true,
            boothNumber: true
          }
        },
        entertainer: {
          select: {
            stageName: true,
            legalName: true
          }
        }
      }
    });

    const alerts = [];
    const now = new Date();

    for (const session of sessions) {
      const songTotal = session.songCountManual * parseFloat(session.songRate.toString());
      const itemsTotal = session.items.reduce((sum, item) =>
        sum + parseFloat(item.totalPrice.toString()), 0
      );
      const grandTotal = songTotal + itemsTotal;
      const minimumSpend = parseFloat(session.minimumSpend.toString());
      const remaining = minimumSpend - grandTotal;

      // Only create alert if below minimum
      if (grandTotal < minimumSpend) {
        const sessionDuration = Math.floor((now - session.startedAt) / 1000 / 60); // minutes
        const percentComplete = (grandTotal / minimumSpend) * 100;

        // Alert criteria:
        // 1. Session > 30 minutes AND below 50% of minimum
        // 2. Session > 45 minutes AND below 75% of minimum
        // 3. Session > 60 minutes AND below minimum
        let shouldAlert = false;
        let severity = 'LOW';

        if (sessionDuration >= 60) {
          shouldAlert = true;
          severity = 'HIGH';
        } else if (sessionDuration >= 45 && percentComplete < 75) {
          shouldAlert = true;
          severity = 'MEDIUM';
        } else if (sessionDuration >= 30 && percentComplete < 50) {
          shouldAlert = true;
          severity = 'MEDIUM';
        }

        if (shouldAlert) {
          // Check if alert already exists for this session (avoid duplicates)
          const existingAlert = await prisma.verificationAlert.findFirst({
            where: {
              clubId,
              entityType: 'VIP_SESSION',
              entityId: session.id,
              alertType: 'VIP_MINIMUM_SPEND',
              status: {
                in: ['OPEN', 'ACKNOWLEDGED']
              }
            }
          });

          if (!existingAlert) {
            // Create new alert
            const alert = await prisma.verificationAlert.create({
              data: {
                clubId,
                alertType: 'VIP_MINIMUM_SPEND',
                severity,
                status: 'OPEN',
                entityType: 'VIP_SESSION',
                entityId: session.id,
                title: `VIP Booth ${session.booth.boothNumber} - Minimum Spend Alert`,
                description: `Session has been active for ${sessionDuration} minutes. Current spending is $${grandTotal.toFixed(2)} (${Math.round(percentComplete)}% of $${minimumSpend} minimum). Shortfall: $${remaining.toFixed(2)}.`,
                expectedValue: minimumSpend.toString(),
                actualValue: grandTotal.toString(),
                discrepancy: remaining.toFixed(2),
                involvedDancerId: session.entertainerId,
                visibleToOwnerOnly: false
              }
            });

            // Emit real-time alert
            if (req.io) {
              req.io.to(`club:${clubId}`).emit('vip:minimum-spend-alert', {
                alertId: alert.id,
                boothId: session.boothId,
                boothNumber: session.booth.boothNumber,
                boothName: session.booth.boothName,
                sessionId: session.id,
                dancerName: session.entertainer.stageName || session.entertainer.legalName,
                customerName: session.customerName,
                minimumSpend,
                currentSpending: grandTotal,
                remaining,
                percentComplete: Math.round(percentComplete),
                sessionDuration,
                severity,
                message: `Booth ${session.booth.boothNumber} is ${Math.round(percentComplete)}% to minimum after ${sessionDuration} min`
              });
            }

            alerts.push({
              id: alert.id,
              booth_id: session.boothId,
              booth_number: session.booth.boothNumber,
              booth_name: session.booth.boothName,
              session_id: session.id,
              dancer_name: session.entertainer.stageName || session.entertainer.legalName,
              customer_name: session.customerName,
              minimum_spend: minimumSpend,
              current_spending: grandTotal,
              remaining,
              percent_complete: Math.round(percentComplete),
              session_duration_minutes: sessionDuration,
              severity,
              created_at: alert.createdAt
            });
          }
        }
      }
    }

    res.json({
      checked_sessions: sessions.length,
      alerts_created: alerts.length,
      alerts
    });
  } catch (error) {
    console.error('Check minimum spend alerts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/vip-rooms/alerts
// @desc    Get active minimum spend alerts
// @access  Private
router.get('/alerts', async (req, res) => {
  try {
    const clubId = req.clubId;

    const alerts = await prisma.verificationAlert.findMany({
      where: {
        clubId,
        alertType: 'VIP_MINIMUM_SPEND',
        status: {
          in: ['OPEN', 'ACKNOWLEDGED']
        }
      },
      include: {
        acknowledgedBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get current session data for each alert
    const enrichedAlerts = await Promise.all(alerts.map(async (alert) => {
      if (alert.entityId) {
        const session = await prisma.vipSession.findUnique({
          where: { id: alert.entityId },
          include: {
            booth: {
              select: {
                boothNumber: true,
                boothName: true
              }
            },
            entertainer: {
              select: {
                stageName: true,
                legalName: true
              }
            },
            items: true
          }
        });

        if (session) {
          const songTotal = session.songCountManual * parseFloat(session.songRate.toString());
          const itemsTotal = session.items.reduce((sum, item) =>
            sum + parseFloat(item.totalPrice.toString()), 0
          );
          const grandTotal = songTotal + itemsTotal;
          const minimumSpend = session.minimumSpend ? parseFloat(session.minimumSpend.toString()) : 0;
          const remaining = Math.max(0, minimumSpend - grandTotal);
          const percentComplete = minimumSpend > 0 ? (grandTotal / minimumSpend) * 100 : 100;

          return {
            id: alert.id,
            alert_type: alert.alertType,
            severity: alert.severity,
            status: alert.status,
            title: alert.title,
            description: alert.description,
            booth_number: session.booth.boothNumber,
            booth_name: session.booth.boothName,
            dancer_name: session.entertainer.stageName || session.entertainer.legalName,
            customer_name: session.customerName,
            minimum_spend: minimumSpend,
            current_spending: grandTotal,
            remaining,
            percent_complete: Math.round(percentComplete),
            session_duration_minutes: Math.floor((new Date() - session.startedAt) / 1000 / 60),
            acknowledged_by: alert.acknowledgedBy?.name,
            acknowledged_at: alert.acknowledgedAt,
            created_at: alert.createdAt
          };
        }
      }

      return {
        id: alert.id,
        alert_type: alert.alertType,
        severity: alert.severity,
        status: alert.status,
        title: alert.title,
        description: alert.description,
        acknowledged_by: alert.acknowledgedBy?.name,
        acknowledged_at: alert.acknowledgedAt,
        created_at: alert.createdAt
      };
    }));

    res.json(enrichedAlerts);
  } catch (error) {
    console.error('Get VIP alerts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/vip-rooms/alerts/:id/acknowledge
// @desc    Acknowledge a minimum spend alert
// @access  Private
router.post('/alerts/:id/acknowledge', async (req, res) => {
  try {
    const clubId = req.clubId;
    const alertId = req.params.id;

    const alert = await prisma.verificationAlert.findFirst({
      where: {
        id: alertId,
        clubId,
        alertType: 'VIP_MINIMUM_SPEND'
      }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updatedAlert = await prisma.verificationAlert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedById: req.user.id,
        acknowledgedAt: new Date()
      }
    });

    // Emit real-time update
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('vip:alert-acknowledged', {
        alertId: updatedAlert.id
      });
    }

    res.json({
      id: updatedAlert.id,
      status: updatedAlert.status,
      acknowledged_at: updatedAlert.acknowledgedAt
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/vip-rooms/alerts/:id/resolve
// @desc    Resolve a minimum spend alert
// @access  Private
router.post('/alerts/:id/resolve', [
  body('resolution').optional().isString()
], async (req, res) => {
  try {
    const clubId = req.clubId;
    const alertId = req.params.id;
    const { resolution } = req.body;

    const alert = await prisma.verificationAlert.findFirst({
      where: {
        id: alertId,
        clubId,
        alertType: 'VIP_MINIMUM_SPEND'
      }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const updatedAlert = await prisma.verificationAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedById: req.user.id,
        resolvedAt: new Date(),
        resolution: resolution || 'Manually resolved'
      }
    });

    // Emit real-time update
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('vip:alert-resolved', {
        alertId: updatedAlert.id
      });
    }

    res.json({
      id: updatedAlert.id,
      status: updatedAlert.status,
      resolved_at: updatedAlert.resolvedAt,
      resolution: updatedAlert.resolution
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
