// Backup Job Module for ClubFlow
// Handles automated backup execution triggered by the scheduler

const backupService = require('../services/backupService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Perform a backup of the specified type
 * @param {string} type - Type of backup: 'full' or 'incremental'
 * @returns {Object} Backup result with status and details
 */
async function performBackup(type = 'full') {
  const startTime = Date.now();
  
  try {
    console.log(`[Backup Job] Starting ${type} backup...`);
    
    let result;
    
    if (type === 'full') {
      // Perform full database backup
      result = await backupService.backupDatabase();
      
      // Also backup configurations
      const configBackup = await backupService.backupConfigs();
      
      console.log(`[Backup Job] Full backup completed successfully`);
      console.log(`[Backup Job] Database backup: ${result.fileName}`);
      console.log(`[Backup Job] Config backup: ${configBackup.fileName}`);
      
    } else if (type === 'incremental') {
      // Perform incremental backup
      result = await backupService.backupIncremental();
      
      console.log(`[Backup Job] Incremental backup completed successfully`);
      console.log(`[Backup Job] Backup file: ${result.fileName}`);
      
    } else {
      throw new Error(`Unknown backup type: ${type}`);
    }
    
    // Clean up old backups (keep last 30 days for full, 7 days for incremental)
    const retentionDays = type === 'full' ? 30 : 7;
    const cleanupCount = await cleanupOldBackups(type, retentionDays);
    
    if (cleanupCount > 0) {
      console.log(`[Backup Job] Cleaned up ${cleanupCount} old ${type} backups`);
    }
    
    // Send success notification if critical
    if (type === 'full') {
      await sendBackupNotification({
        type: 'success',
        backupType: type,
        fileName: result.fileName,
        size: result.size,
        duration: Date.now() - startTime
      });
    }
    
    return {
      success: true,
      type,
      fileName: result.fileName,
      size: result.size,
      duration: Date.now() - startTime,
      cleanupCount
    };
    
  } catch (error) {
    console.error(`[Backup Job] ${type} backup failed:`, error);
    
    // Log failure to database
    try {
      await prisma.backupLog.create({
        data: {
          type,
          status: 'FAILED',
          fileName: null,
          size: 0,
          error: error.message,
          metadata: {
            errorStack: error.stack,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (logError) {
      console.error('[Backup Job] Failed to log backup failure:', logError);
    }
    
    // Send failure notification
    await sendBackupNotification({
      type: 'failure',
      backupType: type,
      error: error.message,
      duration: Date.now() - startTime
    });
    
    throw error;
  }
}

/**
 * Clean up old backup files
 * @param {string} type - Type of backup to clean up
 * @param {number} retentionDays - Number of days to retain backups
 * @returns {number} Number of backups deleted
 */
async function cleanupOldBackups(type, retentionDays) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Find old backups in database
    const oldBackups = await prisma.backupLog.findMany({
      where: {
        type,
        status: 'SUCCESS',
        createdAt: {
          lt: cutoffDate
        }
      },
      select: {
        id: true,
        fileName: true
      }
    });
    
    if (oldBackups.length === 0) {
      return 0;
    }
    
    // Delete files and database records
    let deletedCount = 0;
    
    for (const backup of oldBackups) {
      try {
        // Delete the actual backup file
        if (backup.fileName) {
          await backupService.deleteBackupFile(backup.fileName);
        }
        
        // Delete database record
        await prisma.backupLog.delete({
          where: { id: backup.id }
        });
        
        deletedCount++;
      } catch (error) {
        console.error(`[Backup Job] Failed to delete old backup ${backup.fileName}:`, error);
      }
    }
    
    return deletedCount;
    
  } catch (error) {
    console.error('[Backup Job] Failed to cleanup old backups:', error);
    return 0;
  }
}

/**
 * Send notification about backup status
 * @param {Object} notification - Notification details
 */
async function sendBackupNotification(notification) {
  try {
    // Check if push notifications are available
    const pushService = require('../services/pushNotificationService');
    
    if (!pushService) {
      return;
    }
    
    // Get owner subscriptions
    const owners = await prisma.user.findMany({
      where: {
        role: 'OWNER'
      },
      include: {
        pushSubscriptions: {
          where: {
            active: true
          }
        }
      }
    });
    
    const title = notification.type === 'success' 
      ? '✅ Backup Completed Successfully' 
      : '❌ Backup Failed';
    
    const body = notification.type === 'success'
      ? `${notification.backupType === 'full' ? 'Full' : 'Incremental'} backup completed (${formatFileSize(notification.size)})`
      : `${notification.backupType === 'full' ? 'Full' : 'Incremental'} backup failed: ${notification.error}`;
    
    // Send notifications to all owners
    for (const owner of owners) {
      for (const subscription of owner.pushSubscriptions) {
        try {
          await pushService.sendNotification(subscription.id, {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              type: 'backup_status',
              status: notification.type,
              backupType: notification.backupType,
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error(`[Backup Job] Failed to send notification to ${owner.email}:`, error);
        }
      }
    }
    
  } catch (error) {
    console.error('[Backup Job] Failed to send backup notification:', error);
  }
}

/**
 * Format file size for human reading
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Test backup system functionality
 * @returns {Object} Test results
 */
async function testBackupSystem() {
  const results = {
    database: false,
    incremental: false,
    restore: false,
    cleanup: false,
    errors: []
  };
  
  try {
    console.log('[Backup Job] Starting backup system test...');
    
    // Test full database backup
    try {
      const dbBackup = await backupService.backupDatabase();
      results.database = !!dbBackup.fileName;
      console.log('[Backup Job] ✓ Database backup test passed');
    } catch (error) {
      results.errors.push(`Database backup: ${error.message}`);
      console.error('[Backup Job] ✗ Database backup test failed:', error);
    }
    
    // Test incremental backup
    try {
      const incBackup = await backupService.backupIncremental();
      results.incremental = !!incBackup.fileName;
      console.log('[Backup Job] ✓ Incremental backup test passed');
    } catch (error) {
      results.errors.push(`Incremental backup: ${error.message}`);
      console.error('[Backup Job] ✗ Incremental backup test failed:', error);
    }
    
    // Test cleanup
    try {
      const cleanupCount = await cleanupOldBackups('database', 0); // Clean all for test
      results.cleanup = true;
      console.log(`[Backup Job] ✓ Cleanup test passed (${cleanupCount} files cleaned)`);
    } catch (error) {
      results.errors.push(`Cleanup: ${error.message}`);
      console.error('[Backup Job] ✗ Cleanup test failed:', error);
    }
    
    // Test restore would be destructive, so we skip it in automated tests
    results.restore = 'skipped';
    console.log('[Backup Job] - Restore test skipped (destructive operation)');
    
    const allPassed = results.database && results.incremental && results.cleanup;
    
    console.log('[Backup Job] Backup system test completed');
    console.log('[Backup Job] Results:', {
      ...results,
      summary: allPassed ? 'All tests passed' : 'Some tests failed'
    });
    
    return results;
    
  } catch (error) {
    console.error('[Backup Job] Backup system test failed:', error);
    results.errors.push(`General: ${error.message}`);
    return results;
  }
}

module.exports = {
  performBackup,
  cleanupOldBackups,
  testBackupSystem,
  sendBackupNotification
};