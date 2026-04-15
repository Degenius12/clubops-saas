const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// ==============================================
// SHIFT SCHEDULING (Feature #21)
// ==============================================

// @route   GET /api/scheduled-shifts
// @desc    Get all scheduled shifts for the club or specific entertainer
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { clubId, role } = req.user;
    const { entertainerId, startDate, endDate, status } = req.query;

    // Build filter conditions
    const where = { clubId };
    
    if (entertainerId) {
      where.entertainerId = entertainerId;
    }
    
    if (startDate || endDate) {
      where.shiftDate = {};
      if (startDate) where.shiftDate.gte = new Date(startDate);
      if (endDate) where.shiftDate.lte = new Date(endDate);
    }
    
    if (status) {
      where.status = status;
    }

    const shifts = await prisma.scheduledShift.findMany({
      where,
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            legalName: true,
            photoUrl: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        swaps: {
          where: { status: 'PENDING' },
          select: {
            id: true,
            requestedBy: true,
            reason: true,
            requestedDate: true
          }
        }
      },
      orderBy: [
        { shiftDate: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json(shifts);
  } catch (error) {
    console.error('Get scheduled shifts error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled shifts' });
  }
});

// @route   GET /api/scheduled-shifts/week
// @desc    Get week view of scheduled shifts
// @access  Private
router.get('/week', async (req, res) => {
  try {
    const { clubId } = req.user;
    const { weekStart } = req.query;

    const startDate = weekStart ? new Date(weekStart) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    // Set to Monday of the week
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    
    // Calculate end of week (Sunday)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const shifts = await prisma.scheduledShift.findMany({
      where: {
        clubId,
        shiftDate: {
          gte: startDate,
          lte: endDate
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

    // Group shifts by date for calendar view
    const shiftsByDate = {};
    shifts.forEach(shift => {
      const dateKey = shift.shiftDate.toISOString().split('T')[0];
      if (!shiftsByDate[dateKey]) {
        shiftsByDate[dateKey] = [];
      }
      shiftsByDate[dateKey].push(shift);
    });

    res.json({
      weekStart: startDate,
      weekEnd: endDate,
      shifts: shiftsByDate,
      totalShifts: shifts.length
    });
  } catch (error) {
    console.error('Get week shifts error:', error);
    res.status(500).json({ error: 'Failed to fetch week schedule' });
  }
});

// @route   POST /api/scheduled-shifts
// @desc    Create a new scheduled shift
// @access  Manager, Super Manager, Owner only
router.post('/', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { id: userId, clubId } = req.user;
    const {
      entertainerId,
      shiftDate,
      startTime,
      endTime,
      position,
      notes,
      sendNotification = true
    } = req.body;

    // Validate required fields
    if (!entertainerId || !shiftDate || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Entertainer, date, start time, and end time are required' 
      });
    }

    // Check if entertainer exists and belongs to club
    const entertainer = await prisma.entertainer.findFirst({
      where: {
        id: entertainerId,
        clubId
      }
    });

    if (!entertainer) {
      return res.status(404).json({ error: 'Entertainer not found' });
    }

    // Check for scheduling conflicts
    const existingShift = await prisma.scheduledShift.findFirst({
      where: {
        clubId,
        entertainerId,
        shiftDate: new Date(shiftDate),
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } }
            ]
          }
        ]
      }
    });

    if (existingShift) {
      return res.status(409).json({ 
        error: 'Scheduling conflict: entertainer already has a shift at this time' 
      });
    }

    // Create the scheduled shift
    const shift = await prisma.scheduledShift.create({
      data: {
        clubId,
        entertainerId,
        createdBy: userId,
        shiftDate: new Date(shiftDate),
        startTime,
        endTime,
        position,
        notes,
        notificationSent: false
      },
      include: {
        entertainer: {
          select: {
            id: true,
            stageName: true,
            legalName: true,
            email: true,
            phone: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Send notification if requested (Feature #22)
    if (sendNotification && entertainer.email) {
      // Create notification record
      await prisma.shiftNotification.create({
        data: {
          clubId,
          entertainerId,
          scheduledShiftId: shift.id,
          notificationType: 'SHIFT_SCHEDULED',
          title: 'New Shift Scheduled',
          message: `You have been scheduled for a shift on ${new Date(shiftDate).toLocaleDateString()} from ${startTime} to ${endTime}${position ? ` (${position})` : ''}.`,
          deliveryMethod: 'IN_APP',
          metadata: { shiftId: shift.id }
        }
      });

      // Update shift to mark notification as sent
      await prisma.scheduledShift.update({
        where: { id: shift.id },
        data: {
          notificationSent: true,
          notificationSentAt: new Date()
        }
      });

      // In production, would send email/SMS here
      // await sendEmail(entertainer.email, ...);
      // await sendSMS(entertainer.phone, ...);
    }

    res.status(201).json({
      message: 'Shift scheduled successfully',
      shift,
      notificationSent: sendNotification
    });
  } catch (error) {
    console.error('Create scheduled shift error:', error);
    res.status(500).json({ error: 'Failed to create scheduled shift' });
  }
});

// @route   PATCH /api/scheduled-shifts/:id
// @desc    Update a scheduled shift
// @access  Manager, Super Manager, Owner only
router.patch('/:id', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { id } = req.params;
    const updates = req.body;

    // Check if shift exists and belongs to club
    const shift = await prisma.scheduledShift.findFirst({
      where: {
        id,
        clubId
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Don't allow updates to completed or cancelled shifts
    if (shift.status === 'CANCELLED' || shift.status === 'COMPLETED') {
      return res.status(400).json({ 
        error: `Cannot update ${shift.status.toLowerCase()} shift` 
      });
    }

    // Update the shift
    const updatedShift = await prisma.scheduledShift.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      },
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

    // If shift details changed, notify entertainer
    if (updates.shiftDate || updates.startTime || updates.endTime || updates.position) {
      await prisma.shiftNotification.create({
        data: {
          clubId,
          entertainerId: shift.entertainerId,
          scheduledShiftId: id,
          notificationType: 'SHIFT_UPDATED',
          title: 'Shift Updated',
          message: 'Your scheduled shift has been updated. Please check the details.',
          deliveryMethod: 'IN_APP',
          metadata: { shiftId: id, changes: updates }
        }
      });
    }

    res.json({
      message: 'Shift updated successfully',
      shift: updatedShift
    });
  } catch (error) {
    console.error('Update scheduled shift error:', error);
    res.status(500).json({ error: 'Failed to update scheduled shift' });
  }
});

// @route   DELETE /api/scheduled-shifts/:id
// @desc    Cancel a scheduled shift
// @access  Manager, Super Manager, Owner only
router.delete('/:id', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    // Check if shift exists and belongs to club
    const shift = await prisma.scheduledShift.findFirst({
      where: {
        id,
        clubId
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Mark as cancelled instead of deleting
    await prisma.scheduledShift.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    // Notify entertainer
    await prisma.shiftNotification.create({
      data: {
        clubId,
        entertainerId: shift.entertainerId,
        scheduledShiftId: id,
        notificationType: 'SHIFT_CANCELLED',
        title: 'Shift Cancelled',
        message: `Your shift on ${shift.shiftDate.toLocaleDateString()} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
        deliveryMethod: 'IN_APP',
        metadata: { shiftId: id, reason }
      }
    });

    res.json({ message: 'Shift cancelled successfully' });
  } catch (error) {
    console.error('Cancel scheduled shift error:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled shift' });
  }
});

// @route   POST /api/scheduled-shifts/:id/confirm
// @desc    Entertainer confirms a scheduled shift
// @access  Private (Entertainer)
router.post('/:id/confirm', async (req, res) => {
  try {
    const { clubId } = req.user;
    const { id } = req.params;

    const shift = await prisma.scheduledShift.findFirst({
      where: {
        id,
        clubId,
        status: 'SCHEDULED'
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found or already processed' });
    }

    const updatedShift = await prisma.scheduledShift.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date()
      }
    });

    res.json({
      message: 'Shift confirmed successfully',
      shift: updatedShift
    });
  } catch (error) {
    console.error('Confirm shift error:', error);
    res.status(500).json({ error: 'Failed to confirm shift' });
  }
});

// @route   POST /api/scheduled-shifts/:id/decline
// @desc    Entertainer declines a scheduled shift
// @access  Private (Entertainer)
router.post('/:id/decline', async (req, res) => {
  try {
    const { clubId } = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    const shift = await prisma.scheduledShift.findFirst({
      where: {
        id,
        clubId,
        status: 'SCHEDULED'
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found or already processed' });
    }

    const updatedShift = await prisma.scheduledShift.update({
      where: { id },
      data: {
        status: 'DECLINED',
        declinedAt: new Date(),
        declineReason: reason
      }
    });

    // Notify manager
    await prisma.shiftNotification.create({
      data: {
        clubId,
        entertainerId: shift.entertainerId,
        userId: shift.createdBy,
        scheduledShiftId: id,
        notificationType: 'SHIFT_DECLINED',
        title: 'Shift Declined',
        message: `Entertainer has declined the shift on ${shift.shiftDate.toLocaleDateString()}.${reason ? ` Reason: ${reason}` : ''}`,
        deliveryMethod: 'IN_APP',
        metadata: { shiftId: id, reason }
      }
    });

    res.json({
      message: 'Shift declined',
      shift: updatedShift
    });
  } catch (error) {
    console.error('Decline shift error:', error);
    res.status(500).json({ error: 'Failed to decline shift' });
  }
});

// ==============================================
// SHIFT SWAP REQUESTS (Feature #23)
// ==============================================

// @route   GET /api/scheduled-shifts/swaps
// @desc    Get all swap requests
// @access  Manager, Super Manager, Owner only
router.get('/swaps', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { status = 'PENDING' } = req.query;

    const swaps = await prisma.shiftSwap.findMany({
      where: {
        clubId,
        ...(status && { status })
      },
      include: {
        scheduledShift: {
          include: {
            entertainer: {
              select: {
                id: true,
                stageName: true,
                legalName: true
              }
            }
          }
        },
        requester: {
          select: {
            id: true,
            stageName: true,
            legalName: true
          }
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { requestedDate: 'desc' }
    });

    res.json(swaps);
  } catch (error) {
    console.error('Get swap requests error:', error);
    res.status(500).json({ error: 'Failed to fetch swap requests' });
  }
});

// @route   POST /api/scheduled-shifts/:id/swap-request
// @desc    Request a shift swap
// @access  Private (Entertainer)
router.post('/:id/swap-request', async (req, res) => {
  try {
    const { clubId } = req.user;
    const { id } = req.params;
    const { reason, swapWithEntertainerId } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required for swap request' });
    }

    // Check if shift exists and is not already swapped
    const shift = await prisma.scheduledShift.findFirst({
      where: {
        id,
        clubId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Shift not found or not eligible for swap' });
    }

    // Check if swap request already exists
    const existingSwap = await prisma.shiftSwap.findFirst({
      where: {
        scheduledShiftId: id,
        status: 'PENDING'
      }
    });

    if (existingSwap) {
      return res.status(409).json({ error: 'Swap request already pending for this shift' });
    }

    // Create swap request
    const swapRequest = await prisma.shiftSwap.create({
      data: {
        clubId,
        scheduledShiftId: id,
        requestedBy: shift.entertainerId,
        swapWithEntertainerId,
        reason
      },
      include: {
        scheduledShift: {
          include: {
            entertainer: {
              select: {
                stageName: true
              }
            }
          }
        }
      }
    });

    // Notify managers
    await prisma.shiftNotification.create({
      data: {
        clubId,
        entertainerId: shift.entertainerId,
        userId: shift.createdBy,
        scheduledShiftId: id,
        notificationType: 'SHIFT_SWAP_REQUEST',
        title: 'Shift Swap Request',
        message: `${swapRequest.scheduledShift.entertainer.stageName} has requested a swap for shift on ${shift.shiftDate.toLocaleDateString()}`,
        deliveryMethod: 'IN_APP',
        metadata: { shiftId: id, swapRequestId: swapRequest.id }
      }
    });

    res.status(201).json({
      message: 'Swap request submitted successfully',
      swapRequest
    });
  } catch (error) {
    console.error('Create swap request error:', error);
    res.status(500).json({ error: 'Failed to create swap request' });
  }
});

// @route   POST /api/scheduled-shifts/swaps/:swapId/approve
// @desc    Approve a shift swap request
// @access  Manager, Super Manager, Owner only
router.post('/swaps/:swapId/approve', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { id: userId, clubId } = req.user;
    const { swapId } = req.params;
    const { newEntertainerId, notes } = req.body;

    // Get swap request
    const swapRequest = await prisma.shiftSwap.findFirst({
      where: {
        id: swapId,
        clubId,
        status: 'PENDING'
      },
      include: {
        scheduledShift: true
      }
    });

    if (!swapRequest) {
      return res.status(404).json({ error: 'Swap request not found or already processed' });
    }

    // Begin transaction to update both swap and shift
    const result = await prisma.$transaction(async (tx) => {
      // Update swap request
      const updatedSwap = await tx.shiftSwap.update({
        where: { id: swapId },
        data: {
          status: 'APPROVED',
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNotes: notes
        }
      });

      // Update shift with new entertainer if provided
      let updatedShift = swapRequest.scheduledShift;
      if (newEntertainerId || swapRequest.swapWithEntertainerId) {
        const replacementId = newEntertainerId || swapRequest.swapWithEntertainerId;
        
        // Verify replacement entertainer exists
        const replacement = await tx.entertainer.findFirst({
          where: {
            id: replacementId,
            clubId
          }
        });

        if (!replacement) {
          throw new Error('Replacement entertainer not found');
        }

        updatedShift = await tx.scheduledShift.update({
          where: { id: swapRequest.scheduledShiftId },
          data: {
            entertainerId: replacementId,
            status: 'SCHEDULED', // Reset to scheduled for new entertainer
            confirmedAt: null,
            declinedAt: null,
            declineReason: null
          }
        });

        // Notify new entertainer
        await tx.shiftNotification.create({
          data: {
            clubId,
            entertainerId: replacementId,
            scheduledShiftId: swapRequest.scheduledShiftId,
            notificationType: 'SHIFT_ASSIGNED',
            title: 'Shift Assigned',
            message: `You have been assigned a shift on ${swapRequest.scheduledShift.shiftDate.toLocaleDateString()}`,
            deliveryMethod: 'IN_APP',
            metadata: { shiftId: swapRequest.scheduledShiftId, fromSwap: true }
          }
        });
      }

      // Notify original entertainer
      await tx.shiftNotification.create({
        data: {
          clubId,
          entertainerId: swapRequest.requestedBy,
          scheduledShiftId: swapRequest.scheduledShiftId,
          notificationType: 'SHIFT_SWAP_APPROVED',
          title: 'Shift Swap Approved',
          message: 'Your shift swap request has been approved',
          deliveryMethod: 'IN_APP',
          metadata: { swapRequestId: swapId }
        }
      });

      return { updatedSwap, updatedShift };
    });

    res.json({
      message: 'Swap request approved successfully',
      swap: result.updatedSwap,
      shift: result.updatedShift
    });
  } catch (error) {
    console.error('Approve swap request error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve swap request' });
  }
});

// @route   POST /api/scheduled-shifts/swaps/:swapId/deny
// @desc    Deny a shift swap request
// @access  Manager, Super Manager, Owner only
router.post('/swaps/:swapId/deny', authorize('MANAGER', 'SUPER_MANAGER', 'OWNER'), async (req, res) => {
  try {
    const { id: userId, clubId } = req.user;
    const { swapId } = req.params;
    const { reason } = req.body;

    const swapRequest = await prisma.shiftSwap.findFirst({
      where: {
        id: swapId,
        clubId,
        status: 'PENDING'
      }
    });

    if (!swapRequest) {
      return res.status(404).json({ error: 'Swap request not found or already processed' });
    }

    // Update swap request
    const updatedSwap = await prisma.shiftSwap.update({
      where: { id: swapId },
      data: {
        status: 'DENIED',
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: reason
      }
    });

    // Notify requester
    await prisma.shiftNotification.create({
      data: {
        clubId,
        entertainerId: swapRequest.requestedBy,
        scheduledShiftId: swapRequest.scheduledShiftId,
        notificationType: 'SHIFT_SWAP_DENIED',
        title: 'Shift Swap Denied',
        message: `Your shift swap request has been denied.${reason ? ` Reason: ${reason}` : ''}`,
        deliveryMethod: 'IN_APP',
        metadata: { swapRequestId: swapId, reason }
      }
    });

    res.json({
      message: 'Swap request denied',
      swap: updatedSwap
    });
  } catch (error) {
    console.error('Deny swap request error:', error);
    res.status(500).json({ error: 'Failed to deny swap request' });
  }
});

// @route   GET /api/scheduled-shifts/notifications
// @desc    Get shift notifications for current user
// @access  Private
router.get('/notifications', async (req, res) => {
  try {
    const { id: userId, clubId } = req.user;
    const { unreadOnly = 'false' } = req.query;

    const where = {
      clubId,
      OR: [
        { userId },
        // Also get notifications for entertainers associated with this user
        // (if user account is linked to entertainer profile)
      ]
    };

    if (unreadOnly === 'true') {
      where.readAt = null;
    }

    const notifications = await prisma.shiftNotification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: 50
    });

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// @route   PATCH /api/scheduled-shifts/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { clubId } = req.user;
    const { id } = req.params;

    const notification = await prisma.shiftNotification.findFirst({
      where: {
        id,
        clubId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.shiftNotification.update({
      where: { id },
      data: { readAt: new Date() }
    });

    res.json(updated);
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router;