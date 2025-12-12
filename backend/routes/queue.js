// ClubOps - DJ Queue Management Routes
// Full CRUD operations for stage queue management

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/queue - Get all queue entries for the club
router.get('/', async (req, res) => {
  try {
    const clubId = req.clubId;
    
    const queueItems = await prisma.djQueue.findMany({
      where: { clubId },
      include: {
        dancer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
          }
        }
      },
      orderBy: [
        { stageName: 'asc' },
        { position: 'asc' }
      ]
    });

    // Group by stage
    const groupedByStage = queueItems.reduce((acc, item) => {
      if (!acc[item.stageName]) {
        acc[item.stageName] = [];
      }
      acc[item.stageName].push(item);
      return acc;
    }, {});

    res.json({
      success: true,
      queue: queueItems,
      byStage: groupedByStage,
      totalInQueue: queueItems.length
    });
  } catch (error) {
    console.error('Queue fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/queue/:stage - Get queue for specific stage
router.get('/stage/:stage', async (req, res) => {
  try {
    const clubId = req.clubId;
    const { stage } = req.params;

    const queueItems = await prisma.djQueue.findMany({
      where: { 
        clubId,
        stageName: stage
      },
      include: {
        dancer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
          }
        }
      },
      orderBy: { position: 'asc' }
    });

    // Get currently performing (status = 'performing')
    const currentPerformer = queueItems.find(item => item.status === 'performing');
    const upNext = queueItems.filter(item => item.status === 'queued');

    res.json({
      success: true,
      stage,
      currentPerformer,
      upNext,
      totalInQueue: queueItems.length
    });
  } catch (error) {
    console.error('Stage queue fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/queue - Add dancer to queue
router.post('/', async (req, res) => {
  try {
    const clubId = req.clubId;
    const { dancerId, stageName, songRequest, durationMinutes } = req.body;

    // Validate dancer exists
    const dancer = await prisma.dancer.findFirst({
      where: { id: dancerId, clubId }
    });

    if (!dancer) {
      return res.status(404).json({ error: 'Dancer not found' });
    }

    // Get next position for this stage
    const maxPosition = await prisma.djQueue.aggregate({
      where: { clubId, stageName: stageName || 'Main Stage' },
      _max: { position: true }
    });

    const nextPosition = (maxPosition._max.position || 0) + 1;

    const queueItem = await prisma.djQueue.create({
      data: {
        clubId,
        dancerId,
        stageName: stageName || 'Main Stage',
        position: nextPosition,
        songRequest,
        durationMinutes: durationMinutes || 3,
        status: 'queued'
      },
      include: {
        dancer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
          }
        }
      }
    });

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('queue-updated', {
        action: 'added',
        item: queueItem
      });
    }

    res.status(201).json({
      success: true,
      message: 'Added to queue',
      item: queueItem
    });
  } catch (error) {
    console.error('Queue add error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/queue/:id - Update queue item (position, status, etc.)
router.put('/:id', async (req, res) => {
  try {
    const clubId = req.clubId;
    const { id } = req.params;
    const { position, status, songRequest, durationMinutes } = req.body;

    // Verify ownership
    const existing = await prisma.djQueue.findFirst({
      where: { id, clubId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    const updateData = {};
    if (position !== undefined) updateData.position = position;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'performing') {
        updateData.startedAt = new Date();
      } else if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (songRequest !== undefined) updateData.songRequest = songRequest;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;

    const updated = await prisma.djQueue.update({
      where: { id },
      data: updateData,
      include: {
        dancer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
          }
        }
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('queue-updated', {
        action: 'updated',
        item: updated
      });
    }

    res.json({
      success: true,
      message: 'Queue item updated',
      item: updated
    });
  } catch (error) {
    console.error('Queue update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/queue/reorder - Reorder queue items (drag-and-drop)
router.put('/reorder', async (req, res) => {
  try {
    const clubId = req.clubId;
    const { stageName, orderedIds } = req.body;

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array required' });
    }

    // Update positions in transaction
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.djQueue.updateMany({
          where: { id, clubId, stageName: stageName || 'Main Stage' },
          data: { position: index + 1 }
        })
      )
    );

    // Fetch updated queue
    const updatedQueue = await prisma.djQueue.findMany({
      where: { clubId, stageName: stageName || 'Main Stage' },
      include: {
        dancer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
          }
        }
      },
      orderBy: { position: 'asc' }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('queue-updated', {
        action: 'reordered',
        stageName: stageName || 'Main Stage',
        queue: updatedQueue
      });
    }

    res.json({
      success: true,
      message: 'Queue reordered',
      queue: updatedQueue
    });
  } catch (error) {
    console.error('Queue reorder error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/queue/:id/start - Start performer's set
router.post('/:id/start', async (req, res) => {
  try {
    const clubId = req.clubId;
    const { id } = req.params;

    const queueItem = await prisma.djQueue.findFirst({
      where: { id, clubId }
    });

    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    // Mark any currently performing as completed
    await prisma.djQueue.updateMany({
      where: { 
        clubId, 
        stageName: queueItem.stageName,
        status: 'performing'
      },
      data: { 
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Start this performer
    const updated = await prisma.djQueue.update({
      where: { id },
      data: {
        status: 'performing',
        startedAt: new Date()
      },
      include: {
        dancer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
          }
        }
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('queue-updated', {
        action: 'started',
        item: updated
      });
    }

    res.json({
      success: true,
      message: 'Performance started',
      item: updated
    });
  } catch (error) {
    console.error('Queue start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/queue/:id/complete - Complete performer's set
router.post('/:id/complete', async (req, res) => {
  try {
    const clubId = req.clubId;
    const { id } = req.params;

    const updated = await prisma.djQueue.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date()
      },
      include: {
        dancer: {
          select: {
            id: true,
            stageName: true,
            photoUrl: true
          }
        }
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('queue-updated', {
        action: 'completed',
        item: updated
      });
    }

    res.json({
      success: true,
      message: 'Performance completed',
      item: updated
    });
  } catch (error) {
    console.error('Queue complete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/queue/:id - Remove from queue
router.delete('/:id', async (req, res) => {
  try {
    const clubId = req.clubId;
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.djQueue.findFirst({
      where: { id, clubId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    await prisma.djQueue.delete({
      where: { id }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('queue-updated', {
        action: 'removed',
        itemId: id,
        stageName: existing.stageName
      });
    }

    res.json({
      success: true,
      message: 'Removed from queue'
    });
  } catch (error) {
    console.error('Queue delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/queue/clear/:stage - Clear completed items from stage
router.delete('/clear/:stage', async (req, res) => {
  try {
    const clubId = req.clubId;
    const { stage } = req.params;

    const deleted = await prisma.djQueue.deleteMany({
      where: { 
        clubId, 
        stageName: stage,
        status: 'completed'
      }
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`club-${clubId}`).emit('queue-updated', {
        action: 'cleared',
        stageName: stage
      });
    }

    res.json({
      success: true,
      message: `Cleared ${deleted.count} completed items`,
      count: deleted.count
    });
  } catch (error) {
    console.error('Queue clear error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/queue/stats - Get queue statistics
router.get('/stats', async (req, res) => {
  try {
    const clubId = req.clubId;

    const [totalQueued, totalPerforming, totalCompleted] = await Promise.all([
      prisma.djQueue.count({
        where: { clubId, status: 'queued' }
      }),
      prisma.djQueue.count({
        where: { clubId, status: 'performing' }
      }),
      prisma.djQueue.count({
        where: { clubId, status: 'completed' }
      })
    ]);

    res.json({
      success: true,
      stats: {
        queued: totalQueued,
        performing: totalPerforming,
        completed: totalCompleted,
        total: totalQueued + totalPerforming + totalCompleted
      }
    });
  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
