import env from './src/config/env.js';
import connectDB from './src/config/db.js';
import app from './src/app.js';
import seedSuperAdmin from './src/modules/auth/seedSuperAdmin.js';
import { startBirthdayReminderJob } from './src/jobs/birthdayReminder.job.js';
import { startFinanceAlertsJob } from './src/jobs/financeAlerts.job.js';
import { startHealthScoreRefreshJob } from './src/jobs/healthScoreRefresh.job.js';

const startServer = async () => {
  await connectDB();
  await seedSuperAdmin();
  startBirthdayReminderJob();
  startFinanceAlertsJob();
  startHealthScoreRefreshJob();

  app.listen(env.PORT, () => {
    console.log(`Prynova backend listening on port ${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
