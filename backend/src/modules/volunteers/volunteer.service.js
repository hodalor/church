import mongoose from 'mongoose';
import Member from '../members/member.model.js';
import Tenant from '../tenants/model.js';
import User from '../users/model.js';
import NotificationLog from '../notifications/notification.model.js';
import { createHttpError } from '../../utils/httpError.js';
import { ensureBranchAccess, getAssignedBranches, normalizeBranchList } from '../../utils/branchScope.js';
import Volunteer from './models/volunteer.model.js';
import DutyRoster from './models/dutyRoster.model.js';

const normalizeString = (value, { lowercase = false } = {}) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  if (!nextValue) {
    return undefined;
  }

  return lowercase ? nextValue.toLowerCase() : nextValue;
};

const normalizeTenantId = (value) => normalizeString(value, { lowercase: true });

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeString(String(item))).filter(Boolean))];
  }

  if (typeof value === 'string') {
    return [...new Set(value.split(',').map((item) => normalizeString(item)).filter(Boolean))];
  }

  return [];
};

const parseDate = (value) => {
  if (!value) {
    return undefined;
  }

  const nextDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(nextDate.getTime()) ? undefined : nextDate;
};

const buildPagination = (query = {}, fallbackLimit = 20) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || fallbackLimit, 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const startOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const endOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);

