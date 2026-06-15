import Member from '../members/member.model.js';
import NotificationLog from '../notifications/notification.model.js';
import CBSGroup from './models/cbsGroup.model.js';
import CBSProspect from './models/cbsProspect.model.js';
import CBSSession from './models/cbsSession.model.js';
import { createHttpError } from '../../utils/httpError.js';
import {
  buildPagination,
  compactObject,
  generateSequence,
  normalizeArray,
  normalizeString,
  parseBoolean,
  parseDate,
  parseNumber,
} from '../../utils/phase11Helpers.js';

const activeStudyStages = ['interested', 'studying', 'advanced_study', 'baptism_candidate'];
const convertedStages = ['baptised', 'member'];

const buildGroupPayload = (payload = {}) =>
  compactObject({
    name: normalizeString(payload.name),
    code: normalizeString(payload.code, { uppercase: true }),
    type: normalizeString(payload.type),
    leaderId: normalizeString(payload.leaderId),
    leaderName: normalizeString(payload.leaderName),
    coLeaderId: normalizeString(payload.coLeaderId),
    coLeaderName: normalizeString(payload.coLeaderName),
    supervisorId: normalizeString(payload.supervisorId),
    location: normalizeString(payload.location),
    zone: normalizeString(payload.zone),
    branch: normalizeString(payload.branch),
    gpsCoordinates:
      typeof payload.gpsCoordinates === 'object' && payload.gpsCoordinates
        ? compactObject({
            lat: parseNumber(payload.gpsCoordinates.lat),
            lng: parseNumber(payload.gpsCoordinates.lng),
          })
        : undefined,
    meetingSchedule:
      typeof payload.meetingSchedule === 'object' && payload.meetingSchedule
        ? compactObject({
            frequency: normalizeString(payload.meetingSchedule.frequency),
            dayOfWeek: parseNumber(payload.meetingSchedule.dayOfWeek),
            time: normalizeString(payload.meetingSchedule.time),
            notes: normalizeString(payload.meetingSchedule.notes),
          })
        : undefined,
    studyMaterial: normalizeString(payload.studyMaterial),
    isActive: typeof payload.isActive === 'boolean' ? payload.isActive : parseBoolean(payload.isActive),
    startedDate: parseDate(payload.startedDate),
  });

const buildProspectPayload = (payload = {}) =>
  compactObject({
    firstName: normalizeString(payload.firstName),
    lastName: normalizeString(payload.lastName),
    phone: normalizeString(payload.phone),
    email: normalizeString(payload.email, { lowercase: true }),
    gender: normalizeString(payload.gender),
    ageGroup: normalizeString(payload.ageGroup),
    address: normalizeString(payload.address),
    occupation: normalizeString(payload.occupation),
    contactMethod: normalizeString(payload.contactMethod),
    referredByMemberId: normalizeString(payload.referredByMemberId),
    referredByName: normalizeString(payload.referredByName),
    firstContactDate: parseDate(payload.firstContactDate),
    studyStage: normalizeString(payload.studyStage),
    studiesAttended: parseNumber(payload.studiesAttended),
    studiesTotal: parseNumber(payload.studiesTotal),
    lastStudyDate: parseDate(payload.lastStudyDate),
    nextStudyDate: parseDate(payload.nextStudyDate),
    baptismDate: parseDate(payload.baptismDate),
    baptismServiceId: normalizeString(payload.baptismServiceId),
    spiritualInterests: normalizeArray(payload.spiritualInterests),
    prayerRequests: normalizeArray(payload.prayerRequests),
    challenges: normalizeArray(payload.challenges),
    leaderNotes: normalizeString(payload.leaderNotes),
    lastContactDate: parseDate(payload.lastContactDate),
    nextFollowUpDate: parseDate(payload.nextFollowUpDate),
    isActive: typeof payload.isActive === 'boolean' ? payload.isActive : parseBoolean(payload.isActive),
  });

