import AttendanceRecord from '../attendance/attendanceRecord.model.js';
import Member from '../members/member.model.js';
import NotificationLog from '../notifications/notification.model.js';
import Tenant from '../tenants/model.js';
import Ministry from './models/ministry.model.js';
import MinistryMeeting from './models/ministryMeeting.model.js';
import MinistryMember from './models/ministryMember.model.js';
import { createHttpError } from '../../utils/httpError.js';
import {
  buildPagination,
  compactObject,
  formatPersonName,
  generateSequence,
  normalizeArray,
  normalizeString,
  parseBoolean,
  parseDate,
  parseNumber,
} from '../../utils/phase11Helpers.js';

const ACTIVE_MEMBER_STATUSES = ['active', 'pending_approval', 'on_leave'];

const syncTenantMinistryContent = async (tenantId, previousName, nextName) => {
  const tenant = await Tenant.findOne({ tenantId });
  if (!tenant) {
    return;
  }

  const existingMinistries = Array.isArray(tenant.content?.ministries)
    ? tenant.content.ministries
    : [];
  const updatedMinistries = [
    ...existingMinistries.filter(
      (ministry) => ministry && ministry !== previousName && ministry !== nextName,
    ),
    nextName,
  ];

  tenant.content = {
    ...(tenant.content || {}),
    ministries: updatedMinistries,
  };
  await tenant.save();
};

const normalizeSchedule = (schedule = {}) =>
  compactObject({
    frequency: normalizeString(schedule.frequency),
    dayOfWeek: parseNumber(schedule.dayOfWeek),
    time: normalizeString(schedule.time),
    venue: normalizeString(schedule.venue),
    notes: normalizeString(schedule.notes),
  });

const normalizeActionPoints = (actionPoints = []) =>
  Array.isArray(actionPoints)
    ? actionPoints
        .map((item) =>
          compactObject({
            task: normalizeString(item?.task),
            assignedTo: normalizeString(item?.assignedTo),
            dueDate: parseDate(item?.dueDate),
            isCompleted:
              typeof item?.isCompleted === 'boolean'
                ? item.isCompleted
                : String(item?.isCompleted).toLowerCase() === 'true',
          }),
        )
        .filter((item) => item.task)
    : [];

const buildMinistryPayload = (payload = {}) =>
  compactObject({
    name: normalizeString(payload.name),
    code: normalizeString(payload.code, { uppercase: true }),
    type: normalizeString(payload.type),
    description: normalizeString(payload.description),
    vision: normalizeString(payload.vision),
    branch: normalizeString(payload.branch),
    leaderId: normalizeString(payload.leaderId),
    leaderName: normalizeString(payload.leaderName),
    deputyLeaderId: normalizeString(payload.deputyLeaderId),
    deputyLeaderName: normalizeString(payload.deputyLeaderName),
    meetingSchedule: normalizeSchedule(payload.meetingSchedule),
    maxMembers: parseNumber(payload.maxMembers),
    requiresApproval:
      typeof payload.requiresApproval === 'boolean'
        ? payload.requiresApproval
        : parseBoolean(payload.requiresApproval),
    annualGoals: normalizeArray(payload.annualGoals),
    currentFocus: normalizeString(payload.currentFocus),
    isActive:
      typeof payload.isActive === 'boolean' ? payload.isActive : parseBoolean(payload.isActive),
    establishedDate: parseDate(payload.establishedDate),
    logoUrl: normalizeString(payload.logoUrl),
  });

const buildMeetingPayload = (payload = {}) =>
  compactObject({
    title: normalizeString(payload.title),
    date: parseDate(payload.date),
    startTime: normalizeString(payload.startTime),
    endTime: normalizeString(payload.endTime),
    venue: normalizeString(payload.venue),
    branch: normalizeString(payload.branch),
    agenda: normalizeString(payload.agenda),
    minutes: normalizeString(payload.minutes),
    actionPoints: normalizeActionPoints(payload.actionPoints),
    serviceId: normalizeString(payload.serviceId),
    status: normalizeString(payload.status),
  });

