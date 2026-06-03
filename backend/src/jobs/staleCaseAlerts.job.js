import cron from 'node-cron';
import NotificationLog from '../modules/notifications/notification.model.js';
import Tenant from '../modules/tenants/model.js';
import User from '../modules/users/model.js';
import {
  getAgedCriticalCasesByTenant,
  getStaleCasesByTenant,
} from '../modules/pastoralCare/pastoral.service.js';

const insertNotifications = async (notifications = []) => {
  if (!notifications.length) {
    return;
  }

  await NotificationLog.insertMany(
    notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt || new Date(),
      isRead: notification.isRead ?? false,
    })),
    { ordered: false },
  );
};

const processStaleCaseAlerts = async () => {
  const tenants = await Tenant.find({ isActive: true, isSuspended: false }).select('tenantId');
  let totalNotifications = 0;

  for (const tenant of tenants) {
    const tenantId = tenant.tenantId;
    const [staleCases, criticalCases, headPastors] = await Promise.all([
      getStaleCasesByTenant(tenantId),
      getAgedCriticalCasesByTenant(tenantId),
      User.find({
        tenantId,
        role: 'head_pastor',
        isActive: true,
      }).select('_id'),
    ]);

    const notifications = [
      ...staleCases
        .filter((careCase) => careCase.assignedTo)
        .map((careCase) => ({
          tenantId,
          type: 'follow_up',
          memberId: careCase.memberId,
          memberName: careCase.memberName,
          targetUserId: careCase.assignedTo,
          title: 'Stale care case alert',
          message: `⚠️ No update on case for ${careCase.memberName} in 14+ days`,
        })),
      ...criticalCases.flatMap((careCase) =>
        headPastors.map((pastor) => ({
          tenantId,
          type: 'follow_up',
          memberId: careCase.memberId,
          memberName: careCase.memberName,
          targetUserId: String(pastor._id),
          title: 'Critical care case unresolved',
          message: `🚨 Critical case for ${careCase.memberName} has been open for 7+ days without resolution.`,
        })),
      ),
    ];

    await insertNotifications(notifications);
    totalNotifications += notifications.length;
  }

  console.log(`Stale case alerts processed: ${totalNotifications}`);
};

export const startStaleCaseAlertsJob = () => {
  cron.schedule('0 8 * * 1', async () => {
    try {
      await processStaleCaseAlerts();
    } catch (error) {
      console.error('Stale case alerts job failed:', error);
    }
  });
};

export { processStaleCaseAlerts };
