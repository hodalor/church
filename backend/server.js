import env from './src/config/env.js';
import connectDB from './src/config/db.js';
import app from './src/app.js';
import { startAppointmentRemindersJob } from './src/jobs/appointmentReminders.job.js';
import seedSuperAdmin from './src/modules/auth/seedSuperAdmin.js';
import { startBirthdayReminderJob } from './src/jobs/birthdayReminder.job.js';
import { startDiscipleshipRemindersJob } from './src/jobs/discipleshipReminders.job.js';
import { startAnalyticsInsightsJob } from './src/jobs/analyticsInsights.job.js';
import { startAnalyticsRefreshJob } from './src/jobs/analyticsRefresh.job.js';
import { startEventAutoCloseJob } from './src/jobs/eventAutoClose.job.js';
import { startEventRemindersJob } from './src/jobs/eventReminders.job.js';
import { startFinanceAlertsJob } from './src/jobs/financeAlerts.job.js';
import { startHealthScoreRefreshJob } from './src/jobs/healthScoreRefresh.job.js';
import { startMinistryRemindersJob } from './src/jobs/ministryReminders.job.js';
import { startReportAutomationJob } from './src/jobs/reportAutomation.job.js';
import { startRosterRemindersJob } from './src/jobs/rosterReminders.job.js';
import { startStaleCaseAlertsJob } from './src/jobs/staleCaseAlerts.job.js';
import { startVolunteerAbsenceTrackerJob } from './src/jobs/volunteerAbsenceTracker.job.js';

const startServer = async () => {
  await connectDB();
  await seedSuperAdmin();
  startAnalyticsInsightsJob();
  startAnalyticsRefreshJob();
  startAppointmentRemindersJob();
  startBirthdayReminderJob();
  startDiscipleshipRemindersJob();
  startEventAutoCloseJob();
  startEventRemindersJob();
  startFinanceAlertsJob();
  startHealthScoreRefreshJob();
  startMinistryRemindersJob();
  startReportAutomationJob();
  startRosterRemindersJob();
  startStaleCaseAlertsJob();
  startVolunteerAbsenceTrackerJob();

  app.listen(env.PORT, () => {
    console.log(`Prynova backend listening on port ${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
