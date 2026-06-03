import mongoose from 'mongoose';
import twilio from 'twilio';
import Member from '../members/member.model.js';
import NotificationLog from '../notifications/notification.model.js';
import Tenant from '../tenants/model.js';
import User from '../users/model.js';
import CareCase, {
  careCaseTypes,
  careStatuses,
  careUrgencyLevels,
  interactionTypes,
  milestoneTypes,
  supportTypes,
} from './models/careCase.model.js';
import Appointment, {
  appointmentStatuses,
  appointmentTypes,
} from './models/appointment.model.js';
import DiscipleshipTrack, {
  discipleshipStepTypes,
  discipleshipTargetGroups,
} from './models/discipleshipTrack.model.js';
import MemberDiscipleship, {
  discipleshipEnrollmentStatuses,
} from './models/memberDiscipleship.model.js';
import { createHttpError } from '../../utils/httpError.js';
import { getAssignedBranches } from '../../utils/branchScope.js';

const pastoralFullAccessRoles = ['super_admin', 'head_pastor', 'associate_pastor'];
const pastoralLimitedRoles = ['care_leader', 'branch_pastor'];
const pastoralAccessRoles = [...pastoralFullAccessRoles, ...pastoralLimitedRoles];
const pastoralAssignableRoles = ['head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'];
const welfareReportSupportTypes = ['food', 'medical', 'financial', 'clothing', 'housing'];
const phoneReminderClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

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

const startOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const endOfDay = (value = new Date()) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);

const addDays = (value, amount) => {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const getDateDiffInDays = (from, to = new Date()) => {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);

  if (!fromDate || !toDate) {
    return 0;
  }

  return Math.max(0, Math.floor((startOfDay(toDate) - startOfDay(fromDate)) / (24 * 60 * 60 * 1000)));
};

const percentage = (completed, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((completed / total) * 100);
};

const buildMemberName = (member = {}) => [member.firstName, member.lastName].filter(Boolean).join(' ').trim();

const hasConfidentialAccess = (role) => pastoralFullAccessRoles.includes(role);

const ensurePastoralRoleAccess = (user = {}) => {
  if (!pastoralAccessRoles.includes(user.role)) {
    throw createHttpError(403, 'You do not have permission for this pastoral care action.');
  }
};

const ensurePastoralAdminAccess = (user = {}) => {
  if (!pastoralFullAccessRoles.includes(user.role) && user.role !== 'branch_pastor') {
    throw createHttpError(403, 'Pastoral leadership access is required for this action.');
  }
};

const ensureConfidentialAccess = (role) => {
  if (!hasConfidentialAccess(role)) {
    throw createHttpError(403, 'You do not have permission to access confidential notes.');
  }
};

const buildInteractionId = (careCase) => `INT-${String((careCase?.interactions?.length || 0) + 1).padStart(4, '0')}`;

const findPrayerRequestOrThrow = (careCase, prayerRequestId) => {
  const prayerRequest = (careCase.prayerRequests || []).find(
    (item) => String(item._id) === String(prayerRequestId),
  );

  if (!prayerRequest) {
    throw createHttpError(404, 'Prayer request not found.');
  }

  return prayerRequest;
};

const serializeInteraction = (interaction = {}, role) => ({
  interactionId: interaction.interactionId,
  date: interaction.date,
  type: interaction.type,
  summary: interaction.summary || '',
  confidentialNotes:
    interaction.isConfidential && !hasConfidentialAccess(role)
      ? '[CONFIDENTIAL — restricted access]'
      : interaction.confidentialNotes || '',
  isConfidential: interaction.isConfidential === true,
  nextSteps: interaction.nextSteps || '',
  nextFollowUpDate: interaction.nextFollowUpDate || null,
  conductedBy: interaction.conductedBy || '',
  conductedByName: interaction.conductedByName || '',
  duration: interaction.duration ?? null,
  location: interaction.location || '',
});

const sanitizeCareCase = (careCaseDocument, role) => {
  const careCase = careCaseDocument?.toObject ? careCaseDocument.toObject() : careCaseDocument;

  return {
    ...careCase,
    id: careCase._id?.toString?.() || '',
    _id: careCase._id?.toString?.() || '',
    interactions: (careCase.interactions || []).map((interaction) => serializeInteraction(interaction, role)),
  };
};

const getScopedBranchFilters = (tenantId, user = {}, explicitBranch) => {
  if (user.role !== 'branch_pastor') {
    return null;
  }

  const assignedBranches = getAssignedBranches(user);
  const requestedBranches = normalizeArray(explicitBranch);
  const scopedBranches = requestedBranches.length
    ? requestedBranches.filter((branch) => assignedBranches.includes(branch))
    : assignedBranches;

  if (!scopedBranches.length) {
    return [];
  }

  return Member.find({
    tenantId,
    isDeleted: false,
    branch: { $in: scopedBranches },
  }).select('memberId');
};

const getMemberForTenant = async (tenantId, memberId) => {
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

const getUsersForMember = async (tenantId, memberId) =>
  User.find({
    tenantId,
    memberId: String(memberId || '').trim(),
    isActive: true,
  }).select('_id');

const createNotifications = async (notifications = []) => {
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

const sendSmsIfConfigured = async (to, body) => {
  if (!phoneReminderClient || !process.env.TWILIO_FROM_NUMBER || !to || !body) {
    return false;
  }

  await phoneReminderClient.messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to,
    body,
  });

  return true;
};

const findAssignablePastoralUsers = async (tenantId, memberBranch) => {
  const branchAwareRoles = ['branch_pastor', 'care_leader'];
  const users = await User.find({
    tenantId,
    role: { $in: pastoralAssignableRoles },
    isActive: true,
    $or: [
      { allBranches: true },
      ...(memberBranch
        ? branchAwareRoles.map((role) => ({
            role,
            assignedBranches: memberBranch,
          }))
        : []),
      { role: { $in: ['head_pastor', 'associate_pastor'] } },
    ],
  }).select('_id fullName username role assignedBranches allBranches');

  return users;
};

const pickLeastLoadedAssignee = async (tenantId, memberBranch) => {
  const candidates = await findAssignablePastoralUsers(tenantId, memberBranch);
  if (!candidates.length) {
    return null;
  }

  const openCases = await CareCase.aggregate([
    {
      $match: {
        tenantId,
        status: { $in: ['open', 'in_progress', 'on_hold'] },
        assignedTo: { $in: candidates.map((candidate) => String(candidate._id)) },
      },
    },
    {
      $group: {
        _id: '$assignedTo',
        total: { $sum: 1 },
      },
    },
  ]);

  const workloadMap = new Map(openCases.map((item) => [String(item._id), Number(item.total || 0)]));
  const selected = [...candidates].sort((left, right) => {
    const leftLoad = workloadMap.get(String(left._id)) || 0;
    const rightLoad = workloadMap.get(String(right._id)) || 0;
    if (leftLoad !== rightLoad) {
      return leftLoad - rightLoad;
    }
    return String(left.fullName || left.username).localeCompare(String(right.fullName || right.username));
  })[0];

  return {
    assignedTo: String(selected._id),
    assignedToName: selected.fullName || selected.username || String(selected._id),
  };
};

