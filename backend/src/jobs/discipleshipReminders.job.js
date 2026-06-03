import cron from 'node-cron';
import NotificationLog from '../modules/notifications/notification.model.js';
import Tenant from '../modules/tenants/model.js';
import { getDormantDiscipleshipEnrollmentsByTenant } from '../modules/pastoralCare/pastoral.service.js';

const processDiscipleshipReminders = async () => {
  const tenants = await Tenant.find({ isActive: true, isSuspended: false }).select('tenantId');
  let totalNotifications = 0;

  for (const tenant of tenants) {
    const enrollments = await getDormantDiscipleshipEnrollmentsByTenant(tenant.tenantId);
    const notifications = enrollments
      .filter((enrollment) => enrollment.assignedTo)
      .map((enrollment) => ({
        tenantId: tenant.tenantId,
        type: 'follow_up',
        memberId: enrollment.memberId,
        memberName: enrollment.memberName,
        targetUserId: enrollment.assignedTo,
        title: 'Discipleship progress reminder',
        message: `${enrollment.memberName} hasn't progressed in ${enrollment.trackName} for 14+ days`,
        createdAt: new Date(),
        isRead: false,
      }));

    if (notifications.length) {
      await NotificationLog.insertMany(notifications, { ordered: false });
      totalNotifications += notifications.length;
    }
  }

  console.log(`Discipleship reminders processed: ${totalNotifications}`);
};

export const startDiscipleshipRemindersJob = () => {
  cron.schedule('0 19 * * 0', async () => {
    try {
      await processDiscipleshipReminders();
    } catch (error) {
      console.error('Discipleship reminders job failed:', error);
    }
  });
};

export { processDiscipleshipReminders };
