// Club Settings Management API (Features #35-36)
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

// ============================================================================
// FEE STRUCTURE CUSTOMIZATION (Feature #35)
// ============================================================================

// @route   GET /api/settings/fee-structure
// @desc    Get club's fee structure configuration
// @access  Private (Manager+)
router.get('/fee-structure', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        barFeeAmount: true,
        lateFeeEnabled: true,
        lateFeeAmount: true,
        lateFeeGraceDays: true,
        lateFeeFrequency: true,
        settings: true
      }
    });

    // Parse custom fee structures from settings JSON
    const settings = typeof club.settings === 'string'
      ? JSON.parse(club.settings)
      : club.settings || {};

    const feeStructure = {
      barFee: {
        amount: parseFloat(club.barFeeAmount),
        enabled: true
      },
      lateFee: {
        enabled: club.lateFeeEnabled,
        amount: parseFloat(club.lateFeeAmount),
        graceDays: club.lateFeeGraceDays,
        frequency: club.lateFeeFrequency
      },
      customFees: settings.customFees || [],
      shiftBasedFees: settings.shiftBasedFees || {
        dayShift: null,
        nightShift: null,
        customShift: null
      }
    };

    res.json({
      success: true,
      feeStructure
    });

  } catch (error) {
    console.error('Get fee structure error:', error);
    res.status(500).json({ error: 'Failed to fetch fee structure' });
  }
});

// @route   PUT /api/settings/fee-structure
// @desc    Update club's fee structure
// @access  Private (Owner only)
router.put('/fee-structure', [
  auth,
  authorize('OWNER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { barFee, lateFee, customFees, shiftBasedFees } = req.body;

    const updateData = {};

    // Update bar fee
    if (barFee !== undefined) {
      if (barFee.amount !== undefined) {
        updateData.barFeeAmount = barFee.amount;
      }
    }

    // Update late fee settings
    if (lateFee !== undefined) {
      if (lateFee.enabled !== undefined) updateData.lateFeeEnabled = lateFee.enabled;
      if (lateFee.amount !== undefined) updateData.lateFeeAmount = lateFee.amount;
      if (lateFee.graceDays !== undefined) updateData.lateFeeGraceDays = lateFee.graceDays;
      if (lateFee.frequency !== undefined) updateData.lateFeeFrequency = lateFee.frequency;
    }

    // Update custom fees and shift-based fees in settings JSON
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { settings: true }
    });

    const settings = typeof club.settings === 'string'
      ? JSON.parse(club.settings)
      : club.settings || {};

    if (customFees !== undefined) {
      settings.customFees = customFees;
    }

    if (shiftBasedFees !== undefined) {
      settings.shiftBasedFees = shiftBasedFees;
    }

    updateData.settings = settings;

    // Apply updates
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: updateData,
      select: {
        barFeeAmount: true,
        lateFeeEnabled: true,
        lateFeeAmount: true,
        lateFeeGraceDays: true,
        lateFeeFrequency: true,
        settings: true
      }
    });

    res.json({
      success: true,
      message: 'Fee structure updated successfully',
      feeStructure: {
        barFee: {
          amount: parseFloat(updatedClub.barFeeAmount),
          enabled: true
        },
        lateFee: {
          enabled: updatedClub.lateFeeEnabled,
          amount: parseFloat(updatedClub.lateFeeAmount),
          graceDays: updatedClub.lateFeeGraceDays,
          frequency: updatedClub.lateFeeFrequency
        },
        customFees: settings.customFees || [],
        shiftBasedFees: settings.shiftBasedFees || {}
      }
    });

  } catch (error) {
    console.error('Update fee structure error:', error);
    res.status(500).json({ error: 'Failed to update fee structure' });
  }
});

// ============================================================================
// VIP BOOTH CUSTOMIZATION (Feature #36)
// ============================================================================