const buildSessionPayload = (payload = {}) =>
  compactObject({
    date: parseDate(payload.date),
    startTime: normalizeString(payload.startTime),
    duration: parseNumber(payload.duration),
    venue: normalizeString(payload.venue),
    conductedBy: normalizeString(payload.conductedBy),
    studyTopic: normalizeString(payload.studyTopic),
    studyReference: normalizeString(payload.studyReference),
    curriculum: normalizeString(payload.curriculum),
    attendees: Array.isArray(payload.attendees)
      ? payload.attendees
          .map((item) =>
            compactObject({
              prospectId: normalizeString(item?.prospectId),
              prospectName: normalizeString(item?.prospectName),
              isFirstTime:
                typeof item?.isFirstTime === 'boolean'
                  ? item.isFirstTime
                  : String(item?.isFirstTime).toLowerCase() === 'true',
            }),
          )
          .filter((item) => item.prospectId || item.prospectName)
      : [],
    outcomes: normalizeArray(payload.outcomes),
    leaderNotes: normalizeString(payload.leaderNotes),
    nextSessionDate: parseDate(payload.nextSessionDate),
  });

const refreshGroupStats = async (tenantId, groupId) => {
  const prospects = await CBSProspect.find({ tenantId, groupId });
  const prospectCount = prospects.filter((item) => item.isActive !== false && item.studyStage !== 'member').length;
  const studyCount = prospects.filter((item) => activeStudyStages.includes(item.studyStage)).length;
  const convertedCount = prospects.filter((item) => convertedStages.includes(item.studyStage)).length;

  await CBSGroup.findOneAndUpdate(
    { tenantId, groupId },
    {
      prospectCount,
      studyCount,
      convertedCount,
      updatedAt: new Date(),
    },
  );

  return { prospectCount, studyCount, convertedCount };
};

const findGroupOrThrow = async (tenantId, groupId) => {
  const group = await CBSGroup.findOne({ tenantId, groupId });
  if (!group) {
    throw createHttpError(404, 'CBS group not found.');
  }
  return group;
};

const findProspectOrThrow = async (tenantId, groupId, prospectId) => {
  const prospect = await CBSProspect.findOne({ tenantId, groupId, prospectId });
  if (!prospect) {
    throw createHttpError(404, 'CBS prospect not found.');
  }
  return prospect;
};

const findSessionOrThrow = async (tenantId, groupId, sessionId) => {
  const session = await CBSSession.findOne({ tenantId, groupId, sessionId });
  if (!session) {
    throw createHttpError(404, 'CBS session not found.');
  }
  return session;
};

export const createGroup = async (tenantId, data, createdBy) => {
  const payload = buildGroupPayload(data);
  if (!payload.name) {
    throw createHttpError(400, 'Group name is required.');
  }

  const group = await CBSGroup.create({
    tenantId,
    groupId: await generateSequence(CBSGroup, tenantId, 'groupId', 'CBS'),
    ...payload,
    createdBy,
    updatedBy: createdBy,
  });

  if (group.leaderId) {
    await NotificationLog.create({
      tenantId,
      type: 'system',
      targetUserId: group.leaderId,
      title: 'CBS group assignment',
      message: `You have been assigned to lead ${group.name}.`,
      createdAt: new Date(),
    });
  }

  return group;
};