const addDays = (value, amount) => {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const buildMemberName = (member = {}) =>
  [member.firstName, member.lastName].filter(Boolean).join(' ').trim();

const serializeVolunteer = (volunteerDocument) => {
  const volunteer = volunteerDocument?.toObject ? volunteerDocument.toObject() : volunteerDocument;
  return {
    ...volunteer,
    _id: volunteer._id?.toString?.() || String(volunteer._id || ''),
    id: volunteer._id?.toString?.() || String(volunteer._id || ''),
  };
};

const serializeRoster = (rosterDocument) => {
  const roster = rosterDocument?.toObject ? rosterDocument.toObject() : rosterDocument;
  return {
    ...roster,
    _id: roster._id?.toString?.() || String(roster._id || ''),
    id: roster._id?.toString?.() || String(roster._id || ''),
  };
};

const createNotifications = async (notifications = []) => {
  if (!notifications.length) {
    return;
  }

  await NotificationLog.insertMany(
    notifications.map((notification) => ({
      ...notification,
      isRead: notification.isRead ?? false,
      createdAt: notification.createdAt || new Date(),
    })),
    { ordered: false },
  );
};

const getScopedMemberIds = async (tenantId, actor = {}, branchInput) => {
  const requestedBranches = normalizeBranchList(branchInput);
  const assignedBranches = getAssignedBranches(actor);
  const branches = assignedBranches.length
    ? requestedBranches.length
      ? requestedBranches.filter((branch) => assignedBranches.includes(branch))
      : assignedBranches
    : requestedBranches;

  if (!branches.length) {
    return null;
  }

  const members = await Member.find({
    tenantId,
    branch: { $in: branches },
    isDeleted: false,
  }).select('memberId');

  return members.map((member) => member.memberId);
};

const getMemberOrThrow = async (tenantId, memberId) => {
  const member = await Member.findOne({
    tenantId,
    memberId: String(memberId || '').trim(),
    isDeleted: false,
  });

  if (!member) {
    throw createHttpError(404, 'Member not found.');
  }

  return member;
};

const getVolunteerOrThrow = async (tenantId, volunteerId) => {
  const filter = mongoose.isValidObjectId(volunteerId)
    ? { tenantId, _id: volunteerId }
    : { tenantId, memberId: String(volunteerId || '').trim() };
  const volunteer = await Volunteer.findOne(filter);

  if (!volunteer) {
    throw createHttpError(404, 'Volunteer not found.');
  }

  return volunteer;
};

const getRosterOrThrow = async (tenantId, rosterId) => {
  const normalized = String(rosterId || '').trim();
  const filter = mongoose.isValidObjectId(normalized)
    ? { tenantId, $or: [{ _id: normalized }, { rosterId: normalized }] }
    : { tenantId, rosterId: normalized };
  const roster = await DutyRoster.findOne(filter);

  if (!roster) {
    throw createHttpError(404, 'Duty roster not found.');
  }

  return roster;
};

const resolveAssignmentId = (roster) =>
  `ASN-${String((roster.assignments?.length || 0) + 1).padStart(4, '0')}`;

const buildAssignmentPayload = (roster, volunteer, data = {}) => ({
  assignmentId: resolveAssignmentId(roster),
  department: normalizeString(data.department) || volunteer.primaryDepartment || volunteer.departments?.[0] || '',
  role: normalizeString(data.role) || 'Volunteer',
  volunteerId: String(volunteer._id),
  memberId: volunteer.memberId,
  memberName: volunteer.memberName,
  memberPhoto: volunteer.memberPhoto || '',
  status: data.status || 'assigned',
  notes: normalizeString(data.notes),
});

const incrementVolunteerAssignments = async (tenantId, volunteerIds = []) => {
  if (!volunteerIds.length) {
    return;
  }

  await Volunteer.updateMany(
    {
      tenantId,
      _id: { $in: volunteerIds },
    },
    {
      $inc: { 'performance.totalAssignments': 1 },
      $set: { updatedAt: new Date() },
    },
  );
};

const findVolunteerUsers = async (tenantId, memberId) =>
  User.find({
    tenantId,
    memberId,
    isActive: true,
  }).select('_id');

const awardBadgeNotifications = async (tenantId, volunteer, newBadges = []) => {
  if (!newBadges.length) {
    return;
  }

  const [volunteerUsers, supervisor] = await Promise.all([
    findVolunteerUsers(tenantId, volunteer.memberId),
    volunteer.supervisorId
      ? User.findOne({ tenantId, _id: volunteer.supervisorId, isActive: true }).select('_id')
      : null,
  ]);

  const notifications = [
    ...volunteerUsers.map((user) => ({
      tenantId,
      type: 'system',
      memberId: volunteer.memberId,
      memberName: volunteer.memberName,
      targetUserId: String(user._id),
      title: 'New volunteer badge earned',
      message: `Congratulations! You earned ${newBadges.join(', ')} for faithful service.`,
    })),
  ];

  if (supervisor?._id) {
    notifications.push({
      tenantId,
      type: 'system',
      memberId: volunteer.memberId,
      memberName: volunteer.memberName,
      targetUserId: String(supervisor._id),
      title: 'Volunteer badge awarded',
      message: `${volunteer.memberName} earned ${newBadges.join(', ')}.`,
    });
  }

  await createNotifications(notifications);
};

const getVolunteerBadges = (attended = 0) => {
  const badges = [];
  if (attended >= 10) {
    badges.push('faithful_servant');
  }
  if (attended >= 50) {
    badges.push('dedicated_servant');
  }
  if (attended >= 100) {
    badges.push('pillar_of_service');
  }
  return badges;
};

const ensureVolunteerBranchAccess = async (tenantId, volunteer, actor = {}) => {
  const member = await getMemberOrThrow(tenantId, volunteer.memberId);
  ensureBranchAccess(actor, member.branch, 'You do not have access to this volunteer branch.');
  return member;
};

export const registerVolunteer = async (tenantId, data = {}, createdBy = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const member = await getMemberOrThrow(normalizedTenantId, data.memberId);

  const existing = await Volunteer.findOne({
    tenantId: normalizedTenantId,
    memberId: member.memberId,
  }).select('_id');

  if (existing) {
    throw createHttpError(409, 'This member is already registered as a volunteer.');
  }

  const volunteer = await Volunteer.create({
    tenantId: normalizedTenantId,
    memberId: member.memberId,
    memberName: buildMemberName(member),
    memberPhoto: member.photoUrl || '',
    memberPhone: member.phone || '',
    departments: normalizeArray(data.departments),
    primaryDepartment: normalizeString(data.primaryDepartment) || normalizeArray(data.departments)[0] || '',
    skills: normalizeArray(data.skills),
    availability: {
      ...(data.availability || {}),
      notes: normalizeString(data.availability?.notes),
    },
    notes: normalizeString(data.notes),
    supervisorId: normalizeString(data.supervisorId),
    createdBy: createdBy.userId || 'system',
    updatedBy: createdBy.userId || 'system',
  });

  await Member.updateOne(
    { tenantId: normalizedTenantId, memberId: member.memberId },
    { $addToSet: { tags: 'volunteer' }, $set: { updatedAt: new Date() } },
  );

  if (volunteer.supervisorId) {
    await createNotifications([
      {
        tenantId: normalizedTenantId,
        type: 'system',
        memberId: member.memberId,
        memberName: buildMemberName(member),
        targetUserId: volunteer.supervisorId,
        title: 'New volunteer assigned',
        message: `${buildMemberName(member)} has been registered under your volunteer supervision.`,
      },
    ]);
  }

  return serializeVolunteer(volunteer);
};

export const getAllVolunteers = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const pagination = buildPagination(query);
  const filters = { tenantId: normalizedTenantId };
  const search = normalizeString(query.search);
  const departments = normalizeArray(query.department || query.departments);
  const skills = normalizeArray(query.skills);

  if (query.status) {
    filters.status = query.status;
  }
  if (departments.length) {
    filters.departments = { $in: departments };
  }
  if (skills.length) {
    filters.skills = { $in: skills };
  }
  if (search) {
    filters.$or = [
      { memberName: { $regex: search, $options: 'i' } },
      { memberId: { $regex: search, $options: 'i' } },
      { departments: { $elemMatch: { $regex: search, $options: 'i' } } },
      { skills: { $elemMatch: { $regex: search, $options: 'i' } } },
    ];
  }

  const scopedMemberIds = await getScopedMemberIds(normalizedTenantId, actor, query.branch || query.branches);
  if (Array.isArray(scopedMemberIds)) {
    filters.memberId = { $in: scopedMemberIds };
  }

  const [items, total] = await Promise.all([
    Volunteer.find(filters)
      .sort({ 'performance.reliabilityScore': -1, memberName: 1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Volunteer.countDocuments(filters),
  ]);

  return {
    items: items.map(serializeVolunteer),
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
  };
};

export const getVolunteerStats = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const filters = { tenantId: normalizedTenantId };
  const scopedMemberIds = await getScopedMemberIds(normalizedTenantId, actor, query.branch || query.branches);
  if (Array.isArray(scopedMemberIds)) {
    filters.memberId = { $in: scopedMemberIds };
  }

  const volunteers = await Volunteer.find(filters).lean();
  const active = volunteers.filter((item) => item.status === 'active');
  const rostersThisMonth = await DutyRoster.countDocuments({
    tenantId: normalizedTenantId,
    date: {
      $gte: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      $lte: endOfDay(new Date()),
    },
  });

  const byDepartmentMap = new Map();
  for (const volunteer of volunteers) {
    for (const department of volunteer.departments || []) {
      const current = byDepartmentMap.get(department) || {
        department,
        count: 0,
        reliabilityTotal: 0,
      };
      current.count += 1;
      current.reliabilityTotal += Number(volunteer.performance?.reliabilityScore || 0);
      byDepartmentMap.set(department, current);
    }
  }

  return {
    total: volunteers.length,
    active: active.length,
    inactive: volunteers.filter((item) => item.status === 'inactive').length,
    onLeave: volunteers.filter((item) => item.status === 'on_leave').length,
    byDepartment: [...byDepartmentMap.values()].map((item) => ({
      department: item.department,
      count: item.count,
      avgReliability: item.count ? Number((item.reliabilityTotal / item.count).toFixed(2)) : 0,
    })),
    topVolunteers: [...volunteers]
      .sort(
        (left, right) =>
          Number(right.performance?.reliabilityScore || 0) - Number(left.performance?.reliabilityScore || 0),
      )
      .slice(0, 5)
      .map(serializeVolunteer),
    lowestReliability: [...volunteers]
      .sort(
        (left, right) =>
          Number(left.performance?.reliabilityScore || 0) - Number(right.performance?.reliabilityScore || 0),
      )
      .slice(0, 5)
      .map(serializeVolunteer),
    servicesThisMonth: rostersThisMonth,
    avgReliabilityScore: active.length
      ? Number(
          (
            active.reduce(
              (sum, item) => sum + Number(item.performance?.reliabilityScore || 0),
              0,
            ) / active.length
          ).toFixed(2),
        )
      : 0,
    badgesAwarded: volunteers.reduce(
      (sum, item) => sum + Number(item.performance?.badges?.length || 0),
      0,
    ),
  };
};

export const getAvailableVolunteers = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const targetDate = parseDate(query.date) || new Date();
  const targetDay = dayKeys[targetDate.getDay()];
  const filters = {
    tenantId: normalizedTenantId,
    status: 'active',
    [`availability.${targetDay}`]: true,
  };
  const departments = normalizeArray(query.department || query.departments);
  const skills = normalizeArray(query.skills);

  if (departments.length) {
    filters.departments = { $in: departments };
  }
  if (skills.length) {
    filters.skills = { $in: skills };
  }

  const scopedMemberIds = await getScopedMemberIds(normalizedTenantId, actor, query.branch || query.branches);
  if (Array.isArray(scopedMemberIds)) {
    filters.memberId = { $in: scopedMemberIds };
  }

  const volunteers = await Volunteer.find(filters).sort({
    'performance.reliabilityScore': -1,
    'performance.attended': -1,
    memberName: 1,
  });

  return volunteers.map(serializeVolunteer);
};