// @route   GET /api/settings/vip-config
// @desc    Get VIP booth configuration
// @access  Private (Manager+)
router.get('/vip-config', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: {
        vipSongRate: true,
        avgSongDuration: true,
        settings: true
      }
    });

    const settings = typeof club.settings === 'string'
      ? JSON.parse(club.settings)
      : club.settings || {};

    // Get all VIP booths
    const booths = await prisma.vipBooth.findMany({
      where: { clubId },
      orderBy: { boothNumber: 'asc' }
    });

    res.json({
      success: true,
      vipConfig: {
        defaultSongRate: parseFloat(club.vipSongRate),
        avgSongDuration: club.avgSongDuration,
        timeBasedRates: settings.vipTimeBasedRates || {},
        booths: booths.map(b => ({
          id: b.id,
          boothName: b.boothName,
          boothNumber: b.boothNumber,
          capacity: b.capacity,
          songRate: b.songRate ? parseFloat(b.songRate) : null,
          isAvailable: b.isAvailable,
          isActive: b.isActive
        }))
      }
    });

  } catch (error) {
    console.error('Get VIP config error:', error);
    res.status(500).json({ error: 'Failed to fetch VIP configuration' });
  }
});

// @route   PUT /api/settings/vip-config
// @desc    Update VIP booth configuration
// @access  Private (Owner only)
router.put('/vip-config', [
  auth,
  authorize('OWNER')
], async (req, res) => {
  try {
    const { clubId } = req.user;
    const { defaultSongRate, avgSongDuration, timeBasedRates, boothUpdates } = req.body;

    const updateData = {};

    if (defaultSongRate !== undefined) {
      updateData.vipSongRate = defaultSongRate;
    }

    if (avgSongDuration !== undefined) {
      updateData.avgSongDuration = avgSongDuration;
    }

    // Update time-based rates in settings
    if (timeBasedRates !== undefined) {
      const club = await prisma.club.findUnique({
        where: { id: clubId },
        select: { settings: true }
      });

      const settings = typeof club.settings === 'string'
        ? JSON.parse(club.settings)
        : club.settings || {};

      settings.vipTimeBasedRates = timeBasedRates;
      updateData.settings = settings;
    }

    // Update club defaults
    if (Object.keys(updateData).length > 0) {
      await prisma.club.update({
        where: { id: clubId },
        data: updateData
      });
    }

    // Update individual booth settings
    if (boothUpdates && Array.isArray(boothUpdates)) {
      for (const boothUpdate of boothUpdates) {
        const { boothId, songRate, capacity, isAvailable } = boothUpdate;

        const boothUpdateData = {};
        if (songRate !== undefined) boothUpdateData.songRate = songRate;
        if (capacity !== undefined) boothUpdateData.capacity = capacity;
        if (isAvailable !== undefined) boothUpdateData.isAvailable = isAvailable;

        if (Object.keys(boothUpdateData).length > 0) {
          await prisma.vipBooth.update({
            where: { id: boothId },
            data: boothUpdateData
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'VIP configuration updated successfully'
    });

  } catch (error) {
    console.error('Update VIP config error:', error);
    res.status(500).json({ error: 'Failed to update VIP configuration' });
  }
});

// ============================================================================
// GENERAL CLUB SETTINGS
// ============================================================================

// @route   GET /api/settings/club
// @desc    Get all club settings
// @access  Private (Manager+)
router.get('/club', [
  auth,
  authorize('OWNER', 'SUPER_MANAGER', 'MANAGER')
], async (req, res) => {
  try {
    const { clubId } = req.user;

    const club = await prisma.club.findUnique({
      where: { id: clubId }
    });

    const settings = typeof club.settings === 'string'
      ? JSON.parse(club.settings)
      : club.settings || {};

    res.json({
      success: true,
      club: {
        id: club.id,
        name: club.name,
        subdomain: club.subdomain,
        subscriptionTier: club.subscriptionTier,
        subscriptionStatus: club.subscriptionStatus,
        barFeeAmount: parseFloat(club.barFeeAmount),
        vipSongRate: parseFloat(club.vipSongRate),
        avgSongDuration: club.avgSongDuration,
        lateFeeEnabled: club.lateFeeEnabled,
        lateFeeAmount: parseFloat(club.lateFeeAmount),
        lateFeeGraceDays: club.lateFeeGraceDays,
        lateFeeFrequency: club.lateFeeFrequency,
        settings
      }
    });

  } catch (error) {
    console.error('Get club settings error:', error);
    res.status(500).json({ error: 'Failed to fetch club settings' });
  }
});

module.exports = router;