export const getGroups = async (tenantId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {
    tenantId,
    ...(query.zone ? { zone: normalizeString(query.zone) } : {}),
    ...(query.branch ? { branch: normalizeString(query.branch) } : {}),
  };

  const isActive = parseBoolean(query.isActive);
  if (typeof isActive === 'boolean') {
    filters.isActive = isActive;
  }

  const [groups, total] = await Promise.all([
    CBSGroup.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CBSGroup.countDocuments(filters),
  ]);

  return {
    groups,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getGroupById = async (tenantId, groupId) => findGroupOrThrow(tenantId, groupId);

export const updateGroup = async (tenantId, groupId, data, updatedBy) => {
  const group = await findGroupOrThrow(tenantId, groupId);
  Object.assign(group, buildGroupPayload(data), {
    updatedBy,
    updatedAt: new Date(),
  });
  await group.save();
  return group;
};

export const deactivateGroup = async (tenantId, groupId, updatedBy) => {
  const group = await findGroupOrThrow(tenantId, groupId);
  group.isActive = false;
  group.updatedBy = updatedBy;
  group.updatedAt = new Date();
  await group.save();
  return group;
};

export const createProspect = async (tenantId, groupId, data, createdBy) => {
  const group = await findGroupOrThrow(tenantId, groupId);
  const payload = buildProspectPayload(data);
  if (!payload.firstName || !payload.lastName) {
    throw createHttpError(400, 'Prospect first and last name are required.');
  }

  const prospect = await CBSProspect.create({
    tenantId,
    prospectId: await generateSequence(CBSProspect, tenantId, 'prospectId', 'PRO'),
    groupId,
    groupName: group.name,
    ...payload,
    createdBy,
    updatedBy: createdBy,
  });

  await refreshGroupStats(tenantId, groupId);
  return prospect;
};

export const getGroupProspects = async (tenantId, groupId, query = {}) => {
  await findGroupOrThrow(tenantId, groupId);
  const filters = {
    tenantId,
    groupId,
    ...(query.studyStage ? { studyStage: normalizeString(query.studyStage) } : {}),
  };

  return CBSProspect.find(filters).sort({ createdAt: -1 });
};

export const updateProspect = async (tenantId, groupId, prospectId, data, updatedBy) => {
  const prospect = await findProspectOrThrow(tenantId, groupId, prospectId);
  Object.assign(prospect, buildProspectPayload(data), {
    updatedBy,
    updatedAt: new Date(),
  });
  await prospect.save();
  await refreshGroupStats(tenantId, groupId);
  return prospect;
};

export const convertProspectToMember = async (tenantId, groupId, prospectId, actor) => {
  const prospect = await findProspectOrThrow(tenantId, groupId, prospectId);
  if (prospect.convertedToMemberId) {
    throw createHttpError(400, 'Prospect has already been converted to a member.');
  }

  const member = await Member.create({
    tenantId,
    firstName: prospect.firstName,
    lastName: prospect.lastName,
    phone: prospect.phone,
    email: prospect.email,
    address: prospect.address,
    gender: prospect.gender,
    occupation: prospect.occupation,
    branch: normalizeString((await findGroupOrThrow(tenantId, groupId)).branch),
    membershipStatus: 'new_convert',
    membershipDate: new Date(),
    createdBy: actor.userId,
    updatedBy: actor.userId,
  });

  prospect.convertedToMemberId = member.memberId;
  prospect.convertedAt = new Date();
  prospect.studyStage = 'member';
  prospect.updatedBy = actor.userId;
  prospect.updatedAt = new Date();
  await prospect.save();

  await refreshGroupStats(tenantId, groupId);
  return {
    prospect,
    member,
  };
};

export const createSession = async (tenantId, groupId, data, createdBy) => {
  const group = await findGroupOrThrow(tenantId, groupId);
  const payload = buildSessionPayload(data);
  if (!payload.date) {
    throw createHttpError(400, 'Session date is required.');
  }

  const session = await CBSSession.create({
    tenantId,
    sessionId: await generateSequence(CBSSession, tenantId, 'sessionId', 'SES'),
    groupId,
    groupName: group.name,
    ...payload,
    attendanceCount: payload.attendees?.length || 0,
    guestsCount: (payload.attendees || []).filter((item) => item.isFirstTime).length,
    createdBy,
    updatedAt: new Date(),
  });

  if (payload.attendees?.length) {
    await Promise.all(
      payload.attendees.map((attendee) =>
        CBSProspect.findOneAndUpdate(
          { tenantId, groupId, prospectId: attendee.prospectId },
          {
            $set: {
              lastStudyDate: session.date,
              lastContactDate: session.date,
              updatedAt: new Date(),
            },
            $inc: { studiesAttended: 1 },
          },
        ),
      ),
    );
  }

  await refreshGroupStats(tenantId, groupId);
  return session;
};

export const getSessions = async (tenantId, groupId) => {
  await findGroupOrThrow(tenantId, groupId);
  return CBSSession.find({ tenantId, groupId }).sort({ date: -1 });
};

export const getSessionById = async (tenantId, groupId, sessionId) =>
  findSessionOrThrow(tenantId, groupId, sessionId);

export const updateSession = async (tenantId, groupId, sessionId, data) => {
  const session = await findSessionOrThrow(tenantId, groupId, sessionId);
  const payload = buildSessionPayload(data);
  Object.assign(session, payload, {
    attendanceCount: payload.attendees?.length ?? session.attendanceCount,
    guestsCount:
      payload.attendees?.filter((item) => item.isFirstTime).length ?? session.guestsCount,
    updatedAt: new Date(),
  });
  await session.save();
  return session;
};

export const getCBSStats = async (tenantId) => {
  const [groups, prospects, sessions] = await Promise.all([
    CBSGroup.find({ tenantId }),
    CBSProspect.find({ tenantId }),
    CBSSession.find({ tenantId }),
  ]);

  const byStage = prospects.reduce((accumulator, prospect) => {
    accumulator[prospect.studyStage] = (accumulator[prospect.studyStage] || 0) + 1;
    return accumulator;
  }, {});

  return {
    totalGroups: groups.length,
    activeGroups: groups.filter((item) => item.isActive).length,
    totalProspects: prospects.length,
    convertedCount: prospects.filter((item) => item.convertedToMemberId).length,
    studyPipeline: byStage,
    sessionsThisMonth: sessions.filter((session) => {
      const sessionDate = new Date(session.date);
      const now = new Date();
      return (
        sessionDate.getFullYear() === now.getFullYear() &&
        sessionDate.getMonth() === now.getMonth()
      );
    }).length,
    upcomingSessions: sessions
      .filter((session) => new Date(session.date) >= new Date())
      .sort((left, right) => left.date - right.date)
      .slice(0, 5),
  };
};

export const getCBSOverviewReport = async (tenantId) => {
  const groups = await CBSGroup.find({ tenantId }).sort({ name: 1 });
  const sessions = await CBSSession.find({ tenantId });

  return groups.map((group) => {
    const groupSessions = sessions.filter((session) => session.groupId === group.groupId);
    const avgAttendance = groupSessions.length
      ? Number(
          (
            groupSessions.reduce((sum, session) => sum + Number(session.attendanceCount || 0), 0) /
            groupSessions.length
          ).toFixed(2),
        )
      : 0;

    return {
      groupId: group.groupId,
      name: group.name,
      branch: group.branch,
      zone: group.zone,
      prospectCount: group.prospectCount,
      studyCount: group.studyCount,
      convertedCount: group.convertedCount,
      avgAttendance,
      lastSessionDate: groupSessions.sort((left, right) => right.date - left.date)[0]?.date || null,
    };
  });
};

export const getCBSGroupReport = async (tenantId, groupId) => {
  const [group, prospects, sessions] = await Promise.all([
    findGroupOrThrow(tenantId, groupId),
    CBSProspect.find({ tenantId, groupId }),
    CBSSession.find({ tenantId, groupId }).sort({ date: 1 }),
  ]);

  return {
    group,
    prospects: {
      total: prospects.length,
      byStage: prospects.reduce((accumulator, prospect) => {
        accumulator[prospect.studyStage] = (accumulator[prospect.studyStage] || 0) + 1;
        return accumulator;
      }, {}),
      converted: prospects.filter((item) => item.convertedToMemberId).length,
    },
    sessions: {
      total: sessions.length,
      avgAttendance: sessions.length
        ? Number(
            (
              sessions.reduce((sum, session) => sum + Number(session.attendanceCount || 0), 0) /
              sessions.length
            ).toFixed(2),
          )
        : 0,
      trend: sessions.map((session) => ({
        date: session.date,
        attendanceCount: session.attendanceCount,
      })),
    },
  };
};

export const getGroupsAcrossTenants = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {
    ...(query.tenantId ? { tenantId: normalizeString(query.tenantId, { lowercase: true }) } : {}),
  };

  const [groups, total] = await Promise.all([
    CBSGroup.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CBSGroup.countDocuments(filters),
  ]);

  return {
    groups,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};