export const getVolunteerById = async (tenantId, volunteerId, actor = {}) => {
  const volunteer = await getVolunteerOrThrow(normalizeTenantId(tenantId), volunteerId);
  await ensureVolunteerBranchAccess(normalizeTenantId(tenantId), volunteer, actor);
  return serializeVolunteer(volunteer);
};

export const getVolunteerByMemberId = async (tenantId, memberId, actor = {}) => {
  const volunteer = await getVolunteerOrThrow(normalizeTenantId(tenantId), memberId);
  await ensureVolunteerBranchAccess(normalizeTenantId(tenantId), volunteer, actor);
  return serializeVolunteer(volunteer);
};

export const updateVolunteer = async (tenantId, volunteerId, data = {}, actor = {}) => {
  const volunteer = await getVolunteerOrThrow(normalizeTenantId(tenantId), volunteerId);
  await ensureVolunteerBranchAccess(normalizeTenantId(tenantId), volunteer, actor);

  if (Array.isArray(data.departments)) {
    volunteer.departments = normalizeArray(data.departments);
  }
  if (data.primaryDepartment !== undefined) {
    volunteer.primaryDepartment = normalizeString(data.primaryDepartment) || volunteer.primaryDepartment;
  }
  if (Array.isArray(data.skills)) {
    volunteer.skills = normalizeArray(data.skills);
  }
  if (data.availability && typeof data.availability === 'object') {
    volunteer.availability = {
      ...volunteer.availability?.toObject?.(),
      ...data.availability,
      notes:
        data.availability.notes !== undefined
          ? normalizeString(data.availability.notes) || ''
          : volunteer.availability?.notes,
    };
  }
  if (data.notes !== undefined) {
    volunteer.notes = normalizeString(data.notes) || '';
  }
  if (data.supervisorId !== undefined) {
    volunteer.supervisorId = normalizeString(data.supervisorId) || '';
  }
  volunteer.updatedBy = actor.userId || volunteer.updatedBy;
  await volunteer.save();
  return serializeVolunteer(volunteer);
};