const createAutoAppointmentSuggestion = async ({
  tenantId,
  member,
  caseId,
  assignedTo,
  assignedToName,
  type,
  createdBy,
}) => {
  if (!assignedTo) {
    return null;
  }

  const nextAvailable = new Date();
  nextAvailable.setHours(nextAvailable.getHours() + 2, 0, 0, 0);

  return Appointment.create({
    tenantId,
    caseId,
    memberId: member.memberId,
    memberName: buildMemberName(member),
    memberPhone: member.phone || '',
    type: type === 'hospital_visit' ? 'pastoral_visit' : 'counseling',
    title: `${type === 'hospital_visit' ? 'Hospital follow-up' : 'Bereavement support'} for ${buildMemberName(member)}`,
    notes: 'Auto-generated pastoral appointment suggestion.',
    scheduledAt: nextAvailable,
    duration: 60,
    location: member.address || member.branch || 'To be confirmed',
    assignedTo,
    assignedToName,
    createdBy,
  });
};

const createMemberAndAssigneeAppointmentNotifications = async ({
  tenantId,
  appointment,
  member,
  assignedUserId,
  assignedUserName,
}) => {
  const memberUsers = await getUsersForMember(tenantId, appointment.memberId);
  const notifications = [
    ...memberUsers.map((user) => ({
      tenantId,
      type: 'reminder',
      memberId: appointment.memberId,
      memberName: appointment.memberName,
      targetUserId: String(user._id),
      title: appointment.title || 'Pastoral appointment scheduled',
      message: `You have a pastoral appointment scheduled for ${appointment.scheduledAt.toLocaleString()}.`,
    })),
  ];

  if (assignedUserId) {
    notifications.push({
      tenantId,
      type: 'follow_up',
      memberId: appointment.memberId,
      memberName: appointment.memberName,
      targetUserId: assignedUserId,
      title: 'Pastoral appointment assigned',
      message: `${appointment.memberName} has an appointment scheduled for ${appointment.scheduledAt.toLocaleString()}.`,
    });
  }

  await createNotifications(notifications);

  if (member?.phone) {
    await sendSmsIfConfigured(
      member.phone,
      `Reminder: ${appointment.title || 'Pastoral appointment'} is scheduled for ${appointment.scheduledAt.toLocaleString()}.`,
    );
  }

  return {
    assignedToName: assignedUserName,
  };
};

const getCaseOrThrow = async (tenantId, caseId) => {
  const normalizedCaseId = String(caseId || '').trim();
  const filter = mongoose.isValidObjectId(normalizedCaseId)
    ? { tenantId, $or: [{ _id: normalizedCaseId }, { caseId: normalizedCaseId }] }
    : { tenantId, caseId: normalizedCaseId };
  const careCase = await CareCase.findOne(filter);

  if (!careCase) {
    throw createHttpError(404, 'Care case not found.');
  }

  return careCase;
};

const getAppointmentOrThrow = async (tenantId, appointmentId) => {
  const normalizedAppointmentId = String(appointmentId || '').trim();
  const filter = mongoose.isValidObjectId(normalizedAppointmentId)
    ? { tenantId, $or: [{ _id: normalizedAppointmentId }, { appointmentId: normalizedAppointmentId }] }
    : { tenantId, appointmentId: normalizedAppointmentId };
  const appointment = await Appointment.findOne(filter);

  if (!appointment) {
    throw createHttpError(404, 'Appointment not found.');
  }

  return appointment;
};

const getEnrollmentOrThrow = async (tenantId, enrollmentId) => {
  const enrollment = await MemberDiscipleship.findOne({
    tenantId,
    _id: enrollmentId,
  });

  if (!enrollment) {
    throw createHttpError(404, 'Discipleship enrollment not found.');
  }

  return enrollment;
};

const ensureCaseAccess = async (tenantId, careCase, user = {}) => {
  ensurePastoralRoleAccess(user);

  if (pastoralFullAccessRoles.includes(user.role)) {
    return;
  }

  if (user.role === 'care_leader' && String(careCase.assignedTo || '') !== String(user.userId || '')) {
    throw createHttpError(403, 'You can only access care cases assigned to you.');
  }

  if (user.role === 'branch_pastor') {
    const member = await getMemberForTenant(tenantId, careCase.memberId);
    const allowedBranches = getAssignedBranches(user);
    if (!allowedBranches.length || !allowedBranches.includes(String(member.branch || '').trim())) {
      throw createHttpError(403, 'You can only access care cases for your assigned branches.');
    }
  }
};

const ensureAppointmentAccess = async (tenantId, appointment, user = {}) => {
  ensurePastoralRoleAccess(user);

  if (pastoralFullAccessRoles.includes(user.role)) {
    return;
  }

  if (user.role === 'care_leader' && String(appointment.assignedTo || '') !== String(user.userId || '')) {
    throw createHttpError(403, 'You can only access appointments assigned to you.');
  }

  if (user.role === 'branch_pastor') {
    const member = await getMemberForTenant(tenantId, appointment.memberId);
    const allowedBranches = getAssignedBranches(user);
    if (!allowedBranches.length || !allowedBranches.includes(String(member.branch || '').trim())) {
      throw createHttpError(403, 'You can only access appointments for your assigned branches.');
    }
  }
};

const ensureEnrollmentAccess = async (tenantId, enrollment, user = {}) => {
  ensurePastoralRoleAccess(user);

  if (pastoralFullAccessRoles.includes(user.role)) {
    return;
  }

  if (user.role === 'care_leader' && String(enrollment.assignedTo || '') !== String(user.userId || '')) {
    throw createHttpError(403, 'You can only access discipleship enrollments assigned to you.');
  }

  if (user.role === 'branch_pastor') {
    const member = await getMemberForTenant(tenantId, enrollment.memberId);
    const allowedBranches = getAssignedBranches(user);
    if (!allowedBranches.length || !allowedBranches.includes(String(member.branch || '').trim())) {
      throw createHttpError(403, 'You can only access discipleship enrollments for your assigned branches.');
    }
  }
};