const notifyUser = async ({ tenantId, targetUserId, title, message }) => {
  if (!targetUserId) {
    return;
  }

  await NotificationLog.create({
    tenantId,
    type: 'system',
    targetUserId,
    title,
    message,
    createdAt: new Date(),
  });
};

const findMinistryOrThrow = async (tenantId, ministryId) => {
  const ministry = await Ministry.findOne({ tenantId, ministryId });
  if (!ministry) {
    throw createHttpError(404, 'Ministry not found.');
  }

  return ministry;
};

const findMeetingOrThrow = async (tenantId, ministryId, meetingId) => {
  const meeting = await MinistryMeeting.findOne({ tenantId, ministryId, meetingId });
  if (!meeting) {
    throw createHttpError(404, 'Meeting not found.');
  }

  return meeting;
};

const refreshMemberCount = async (tenantId, ministryId) => {
  const memberCount = await MinistryMember.countDocuments({
    tenantId,
    ministryId,
    status: { $in: ACTIVE_MEMBER_STATUSES },
  });

  await Ministry.findOneAndUpdate({ tenantId, ministryId }, { memberCount, updatedAt: new Date() });
  return memberCount;
};

const syncMemberMinistryCache = async (tenantId, memberId) => {
  const memberships = await MinistryMember.find({
    tenantId,
    memberId,
    status: { $in: ACTIVE_MEMBER_STATUSES },
  }).select('ministryId ministryName role');

  await Member.findOneAndUpdate(
    { tenantId, memberId },
    {
      ministries: memberships.map((membership) => ({
        ministryId: membership.ministryId,
        ministryName: membership.ministryName,
        role: membership.role,
      })),
    },
  );
};

const ensureMemberCapacity = (ministry) => {
  if (!ministry.maxMembers) {
    return;
  }

  if (Number(ministry.memberCount || 0) >= Number(ministry.maxMembers)) {
    throw createHttpError(400, 'This ministry has reached its maximum membership.');
  }
};

export const createMinistry = async (tenantId, data, createdBy) => {
  const payload = buildMinistryPayload(data);
  if (!payload.name) {
    throw createHttpError(400, 'Ministry name is required.');
  }

  const existingMinistry = await Ministry.findOne({ tenantId, name: payload.name });
  if (existingMinistry) {
    throw createHttpError(409, 'A ministry with that name already exists.');
  }

  const ministry = await Ministry.create({
    tenantId,
    ministryId: await generateSequence(Ministry, tenantId, 'ministryId', 'MIN'),
    ...payload,
    createdBy,
    updatedBy: createdBy,
  });

  await syncTenantMinistryContent(tenantId, null, ministry.name);

  if (ministry.leaderId) {
    await notifyUser({
      tenantId,
      targetUserId: ministry.leaderId,
      title: 'Ministry assignment',
      message: `You have been assigned to lead the ${ministry.name} ministry.`,
    });
  }

  return ministry;
};