export const updateVolunteerStatus = async (tenantId, volunteerId, status, actor = {}) => {
  const volunteer = await getVolunteerOrThrow(normalizeTenantId(tenantId), volunteerId);
  await ensureVolunteerBranchAccess(normalizeTenantId(tenantId), volunteer, actor);
  volunteer.status = status;
  volunteer.updatedBy = actor.userId || volunteer.updatedBy;
  await volunteer.save();
  return serializeVolunteer(volunteer);
};

export const updatePerformance = async (tenantId, volunteerId, data = {}, actor = {}) => {
  const volunteer = await getVolunteerOrThrow(normalizeTenantId(tenantId), volunteerId);
  await ensureVolunteerBranchAccess(normalizeTenantId(tenantId), volunteer, actor);
  volunteer.performance = {
    ...volunteer.performance?.toObject?.(),
    ...volunteer.performance,
    ...(data.totalAssignments !== undefined
      ? { totalAssignments: Number(data.totalAssignments) }
      : {}),
    ...(data.attended !== undefined ? { attended: Number(data.attended) } : {}),
    ...(data.absent !== undefined ? { absent: Number(data.absent) } : {}),
    ...(data.reliabilityScore !== undefined
      ? { reliabilityScore: Number(data.reliabilityScore) }
      : {}),
    ...(data.lastServedDate !== undefined
      ? { lastServedDate: parseDate(data.lastServedDate) }
      : {}),
    ...(Array.isArray(data.badges) ? { badges: normalizeArray(data.badges) } : {}),
  };
  volunteer.updatedBy = actor.userId || volunteer.updatedBy;
  await volunteer.save();
  return serializeVolunteer(volunteer);
};

