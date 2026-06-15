import cron from 'node-cron';
import MinistryMember from '../modules/ministry/models/ministryMember.model.js';
import NotificationLog from '../modules/notifications/notification.model.js';
import User from '../modules/users/model.js';
import { getOverdueActionPoints, getTomorrowMeetings } from '../modules/ministry/ministry.service.js';

export const processMinistryReminders = async () => {
  const meetings = await getTomorrowMeetings();

  for (const meeting of meetings) {
    const members = await MinistryMember.find({
      tenantId: meeting.tenantId,
      ministryId: meeting.ministryId,
      status: { $in: ['active', 'pending_approval', 'on_leave'] },
    }).select('memberId');
    const users = await User.find({
      tenantId: meeting.tenantId,
      memberId: { $in: members.map((member) => member.memberId).filter(Boolean) },
      isActive: true,
    }).select('_id');

    if (users.length) {
      await NotificationLog.insertMany(
        users.map((user) => ({
          tenantId: meeting.tenantId,
          type: 'reminder',
          targetUserId: String(user._id),
          title: 'Ministry meeting reminder',
          message: `${meeting.ministryName} meets tomorrow${meeting.startTime ? ` at ${meeting.startTime}` : ''}.`,
          createdAt: new Date(),
        })),
        { ordered: false },
      );
    }
  }

  const overdueItems = await getOverdueActionPoints();
  for (const item of overdueItems) {
    const recipients = [item.actionPoint.assignedTo, item.meeting.createdBy].filter(Boolean);

    if (!recipients.length) {
      continue;
    }

    await NotificationLog.insertMany(
      recipients.map((recipient) => ({
        tenantId: item.meeting.tenantId,
        type: 'reminder',
        targetUserId: recipient,
        title: 'Overdue ministry action point',
        message: `The action point "${item.actionPoint.task}" from ${item.meeting.ministryName} is overdue.`,
        createdAt: new Date(),
      })),
      { ordered: false },
    );
  }
};

export const startMinistryRemindersJob = () => {
  cron.schedule('0 8 * * *', async () => {
    try {
      await processMinistryReminders();
    } catch (error) {
      console.error('Ministry reminder job failed:', error);
    }
  });
};
