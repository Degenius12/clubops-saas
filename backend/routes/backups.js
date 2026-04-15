const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const backupService = require('../services/backupService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Apply authentication and authorization to all backup routes
router.use(auth);
router.use(authorize('OWNER')); // Only owners can manage backups

// ==============================================
// BACKUP OPERATIONS
// ==============================================

// @route   POST /api/backups/database
// @desc    Create a full database backup
// @access  Owner only
router.post('/database', async (req, res) => {
  try {
    const result = await backupService.backupDatabase();
    
    res.json({
      message: 'Database backup created successfully',
      backup: result
    });
  } catch (error) {
    console.error('Database backup failed:', error);
    res.status(500).json({
      error: 'Failed to create database backup',
      details: error.message
    });
  }
});

// @route   POST /api/backups/incremental
// @desc    Create an incremental backup
// @access  Owner only
router.post('/incremental', async (req, res) => {
  try {
    const result = await backupService.backupIncremental();
    
    res.json({
      message: 'Incremental backup created successfully',
      backup: result
    });
  } catch (error) {
    console.error('Incremental backup failed:', error);
    res.status(500).json({
      error: 'Failed to create incremental backup',
      details: error.message
    });
  }
});

// @route   POST /api/backups/configs
// @desc    Backup configuration files
// @access  Owner only
router.post('/configs', async (req, res) => {
  try {
    const result = await backupService.backupConfigs();
    
    res.json({
      message: 'Configuration backup created successfully',
      backup: result
    });
  } catch (error) {
    console.error('Configuration backup failed:', error);
    res.status(500).json({
      error: 'Failed to create configuration backup',
      details: error.message
    });
  }
});

// ==============================================
// RESTORE OPERATIONS
// ==============================================

// @route   POST /api/backups/restore
// @desc    Restore from a backup file
// @access  Owner only
router.post('/restore', async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({
        error: 'Backup file name is required'
      });
    }
    
    const result = await backupService.restoreDatabase(fileName);
    
    res.json({
      message: 'Database restored successfully',
      result
    });
  } catch (error) {
    console.error('Database restore failed:', error);
    res.status(500).json({
      error: 'Failed to restore database',
      details: error.message
    });
  }
});

// ==============================================
// BACKUP MANAGEMENT
// ==============================================

// @route   GET /api/backups/history
// @desc    Get backup history
// @access  Owner only
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, type } = req.query;
    
    const where = {};
    if (type) {
      where.type = type;
    }
    
    const backups = await prisma.backupLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });
    
    res.json(backups);
  } catch (error) {
    console.error('Failed to get backup history:', error);
    res.status(500).json({
      error: 'Failed to get backup history',
      details: error.message
    });
  }
});

// @route   GET /api/backups/stats
// @desc    Get backup statistics
// @access  Owner only
router.get('/stats', async (req, res) => {
  try {
    const stats = await backupService.getBackupStats();
    
    res.json(stats);
  } catch (error) {
    console.error('Failed to get backup stats:', error);
    res.status(500).json({
      error: 'Failed to get backup statistics',
      details: error.message
    });
  }
});

// @route   DELETE /api/backups/cleanup
// @desc    Clean up old backups
// @access  Owner only
router.delete('/cleanup', async (req, res) => {
  try {
    const { type = 'database' } = req.query;
    
    const deletedCount = await backupService.cleanupOldBackups(type);
    
    res.json({
      message: `Cleaned up ${deletedCount} old backups`,
      deletedCount
    });
  } catch (error) {
    console.error('Failed to cleanup backups:', error);
    res.status(500).json({
      error: 'Failed to cleanup old backups',
      details: error.message
    });
  }
});

// @route   GET /api/backups/test
// @desc    Test backup configuration
// @access  Owner only
router.get('/test', async (req, res) => {
  try {
    const result = await backupService.testBackupConfiguration();
    
    res.json({
      message: 'Backup configuration test completed',
      ...result
    });
  } catch (error) {
    console.error('Failed to test backup configuration:', error);
    res.status(500).json({
      error: 'Failed to test backup configuration',
      details: error.message
    });
  }
});

// @route   POST /api/backups/initialize
// @desc    Initialize backup system
// @access  Owner only
router.post('/initialize', async (req, res) => {
  try {
    await backupService.initializeBackupDirectory();
    
    res.json({
      message: 'Backup system initialized successfully'
    });
  } catch (error) {
    console.error('Failed to initialize backup system:', error);
    res.status(500).json({
      error: 'Failed to initialize backup system',
      details: error.message
    });
  }
});

module.exports = router;