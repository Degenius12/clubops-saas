// Club Onboarding Routes (Feature #50)
// Handles the initial setup wizard for new clubs

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { auth, authorize } = require('../middleware/auth');

// ============================================================================
// GET /api/club-onboarding/status
// Get current onboarding status for the club
// ============================================================================
router.get('/status', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const { clubId } = req.user;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        onboardingCompleted: true,
        onboardingCompletedAt: true,
        onboardingStep: true,
        // Current configuration
        stageCount: true,
        stageRotationSequence: true,
        stageRotationEnabled: true,
        vipBillingType: true,
        vipTimeIncrement: true,
        vipTimeRate: true,
        vipSongRate: true,
        avgSongDuration: true,
        doorCountEnabled: true,
        capacityLimit: true,
        reEntryFeeEnabled: true,
        reEntryFeeAmount: true
      }
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json({
      success: true,
      onboarding: {
        completed: club.onboardingCompleted,
        completedAt: club.onboardingCompletedAt,
        currentStep: club.onboardingStep
      },
      configuration: {
        stages: {
          count: club.stageCount,
          rotationSequence: club.stageRotationSequence,
          rotationEnabled: club.stageRotationEnabled
        },
        vipBilling: {
          type: club.vipBillingType,
          timeIncrement: club.vipTimeIncrement,
          timeRate: club.vipTimeRate,
          songRate: club.vipSongRate,
          avgSongDuration: club.avgSongDuration
        },
        patronCount: {
          enabled: club.doorCountEnabled,
          capacityLimit: club.capacityLimit,
          reEntryFeeEnabled: club.reEntryFeeEnabled,
          reEntryFeeAmount: club.reEntryFeeAmount
        }
      }
    });
  } catch (error) {
    console.error('[club-onboarding] Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

// ============================================================================
// POST /api/club-onboarding/stage-config
// Configure stage settings (Step 1 of onboarding)
// ============================================================================
router.post('/stage-config', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const { stageCount, stageRotationSequence, stageRotationEnabled } = req.body;

    // Validation
    if (typeof stageCount !== 'number' || stageCount < 1 || stageCount > 10) {
      return res.status(400).json({ error: 'Stage count must be between 1 and 10' });
    }

    if (stageRotationSequence) {
      if (!Array.isArray(stageRotationSequence)) {
        return res.status(400).json({ error: 'Stage rotation sequence must be an array' });
      }
      if (stageRotationSequence.length !== stageCount) {
        return res.status(400).json({ error: 'Rotation sequence length must match stage count' });
      }
      // Validate each stage name
      for (const stageName of stageRotationSequence) {
        if (typeof stageName !== 'string' || stageName.trim().length === 0) {
          return res.status(400).json({ error: 'Each stage name must be a non-empty string' });
        }
        if (stageName.length > 50) {
          return res.status(400).json({ error: 'Stage names cannot exceed 50 characters' });
        }
      }
    }

    // Update club with stage configuration
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: {
        stageCount,
        stageRotationSequence: stageRotationSequence || null,
        stageRotationEnabled: stageRotationEnabled || false,
        onboardingStep: Math.max(await getCurrentStep(clubId), 1) // Advance to at least step 1
      },
      select: {
        stageCount: true,
        stageRotationSequence: true,
        stageRotationEnabled: true,
        onboardingStep: true
      }
    });

    res.json({
      success: true,
      message: 'Stage configuration saved',
      stageConfig: {
        count: updatedClub.stageCount,
        rotationSequence: updatedClub.stageRotationSequence,
        rotationEnabled: updatedClub.stageRotationEnabled
      },
      nextStep: updatedClub.onboardingStep + 1
    });
  } catch (error) {
    console.error('[club-onboarding] Error saving stage config:', error);
    res.status(500).json({ error: 'Failed to save stage configuration' });
  }
});

// ============================================================================
// POST /api/club-onboarding/vip-billing-config
// Configure VIP billing settings (Step 2 of onboarding)
// ============================================================================
router.post('/vip-billing-config', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const {
      vipBillingType,
      vipTimeIncrement,
      vipTimeRate,
      vipSongRate,
      avgSongDuration
    } = req.body;

    // Validation
    if (!['SONG', 'TIME'].includes(vipBillingType)) {
      return res.status(400).json({ error: 'VIP billing type must be either SONG or TIME' });
    }

    // Validate based on billing type
    if (vipBillingType === 'TIME') {
      if (!vipTimeIncrement || typeof vipTimeIncrement !== 'number' || vipTimeIncrement < 1) {
        return res.status(400).json({ error: 'Time increment is required and must be positive when using TIME billing' });
      }
      if (!vipTimeRate || typeof vipTimeRate !== 'number' || vipTimeRate < 0) {
        return res.status(400).json({ error: 'Time rate is required and must be non-negative when using TIME billing' });
      }
    } else if (vipBillingType === 'SONG') {
      if (!vipSongRate || typeof vipSongRate !== 'number' || vipSongRate < 0) {
        return res.status(400).json({ error: 'Song rate is required and must be non-negative when using SONG billing' });
      }
      if (avgSongDuration && (typeof avgSongDuration !== 'number' || avgSongDuration < 1)) {
        return res.status(400).json({ error: 'Average song duration must be a positive number (in seconds)' });
      }
    }

    // Update club with VIP billing configuration
    const updateData = {
      vipBillingType,
      onboardingStep: Math.max(await getCurrentStep(clubId), 2) // Advance to at least step 2
    };

    if (vipBillingType === 'TIME') {
      updateData.vipTimeIncrement = vipTimeIncrement;
      updateData.vipTimeRate = vipTimeRate;
    } else {
      updateData.vipSongRate = vipSongRate || 30.00; // Default $30/song
      if (avgSongDuration) {
        updateData.avgSongDuration = avgSongDuration;
      }
    }

    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      select: {
        vipBillingType: true,
        vipTimeIncrement: true,
        vipTimeRate: true,
        vipSongRate: true,
        avgSongDuration: true,
        onboardingStep: true
      }
    });

    res.json({
      success: true,
      message: 'VIP billing configuration saved',
      vipBillingConfig: {
        type: updatedClub.vipBillingType,
        timeIncrement: updatedClub.vipTimeIncrement,
        timeRate: updatedClub.vipTimeRate,
        songRate: updatedClub.vipSongRate,
        avgSongDuration: updatedClub.avgSongDuration
      },
      nextStep: updatedClub.onboardingStep + 1
    });
  } catch (error) {
    console.error('[club-onboarding] Error saving VIP billing config:', error);
    res.status(500).json({ error: 'Failed to save VIP billing configuration' });
  }
});

