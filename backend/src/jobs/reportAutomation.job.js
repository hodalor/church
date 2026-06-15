import cron from 'node-cron';
import Tenant from '../modules/tenants/model.js';
import User from '../modules/users/model.js';
import NotificationLog from '../modules/notifications/notification.model.js';
import { getFamilyOverview } from '../modules/family/familyAnalytics.service.js';
import { getMinistryStats } from '../modules/ministry/ministry.service.js';
import { getCBSStats } from '../modules/cbs/cbs.service.js';
import { getLeadershipStats } from '../modules/leadership/leadership.service.js';
import { getBalancedScorecard } from '../modules/strategic/strategic.service.js';

export const processAutomatedReports = async () => {
  const tenants = await Tenant.find({ isActive: true, isSuspended: false }).select('tenantId');

  for (const tenant of tenants) {
    const [family, ministry, cbs, leadership, strategic, recipients] = await Promise.all([
      getFamilyOverview(tenant.tenantId),
      getMinistryStats(tenant.tenantId),
      getCBSStats(tenant.tenantId),
      getLeadershipStats(tenant.tenantId),
      getBalancedScorecard(tenant.tenantId),
      User.find({
        tenantId: tenant.tenantId,
        role: { $in: ['head_pastor', 'associate_pastor', 'branch_pastor', 'super_admin'] },
        isActive: true,
      }).select('_id'),
    ]);

    if (!recipients.length) {
      continue;
    }

    const message =
      `Automated ministry report: ${ministry.total} ministries, ` +
      `${cbs.totalGroups} CBS groups, ${family.atRiskFamilies} at-risk families, ` +
      `${leadership.candidates.readyNow} leaders ready now, ` +
      `${strategic.summary.offTrackKpis} off-track KPIs.`;

    await NotificationLog.insertMany(
      recipients.map((recipient) => ({
        tenantId: tenant.tenantId,
        type: 'system',
        targetUserId: String(recipient._id),
        title: 'Automated ministry report',
        message,
        createdAt: new Date(),
      })),
      { ordered: false },
    );
  }
};

export const startReportAutomationJob = () => {
  cron.schedule('0 7 1 * *', async () => {
    try {
      await processAutomatedReports();
    } catch (error) {
      console.error('Automated report job failed:', error);
    }
  });
};
