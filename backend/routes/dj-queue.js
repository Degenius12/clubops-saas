// ClubOps - DJ Queue Management Routes
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get DJ queue for club (all stages)
router.get('/', async (req, res) => {
  try {
    const clubId = req.clubId;

    // Get all queued items, ordered by position
    const queueItems = await prisma.djQueue.findMany({
      where: {
        clubId,
        status: {
          in: ['queued', 'current']
        }
      },
      include: {
        dancer: {
          select: {
            id: true,
            name: true,
            stageName: true
          }
        }
      },
      orderBy: [
        { status: 'desc' }, // 'current' comes before 'queued' alphabetically (desc)
        { position: 'asc' }
      ]
    });

    // Separate by stage
    const mainQueue = queueItems
      .filter(item => item.stageName === 'main')
      .map(item => ({
        id: item.id,
        dancer_id: item.entertainerId,
        dancer_name: item.dancer.stageName || item.dancer.name,
        song_title: item.songRequest || 'Open Performance',
        artist: 'Unknown Artist',
        position: item.position,
        stage: item.stageName,
        status: item.status,
        duration: item.durationMinutes * 60,
        created_at: item.createdAt
      }));

    const vipQueue = queueItems
      .filter(item => item.stageName === 'vip')
      .map(item => ({
        id: item.id,
        dancer_id: item.entertainerId,
        dancer_name: item.dancer.stageName || item.dancer.name,
        song_title: item.songRequest || 'Open Performance',
        artist: 'Unknown Artist',
        position: item.position,
        stage: item.stageName,
        status: item.status,
        duration: item.durationMinutes * 60,
        created_at: item.createdAt
      }));

    // Get current performances (items with status 'current')
    const currentPerformances = queueItems
      .filter(item => item.status === 'current' && item.startedAt)
      .map(item => {
        const elapsedMs = Date.now() - new Date(item.startedAt).getTime();
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        const totalSeconds = item.durationMinutes * 60;
        const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

        return {
          dancer_id: item.entertainerId,
          dancer_name: item.dancer.stageName || item.dancer.name,
          song_title: item.songRequest || 'Open Performance',
          artist: 'Unknown Artist',
          start_time: item.startedAt,
          duration: totalSeconds,
          remaining_time: remainingSeconds,
          stage: item.stageName
        };
      });

    res.json({
      mainQueue,
      vipQueue,
      currentPerformances
    });
  } catch (error) {
    console.error('Error fetching DJ queue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add dancer to queue
router.post('/', async (req, res) => {
  try {
    const clubId = req.clubId;
    const { dancer_id, song_title, artist, stage } = req.body;

    if (!dancer_id) {
      return res.status(400).json({ error: 'Dancer ID is required' });
    }

    // Get the highest position for this stage
    const lastItem = await prisma.djQueue.findFirst({
      where: {
        clubId,
        stageName: stage || 'main',
        status: 'queued'
      },
      orderBy: {
        position: 'desc'
      }
    });

    const nextPosition = lastItem ? lastItem.position + 1 : 1;

    // Create queue item
    const queueItem = await prisma.djQueue.create({
      data: {
        clubId,
        entertainerId: dancer_id,
        stageName: stage || 'main',
        position: nextPosition,
        songRequest: song_title || null,
        durationMinutes: 3, // Default 3 minutes per song
        status: 'queued'
      },
      include: {
        dancer: {
          select: {
            id: true,
            name: true,
            stageName: true
          }
        }
      }
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('queue:updated', {
        action: 'added',
        stage: queueItem.stageName,
        queueItem: {
          id: queueItem.id,
          dancer_id: queueItem.entertainerId,
          dancer_name: queueItem.dancer.stageName || queueItem.dancer.name,
          song_title: queueItem.songRequest || 'Open Performance',
          position: queueItem.position,
          stage: queueItem.stageName,
          status: queueItem.status
        }
      });
    }

    res.json({
      id: queueItem.id,
      dancer_id: queueItem.entertainerId,
      dancer_name: queueItem.dancer.stageName || queueItem.dancer.name,
      song_title: queueItem.songRequest || 'Open Performance',
      artist: artist || 'Unknown Artist',
      position: queueItem.position,
      stage: queueItem.stageName,
      status: queueItem.status,
      duration: queueItem.durationMinutes * 60,
      created_at: queueItem.createdAt
    });
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start performance (mark as current, advance queue)
router.post('/:id/start', async (req, res) => {
  try {
    const clubId = req.clubId;
    const queueItemId = req.params.id;

    // Get the queue item
    const queueItem = await prisma.djQueue.findUnique({
      where: { id: queueItemId },
      include: {
        dancer: {
          select: {
            id: true,
            name: true,
            stageName: true
          }
        }
      }
    });

    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    if (queueItem.clubId !== clubId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark any current performance on this stage as completed
    await prisma.djQueue.updateMany({
      where: {
        clubId,
        stageName: queueItem.stageName,
        status: 'current'
      },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Mark this item as current
    const updatedItem = await prisma.djQueue.update({
      where: { id: queueItemId },
      data: {
        status: 'current',
        startedAt: new Date()
      },
      include: {
        dancer: {
          select: {
            id: true,
            name: true,
            stageName: true
          }
        }
      }
    });

    const performance = {
      dancer_id: updatedItem.entertainerId,
      dancer_name: updatedItem.dancer.stageName || updatedItem.dancer.name,
      song_title: updatedItem.songRequest || 'Open Performance',
      artist: 'Unknown Artist',
      start_time: updatedItem.startedAt,
      duration: updatedItem.durationMinutes * 60,
      remaining_time: updatedItem.durationMinutes * 60,
      stage: updatedItem.stageName
    };

    // Emit real-time event
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('performance:started', {
        stage: updatedItem.stageName,
        performance
      });
    }

    res.json(performance);
  } catch (error) {
    console.error('Error starting performance:', error);
    res.status(500).json({ error: error.message });
  }
});

// End performance (mark as completed)
router.post('/:id/end', async (req, res) => {
  try {
    const clubId = req.clubId;
    const queueItemId = req.params.id;

    // Get the queue item
    const queueItem = await prisma.djQueue.findUnique({
      where: { id: queueItemId }
    });

    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    if (queueItem.clubId !== clubId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark as completed
    await prisma.djQueue.update({
      where: { id: queueItemId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('performance:ended', {
        stage: queueItem.stageName,
        entertainerId: queueItem.entertainerId
      });
    }

    res.json({
      id: queueItemId,
      status: 'completed'
    });
  } catch (error) {
    console.error('Error ending performance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update queue item position (reorder)
router.put('/:id/position', async (req, res) => {
  try {
    const clubId = req.clubId;
    const queueItemId = req.params.id;
    const { position, stage } = req.body;

    if (typeof position !== 'number' || position < 1) {
      return res.status(400).json({ error: 'Invalid position' });
    }

    // Get the item being moved
    const item = await prisma.djQueue.findUnique({
      where: { id: queueItemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    if (item.clubId !== clubId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const oldPosition = item.position;
    const newPosition = position;
    const stageName = stage || item.stageName;

    // If moving down (position increased), shift items up
    if (newPosition > oldPosition) {
      await prisma.djQueue.updateMany({
        where: {
          clubId,
          stageName,
          status: 'queued',
          position: {
            gt: oldPosition,
            lte: newPosition
          }
        },
        data: {
          position: {
            decrement: 1
          }
        }
      });
    }
    // If moving up (position decreased), shift items down
    else if (newPosition < oldPosition) {
      await prisma.djQueue.updateMany({
        where: {
          clubId,
          stageName,
          status: 'queued',
          position: {
            gte: newPosition,
            lt: oldPosition
          }
        },
        data: {
          position: {
            increment: 1
          }
        }
      });
    }

    // Update the item's position
    const updatedItem = await prisma.djQueue.update({
      where: { id: queueItemId },
      data: {
        position: newPosition
      },
      include: {
        dancer: {
          select: {
            id: true,
            name: true,
            stageName: true
          }
        }
      }
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('queue:reordered', {
        stage: stageName,
        itemId: queueItemId,
        oldPosition,
        newPosition
      });
    }

    res.json({
      id: updatedItem.id,
      dancer_id: updatedItem.entertainerId,
      dancer_name: updatedItem.dancer.stageName || updatedItem.dancer.name,
      song_title: updatedItem.songRequest || 'Open Performance',
      position: updatedItem.position,
      stage: updatedItem.stageName,
      status: updatedItem.status
    });
  } catch (error) {
    console.error('Error reordering queue:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove from queue
router.delete('/:id', async (req, res) => {
  try {
    const clubId = req.clubId;
    const queueItemId = req.params.id;

    // Get the item
    const item = await prisma.djQueue.findUnique({
      where: { id: queueItemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    if (item.clubId !== clubId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete the item
    await prisma.djQueue.delete({
      where: { id: queueItemId }
    });

    // Shift remaining items up
    await prisma.djQueue.updateMany({
      where: {
        clubId,
        stageName: item.stageName,
        status: 'queued',
        position: {
          gt: item.position
        }
      },
      data: {
        position: {
          decrement: 1
        }
      }
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`club:${clubId}`).emit('queue:removed', {
        stage: item.stageName,
        itemId: queueItemId
      });
    }

    res.json({
      success: true,
      id: queueItemId
    });
  } catch (error) {
    console.error('Error removing from queue:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
