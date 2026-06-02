import cron from 'node-cron';
import Tenant from '../modules/tenants/model.js';
import Member from '../modules/members/member.model.js';
import { recalculateHealthScore } from '../modules/members/member.service.js';

const refreshHealthScores = async () => {
  const tenants = await Tenant.find({ isActive: true, isSuspended: false }).select('tenantId');
  let refreshedMembers = 0;

  for (const tenant of tenants) {
    const members = await Member.find({
      tenantId: tenant.tenantId,
      isDeleted: false,
      isActive: true,
    }).select('memberId');

    for (const member of members) {
      await recalculateHealthScore(tenant.tenantId, member.memberId);
      refreshedMembers += 1;
    }
  }

  console.log(`Health scores refreshed for ${refreshedMembers} members across ${tenants.length} tenants`);
};

export const startHealthScoreRefreshJob = () => {
  cron.schedule('0 23 * * 0', async () => {
    try {
      await refreshHealthScores();
    } catch (error) {
      console.error('Health score refresh job failed:', error);
    }
  });
};

export { refreshHealthScores };
