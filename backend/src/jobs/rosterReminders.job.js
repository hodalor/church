import cron from 'node-cron';
import NotificationLog from '../modules/notifications/notification.model.js';
import User from '../modules/users/model.js';
import DutyRoster from '../modules/volunteers/models/dutyRoster.model.js';

const startOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const endOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);

const addDays = (value, amount) => {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

export const processRosterReminders = async () => {
  const tomorrow = addDays(new Date(), 1);
  const rosters = await DutyRoster.find({
    isPublished: true,
    date: {
      $gte: startOfDay(tomorrow),
      $lte: endOfDay(tomorrow),
    },
  }).lean();

  if (!rosters.length) {
    console.log('Roster reminders processed: 0');
    return;
  }

  const tenantMemberPairs = [
    ...new Set(
      rosters.flatMap((roster) =>
        (roster.assignments || [])
          .map((assignment) =>
            assignment.memberId ? `${roster.tenantId}::${assignment.memberId}` : null,
          )
          .filter(Boolean),
      ),
    ),
  ].map((pair) => {
    const [tenantId, memberId] = pair.split('::');
    return { tenantId, memberId };
  });
  const users = await User.find({
    isActive: true,
    $or: tenantMemberPairs,
  }).select('_id tenantId memberId');
  const userMap = new Map(
    users.map((user) => [`${user.tenantId}::${user.memberId}`, String(user._id)]),
  );

  const notifications = rosters.flatMap((roster) =>
    (roster.assignments || [])
      .map((assignment) =>
        userMap.get(`${roster.tenantId}::${assignment.memberId}`)
          ? {
              tenantId: roster.tenantId,
              type: 'reminder',
              memberId: assignment.memberId,
              memberName: assignment.memberName,
              targetUserId: userMap.get(`${roster.tenantId}::${assignment.memberId}`),
              title: 'Volunteer service reminder',
              message: `Reminder: You are serving tomorrow as ${assignment.role} in ${assignment.department}.`,
              createdAt: new Date(),
            }
          : null,
      )
      .filter(Boolean),
  );

  if (notifications.length) {
    await NotificationLog.insertMany(notifications, { ordered: false });
  }

  console.log(`Roster reminders processed: ${notifications.length}`);
};

export const startRosterRemindersJob = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      await processRosterReminders();
    } catch (error) {
      console.error('Roster reminder job failed:', error);
    }
  });
};
