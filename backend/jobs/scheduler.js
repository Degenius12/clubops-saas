// Job Scheduler for ClubFlow
// Manages scheduled tasks like late fee processing and compliance alerts

const cron = require('node-cron');
const { processLateFees } = require('./lateFeeProcessor');
const { processComplianceAlerts } = require('./complianceAlerts');
const { checkCapacityAlerts } = require('./patronCountAlerts');
const { performBackup } = require('./backupJob');

/**
 * Initialize all scheduled jobs
 */
function initializeScheduledJobs() {
  console.log('[Job Scheduler] Initializing scheduled jobs...');

  // Late Fee Processing - Runs daily at 2:00 AM
  // Cron format: second minute hour day month dayOfWeek
  const lateFeeCron = cron.schedule('0 2 * * *', async () => {
    console.log('[Job Scheduler] Running daily late fee processing...');
    try {
      const result = await processLateFees();
      console.log('[Job Scheduler] Late fee processing complete:', result);
    } catch (error) {
      console.error('[Job Scheduler] Late fee processing failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York" // Adjust to club's timezone
  });

  console.log('[Job Scheduler] ✓ Late fee processing scheduled for 2:00 AM daily');

  // Compliance Alerts - Runs daily at 6:00 AM
  // Checks for expiring licenses and creates alerts
  const complianceAlertsCron = cron.schedule('0 6 * * *', async () => {
    console.log('[Job Scheduler] Running daily compliance alerts check...');
    try {
      const result = await processComplianceAlerts();
      console.log('[Job Scheduler] Compliance alerts check complete:', result);
    } catch (error) {
      console.error('[Job Scheduler] Compliance alerts check failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York" // Adjust to club's timezone
  });

  console.log('[Job Scheduler] ✓ Compliance alerts scheduled for 6:00 AM daily');

  // Patron Count Capacity Alerts - Runs every 5 minutes
  // Checks current patron counts against capacity limits (Feature #49)
  const patronCountAlertsCron = cron.schedule('*/5 * * * *', async () => {
    try {
      await checkCapacityAlerts();
    } catch (error) {
      console.error('[Job Scheduler] Patron count alerts check failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York" // Adjust to club's timezone
  });

  console.log('[Job Scheduler] ✓ Patron count capacity alerts scheduled for every 5 minutes');

  // Automated Backups - Daily at 3:00 AM (Feature #40)
  // Full database backup daily, incremental every 6 hours
  const dailyBackupCron = cron.schedule('0 3 * * *', async () => {
    console.log('[Job Scheduler] Running daily database backup...');
    try {
      const result = await performBackup('full');
      console.log('[Job Scheduler] Daily backup complete:', result);
    } catch (error) {
      console.error('[Job Scheduler] Daily backup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York"
  });

  console.log('[Job Scheduler] ✓ Daily database backup scheduled for 3:00 AM');

  // Incremental backups every 6 hours
  const incrementalBackupCron = cron.schedule('0 */6 * * *', async () => {
    console.log('[Job Scheduler] Running incremental backup...');
    try {
      const result = await performBackup('incremental');
      console.log('[Job Scheduler] Incremental backup complete:', result);
    } catch (error) {
      console.error('[Job Scheduler] Incremental backup failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York"
  });

  console.log('[Job Scheduler] ✓ Incremental backups scheduled for every 6 hours');

  // TODO: Add more scheduled jobs here
  // - Daily revenue reports
  // - Weekly analytics
  // - Shift reminders
  // - Cleanup old data

  return {
    lateFeeCron,
    complianceAlertsCron,
    patronCountAlertsCron,
    dailyBackupCron,
    incrementalBackupCron
  };
}

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
function stopAllJobs(jobs) {
  console.log('[Job Scheduler] Stopping all scheduled jobs...');

  if (jobs.lateFeeCron) {
    jobs.lateFeeCron.stop();
    console.log('[Job Scheduler] ✓ Late fee processing stopped');
  }

  if (jobs.complianceAlertsCron) {
    jobs.complianceAlertsCron.stop();
    console.log('[Job Scheduler] ✓ Compliance alerts stopped');
  }

  if (jobs.patronCountAlertsCron) {
    jobs.patronCountAlertsCron.stop();
    console.log('[Job Scheduler] ✓ Patron count alerts stopped');
  }

  if (jobs.dailyBackupCron) {
    jobs.dailyBackupCron.stop();
    console.log('[Job Scheduler] ✓ Daily backup stopped');
  }

  if (jobs.incrementalBackupCron) {
    jobs.incrementalBackupCron.stop();
    console.log('[Job Scheduler] ✓ Incremental backup stopped');
  }

  console.log('[Job Scheduler] All jobs stopped');
}

module.exports = {
  initializeScheduledJobs,
  stopAllJobs
};