export const getAllMinistries = async (tenantId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const search = normalizeString(query.search);
  const filters = {
    tenantId,
    ...(query.type ? { type: normalizeString(query.type) } : {}),
    ...(query.branch ? { branch: normalizeString(query.branch) } : {}),
  };

  const isActive = parseBoolean(query.isActive);
  if (typeof isActive === 'boolean') {
    filters.isActive = isActive;
  }

  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { leaderName: { $regex: search, $options: 'i' } },
    ];
  }

  const [ministries, total] = await Promise.all([
    Ministry.find(filters).sort({ name: 1 }).skip(skip).limit(limit),
    Ministry.countDocuments(filters),
  ]);

  return {
    ministries,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getMinistryById = async (tenantId, ministryId) => findMinistryOrThrow(tenantId, ministryId);

export const updateMinistry = async (tenantId, ministryId, data, updatedBy) => {
  const ministry = await findMinistryOrThrow(tenantId, ministryId);
  const previousName = ministry.name;
  const payload = buildMinistryPayload(data);

  Object.assign(ministry, payload, {
    updatedBy,
    updatedAt: new Date(),
  });

  await ministry.save();
  if (ministry.name && ministry.name !== previousName) {
    await syncTenantMinistryContent(tenantId, previousName, ministry.name);
  }
  return ministry;
};

export const deactivateMinistry = async (tenantId, ministryId, updatedBy) => {
  const ministry = await findMinistryOrThrow(tenantId, ministryId);
  ministry.isActive = false;
  ministry.updatedBy = updatedBy;
  ministry.updatedAt = new Date();
  await ministry.save();
  return ministry;
};

export const addMemberToMinistry = async (tenantId, ministryId, memberId, role, addedBy, notes) => {
  const [ministry, member] = await Promise.all([
    findMinistryOrThrow(tenantId, ministryId),
    Member.findOne({ tenantId, memberId, isDeleted: false }),
  ]);

  if (!member) {
    throw createHttpError(404, 'Member not found.');
  }

  ensureMemberCapacity(ministry);

  const existingMembership = await MinistryMember.findOne({ tenantId, ministryId, memberId });
  if (existingMembership) {
    throw createHttpError(409, 'Member already belongs to this ministry.');
  }

  const status = ministry.requiresApproval ? 'pending_approval' : 'active';
  const ministryMember = await MinistryMember.create({
    tenantId,
    ministryId,
    ministryName: ministry.name,
    memberId,
    memberName: formatPersonName(member.firstName, member.otherName, member.lastName),
    memberPhoto: member.photoUrl,
    role: normalizeString(role),
    status,
    approvedBy: status === 'active' ? addedBy : undefined,
    approvedAt: status === 'active' ? new Date() : undefined,
    notes: normalizeString(notes),
  });

  await refreshMemberCount(tenantId, ministryId);
  await syncMemberMinistryCache(tenantId, memberId);

  if (status === 'pending_approval' && ministry.leaderId) {
    await notifyUser({
      tenantId,
      targetUserId: ministry.leaderId,
      title: 'Ministry approval required',
      message: `${ministryMember.memberName} is awaiting approval for ${ministry.name}.`,
    });
  }

  return ministryMember;
};

export const getMinistryMembers = async (tenantId, ministryId, query = {}) => {
  await findMinistryOrThrow(tenantId, ministryId);
  const filters = {
    tenantId,
    ministryId,
    ...(query.status ? { status: normalizeString(query.status) } : {}),
  };

  return MinistryMember.find(filters).sort({ status: 1, memberName: 1 });
};

export const updateMemberRole = async (tenantId, ministryId, memberId, data, updatedBy) => {
  const ministryMember = await MinistryMember.findOne({ tenantId, ministryId, memberId });
  if (!ministryMember) {
    throw createHttpError(404, 'Ministry member not found.');
  }

  if (typeof data.role !== 'undefined') {
    ministryMember.role = normalizeString(data.role);
  }

  if (typeof data.status !== 'undefined') {
    ministryMember.status = normalizeString(data.status) || ministryMember.status;
  }

  if (typeof data.notes !== 'undefined') {
    ministryMember.notes = normalizeString(data.notes);
  }

  if (ministryMember.status === 'active') {
    ministryMember.approvedBy = updatedBy;
    ministryMember.approvedAt = new Date();
  }

  await ministryMember.save();
  await refreshMemberCount(tenantId, ministryId);
  await syncMemberMinistryCache(tenantId, memberId);
  return ministryMember;
};

export const removeMemberFromMinistry = async (tenantId, ministryId, memberId) => {
  const membership = await MinistryMember.findOneAndDelete({ tenantId, ministryId, memberId });
  if (!membership) {
    throw createHttpError(404, 'Ministry member not found.');
  }

  await refreshMemberCount(tenantId, ministryId);
  await syncMemberMinistryCache(tenantId, memberId);

  return membership;
};

export const bulkAddMembers = async (tenantId, ministryId, members = [], addedBy) => {
  if (!Array.isArray(members) || members.length === 0) {
    throw createHttpError(400, 'Members payload must be a non-empty array.');
  }

  const results = [];
  const errors = [];

  for (const entry of members) {
    try {
      const membership = await addMemberToMinistry(
        tenantId,
        ministryId,
        normalizeString(entry.memberId),
        entry.role,
        addedBy,
        entry.notes,
      );
      results.push(membership);
    } catch (error) {
      errors.push({
        memberId: entry.memberId,
        message: error.message,
      });
    }
  }

  return {
    created: results.length,
    failed: errors.length,
    memberships: results,
    errors,
  };
};

export const getMemberMinistries = async (tenantId, memberId) =>
  MinistryMember.find({ tenantId, memberId }).sort({ createdAt: -1 });

export const createMeeting = async (tenantId, ministryId, data, createdBy) => {
  const ministry = await findMinistryOrThrow(tenantId, ministryId);
  const payload = buildMeetingPayload(data);
  if (!payload.date) {
    throw createHttpError(400, 'Meeting date is required.');
  }

  const meeting = await MinistryMeeting.create({
    tenantId,
    meetingId: await generateSequence(MinistryMeeting, tenantId, 'meetingId', 'MMT'),
    ministryId,
    ministryName: ministry.name,
    ...payload,
    createdBy,
    updatedAt: new Date(),
  });

  return meeting;
};

export const getMinistryMeetings = async (tenantId, ministryId, query = {}) => {
  await findMinistryOrThrow(tenantId, ministryId);
  const filters = {
    tenantId,
    ministryId,
    ...(query.status ? { status: normalizeString(query.status) } : {}),
  };

  return MinistryMeeting.find(filters).sort({ date: -1, createdAt: -1 });
};

export const getMeetingById = async (tenantId, ministryId, meetingId) =>
  findMeetingOrThrow(tenantId, ministryId, meetingId);

export const updateMeeting = async (tenantId, ministryId, meetingId, data) => {
  const meeting = await findMeetingOrThrow(tenantId, ministryId, meetingId);
  const payload = buildMeetingPayload(data);
  Object.assign(meeting, payload, { updatedAt: new Date() });
  await meeting.save();
  return meeting;
};

export const recordMeetingAttendance = async (tenantId, ministryId, meetingId, attendeeIds = [], actor) => {
  const [meeting, ministryMembers] = await Promise.all([
    findMeetingOrThrow(tenantId, ministryId, meetingId),
    MinistryMember.find({ tenantId, ministryId, status: { $in: ACTIVE_MEMBER_STATUSES } }),
  ]);

  const uniqueAttendeeIds = [...new Set((attendeeIds || []).map((item) => String(item).trim()).filter(Boolean))];
  const membersById = new Map(ministryMembers.map((item) => [item.memberId, item]));
  const serviceId = meeting.serviceId || `ministry-${meeting.meetingId}`;

  meeting.serviceId = serviceId;
  meeting.attendeeIds = uniqueAttendeeIds;
  meeting.attendanceCount = uniqueAttendeeIds.length;
  meeting.absentCount = Math.max(ministryMembers.length - uniqueAttendeeIds.length, 0);
  meeting.status = 'completed';
  meeting.updatedAt = new Date();
  await meeting.save();

  await AttendanceRecord.deleteMany({
    tenantId,
    serviceId,
    checkInMethod: 'bulk',
  });

  const attendanceDocs = uniqueAttendeeIds
    .filter((memberId) => membersById.has(memberId))
    .map((memberId) => {
      const ministryMember = membersById.get(memberId);
      return {
        tenantId,
        serviceId,
        serviceTitle: meeting.title || `${meeting.ministryName} Meeting`,
        serviceDate: meeting.date,
        memberId,
        memberName: ministryMember.memberName,
        attendeeType: 'member',
        checkInMethod: 'bulk',
        checkInTime: new Date(),
        branch: meeting.branch,
        checkedBy: {
          userId: actor?.userId,
          role: actor?.role,
        },
      };
    });

  if (attendanceDocs.length) {
    await AttendanceRecord.insertMany(attendanceDocs, { ordered: false });
  }

  return meeting;
};

export const getMinistryStats = async (tenantId) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [ministries, members, meetings, byType, distinctMemberIds, totalMembers] = await Promise.all([
    Ministry.find({ tenantId }),
    MinistryMember.find({ tenantId, status: { $in: ACTIVE_MEMBER_STATUSES } }),
    MinistryMeeting.find({ tenantId }),
    Ministry.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalMembers: { $sum: '$memberCount' },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]),
    MinistryMember.distinct('memberId', {
      tenantId,
      status: { $in: ACTIVE_MEMBER_STATUSES },
    }),
    Member.countDocuments({ tenantId, isDeleted: false }),
  ]);

  const upcomingMeetings = await MinistryMeeting.find({
    tenantId,
    date: { $gte: now },
    status: 'scheduled',
  })
    .sort({ date: 1 })
    .limit(5);

  const meetingsThisMonth = meetings.filter(
    (meeting) => meeting.date >= monthStart && meeting.date < monthEnd,
  ).length;

  const ministryActivity = ministries.map((ministry) => {
    const ministryMeetings = meetings.filter((meeting) => meeting.ministryId === ministry.ministryId);
    const completedMeetings = ministryMeetings.filter((meeting) => meeting.status === 'completed');
    const avgAttendance = completedMeetings.length
      ? completedMeetings.reduce((sum, meeting) => sum + Number(meeting.attendanceCount || 0), 0) /
        completedMeetings.length
      : 0;

    return {
      name: ministry.name,
      meetingCount: ministryMeetings.length,
      avgAttendance: Number(avgAttendance.toFixed(2)),
    };
  });

  ministryActivity.sort((left, right) => {
    if (right.meetingCount !== left.meetingCount) {
      return right.meetingCount - left.meetingCount;
    }

    return right.avgAttendance - left.avgAttendance;
  });

  return {
    total: ministries.length,
    active: ministries.filter((item) => item.isActive).length,
    inactive: ministries.filter((item) => !item.isActive).length,
    byType: byType.map((item) => ({
      type: item._id || 'other',
      count: item.count,
      totalMembers: item.totalMembers,
    })),
    totalMinistryMembers: distinctMemberIds.length,
    membersInNoMinistry: Math.max(totalMembers - distinctMemberIds.length, 0),
    upcomingMeetings,
    mostActiveMinistry: ministryActivity[0] || null,
    meetingsThisMonth,
    membershipAssignments: members.length,
  };
};