export const addTraining = async (tenantId, volunteerId, data = {}, actor = {}) => {
  const volunteer = await getVolunteerOrThrow(normalizeTenantId(tenantId), volunteerId);
  await ensureVolunteerBranchAccess(normalizeTenantId(tenantId), volunteer, actor);
  volunteer.trainings.push({
    title: data.title,
    completedAt: parseDate(data.completedAt) || new Date(),
    certUrl: normalizeString(data.certUrl),
    conductedBy: normalizeString(data.conductedBy) || actor.name || actor.userId || 'System',
  });
  volunteer.updatedBy = actor.userId || volunteer.updatedBy;
  await volunteer.save();
  return serializeVolunteer(volunteer);
};

export const removeVolunteer = async (tenantId, volunteerId, actor = {}) => {
  const volunteer = await getVolunteerOrThrow(normalizeTenantId(tenantId), volunteerId);
  await ensureVolunteerBranchAccess(normalizeTenantId(tenantId), volunteer, actor);
  await Volunteer.deleteOne({ _id: volunteer._id, tenantId: volunteer.tenantId });
  await Member.updateOne(
    { tenantId: volunteer.tenantId, memberId: volunteer.memberId },
    { $pull: { tags: 'volunteer' }, $set: { updatedAt: new Date() } },
  );
  return { deleted: true };
};

export const createRoster = async (tenantId, data = {}, createdBy = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  ensureBranchAccess(createdBy, data.branch, 'You do not have access to this roster branch.');

  const roster = new DutyRoster({
    tenantId: normalizedTenantId,
    title: data.title,
    serviceId: normalizeString(data.serviceId),
    eventId: normalizeString(data.eventId),
    date: parseDate(data.date),
    branch: normalizeString(data.branch),
    createdBy: createdBy.userId || 'system',
    updatedBy: createdBy.userId || 'system',
    assignments: [],
  });

  const assignmentItems = Array.isArray(data.assignments) ? data.assignments : [];
  const volunteerIds = [];
  for (const item of assignmentItems) {
    const volunteer = await getVolunteerOrThrow(normalizedTenantId, item.volunteerId);
    await ensureVolunteerBranchAccess(normalizedTenantId, volunteer, createdBy);
    roster.assignments.push(buildAssignmentPayload(roster, volunteer, item));
    volunteerIds.push(String(volunteer._id));
  }

  await roster.save();
  await incrementVolunteerAssignments(normalizedTenantId, volunteerIds);
  return serializeRoster(roster);
};

