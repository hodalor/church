import cron from 'node-cron';
import NotificationLog from '../modules/notifications/notification.model.js';
import User from '../modules/users/model.js';
import Volunteer from '../modules/volunteers/models/volunteer.model.js';
import DutyRoster from '../modules/volunteers/models/dutyRoster.model.js';

const startOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const endOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);

const getPreviousSunday = (value = new Date()) => {
  const current = new Date(value);
  const day = current.getDay();
  const offset = day === 0 ? 7 : day;
  current.setDate(current.getDate() - offset);
  return current;
};

const hasThreeConsecutiveAbsences = async (tenantId, volunteerId, cutoffDate) => {
  const rosters = await DutyRoster.find({
    tenantId,
    date: { $lte: cutoffDate },
    'assignments.volunteerId': volunteerId,
  })
    .sort({ date: -1 })
    .limit(12)
    .lean();

  const statuses = rosters
    .map((roster) => (roster.assignments || []).find((assignment) => assignment.volunteerId === volunteerId))
    .filter(Boolean)
    .map((assignment) => assignment.status)
    .slice(0, 3);

  return statuses.length === 3 && statuses.every((status) => status === 'absent');
};

export const processVolunteerAbsenceTracker = async () => {
  const previousSunday = getPreviousSunday(new Date());
  const rosters = await DutyRoster.find({
    date: {
      $gte: startOfDay(previousSunday),
      $lte: endOfDay(previousSunday),
    },
    'assignments.status': 'absent',
  }).lean();

  const volunteerIds = [
    ...new Set(
      rosters.flatMap((roster) =>
        (roster.assignments || [])
          .filter((assignment) => assignment.status === 'absent')
          .map((assignment) => assignment.volunteerId)
          .filter(Boolean),
      ),
    ),
  ];

  if (!volunteerIds.length) {
    console.log('Volunteer absence tracker processed: 0');
    return;
  }

  const volunteers = await Volunteer.find({ _id: { $in: volunteerIds } });
  const supervisorIds = [...new Set(volunteers.map((volunteer) => volunteer.supervisorId).filter(Boolean))];
  const supervisors = await User.find({
    _id: { $in: supervisorIds },
    isActive: true,
  }).select('_id');
  const supervisorSet = new Set(supervisors.map((supervisor) => String(supervisor._id)));
  const notifications = [];

  for (const volunteer of volunteers) {
    const totalAssignments = Number(volunteer.performance?.totalAssignments || 0);
    const attended = Number(volunteer.performance?.attended || 0);
    volunteer.performance.reliabilityScore = totalAssignments
      ? Number(((attended / totalAssignments) * 100).toFixed(2))
      : 100;
    await volunteer.save();

    if (
      volunteer.supervisorId &&
      supervisorSet.has(String(volunteer.supervisorId)) &&
      (await hasThreeConsecutiveAbsences(volunteer.tenantId, String(volunteer._id), endOfDay(previousSunday)))
    ) {
      notifications.push({
        tenantId: volunteer.tenantId,
        type: 'system',
        memberId: volunteer.memberId,
        memberName: volunteer.memberName,
        targetUserId: String(volunteer.supervisorId),
        title: 'Volunteer absence alert',
        message: `${volunteer.memberName} has been absent for 3 consecutive rosters.`,
        createdAt: new Date(),
      });
    }
  }

  if (notifications.length) {
    await NotificationLog.insertMany(notifications, { ordered: false });
  }

  console.log(
    `Volunteer absence tracker processed: volunteers=${volunteers.length}, alerts=${notifications.length}`,
  );
};

export const startVolunteerAbsenceTrackerJob = () => {
  cron.schedule('0 8 * * 1', async () => {
    try {
      await processVolunteerAbsenceTracker();
    } catch (error) {
      console.error('Volunteer absence tracker job failed:', error);
    }
  });
};
