// ClubFlow - Shift Scheduling Routes (Features #21-23)
// Handles scheduled shifts, shift swaps, and notifications

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// ===========================================
// SCHEDULED SHIFTS
// ===========================================

// @route   GET /api/schedule/shifts
// @desc    Get scheduled shifts (filterable by date range, entertainer, status)
// @access  Private (Manager+)
router.get('/shifts', auth, authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const {
      startDate,
      endDate,
      entertainerId,
      status,
      limit = 100
    } = req.query;

    const where = { clubId };

    // Date range filter
    if (startDate || endDate) {
      where.shiftDate = {};
      if (startDate) where.shiftDate.gte = new Date(startDate);
      if (endDate) where.shiftDate.lte = new Date(endDate);
    }

    // Entertainer filter
    if (entertainerId) {
      where.entertainerId = entertainerId;
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    const scheduledShifts = await prisma.scheduledShift.findMany({
      where,
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true,
            phone: true,
            email: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        swaps: {
          where: { status: 'PENDING' },
          include: {
            requester: {
              select: { id: true, stageName: true }
            }
          }
        }
      },
      orderBy: [
        { shiftDate: 'asc' },
        { startTime: 'asc' }
      ],
      take: parseInt(limit)
    });

    res.json({
      success: true,
      count: scheduledShifts.length,
      scheduledShifts
    });
  } catch (error) {
    console.error('Get scheduled shifts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/schedule/shifts
// @desc    Create a new scheduled shift (Feature #21)
// @access  Private (Manager+)
router.post('/shifts', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'),
  body('entertainerId').isUUID().withMessage('Invalid entertainer ID'),
  body('shiftDate').isISO8601().withMessage('Invalid shift date'),
  body('startTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format (HH:MM)'),
  body('endTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format (HH:MM)'),
  body('position').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clubId, id: createdBy } = req.user;
    const {
      entertainerId,
      shiftDate,
      startTime,
      endTime,
      position,
      notes
    } = req.body;

    // Verify entertainer belongs to this club
    const entertainer = await prisma.entertainer.findFirst({
      where: {
        id: entertainerId,
        clubId,
        isActive: true
      }
    });

    if (!entertainer) {
      return res.status(404).json({
        error: 'Entertainer not found or inactive'
      });
    }

    // Check for conflicting shifts
    const existingShift = await prisma.scheduledShift.findFirst({
      where: {
        clubId,
        entertainerId,
        shiftDate: new Date(shiftDate),
        status: {
          notIn: ['CANCELLED', 'DECLINED', 'NO_SHOW']
        }
      }
    });

    if (existingShift) {
      return res.status(409).json({
        error: 'Shift conflict',
        message: `${entertainer.stageName} already has a shift scheduled for this date`
      });
    }

    // Create scheduled shift
    const scheduledShift = await prisma.scheduledShift.create({
      data: {
        clubId,
        entertainerId,
        createdBy,
        shiftDate: new Date(shiftDate),
        startTime,
        endTime,
        position,
        notes,
        status: 'SCHEDULED'
      },
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            phone: true,
            email: true
          }
        }
      }
    });

    // Create notification (Feature #22)
    await prisma.shiftNotification.create({
      data: {
        clubId,
        entertainerId,
        scheduledShiftId: scheduledShift.id,
        notificationType: 'SHIFT_SCHEDULED',
        title: 'New Shift Scheduled',
        message: `You have been scheduled for a shift on ${new Date(shiftDate).toLocaleDateString()} from ${startTime} to ${endTime}`,
        deliveryMethod: 'IN_APP' // Default to in-app, could extend to SMS/EMAIL
      }
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('shift-scheduled', {
        clubId,
        scheduledShift,
        entertainerId,
        stageName: entertainer.stageName
      });
    }

    res.status(201).json({
      success: true,
      message: `Shift scheduled for ${entertainer.stageName}`,
      scheduledShift
    });
  } catch (error) {
    console.error('Create scheduled shift error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/schedule/shifts/:id
// @desc    Update a scheduled shift
// @access  Private (Manager+)
router.put('/shifts/:id', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'),
  body('shiftDate').optional().isISO8601(),
  body('startTime').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('position').optional().isString(),
  body('status').optional().isIn(['SCHEDULED', 'CONFIRMED', 'CANCELLED']),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clubId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // Convert shiftDate if provided
    if (updateData.shiftDate) {
      updateData.shiftDate = new Date(updateData.shiftDate);
    }

    // Verify shift exists and belongs to club
    const existingShift = await prisma.scheduledShift.findFirst({
      where: { id, clubId },
      include: {
        entertainer: {
          select: { stageName: true, phone: true, email: true }
        }
      }
    });

    if (!existingShift) {
      return res.status(404).json({ error: 'Scheduled shift not found' });
    }

    // Update shift
    const updatedShift = await prisma.scheduledShift.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
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

    // Send notification if shift was cancelled
    if (updateData.status === 'CANCELLED') {
      await prisma.shiftNotification.create({
        data: {
          clubId,
          entertainerId: updatedShift.entertainerId,
          scheduledShiftId: updatedShift.id,
          notificationType: 'SHIFT_CANCELLED',
          title: 'Shift Cancelled',
          message: `Your scheduled shift on ${updatedShift.shiftDate.toLocaleDateString()} has been cancelled`,
          deliveryMethod: 'IN_APP'
        }
      });
    }

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('shift-updated', {
        clubId,
        scheduledShift: updatedShift
      });
    }

    res.json({
      success: true,
      message: 'Shift updated successfully',
      scheduledShift: updatedShift
    });
  } catch (error) {
    console.error('Update scheduled shift error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/schedule/shifts/:id
// @desc    Delete a scheduled shift
// @access  Private (Manager+)
router.delete('/shifts/:id', auth, authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { id } = req.params;

    // Verify shift exists
    const shift = await prisma.scheduledShift.findFirst({
      where: { id, clubId }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Scheduled shift not found' });
    }

    // Delete shift (cascade will delete related swaps and notifications)
    await prisma.scheduledShift.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error('Delete scheduled shift error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// SHIFT SWAPS (Feature #23)
// ===========================================

// @route   GET /api/schedule/swaps
// @desc    Get shift swap requests
// @access  Private (Manager+)
router.get('/swaps', auth, authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { status } = req.query;

    const where = { clubId };
    if (status) {
      where.status = status;
    }

    const swaps = await prisma.shiftSwap.findMany({
      where,
      include: {
        scheduledShift: {
          include: {
            entertainer: {
              select: {
                id: true,
                stageName: true,
                photoUrl: true
              }
            }
          }
        },
        requester: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
          }
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { requestedDate: 'desc' }
    });

    res.json({
      success: true,
      count: swaps.length,
      swaps
    });
  } catch (error) {
    console.error('Get shift swaps error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/schedule/swaps
// @desc    Create a shift swap request
// @access  Private (Entertainer or Manager)
router.post('/swaps', [
  auth,
  body('scheduledShiftId').isUUID(),
  body('requestedBy').isUUID(),
  body('reason').isString().isLength({ min: 10, max: 500 }),
  body('swapWithEntertainerId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clubId } = req.user;
    const {
      scheduledShiftId,
      requestedBy,
      reason,
      swapWithEntertainerId
    } = req.body;

    // Verify shift exists
    const shift = await prisma.scheduledShift.findFirst({
      where: {
        id: scheduledShiftId,
        clubId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      },
      include: {
        entertainer: {
          select: { stageName: true }
        }
      }
    });

    if (!shift) {
      return res.status(404).json({
        error: 'Scheduled shift not found or cannot be swapped'
      });
    }

    // Create swap request
    const swap = await prisma.shiftSwap.create({
      data: {
        clubId,
        scheduledShiftId,
        requestedBy,
        swapWithEntertainerId,
        reason,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: { stageName: true }
        },
        scheduledShift: {
          select: {
            shiftDate: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

    // Create notification for managers
    await prisma.shiftNotification.create({
      data: {
        clubId,
        entertainerId: requestedBy,
        scheduledShiftId,
        notificationType: 'SHIFT_SWAP_REQUEST',
        title: 'Shift Swap Request Submitted',
        message: `Your swap request for ${shift.shiftDate.toLocaleDateString()} has been submitted for manager approval`,
        deliveryMethod: 'IN_APP'
      }
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('swap-request-created', {
        clubId,
        swap
      });
    }

    res.status(201).json({
      success: true,
      message: 'Swap request submitted successfully',
      swap
    });
  } catch (error) {
    console.error('Create shift swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/schedule/swaps/:id/review
// @desc    Approve or decline shift swap request (Feature #23)
// @access  Private (Manager+)
router.put('/swaps/:id/review', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'),
  body('action').isIn(['approve', 'decline']).withMessage('Action must be approve or decline'),
  body('reviewNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { clubId, id: reviewedBy } = req.user;
    const { id: swapId } = req.params;
    const { action, reviewNotes } = req.body;

    // Get swap request
    const swap = await prisma.shiftSwap.findFirst({
      where: {
        id: swapId,
        clubId,
        status: 'PENDING'
      },
      include: {
        scheduledShift: {
          include: {
            entertainer: { select: { stageName: true } }
          }
        },
        requester: {
          select: { id: true, stageName: true }
        }
      }
    });

    if (!swap) {
      return res.status(404).json({
        error: 'Swap request not found or already reviewed'
      });
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'DECLINED';

    // Update swap request
    const updatedSwap = await prisma.shiftSwap.update({
      where: { id: swapId },
      data: {
        status: newStatus,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes
      },
      include: {
        requester: {
          select: { stageName: true }
        },
        reviewer: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Send notification to requester
    await prisma.shiftNotification.create({
      data: {
        clubId,
        entertainerId: swap.requester.id,
        scheduledShiftId: swap.scheduledShiftId,
        notificationType: 'SHIFT_SWAP_APPROVED',
        title: `Shift Swap ${action === 'approve' ? 'Approved' : 'Declined'}`,
        message: `Your shift swap request for ${swap.scheduledShift.shiftDate.toLocaleDateString()} has been ${action === 'approve' ? 'approved' : 'declined'}`,
        deliveryMethod: 'IN_APP'
      }
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('swap-request-reviewed', {
        clubId,
        swap: updatedSwap,
        action
      });
    }

    res.json({
      success: true,
      message: `Swap request ${action === 'approve' ? 'approved' : 'declined'} successfully`,
      swap: updatedSwap
    });
  } catch (error) {
    console.error('Review shift swap error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// NOTIFICATIONS (Feature #22)
// ===========================================

// @route   GET /api/schedule/notifications
// @desc    Get shift notifications for an entertainer
// @access  Private
router.get('/notifications', auth, async (req, res) => {
  try {
    const { clubId, id: userId } = req.user;
    const { entertainerId, unreadOnly } = req.query;

    const where = { clubId };

    // If user is entertainer, only show their notifications
    // If manager, can view all or filter by entertainerId
    if (entertainerId) {
      where.entertainerId = entertainerId;
    }

    if (unreadOnly === 'true') {
      where.readAt = null;
    }

    const notifications = await prisma.shiftNotification.findMany({
      where,
      include: {
        scheduledShift: {
          select: {
            id: true,
            shiftDate: true,
            startTime: true,
            endTime: true,
            position: true
          }
        },
        entertainer: {
          select: {
            id: true,
            stageName: true
          }
        }
      },
      orderBy: { sentAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/schedule/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    const { clubId } = req.user;
    const { id } = req.params;

    const notification = await prisma.shiftNotification.update({
      where: {
        id,
        clubId
      },
      data: {
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===========================================
// CALENDAR VIEW
// ===========================================

// @route   GET /api/schedule/calendar
// @desc    Get calendar view of scheduled shifts
// @access  Private (Manager+)
router.get('/calendar', auth, authorize('OWNER', 'SUPER_MANAGER', 'MANAGER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate are required'
      });
    }

    const shifts = await prisma.scheduledShift.findMany({
      where: {
        clubId,
        shiftDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW']
        }
      },
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
          }
        }
      },
      orderBy: [
        { shiftDate: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({
      success: true,
      count: shifts.length,
      shifts
    });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
