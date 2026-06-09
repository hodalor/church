import cron from 'node-cron';
import Tenant from '../modules/tenants/model.js';
import BranchProfile from '../modules/analytics/models/branchProfile.model.js';
import { refreshBranchCache } from '../modules/analytics/analytics.helpers.js';
import { generateSnapshot } from '../modules/analytics/snapshots.service.js';

export const runAnalyticsRefresh = async () => {
  const tenants = await Tenant.find({ isActive: true }).select('tenantId').lean();

  for (const tenant of tenants) {
    const branches = await BranchProfile.find({
      tenantId: tenant.tenantId,
      isActive: true,
    });

    for (const branch of branches) {
      await refreshBranchCache(branch);
      await generateSnapshot(tenant.tenantId, { period: 'monthly', branchId: branch.branchId }, {});
    }

    await generateSnapshot(tenant.tenantId, { period: 'monthly' }, {});
  }
};

export const startAnalyticsRefreshJob = () => {
  cron.schedule('0 2 * * *', async () => {
    try {
      await runAnalyticsRefresh();
      console.log('Analytics refresh job completed.');
    } catch (error) {
      console.error('Analytics refresh job failed:', error);
    }
  });
};

export default startAnalyticsRefreshJob;
