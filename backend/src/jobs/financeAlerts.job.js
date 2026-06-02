import cron from 'node-cron';
import { runWeeklyFinanceAlerts } from '../modules/finance/finance.service.js';

export const startFinanceAlertsJob = () => {
  cron.schedule('0 8 * * 1', async () => {
    try {
      await runWeeklyFinanceAlerts();
      console.log('Finance alerts job completed.');
    } catch (error) {
      console.error('Finance alerts job failed:', error);
    }
  });
};

export default startFinanceAlertsJob;
