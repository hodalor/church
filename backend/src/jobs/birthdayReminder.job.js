import cron from 'node-cron';
import Tenant from '../modules/tenants/model.js';
import Member from '../modules/members/member.model.js';
import User from '../modules/users/model.js';
import NotificationLog from '../modules/notifications/notification.model.js';

const reminderRoles = ['head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'];

const isBirthdayToday = (dateOfBirth) => {
  const today = new Date();
  return (
    dateOfBirth.getMonth() === today.getMonth() &&
    dateOfBirth.getDate() === today.getDate()
  );
};

const processBirthdayReminders = async () => {
  const tenants = await Tenant.find({ isActive: true, isSuspended: false }).select('tenantId');
  let processedTenants = 0;

  for (const tenant of tenants) {
    const birthdayMembers = await Member.find({
      tenantId: tenant.tenantId,
      isDeleted: false,
      isActive: true,
      dateOfBirth: { $exists: true, $ne: null },
    }).select('memberId firstName lastName dateOfBirth');

    const todayBirthdays = birthdayMembers.filter((member) => isBirthdayToday(member.dateOfBirth));
    if (!todayBirthdays.length) {
      processedTenants += 1;
      continue;
    }

    const targetUsers = await User.find({
      tenantId: tenant.tenantId,
      role: { $in: reminderRoles },
      isActive: true,
    }).select('_id');

    const targetUserIds = targetUsers.length
      ? targetUsers.map((user) => user._id.toString())
      : [undefined];

    const notifications = [];

    todayBirthdays.forEach((member) => {
      const memberName = [member.firstName, member.lastName].filter(Boolean).join(' ');
      targetUserIds.forEach((targetUserId) => {
        notifications.push({
          tenantId: tenant.tenantId,
          type: 'birthday',
          memberId: member.memberId,
          memberName,
          ...(targetUserId ? { targetUserId } : {}),
          message: `Today is ${memberName}'s birthday. Reach out and celebrate with them.`,
          isRead: false,
          createdAt: new Date(),
        });
      });
    });

    if (notifications.length) {
      await NotificationLog.insertMany(notifications, { ordered: false });
    }

    processedTenants += 1;
  }

  console.log(`Birthday reminders processed for ${processedTenants} tenants`);
};

export const startBirthdayReminderJob = () => {
  cron.schedule('0 7 * * *', async () => {
    try {
      await processBirthdayReminders();
    } catch (error) {
      console.error('Birthday reminder job failed:', error);
    }
  });
};

export { processBirthdayReminders };
