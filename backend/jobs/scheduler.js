// Job Scheduler for ClubFlow
// Manages scheduled tasks like late fee processing and compliance alerts

const cron = require('node-cron');
const { processLateFees } = require('./lateFeeProcessor');
const { processComplianceAlerts } = require('./complianceAlerts');

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

  // TODO: Add more scheduled jobs here
  // - Daily revenue reports
  // - Weekly analytics
  // - Shift reminders
  // - Cleanup old data

  return {
    lateFeeCron,
    complianceAlertsCron
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

  console.log('[Job Scheduler] All jobs stopped');
}

module.exports = {
  initializeScheduledJobs,
  stopAllJobs
};
