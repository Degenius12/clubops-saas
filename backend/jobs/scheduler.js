// Job Scheduler for ClubFlow
// Manages scheduled tasks like late fee processing

const cron = require('node-cron');
const { processLateFees } = require('./lateFeeProcessor');

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

  // TODO: Add more scheduled jobs here
  // - Daily revenue reports
  // - Weekly analytics
  // - Shift reminders
  // - Cleanup old data

  return {
    lateFeeCron
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

  console.log('[Job Scheduler] All jobs stopped');
}

module.exports = {
  initializeScheduledJobs,
  stopAllJobs
};