const buildCaseFilters = async (tenantId, query = {}, user = {}) => {
  const filters = { tenantId };
  const status = normalizeString(query.status);
  const type = normalizeString(query.type);
  const urgency = normalizeString(query.urgency);
  const assignedTo = normalizeString(query.assignedTo);
  const memberId = normalizeString(query.memberId);
  const tags = normalizeArray(query.tags);
  const fromDate = parseDate(query.fromDate || query.from);
  const toDate = parseDate(query.toDate || query.to);

  if (status) {
    filters.status = status;
  }
  if (type) {
    filters.type = type;
  }
  if (urgency) {
    filters.urgency = urgency;
  }
  if (assignedTo) {
    filters.assignedTo = assignedTo;
  }
  if (memberId) {
    filters.memberId = memberId;
  }
  if (tags.length) {
    filters.tags = { $in: tags };
  }
  if (fromDate || toDate) {
    filters.createdAt = {
      ...(fromDate ? { $gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { $lte: endOfDay(toDate) } : {}),
    };
  }

  if (user.role === 'care_leader') {
    filters.assignedTo = String(user.userId || '');
  } else if (user.role === 'branch_pastor') {
    const scopedMembers = await getScopedBranchFilters(tenantId, user, query.branch || query.branches);
    filters.memberId = {
      $in: scopedMembers.map((member) => member.memberId),
    };
  }

  return filters;
};

const buildAppointmentFilters = async (tenantId, query = {}, user = {}) => {
  const filters = { tenantId };
  const status = normalizeString(query.status);
  const assignedTo = normalizeString(query.assignedTo);
  const memberId = normalizeString(query.memberId);
  const fromDate = parseDate(query.fromDate || query.from);
  const toDate = parseDate(query.toDate || query.to);

  if (status) {
    filters.status = status;
  }
  if (assignedTo) {
    filters.assignedTo = assignedTo;
  }
  if (memberId) {
    filters.memberId = memberId;
  }
  if (fromDate || toDate) {
    filters.scheduledAt = {
      ...(fromDate ? { $gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { $lte: endOfDay(toDate) } : {}),
    };
  }

  if (user.role === 'care_leader') {
    filters.assignedTo = String(user.userId || '');
  } else if (user.role === 'branch_pastor') {
    const scopedMembers = await getScopedBranchFilters(tenantId, user, query.branch || query.branches);
    filters.memberId = {
      $in: scopedMembers.map((member) => member.memberId),
    };
  }

  return filters;
};

const buildEnrollmentFilters = async (tenantId, query = {}, user = {}) => {
  const filters = { tenantId };
  const status = normalizeString(query.status);
  const trackId = normalizeString(query.trackId);
  const memberId = normalizeString(query.memberId);

  if (status) {
    filters.status = status;
  }
  if (trackId) {
    filters.trackId = trackId;
  }
  if (memberId) {
    filters.memberId = memberId;
  }

  if (user.role === 'care_leader') {
    filters.assignedTo = String(user.userId || '');
  } else if (user.role === 'branch_pastor') {
    const scopedMembers = await getScopedBranchFilters(tenantId, user, query.branch || query.branches);
    filters.memberId = {
      $in: scopedMembers.map((member) => member.memberId),
    };
  }

  return filters;
};

const sortCases = (cases = []) => {
  const urgencyOrder = {
    critical: 0,
    urgent: 1,
    normal: 2,
    low: 3,
  };

  return [...cases].sort((left, right) => {
    const urgencyDiff = (urgencyOrder[left.urgency] ?? 99) - (urgencyOrder[right.urgency] ?? 99);
    if (urgencyDiff !== 0) {
      return urgencyDiff;
    }

    return new Date(right.createdAt) - new Date(left.createdAt);
  });
};

const getCaseSummaryForReports = (careCase) => ({
  caseId: careCase.caseId,
  memberId: careCase.memberId,
  memberName: careCase.memberName,
  type: careCase.type,
  urgency: careCase.urgency,
  status: careCase.status,
  assignedTo: careCase.assignedTo,
  assignedToName: careCase.assignedToName,
  createdAt: careCase.createdAt,
  resolvedAt: careCase.resolvedAt,
});

export const createCase = async (tenantId, data = {}, createdBy = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const member = await getMemberForTenant(normalizedTenantId, data.memberId);
  const memberName = buildMemberName(member);

  let assignment = {
    assignedTo: normalizeString(data.assignedTo),
    assignedToName: normalizeString(data.assignedToName),
  };

  if (!assignment.assignedTo) {
    assignment = (await pickLeastLoadedAssignee(normalizedTenantId, member.branch)) || assignment;
  } else if (!assignment.assignedToName) {
    const assignedUser = await User.findOne({
      tenantId: normalizedTenantId,
      _id: assignment.assignedTo,
      isActive: true,
    }).select('fullName username');
    assignment.assignedToName = assignedUser?.fullName || assignedUser?.username || assignment.assignedTo;
  }

  const careCase = await CareCase.create({
    tenantId: normalizedTenantId,
    memberId: member.memberId,
    memberName,
    type: data.type,
    title: data.title,
    description: normalizeString(data.description),
    urgency: normalizeString(data.urgency) || 'normal',
    status: normalizeString(data.status) || 'open',
    assignedTo: assignment.assignedTo,
    assignedToName: assignment.assignedToName,
    assignedAt: assignment.assignedTo ? new Date() : undefined,
    welfareSupport: {
      isReceivingSupport: Boolean(data.welfareSupport?.isReceivingSupport),
      supportType: normalizeArray(data.welfareSupport?.supportType || data.welfareSupport?.supportTypes),
      totalSupport: Number(data.welfareSupport?.totalSupport || 0),
      currency: normalizeString(data.welfareSupport?.currency),
      notes: normalizeString(data.welfareSupport?.notes),
    },
    tags: normalizeArray(data.tags),
    isConfidential: data.isConfidential === true,
    createdBy: createdBy.userId || 'system',
    updatedBy: createdBy.userId || 'system',
  });

  if (careCase.urgency === 'critical') {
    const heads = await User.find({
      tenantId: normalizedTenantId,
      role: 'head_pastor',
      isActive: true,
    }).select('_id');

    await createNotifications(
      heads.map((user) => ({
        tenantId: normalizedTenantId,
        type: 'follow_up',
        memberId: careCase.memberId,
        memberName,
        targetUserId: String(user._id),
        title: 'Critical care case',
        message: `🚨 Critical care case opened for ${memberName} — immediate attention required`,
      })),
    );
  }

  if (['bereavement', 'hospital_visit'].includes(careCase.type)) {
    await createAutoAppointmentSuggestion({
      tenantId: normalizedTenantId,
      member,
      caseId: careCase.caseId,
      assignedTo: careCase.assignedTo,
      assignedToName: careCase.assignedToName,
      type: careCase.type,
      createdBy: createdBy.userId || 'system',
    });
  }

  return sanitizeCareCase(careCase, createdBy.role);
};

export const getAllCases = async (tenantId, query = {}, requestingUser = {}) => {
  const filters = await buildCaseFilters(normalizeTenantId(tenantId), query, requestingUser);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  const cases = await CareCase.find(filters).lean();
  const sorted = sortCases(cases);
  const total = sorted.length;
  const items = sorted
    .slice((page - 1) * limit, (page - 1) * limit + limit)
    .map((careCase) => sanitizeCareCase(careCase, requestingUser.role));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getCaseById = async (tenantId, caseId, requestingUser = {}) => {
  const careCase = await getCaseOrThrow(normalizeTenantId(tenantId), caseId);
  await ensureCaseAccess(normalizeTenantId(tenantId), careCase, requestingUser);
  return sanitizeCareCase(careCase, requestingUser.role);
};

export const updateCase = async (tenantId, caseId, data = {}, actor = {}) => {
  const careCase = await getCaseOrThrow(normalizeTenantId(tenantId), caseId);
  await ensureCaseAccess(normalizeTenantId(tenantId), careCase, actor);

  if (data.type && careCaseTypes.includes(data.type)) {
    careCase.type = data.type;
  }
  if (data.title) {
    careCase.title = data.title.trim();
  }
  if (data.description !== undefined) {
    careCase.description = normalizeString(data.description) || '';
  }
  if (data.urgency && careUrgencyLevels.includes(data.urgency)) {
    careCase.urgency = data.urgency;
  }
  if (data.tags !== undefined) {
    careCase.tags = normalizeArray(data.tags);
  }
  if (data.isConfidential !== undefined) {
    if (data.isConfidential) {
      ensureConfidentialAccess(actor.role);
    }
    careCase.isConfidential = data.isConfidential === true;
  }
  if (data.welfareSupport && typeof data.welfareSupport === 'object') {
    careCase.welfareSupport = {
      ...careCase.welfareSupport?.toObject?.(),
      ...careCase.welfareSupport,
      isReceivingSupport:
        data.welfareSupport.isReceivingSupport ?? careCase.welfareSupport?.isReceivingSupport ?? false,
      supportType: data.welfareSupport.supportType
        ? normalizeArray(data.welfareSupport.supportType)
        : careCase.welfareSupport?.supportType || [],
      totalSupport:
        data.welfareSupport.totalSupport !== undefined
          ? Number(data.welfareSupport.totalSupport || 0)
          : careCase.welfareSupport?.totalSupport || 0,
    };
  }
  if (data.resolutionNotes !== undefined) {
    careCase.resolutionNotes = normalizeString(data.resolutionNotes) || '';
  }
  if (data.isReferred !== undefined) {
    careCase.isReferred = data.isReferred === true;
  }
  if (data.referredTo !== undefined) {
    careCase.referredTo = normalizeString(data.referredTo) || '';
  }
  if (data.referralNotes !== undefined) {
    careCase.referralNotes = normalizeString(data.referralNotes) || '';
  }

  careCase.updatedBy = actor.userId || careCase.updatedBy;
  await careCase.save();
  return sanitizeCareCase(careCase, actor.role);
};

export const assignCase = async (tenantId, caseId, data = {}, actor = {}) => {
  ensurePastoralAdminAccess(actor);

  const careCase = await getCaseOrThrow(normalizeTenantId(tenantId), caseId);
  const assignedUser = await User.findOne({
    tenantId: normalizeTenantId(tenantId),
    _id: String(data.assignedTo || '').trim(),
    isActive: true,
    role: { $in: pastoralAssignableRoles },
  }).select('_id fullName username');

  if (!assignedUser) {
    throw createHttpError(404, 'Assigned pastor or care leader not found.');
  }

  careCase.assignedTo = String(assignedUser._id);
  careCase.assignedToName = assignedUser.fullName || assignedUser.username || String(assignedUser._id);
  careCase.assignedAt = new Date();
  careCase.updatedBy = actor.userId || careCase.updatedBy;
  await careCase.save();

  await createNotifications([
    {
      tenantId: normalizeTenantId(tenantId),
      type: 'follow_up',
      memberId: careCase.memberId,
      memberName: careCase.memberName,
      targetUserId: careCase.assignedTo,
      title: 'Care case assigned',
      message: `${careCase.memberName}'s care case has been assigned to you.`,
    },
  ]);

  return sanitizeCareCase(careCase, actor.role);
};

export const updateCaseStatus = async (tenantId, caseId, status, resolutionNotes, actor = {}) => {
  const careCase = await getCaseOrThrow(normalizeTenantId(tenantId), caseId);
  await ensureCaseAccess(normalizeTenantId(tenantId), careCase, actor);

  if (!careStatuses.includes(status)) {
    throw createHttpError(400, 'Care case status is invalid.');
  }

  careCase.status = status;
  if (['resolved', 'closed'].includes(status)) {
    careCase.resolvedAt = new Date();
    careCase.resolutionNotes = normalizeString(resolutionNotes) || careCase.resolutionNotes || '';
  }
  careCase.updatedBy = actor.userId || careCase.updatedBy;
  await careCase.save();

  return sanitizeCareCase(careCase, actor.role);
};

export const addInteraction = async (tenantId, caseId, data = {}, conductedBy = {}) => {
  const careCase = await getCaseOrThrow(normalizeTenantId(tenantId), caseId);
  await ensureCaseAccess(normalizeTenantId(tenantId), careCase, conductedBy);

  if (data.isConfidential === true) {
    ensureConfidentialAccess(conductedBy.role);
  }

  const interaction = {
    interactionId: buildInteractionId(careCase),
    date: parseDate(data.date) || new Date(),
    type: data.type,
    summary: normalizeString(data.summary),
    confidentialNotes: normalizeString(data.confidentialNotes),
    isConfidential: data.isConfidential === true,
    nextSteps: normalizeString(data.nextSteps),
    nextFollowUpDate: parseDate(data.nextFollowUpDate),
    conductedBy: conductedBy.userId || '',
    conductedByName: conductedBy.name || conductedBy.userId || '',
    duration: data.duration !== undefined ? Number(data.duration) : undefined,
    location: normalizeString(data.location),
  };

  careCase.interactions.push(interaction);
  if (careCase.status === 'open') {
    careCase.status = 'in_progress';
  }
  careCase.updatedBy = conductedBy.userId || careCase.updatedBy;
  await careCase.save();

  if (interaction.nextFollowUpDate) {
    const member = await getMemberForTenant(normalizeTenantId(tenantId), careCase.memberId);
    await createAppointment(
      normalizeTenantId(tenantId),
      {
        caseId: careCase.caseId,
        memberId: careCase.memberId,
        type: careCase.type === 'discipleship' ? 'discipleship' : 'other',
        title: `Follow-up for ${careCase.memberName}`,
        notes: interaction.nextSteps || 'Generated from care case interaction.',
        scheduledAt: interaction.nextFollowUpDate,
        duration: 60,
        location: interaction.location || member.address || member.branch,
        assignedTo: careCase.assignedTo,
      },
      conductedBy,
    );
  }

  return sanitizeCareCase(careCase, conductedBy.role);
};

export const updateInteraction = async (tenantId, caseId, interactionId, data = {}, actor = {}) => {
  const careCase = await getCaseOrThrow(normalizeTenantId(tenantId), caseId);
  await ensureCaseAccess(normalizeTenantId(tenantId), careCase, actor);

  const interaction = (careCase.interactions || []).find((item) => item.interactionId === interactionId);
  if (!interaction) {
    throw createHttpError(404, 'Interaction not found.');
  }

  if ((data.isConfidential === true || interaction.isConfidential === true) && !hasConfidentialAccess(actor.role)) {
    throw createHttpError(403, 'You do not have permission to update confidential notes.');
  }

  if (data.type && interactionTypes.includes(data.type)) {
    interaction.type = data.type;
  }
  if (data.date) {
    interaction.date = parseDate(data.date) || interaction.date;
  }
  if (data.summary !== undefined) {
    interaction.summary = normalizeString(data.summary) || '';
  }
  if (data.confidentialNotes !== undefined) {
    interaction.confidentialNotes = normalizeString(data.confidentialNotes) || '';
  }
  if (data.isConfidential !== undefined) {
    interaction.isConfidential = data.isConfidential === true;
  }
  if (data.nextSteps !== undefined) {
    interaction.nextSteps = normalizeString(data.nextSteps) || '';
  }
  if (data.nextFollowUpDate !== undefined) {
    interaction.nextFollowUpDate = parseDate(data.nextFollowUpDate);
  }
  if (data.duration !== undefined) {
    interaction.duration = Number(data.duration);
  }
  if (data.location !== undefined) {
    interaction.location = normalizeString(data.location) || '';
  }

  careCase.updatedBy = actor.userId || careCase.updatedBy;
  await careCase.save();
  return sanitizeCareCase(careCase, actor.role);
};

export const addMilestone = async (tenantId, caseId, data = {}, actor = {}) => {
  const careCase = await getCaseOrThrow(normalizeTenantId(tenantId), caseId);
  await ensureCaseAccess(normalizeTenantId(tenantId), careCase, actor);

  careCase.milestones.push({
    title: data.title,
    date: parseDate(data.date) || new Date(),
    notes: normalizeString(data.notes),
    type: milestoneTypes.includes(data.type) ? data.type : 'other',
  });
  careCase.updatedBy = actor.userId || careCase.updatedBy;
  await careCase.save();
  return sanitizeCareCase(careCase, actor.role);
};

export const addPrayerRequest = async (tenantId, caseId, data = {}, actor = {}) => {
  const careCase = await getCaseOrThrow(normalizeTenantId(tenantId), caseId);
  await ensureCaseAccess(normalizeTenantId(tenantId), careCase, actor);

  careCase.prayerRequests.push({
    request: data.request,
    date: parseDate(data.date) || new Date(),
  });
  careCase.updatedBy = actor.userId || careCase.updatedBy;
  await careCase.save();
  return sanitizeCareCase(careCase, actor.role);
};

export const markPrayerAnswered = async (tenantId, caseId, prayerRequestId, data = {}, actor = {}) => {
  const careCase = await getCaseOrThrow(normalizeTenantId(tenantId), caseId);
  await ensureCaseAccess(normalizeTenantId(tenantId), careCase, actor);

  const prayerRequest = findPrayerRequestOrThrow(careCase, prayerRequestId);
  prayerRequest.isAnswered = true;
  prayerRequest.testimonial = normalizeString(data.testimonial) || prayerRequest.testimonial || '';
  careCase.updatedBy = actor.userId || careCase.updatedBy;
  await careCase.save();
  return sanitizeCareCase(careCase, actor.role);
};

export const getMemberCases = async (tenantId, memberId, requestingUser = {}) => {
  const filters = await buildCaseFilters(normalizeTenantId(tenantId), { memberId }, requestingUser);
  const items = await CareCase.find(filters).sort({ createdAt: -1 });
  return items.map((item) => sanitizeCareCase(item, requestingUser.role));
};

export const getMyCases = async (tenantId, user = {}) => {
  ensurePastoralRoleAccess(user);
  return getAllCases(normalizeTenantId(tenantId), { assignedTo: user.userId, limit: 100 }, user);
};

export const getUrgentCases = async (tenantId, user = {}) => {
  ensurePastoralRoleAccess(user);
  const data = await getAllCases(normalizeTenantId(tenantId), { limit: 100 }, user);
  data.items = data.items.filter((item) => ['urgent', 'critical'].includes(item.urgency));
  data.total = data.items.length;
  data.totalPages = 1;
  return data;
};

export const createAppointment = async (tenantId, data = {}, createdBy = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const member = await getMemberForTenant(normalizedTenantId, data.memberId);
  const assignedUser = await User.findOne({
    tenantId: normalizedTenantId,
    _id: String(data.assignedTo || '').trim(),
    isActive: true,
  }).select('_id fullName username');

  if (!assignedUser) {
    throw createHttpError(404, 'Assigned pastor or care leader not found.');
  }

  const appointment = await Appointment.create({
    tenantId: normalizedTenantId,
    caseId: normalizeString(data.caseId),
    memberId: member.memberId,
    memberName: buildMemberName(member),
    memberPhone: member.phone || '',
    type: appointmentTypes.includes(data.type) ? data.type : 'other',
    title: normalizeString(data.title) || `${data.type || 'Pastoral'} appointment`,
    notes: normalizeString(data.notes),
    scheduledAt: parseDate(data.scheduledAt),
    duration: Number(data.duration || 60),
    location: normalizeString(data.location),
    isOnline: data.isOnline === true,
    meetingLink: normalizeString(data.meetingLink),
    assignedTo: String(assignedUser._id),
    assignedToName: assignedUser.fullName || assignedUser.username || String(assignedUser._id),
    createdBy: createdBy.userId || 'system',
  });

  await createMemberAndAssigneeAppointmentNotifications({
    tenantId: normalizedTenantId,
    appointment,
    member,
    assignedUserId: appointment.assignedTo,
    assignedUserName: appointment.assignedToName,
  });

  return appointment;
};

export const getAllAppointments = async (tenantId, query = {}, user = {}) => {
  const filters = await buildAppointmentFilters(normalizeTenantId(tenantId), query, user);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const [items, total] = await Promise.all([
    Appointment.find(filters)
      .sort({ scheduledAt: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Appointment.countDocuments(filters),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getTodayAppointments = async (tenantId, user = {}) => {
  const filters = await buildAppointmentFilters(
    normalizeTenantId(tenantId),
    { fromDate: startOfDay(new Date()), toDate: endOfDay(new Date()), limit: 100 },
    user,
  );
  const items = await Appointment.find(filters).sort({ scheduledAt: 1 });
  return { items };
};

export const getUpcomingAppointments = async (tenantId, user = {}) => {
  const filters = await buildAppointmentFilters(
    normalizeTenantId(tenantId),
    { fromDate: new Date(), toDate: addDays(new Date(), 14), limit: 100 },
    user,
  );
  const items = await Appointment.find(filters).sort({ scheduledAt: 1 });
  return { items };
};

export const getMyAppointments = async (tenantId, user = {}) => {
  return getAllAppointments(normalizeTenantId(tenantId), { assignedTo: user.userId, limit: 100 }, user);
};

export const getAppointmentById = async (tenantId, appointmentId, user = {}) => {
  const appointment = await getAppointmentOrThrow(normalizeTenantId(tenantId), appointmentId);
  await ensureAppointmentAccess(normalizeTenantId(tenantId), appointment, user);
  return appointment;
};

export const updateAppointment = async (tenantId, appointmentId, data = {}, actor = {}) => {
  const appointment = await getAppointmentOrThrow(normalizeTenantId(tenantId), appointmentId);
  await ensureAppointmentAccess(normalizeTenantId(tenantId), appointment, actor);

  if (data.scheduledAt) {
    appointment.scheduledAt = parseDate(data.scheduledAt) || appointment.scheduledAt;
    appointment.reminderSent = false;
  }
  if (data.duration !== undefined) {
    appointment.duration = Number(data.duration);
  }
  if (data.location !== undefined) {
    appointment.location = normalizeString(data.location) || '';
  }
  if (data.isOnline !== undefined) {
    appointment.isOnline = data.isOnline === true;
  }
  if (data.meetingLink !== undefined) {
    appointment.meetingLink = normalizeString(data.meetingLink) || '';
  }
  if (data.type && appointmentTypes.includes(data.type)) {
    appointment.type = data.type;
  }
  if (data.title !== undefined) {
    appointment.title = normalizeString(data.title) || '';
  }
  if (data.notes !== undefined) {
    appointment.notes = normalizeString(data.notes) || '';
  }
  if (data.assignedTo && String(data.assignedTo) !== String(appointment.assignedTo)) {
    const assignedUser = await User.findOne({
      tenantId: normalizeTenantId(tenantId),
      _id: String(data.assignedTo).trim(),
      isActive: true,
    }).select('_id fullName username');
    if (!assignedUser) {
      throw createHttpError(404, 'Assigned pastor or care leader not found.');
    }
    appointment.assignedTo = String(assignedUser._id);
    appointment.assignedToName = assignedUser.fullName || assignedUser.username || String(assignedUser._id);
  }

  await appointment.save();
  return appointment;
};

export const updateAppointmentStatus = async (tenantId, appointmentId, status, completionNotes, actor = {}) => {
  const appointment = await getAppointmentOrThrow(normalizeTenantId(tenantId), appointmentId);
  await ensureAppointmentAccess(normalizeTenantId(tenantId), appointment, actor);

  if (!appointmentStatuses.includes(status)) {
    throw createHttpError(400, 'Appointment status is invalid.');
  }

  appointment.status = status;
  if (status === 'completed') {
    appointment.completionNotes = normalizeString(completionNotes) || appointment.completionNotes || '';
  }
  await appointment.save();
  return appointment;
};

export const cancelAppointment = async (tenantId, appointmentId, actor = {}) => {
  return updateAppointmentStatus(normalizeTenantId(tenantId), appointmentId, 'cancelled', undefined, actor);
};

export const createTrack = async (tenantId, data = {}, actor = {}) => {
  ensurePastoralAdminAccess(actor);

  const track = await DiscipleshipTrack.create({
    tenantId: normalizeTenantId(tenantId),
    name: data.name,
    description: normalizeString(data.description),
    targetGroup: discipleshipTargetGroups.includes(data.targetGroup) ? data.targetGroup : 'all',
    isActive: data.isActive !== false,
    steps: (Array.isArray(data.steps) ? data.steps : []).map((step, index) => ({
      stepNumber: Number(step.stepNumber || index + 1),
      title: step.title,
      description: normalizeString(step.description),
      type: discipleshipStepTypes.includes(step.type) ? step.type : 'class',
      durationDays: step.durationDays !== undefined ? Number(step.durationDays) : undefined,
      resources: normalizeArray(step.resources),
      isRequired: step.isRequired !== false,
    })),
    createdBy: actor.userId || 'system',
  });

  return track;
};

export const getAllTracks = async (tenantId, query = {}) =>
  DiscipleshipTrack.find({
    tenantId: normalizeTenantId(tenantId),
    ...(query.isActive !== undefined ? { isActive: query.isActive === 'true' || query.isActive === true } : {}),
  }).sort({ createdAt: -1 });

export const updateTrack = async (tenantId, trackId, data = {}, actor = {}) => {
  ensurePastoralAdminAccess(actor);

  const track = await DiscipleshipTrack.findOne({
    tenantId: normalizeTenantId(tenantId),
    $or: [{ trackId: String(trackId || '').trim() }, ...(mongoose.isValidObjectId(trackId) ? [{ _id: trackId }] : [])],
  });

  if (!track) {
    throw createHttpError(404, 'Discipleship track not found.');
  }

  if (data.name !== undefined) {
    track.name = data.name.trim();
  }
  if (data.description !== undefined) {
    track.description = normalizeString(data.description) || '';
  }
  if (data.targetGroup && discipleshipTargetGroups.includes(data.targetGroup)) {
    track.targetGroup = data.targetGroup;
  }
  if (data.isActive !== undefined) {
    track.isActive = data.isActive === true;
  }
  if (Array.isArray(data.steps)) {
    track.steps = data.steps.map((step, index) => ({
      stepNumber: Number(step.stepNumber || index + 1),
      title: step.title,
      description: normalizeString(step.description),
      type: discipleshipStepTypes.includes(step.type) ? step.type : 'class',
      durationDays: step.durationDays !== undefined ? Number(step.durationDays) : undefined,
      resources: normalizeArray(step.resources),
      isRequired: step.isRequired !== false,
    }));
  }

  await track.save();
  return track;
};

export const enrollMember = async (tenantId, data = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const member = await getMemberForTenant(normalizedTenantId, data.memberId);
  const track = await DiscipleshipTrack.findOne({
    tenantId: normalizedTenantId,
    trackId: String(data.trackId || '').trim(),
  });

  if (!track) {
    throw createHttpError(404, 'Discipleship track not found.');
  }

  const existing = await MemberDiscipleship.findOne({
    tenantId: normalizedTenantId,
    memberId: member.memberId,
    trackId: track.trackId,
  });

  if (existing) {
    throw createHttpError(409, 'Member is already enrolled in this discipleship track.');
  }

  let assignedTo = normalizeString(data.assignedTo);
  let assignedToName = normalizeString(data.assignedToName);

  if (assignedTo && !assignedToName) {
    const assignedUser = await User.findOne({
      tenantId: normalizedTenantId,
      _id: assignedTo,
      isActive: true,
    }).select('fullName username');
    assignedToName = assignedUser?.fullName || assignedUser?.username || assignedTo;
  }

  const enrollment = await MemberDiscipleship.create({
    tenantId: normalizedTenantId,
    memberId: member.memberId,
    memberName: buildMemberName(member),
    trackId: track.trackId,
    trackName: track.name,
    assignedTo,
    assignedToName,
    progress: (track.steps || []).map((step) => ({
      stepNumber: step.stepNumber,
      stepTitle: step.title,
      isCompleted: false,
    })),
    notes: normalizeString(data.notes),
  });

  const memberUsers = await getUsersForMember(normalizedTenantId, member.memberId);
  await createNotifications(
    memberUsers.map((user) => ({
      tenantId: normalizedTenantId,
      type: 'follow_up',
      memberId: member.memberId,
      memberName: buildMemberName(member),
      targetUserId: String(user._id),
      title: 'Discipleship enrollment',
      message: `You have been enrolled in ${track.name}.`,
    })),
  );

  return enrollment;
};

export const getAllEnrollments = async (tenantId, query = {}, user = {}) => {
  const filters = await buildEnrollmentFilters(normalizeTenantId(tenantId), query, user);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const [items, total] = await Promise.all([
    MemberDiscipleship.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    MemberDiscipleship.countDocuments(filters),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const getMemberDiscipleship = async (tenantId, memberId, user = {}) => {
  const filters = await buildEnrollmentFilters(normalizeTenantId(tenantId), { memberId }, user);
  return MemberDiscipleship.find(filters).sort({ createdAt: -1 });
};

export const completeStep = async (tenantId, enrollmentId, stepNumber, data = {}, actor = {}) => {
  const enrollment = await getEnrollmentOrThrow(normalizeTenantId(tenantId), enrollmentId);
  await ensureEnrollmentAccess(normalizeTenantId(tenantId), enrollment, actor);

  const step = (enrollment.progress || []).find((item) => Number(item.stepNumber) === Number(stepNumber));
  if (!step) {
    throw createHttpError(404, 'Discipleship step not found.');
  }

  step.isCompleted = true;
  step.completedAt = new Date();
  step.notes = normalizeString(data.notes) || '';
  step.completedBy = actor.userId || normalizeString(data.completedBy) || '';

  const completedSteps = (enrollment.progress || []).filter((item) => item.isCompleted).length;
  enrollment.completionPercent = percentage(completedSteps, enrollment.progress.length);

  if (completedSteps === enrollment.progress.length && enrollment.progress.length > 0) {
    enrollment.status = 'completed';
    enrollment.completedAt = new Date();

    const discipleshipCase = await CareCase.findOne({
      tenantId: normalizeTenantId(tenantId),
      memberId: enrollment.memberId,
      type: 'discipleship',
    }).sort({ createdAt: -1 });

    if (discipleshipCase) {
      discipleshipCase.milestones.push({
        title: `${enrollment.trackName} completed`,
        date: new Date(),
        notes: `Completed via discipleship enrollment ${String(enrollment._id)}`,
        type: 'other',
      });
      discipleshipCase.updatedBy = actor.userId || discipleshipCase.updatedBy;
      await discipleshipCase.save();
    }

    const memberUsers = await getUsersForMember(normalizeTenantId(tenantId), enrollment.memberId);
    await createNotifications(
      memberUsers.map((user) => ({
        tenantId: normalizeTenantId(tenantId),
        type: 'follow_up',
        memberId: enrollment.memberId,
        memberName: enrollment.memberName,
        targetUserId: String(user._id),
        title: 'Discipleship completed',
        message: `Congratulations! You have completed ${enrollment.trackName}.`,
      })),
    );
  }

  await enrollment.save();
  return enrollment;
};

export const updateEnrollmentStatus = async (tenantId, enrollmentId, status, notes, actor = {}) => {
  const enrollment = await getEnrollmentOrThrow(normalizeTenantId(tenantId), enrollmentId);
  await ensureEnrollmentAccess(normalizeTenantId(tenantId), enrollment, actor);

  if (!discipleshipEnrollmentStatuses.includes(status)) {
    throw createHttpError(400, 'Enrollment status is invalid.');
  }

  enrollment.status = status;
  if (notes !== undefined) {
    enrollment.notes = normalizeString(notes) || '';
  }
  if (status === 'completed' && !enrollment.completedAt) {
    enrollment.completedAt = new Date();
    enrollment.completionPercent = 100;
  }
  await enrollment.save();
  return enrollment;
};

export const getCareStats = async (tenantId, user = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const filters = await buildCaseFilters(normalizedTenantId, {}, user);
  const careCases = await CareCase.find(filters).lean();
  const appointments = await Appointment.countDocuments(
    await buildAppointmentFilters(normalizedTenantId, { status: 'scheduled' }, user),
  );
  const discipleship = await MemberDiscipleship.countDocuments(
    await buildEnrollmentFilters(normalizedTenantId, { status: 'active' }, user),
  );

  const resolvedCases = careCases.filter((item) => item.resolvedAt);
  const recentMilestones = careCases
    .flatMap((careCase) =>
      (careCase.milestones || []).map((milestone) => ({
        ...milestone,
        caseId: careCase.caseId,
        memberId: careCase.memberId,
        memberName: careCase.memberName,
      })),
    )
    .sort((left, right) => new Date(right.date || right.createdAt || 0) - new Date(left.date || left.createdAt || 0))
    .slice(0, 5);

  return {
    total: careCases.length,
    open: careCases.filter((item) => item.status === 'open').length,
    inProgress: careCases.filter((item) => item.status === 'in_progress').length,
    resolved: careCases.filter((item) => item.status === 'resolved').length,
    closed: careCases.filter((item) => item.status === 'closed').length,
    byType: careCaseTypes.map((type) => ({
      type,
      count: careCases.filter((item) => item.type === type).length,
    })),
    byUrgency: careUrgencyLevels.reduce((accumulator, urgency) => {
      accumulator[urgency] = careCases.filter((item) => item.urgency === urgency).length;
      return accumulator;
    }, {}),
    avgResolutionDays: resolvedCases.length
      ? Number(
          (
            resolvedCases.reduce((sum, item) => sum + getDateDiffInDays(item.createdAt, item.resolvedAt), 0) /
            resolvedCases.length
          ).toFixed(2),
        )
      : 0,
    openCritical: careCases.filter((item) => item.urgency === 'critical' && !['resolved', 'closed'].includes(item.status))
      .length,
    pendingAppointments: appointments,
    welfareSupported: careCases.filter((item) => item.welfareSupport?.isReceivingSupport === true).length,
    discipleshipActive: discipleship,
    recentMilestones,
  };
};

export const getPastoralCareReport = async (tenantId, user = {}) => {
  const [stats, upcomingAppointments, urgentCases] = await Promise.all([
    getCareStats(normalizeTenantId(tenantId), user),
    getUpcomingAppointments(normalizeTenantId(tenantId), user),
    getUrgentCases(normalizeTenantId(tenantId), user),
  ]);

  return {
    ...stats,
    upcomingAppointments: upcomingAppointments.items.slice(0, 10),
    urgentCases: urgentCases.items.slice(0, 10).map(getCaseSummaryForReports),
  };
};

export const getPastorWorkloadReport = async (tenantId, user = {}) => {
  ensurePastoralAdminAccess(user);

  const normalizedTenantId = normalizeTenantId(tenantId);
  const pastors = await User.find({
    tenantId: normalizedTenantId,
    role: { $in: pastoralAssignableRoles },
    isActive: true,
  }).select('_id fullName username role');

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [careCases, appointments] = await Promise.all([
    CareCase.find({ tenantId: normalizedTenantId }).lean(),
    Appointment.find({
      tenantId: normalizedTenantId,
      scheduledAt: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
    }).lean(),
  ]);

  return pastors.map((pastor) => {
    const userId = String(pastor._id);
    const assignedCases = careCases.filter((item) => String(item.assignedTo || '') === userId);
    const openCases = assignedCases.filter((item) => ['open', 'in_progress', 'on_hold'].includes(item.status)).length;
    const resolvedThisMonth = assignedCases.filter(
      (item) => item.resolvedAt && new Date(item.resolvedAt) >= startOfMonth,
    ).length;
    const totalInteractions = assignedCases.reduce((sum, item) => sum + (item.interactions || []).length, 0);
    const avgCaseAge = openCases
      ? Number(
          (
            assignedCases
              .filter((item) => ['open', 'in_progress', 'on_hold'].includes(item.status))
              .reduce((sum, item) => sum + getDateDiffInDays(item.createdAt), 0) / openCases
          ).toFixed(2),
        )
      : 0;
    const upcomingAppointments = appointments.filter((item) => String(item.assignedTo || '') === userId).length;

    return {
      userId,
      name: pastor.fullName || pastor.username || userId,
      role: pastor.role,
      openCases,
      resolvedThisMonth,
      totalInteractions,
      avgCaseAge,
      upcomingAppointments,
    };
  });
};

export const getWelfareReport = async (tenantId, user = {}) => {
  const filters = await buildCaseFilters(normalizeTenantId(tenantId), {}, user);
  const careCases = await CareCase.find(filters).lean();
  const supportedCases = careCases.filter((item) => item.welfareSupport?.isReceivingSupport === true);

  return {
    totalSupportedCases: supportedCases.length,
    totalSupportValue: supportedCases.reduce((sum, item) => sum + Number(item.welfareSupport?.totalSupport || 0), 0),
    bySupportType: welfareReportSupportTypes.map((type) => ({
      type,
      count: supportedCases.filter((item) => (item.welfareSupport?.supportType || []).includes(type)).length,
    })),
    recentSupportCases: supportedCases
      .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
      .slice(0, 10)
      .map(getCaseSummaryForReports),
  };
};

export const getDiscipleshipReport = async (tenantId, user = {}) => {
  const filters = await buildEnrollmentFilters(normalizeTenantId(tenantId), {}, user);
  const enrollments = await MemberDiscipleship.find(filters).lean();
  const tracks = await DiscipleshipTrack.find({ tenantId: normalizeTenantId(tenantId) }).lean();

  return {
    totalEnrolled: enrollments.length,
    active: enrollments.filter((item) => item.status === 'active').length,
    completed: enrollments.filter((item) => item.status === 'completed').length,
    dropped: enrollments.filter((item) => item.status === 'dropped').length,
    avgCompletionPercent: enrollments.length
      ? Number(
          (
            enrollments.reduce((sum, item) => sum + Number(item.completionPercent || 0), 0) / enrollments.length
          ).toFixed(2),
        )
      : 0,
    byTrack: tracks.map((track) => {
      const trackEnrollments = enrollments.filter((item) => item.trackId === track.trackId);
      return {
        trackName: track.name,
        enrolled: trackEnrollments.length,
        completed: trackEnrollments.filter((item) => item.status === 'completed').length,
        avgProgress: trackEnrollments.length
          ? Number(
              (
                trackEnrollments.reduce((sum, item) => sum + Number(item.completionPercent || 0), 0) /
                trackEnrollments.length
              ).toFixed(2),
            )
          : 0,
      };
    }),
    recentCompletions: enrollments
      .filter((item) => item.completedAt)
      .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt))
      .slice(0, 5),
    topDisciplers: Object.values(
      enrollments.reduce((accumulator, item) => {
        if (!item.assignedTo) {
          return accumulator;
        }

        const current = accumulator[item.assignedTo] || {
          name: item.assignedToName || item.assignedTo,
          assigned: 0,
          completed: 0,
        };

        current.assigned += 1;
        if (item.status === 'completed') {
          current.completed += 1;
        }
        accumulator[item.assignedTo] = current;
        return accumulator;
      }, {}),
    )
      .sort((left, right) => right.completed - left.completed || right.assigned - left.assigned)
      .slice(0, 5),
  };
};

export const getPlatformPastoralOverview = async () => {
  const tenants = await Tenant.find({ isActive: true, isSuspended: false }).select('tenantId churchName');

  const rows = await Promise.all(
    tenants.map(async (tenant) => {
      const [openCases, criticalCases, activeDiscipships, pendingAppointments] = await Promise.all([
        CareCase.countDocuments({
          tenantId: tenant.tenantId,
          status: { $in: ['open', 'in_progress', 'on_hold'] },
        }),
        CareCase.countDocuments({
          tenantId: tenant.tenantId,
          urgency: 'critical',
          status: { $in: ['open', 'in_progress', 'on_hold'] },
        }),
        MemberDiscipleship.countDocuments({
          tenantId: tenant.tenantId,
          status: 'active',
        }),
        Appointment.countDocuments({
          tenantId: tenant.tenantId,
          status: { $in: ['scheduled', 'confirmed'] },
        }),
      ]);

      return {
        tenantId: tenant.tenantId,
        churchName: tenant.churchName,
        openCases,
        criticalCases,
        activeDiscipships,
        pendingAppointments,
      };
    }),
  );

  return {
    tenants: rows,
    totalOpenCases: rows.reduce((sum, row) => sum + row.openCases, 0),
    totalCriticalCases: rows.reduce((sum, row) => sum + row.criticalCases, 0),
    totalActiveDiscipships: rows.reduce((sum, row) => sum + row.activeDiscipships, 0),
    totalPendingAppointments: rows.reduce((sum, row) => sum + row.pendingAppointments, 0),
  };
};

export const getReminderWindowAppointments = async (start, end) =>
  Appointment.find({
    status: { $in: ['scheduled', 'confirmed'] },
    reminderSent: false,
    scheduledAt: {
      $gte: start,
      $lte: end,
    },
  }).lean();

export const markAppointmentReminderSent = async (appointmentIds = []) => {
  if (!appointmentIds.length) {
    return;
  }

  await Appointment.updateMany(
    {
      _id: { $in: appointmentIds },
    },
    {
      reminderSent: true,
      updatedAt: new Date(),
    },
  );
};

export const createAppointmentReminderNotifications = async (appointment) => {
  const memberUsers = await getUsersForMember(appointment.tenantId, appointment.memberId);
  const notifications = [
    ...memberUsers.map((user) => ({
      tenantId: appointment.tenantId,
      type: 'reminder',
      memberId: appointment.memberId,
      memberName: appointment.memberName,
      targetUserId: String(user._id),
      title: appointment.title || 'Pastoral appointment reminder',
      message: `Reminder: ${appointment.title || 'Pastoral appointment'} starts at ${new Date(
        appointment.scheduledAt,
      ).toLocaleString()}.`,
    })),
  ];

  if (appointment.assignedTo) {
    notifications.push({
      tenantId: appointment.tenantId,
      type: 'reminder',
      memberId: appointment.memberId,
      memberName: appointment.memberName,
      targetUserId: appointment.assignedTo,
      title: 'Assigned appointment reminder',
      message: `${appointment.memberName}'s appointment is coming up at ${new Date(
        appointment.scheduledAt,
      ).toLocaleString()}.`,
    });
  }

  await createNotifications(notifications);
  await sendSmsIfConfigured(
    appointment.memberPhone,
    `Reminder: ${appointment.title || 'Pastoral appointment'} starts at ${new Date(
      appointment.scheduledAt,
    ).toLocaleString()}.`,
  );
};

export const getStaleCasesByTenant = async (tenantId) => {
  const cases = await CareCase.find({
    tenantId,
    status: { $in: ['open', 'in_progress'] },
  }).lean();

  const threshold = addDays(new Date(), -14);
  return cases.filter((careCase) => {
    const lastInteraction = [...(careCase.interactions || [])]
      .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))[0];
    const lastActivity = lastInteraction?.date || careCase.updatedAt || careCase.createdAt;
    return new Date(lastActivity) < threshold;
  });
};

export const getAgedCriticalCasesByTenant = async (tenantId) =>
  CareCase.find({
    tenantId,
    urgency: 'critical',
    status: { $in: ['open', 'in_progress', 'on_hold'] },
    createdAt: { $lte: addDays(new Date(), -7) },
  }).lean();

export const getDormantDiscipleshipEnrollmentsByTenant = async (tenantId) => {
  const threshold = addDays(new Date(), -14);
  const enrollments = await MemberDiscipleship.find({
    tenantId,
    status: 'active',
  }).lean();

  return enrollments.filter((enrollment) => {
    const completedSteps = (enrollment.progress || [])
      .filter((item) => item.isCompleted && item.completedAt)
      .sort((left, right) => new Date(right.completedAt) - new Date(left.completedAt));
    const lastProgressDate = completedSteps[0]?.completedAt || enrollment.enrolledAt || enrollment.createdAt;
    return new Date(lastProgressDate) < threshold;
  });
};

export const pastoralAccess = {
  pastoralAccessRoles,
  pastoralAssignableRoles,
  pastoralFullAccessRoles,
  pastoralLimitedRoles,
  hasConfidentialAccess,
};