export const getMinistryReport = async (tenantId, ministryId) => {
  const [ministry, members, meetings] = await Promise.all([
    findMinistryOrThrow(tenantId, ministryId),
    MinistryMember.find({ tenantId, ministryId }),
    MinistryMeeting.find({ tenantId, ministryId }).sort({ date: 1 }),
  ]);

  const completedMeetings = meetings.filter((meeting) => meeting.status === 'completed');
  const joinedThisMonthStart = new Date();
  joinedThisMonthStart.setDate(1);
  joinedThisMonthStart.setHours(0, 0, 0, 0);

  const attendanceMap = new Map();
  completedMeetings.forEach((meeting) => {
    meeting.attendeeIds.forEach((memberId) => {
      attendanceMap.set(memberId, (attendanceMap.get(memberId) || 0) + 1);
    });
  });

  const topAttendees = members
    .map((member) => {
      const attended = attendanceMap.get(member.memberId) || 0;
      const attendanceRate = completedMeetings.length
        ? Number(((attended / completedMeetings.length) * 100).toFixed(2))
        : 0;

      return {
        memberId: member.memberId,
        memberName: member.memberName,
        attendanceRate,
        attended,
      };
    })
    .sort((left, right) => right.attendanceRate - left.attendanceRate)
    .slice(0, 5);

  const actionPoints = meetings.flatMap((meeting) => meeting.actionPoints || []);
  const today = new Date();

  return {
    ministry: {
      ministryId: ministry.ministryId,
      name: ministry.name,
      type: ministry.type,
      leader: ministry.leaderName,
      memberCount: ministry.memberCount,
    },
    meetings: {
      total: meetings.length,
      completed: completedMeetings.length,
      avgAttendance: completedMeetings.length
        ? Number(
            (
              completedMeetings.reduce(
                (sum, meeting) => sum + Number(meeting.attendanceCount || 0),
                0,
              ) / completedMeetings.length
            ).toFixed(2),
          )
        : 0,
      attendanceTrend: meetings.map((meeting) => ({
        date: meeting.date,
        attendanceCount: meeting.attendanceCount || 0,
      })),
    },
    members: {
      total: members.length,
      active: members.filter((member) => member.status === 'active').length,
      inactive: members.filter((member) => member.status === 'inactive').length,
      joinedThisMonth: members.filter((member) => member.joinedAt >= joinedThisMonthStart).length,
    },
    topAttendees,
    actionPoints: {
      total: actionPoints.length,
      completed: actionPoints.filter((item) => item.isCompleted).length,
      pending: actionPoints.filter((item) => !item.isCompleted).length,
      overdue: actionPoints.filter((item) => !item.isCompleted && item.dueDate && item.dueDate < today)
        .length,
    },
  };
};