export const getAllRosters = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const pagination = buildPagination(query);
  const filters = { tenantId: normalizedTenantId };
  const branches = normalizeBranchList(query.branch || query.branches);
  const assignedBranches = getAssignedBranches(actor);
  const scopedBranches = assignedBranches.length
    ? branches.length
      ? branches.filter((branch) => assignedBranches.includes(branch))
      : assignedBranches
    : branches;

  if (scopedBranches.length) {
    filters.branch = { $in: scopedBranches };
  }
  if (query.isPublished === 'true') {
    filters.isPublished = true;
  }
  if (query.isPublished === 'false') {
    filters.isPublished = false;
  }
  if (query.from || query.to) {
    filters.date = {
      ...(query.from ? { $gte: startOfDay(parseDate(query.from) || new Date()) } : {}),
      ...(query.to ? { $lte: endOfDay(parseDate(query.to) || new Date()) } : {}),
    };
  }

  const [items, total] = await Promise.all([
    DutyRoster.find(filters)
      .sort({ date: 1, createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    DutyRoster.countDocuments(filters),
  ]);

  return {
    items: items.map(serializeRoster),
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
  };
};

export const getUpcomingRosters = async (tenantId, query = {}, actor = {}) => {
  return getAllRosters(
    normalizeTenantId(tenantId),
    {
      ...query,
      from: query.from || new Date().toISOString(),
    },
    actor,
  );
};

export const getRosterById = async (tenantId, rosterId, actor = {}) => {
  const roster = await getRosterOrThrow(normalizeTenantId(tenantId), rosterId);
  ensureBranchAccess(actor, roster.branch, 'You do not have access to this roster branch.');
  return serializeRoster(roster);
};

export const updateRoster = async (tenantId, rosterId, data = {}, actor = {}) => {
  const roster = await getRosterOrThrow(normalizeTenantId(tenantId), rosterId);
  ensureBranchAccess(actor, roster.branch, 'You do not have access to this roster branch.');

  if (data.title !== undefined) {
    roster.title = normalizeString(data.title) || roster.title;
  }
  if (data.date !== undefined) {
    roster.date = parseDate(data.date) || roster.date;
  }
  if (data.branch !== undefined) {
    ensureBranchAccess(actor, data.branch, 'You do not have access to this roster branch.');
    roster.branch = normalizeString(data.branch) || '';
  }
  if (data.serviceId !== undefined) {
    roster.serviceId = normalizeString(data.serviceId) || '';
  }
  if (data.eventId !== undefined) {
    roster.eventId = normalizeString(data.eventId) || '';
  }
  roster.updatedBy = actor.userId || roster.updatedBy;
  await roster.save();
  return serializeRoster(roster);
};

export const deleteRoster = async (tenantId, rosterId, actor = {}) => {
  const roster = await getRosterOrThrow(normalizeTenantId(tenantId), rosterId);
  ensureBranchAccess(actor, roster.branch, 'You do not have access to this roster branch.');
  await DutyRoster.deleteOne({ _id: roster._id, tenantId: roster.tenantId });
  return { deleted: true };
};

export const addAssignment = async (tenantId, rosterId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const roster = await getRosterOrThrow(normalizedTenantId, rosterId);
  ensureBranchAccess(actor, roster.branch, 'You do not have access to this roster branch.');
  const volunteer = await getVolunteerOrThrow(normalizedTenantId, data.volunteerId);
  await ensureVolunteerBranchAccess(normalizedTenantId, volunteer, actor);

  const assignment = buildAssignmentPayload(roster, volunteer, data);
  roster.assignments.push(assignment);
  roster.updatedBy = actor.userId || roster.updatedBy;
  await roster.save();
  await incrementVolunteerAssignments(normalizedTenantId, [String(volunteer._id)]);

  return serializeRoster(roster);
};

export const updateAssignment = async (tenantId, rosterId, assignmentId, data = {}, actor = {}) => {
  const roster = await getRosterOrThrow(normalizeTenantId(tenantId), rosterId);
  ensureBranchAccess(actor, roster.branch, 'You do not have access to this roster branch.');
  const assignment = (roster.assignments || []).find((item) => item.assignmentId === assignmentId);

  if (!assignment) {
    throw createHttpError(404, 'Roster assignment not found.');
  }

  if (data.department !== undefined) {
    assignment.department = normalizeString(data.department) || assignment.department;
  }
  if (data.role !== undefined) {
    assignment.role = normalizeString(data.role) || assignment.role;
  }
  if (data.status !== undefined) {
    assignment.status = data.status;
    assignment.confirmedAt = data.status === 'confirmed' ? new Date() : assignment.confirmedAt;
  }
  if (data.declinedReason !== undefined) {
    assignment.declinedReason = normalizeString(data.declinedReason) || '';
  }
  if (data.notes !== undefined) {
    assignment.notes = normalizeString(data.notes) || '';
  }

  roster.updatedBy = actor.userId || roster.updatedBy;
  await roster.save();
  return serializeRoster(roster);
};

export const removeAssignment = async (tenantId, rosterId, assignmentId, actor = {}) => {
  const roster = await getRosterOrThrow(normalizeTenantId(tenantId), rosterId);
  ensureBranchAccess(actor, roster.branch, 'You do not have access to this roster branch.');
  roster.assignments = (roster.assignments || []).filter((item) => item.assignmentId !== assignmentId);
  roster.updatedBy = actor.userId || roster.updatedBy;
  await roster.save();
  return serializeRoster(roster);
};

export const publishRoster = async (tenantId, rosterId, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const roster = await getRosterOrThrow(normalizedTenantId, rosterId);
  ensureBranchAccess(actor, roster.branch, 'You do not have access to this roster branch.');

  roster.isPublished = true;
  roster.publishedAt = new Date();
  roster.updatedBy = actor.userId || roster.updatedBy;
  await roster.save();

  const assignmentMemberIds = (roster.assignments || []).map((item) => item.memberId).filter(Boolean);
  const [users, leaders] = await Promise.all([
    User.find({ tenantId: normalizedTenantId, memberId: { $in: assignmentMemberIds }, isActive: true }).select(
      '_id memberId',
    ),
    User.find({
      tenantId: normalizedTenantId,
      isActive: true,
      role: { $in: ['head_pastor', 'associate_pastor', 'volunteer_leader', 'branch_pastor'] },
    }).select('_id role'),
  ]);

  const userMap = new Map(users.map((user) => [user.memberId, String(user._id)]));
  const notifications = [
    ...(roster.assignments || [])
      .map((assignment) =>
        userMap.get(assignment.memberId)
          ? {
              tenantId: normalizedTenantId,
              type: 'reminder',
              memberId: assignment.memberId,
              memberName: assignment.memberName,
              targetUserId: userMap.get(assignment.memberId),
              title: 'Duty roster published',
              message: `You have been assigned to serve on ${new Date(roster.date).toLocaleDateString()} as ${assignment.role} in ${assignment.department}.`,
            }
          : null,
      )
      .filter(Boolean),
    ...leaders.map((leader) => ({
      tenantId: normalizedTenantId,
      type: 'system',
      targetUserId: String(leader._id),
      title: 'Duty roster published',
      message: `${roster.title} has been published with ${roster.assignments.length} assignments.`,
    })),
  ];

  await createNotifications(notifications);
  return serializeRoster(roster);
};

export const autoGenerateRoster = async (tenantId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const targetDate = parseDate(data.date);
  const departments = normalizeArray(data.departments);
  const requiredCounts = data.volunteerCountPerDepartment || {};
  const previousWeekRosters = await DutyRoster.find({
    tenantId: normalizedTenantId,
    date: {
      $gte: startOfDay(addDays(targetDate, -7)),
      $lte: endOfDay(addDays(targetDate, -1)),
    },
  }).lean();
  const recentlyRostered = new Set(
    previousWeekRosters.flatMap((roster) => (roster.assignments || []).map((assignment) => assignment.volunteerId)),
  );

  const assignments = [];
  for (const department of departments) {
    const neededCount = Math.max(Number(requiredCounts[department] || 0), 0);
    if (!neededCount) {
      continue;
    }

    const availableVolunteers = await getAvailableVolunteers(
      normalizedTenantId,
      {
        date: targetDate,
        department,
        branch: data.branch,
      },
      actor,
    );

    const fairRotation = availableVolunteers.filter(
      (volunteer) => !recentlyRostered.has(String(volunteer._id || volunteer.id)),
    );
    const pool = fairRotation.length >= neededCount ? fairRotation : availableVolunteers;
    const selected = pool.slice(0, neededCount);

    for (const volunteer of selected) {
      assignments.push({
        volunteerId: volunteer._id || volunteer.id,
        department,
        role: `${department} volunteer`,
      });
    }
  }

  return createRoster(
    normalizedTenantId,
    {
      title:
        normalizeString(data.title) ||
        `Roster - ${targetDate.toLocaleDateString()}${data.branch ? ` - ${data.branch}` : ''}`,
      date: targetDate,
      serviceId: normalizeString(data.serviceId),
      eventId: normalizeString(data.eventId),
      branch: normalizeString(data.branch),
      assignments,
    },
    actor,
  );
};

export const markAttendance = async (tenantId, rosterId, assignmentId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const roster = await getRosterOrThrow(normalizedTenantId, rosterId);
  ensureBranchAccess(actor, roster.branch, 'You do not have access to this roster branch.');
  const assignment = (roster.assignments || []).find((item) => item.assignmentId === assignmentId);

  if (!assignment) {
    throw createHttpError(404, 'Roster assignment not found.');
  }

  const volunteer = await getVolunteerOrThrow(normalizedTenantId, assignment.volunteerId);
  const previousStatus = assignment.status;
  assignment.status = data.status;
  roster.updatedBy = actor.userId || roster.updatedBy;
  await roster.save();

  if (previousStatus !== 'attended' && previousStatus !== 'absent') {
    volunteer.performance.totalAssignments = Math.max(
      Number(volunteer.performance?.totalAssignments || 0),
      Number(volunteer.performance?.attended || 0) + Number(volunteer.performance?.absent || 0) + 1,
    );
  }

  if (data.status === 'attended' && previousStatus !== 'attended') {
    volunteer.performance.attended = Number(volunteer.performance?.attended || 0) + 1;
    volunteer.performance.lastServedDate = roster.date;
  }

  if (data.status === 'absent' && previousStatus !== 'absent') {
    volunteer.performance.absent = Number(volunteer.performance?.absent || 0) + 1;
  }

  const totalAssignments = Math.max(Number(volunteer.performance?.totalAssignments || 0), 1);
  volunteer.performance.reliabilityScore = Number(
    ((Number(volunteer.performance?.attended || 0) / totalAssignments) * 100).toFixed(2),
  );

  const currentBadges = new Set(volunteer.performance?.badges || []);
  const earnedBadges = getVolunteerBadges(Number(volunteer.performance?.attended || 0));
  const newBadges = earnedBadges.filter((badge) => !currentBadges.has(badge));
  volunteer.performance.badges = [...new Set([...(volunteer.performance?.badges || []), ...earnedBadges])];
  volunteer.updatedBy = actor.userId || volunteer.updatedBy;
  await volunteer.save();

  await awardBadgeNotifications(normalizedTenantId, volunteer, newBadges);

  return {
    roster: serializeRoster(roster),
    assignment,
  };
};

export const getPlatformVolunteerOverview = async () => {
  const tenants = await Tenant.find({ isActive: true, isSuspended: false }).select('tenantId churchName');

  const rows = await Promise.all(
    tenants.map(async (tenant) => {
      const volunteers = await Volunteer.find({ tenantId: tenant.tenantId }).lean();
      const active = volunteers.filter((item) => item.status === 'active').length;
      const avgReliability = volunteers.length
        ? Number(
            (
              volunteers.reduce(
                (sum, item) => sum + Number(item.performance?.reliabilityScore || 0),
                0,
              ) / volunteers.length
            ).toFixed(2),
          )
        : 0;

      return {
        tenantId: tenant.tenantId,
        churchName: tenant.churchName,
        total: volunteers.length,
        active,
        onLeave: volunteers.filter((item) => item.status === 'on_leave').length,
        avgReliability,
      };
    }),
  );

  return {
    tenants: rows,
    totalVolunteers: rows.reduce((sum, item) => sum + item.total, 0),
    totalActive: rows.reduce((sum, item) => sum + item.active, 0),
  };
};
