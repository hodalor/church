import cron from 'node-cron';
import Tenant from '../modules/tenants/model.js';
import { generateAllInsights } from '../modules/analytics/insights.service.js';

export const runAnalyticsInsights = async () => {
  const tenants = await Tenant.find({ isActive: true }).select('tenantId').lean();

  for (const tenant of tenants) {
    await generateAllInsights(tenant.tenantId);
  }
};

export const startAnalyticsInsightsJob = () => {
  cron.schedule('15 2 * * *', async () => {
    try {
      await runAnalyticsInsights();
      console.log('Analytics insights job completed.');
    } catch (error) {
      console.error('Analytics insights job failed:', error);
    }
  });
};

export default startAnalyticsInsightsJob;