// ============================================================================
// POST /api/club-onboarding/patron-count-config
// Configure patron count system settings (Step 3 of onboarding - OPTIONAL)
// ============================================================================
router.post('/patron-count-config', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const { clubId } = req.user;
    const {
      doorCountEnabled,
      capacityLimit,
      reEntryFeeEnabled,
      reEntryFeeAmount
    } = req.body;

    // Validation (all optional - can skip this step)
    const updateData = {
      onboardingStep: Math.max(await getCurrentStep(clubId), 3) // Advance to at least step 3
    };

    if (typeof doorCountEnabled === 'boolean') {
      updateData.doorCountEnabled = doorCountEnabled;
    }

    if (capacityLimit !== undefined) {
      if (typeof capacityLimit !== 'number' || capacityLimit < 1) {
        return res.status(400).json({ error: 'Capacity limit must be a positive number' });
      }
      updateData.capacityLimit = capacityLimit;
    }

    if (typeof reEntryFeeEnabled === 'boolean') {
      updateData.reEntryFeeEnabled = reEntryFeeEnabled;
    }

    if (reEntryFeeAmount !== undefined) {
      if (typeof reEntryFeeAmount !== 'number' || reEntryFeeAmount < 0) {
        return res.status(400).json({ error: 'Re-entry fee amount must be non-negative' });
      }
      updateData.reEntryFeeAmount = reEntryFeeAmount;
    }

    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      select: {
        doorCountEnabled: true,
        capacityLimit: true,
        reEntryFeeEnabled: true,
        reEntryFeeAmount: true,
        onboardingStep: true
      }
    });

    res.json({
      success: true,
      message: 'Patron count configuration saved',
      patronCountConfig: {
        enabled: updatedClub.doorCountEnabled,
        capacityLimit: updatedClub.capacityLimit,
        reEntryFeeEnabled: updatedClub.reEntryFeeEnabled,
        reEntryFeeAmount: updatedClub.reEntryFeeAmount
      },
      nextStep: updatedClub.onboardingStep + 1
    });
  } catch (error) {
    console.error('[club-onboarding] Error saving patron count config:', error);
    res.status(500).json({ error: 'Failed to save patron count configuration' });
  }
});

// ============================================================================
// POST /api/club-onboarding/complete
// Mark onboarding as complete (Final step)
// ============================================================================
router.post('/complete', auth, authorize('OWNER', 'SUPER_MANAGER'), async (req, res) => {
  try {
    const { clubId } = req.user;

    // Verify that required steps are complete
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        onboardingStep: true,
        onboardingCompleted: true,
        stageCount: true,
        vipBillingType: true
      }
    });

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    if (club.onboardingCompleted) {
      return res.status(400).json({ error: 'Onboarding already completed' });
    }

    // Verify minimum required configuration
    if (club.onboardingStep < 2) {
      return res.status(400).json({
        error: 'Please complete stage configuration and VIP billing configuration before finishing onboarding',
        currentStep: club.onboardingStep
      });
    }

    // Mark onboarding as complete
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: 4 // Final step
      },
      select: {
        id: true,
        name: true,
        onboardingCompleted: true,
        onboardingCompletedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      club: {
        id: updatedClub.id,
        name: updatedClub.name,
        onboardingCompletedAt: updatedClub.onboardingCompletedAt
      }
    });
  } catch (error) {
    console.error('[club-onboarding] Error completing onboarding:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// ============================================================================
// POST /api/club-onboarding/restart
// Allow re-running onboarding (for OWNER only)
// ============================================================================
router.post('/restart', auth, authorize('OWNER'), async (req, res) => {
  try {
    const { clubId } = req.user;

    await prisma.club.update({
      where: { id: clubId },
      data: {
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        onboardingStep: 0
      }
    });

    res.json({
      success: true,
      message: 'Onboarding has been reset. You can now go through the setup wizard again.'
    });
  } catch (error) {
    console.error('[club-onboarding] Error restarting onboarding:', error);
    res.status(500).json({ error: 'Failed to restart onboarding' });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentStep(clubId) {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { onboardingStep: true }
  });
  return club?.onboardingStep || 0;
}

module.exports = router;