export const getMinistryOverviewReport = async (tenantId) => {
  const ministries = await Ministry.find({ tenantId }).sort({ name: 1 });
  const ministryIds = ministries.map((item) => item.ministryId);
  const meetings = await MinistryMeeting.find({ tenantId, ministryId: { $in: ministryIds } });
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return ministries.map((ministry) => {
    const ministryMeetings = meetings.filter((meeting) => meeting.ministryId === ministry.ministryId);
    const meetingsThisMonth = ministryMeetings.filter((meeting) => meeting.date >= monthStart).length;
    const completedMeetings = ministryMeetings.filter((meeting) => meeting.status === 'completed');
    const lastMeeting = ministryMeetings.sort((left, right) => right.date - left.date)[0];
    const avgAttendance = completedMeetings.length
      ? Number(
          (
            completedMeetings.reduce((sum, meeting) => sum + Number(meeting.attendanceCount || 0), 0) /
            completedMeetings.length
          ).toFixed(2),
        )
      : 0;

    let health = 'inactive';
    if (lastMeeting) {
      const daysSinceMeeting = Math.floor((Date.now() - new Date(lastMeeting.date).getTime()) / (24 * 60 * 60 * 1000));
      if (daysSinceMeeting <= 30) {
        health = 'active';
      } else if (daysSinceMeeting <= 60) {
        health = 'low';
      }
    }

    return {
      ministryId: ministry.ministryId,
      name: ministry.name,
      type: ministry.type,
      memberCount: ministry.memberCount,
      meetingsThisMonth,
      avgAttendance,
      lastMeetingDate: lastMeeting?.date || null,
      health,
    };
  });
};

export const getAllMinistriesAcrossTenants = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {
    ...(query.tenantId ? { tenantId: normalizeString(query.tenantId, { lowercase: true }) } : {}),
  };

  const [ministries, total] = await Promise.all([
    Ministry.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Ministry.countDocuments(filters),
  ]);

  return {
    ministries,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getTomorrowMeetings = async () => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return MinistryMeeting.find({
    date: { $gte: start, $lt: end },
    status: 'scheduled',
  });
};

export const getOverdueActionPoints = async () => {
  const today = new Date();
  const meetings = await MinistryMeeting.find({
    'actionPoints.0': { $exists: true },
    status: { $ne: 'cancelled' },
  });

  return meetings.flatMap((meeting) =>
    (meeting.actionPoints || [])
      .filter((item) => !item.isCompleted && item.dueDate && item.dueDate < today)
      .map((item) => ({
        meeting,
        actionPoint: item,
      })),
  );
};
