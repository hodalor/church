import mongoose from 'mongoose';
import User from '../users/model.js';
import Member from '../members/member.model.js';
import * as memberService from '../members/member.service.js';
import Tenant from '../tenants/model.js';
import { createHttpError } from '../../utils/httpError.js';
import Visitor, { visitorStages } from './visitor.model.js';
import VisitorWorkflow from './visitorWorkflow.model.js';

const ASSIGNABLE_LEADER_ROLES = ['care_leader', 'volunteer_leader', 'branch_pastor', 'associate_pastor'];

const DEFAULT_VISITOR_WORKFLOW_STEPS = [
  {
    id: 'step-1',
    name: 'Welcome Message',
    day: 0,
    actions: [
      {
        id: 'action-1',
        type: 'send_message',
        channel: 'sms',
        template: 'Visitor welcome',
        preview: 'Thank you for worshipping with us today.',
      },
    ],
  },
  {
    id: 'step-2',
    name: 'Next Day Follow-up',
    day: 1,
    actions: [
      {
        id: 'action-2',
        type: 'create_follow_up',
        method: 'call',
        noteTemplate: 'Call and thank the visitor for joining service.',
      },
      {
        id: 'action-3',
        type: 'notify_care_leader',
        urgency: 'normal',
        message: 'A new visitor needs welcome follow-up.',
      },
    ],
  },
  {
    id: 'step-3',
    name: 'Weekend Survey',
    day: 3,
    actions: [
      {
        id: 'action-4',
        type: 'send_survey',
        channel: 'whatsapp',
      },
    ],
  },
];

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

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(String(item))).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => normalizeString(item))
      .filter(Boolean);
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

const parseBool = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    }
    if (value.toLowerCase() === 'false') {
      return false;
    }
  }

  return undefined;
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

const dateOnly = (value) => {
  const nextDate = parseDate(value);
  return nextDate ? nextDate.toISOString().slice(0, 10) : null;
};

const dateTimeValue = (value) => {
  const nextDate = parseDate(value);
  return nextDate ? nextDate.toISOString() : null;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const percentage = (value, total) => {
  if (!total) {
    return 0;
  }

  return Math.round((Number(value || 0) / Number(total || 0)) * 100);
};

const getDaysBetween = (fromDate, toDate = new Date()) => {
  if (!fromDate) {
    return 0;
  }

  const start = startOfDay(parseDate(fromDate) || new Date());
  const end = startOfDay(parseDate(toDate) || new Date());
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
};

const buildVisitorFullName = (visitor = {}) =>
  [visitor.firstName, visitor.lastName].filter(Boolean).join(' ').trim();

const formatStageLabel = (stage) =>
  String(stage || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getNextPendingFollowUp = (followUps = []) =>
  [...followUps]
    .filter((item) => item.status !== 'completed')
    .sort((left, right) => new Date(left.scheduledDate) - new Date(right.scheduledDate))[0] || null;

const getLastCompletedFollowUp = (followUps = []) =>
  [...followUps]
    .filter((item) => item.status === 'completed')
    .sort(
      (left, right) =>
        new Date(right.completedAt || right.updatedAt || right.scheduledDate) -
        new Date(left.completedAt || left.updatedAt || left.scheduledDate),
    )[0] || null;

const getFollowUpStatus = (followUps = []) => {
  const next = getNextPendingFollowUp(followUps);
  if (!next) {
    return 'none';
  }

  return new Date(next.scheduledDate) < startOfDay(new Date()) ? 'overdue' : 'upcoming';
};

const serializeCareLeader = (assignedTo) => {
  if (!assignedTo) {
    return null;
  }

  return {
    id: assignedTo.id || assignedTo.userId || null,
    userId: assignedTo.userId || assignedTo.id || null,
    name: assignedTo.name || '',
    role: assignedTo.role || '',
    photoUrl: assignedTo.photoUrl || '',
  };
};

const serializeFollowUp = (followUp) => ({
  id: followUp._id?.toString?.() || String(followUp.id || ''),
  method: followUp.method,
  scheduledDate: dateOnly(followUp.scheduledDate),
  status: followUp.status,
  outcome: followUp.outcome || '',
  notes: followUp.notes || '',
  createdAt: dateTimeValue(followUp.createdAt),
  updatedAt: dateTimeValue(followUp.updatedAt),
  completedAt: dateTimeValue(followUp.completedAt),
});

const serializeVisit = (visit) => ({
  id: visit._id?.toString?.() || String(visit.id || ''),
  date: dateOnly(visit.date),
  serviceName: visit.serviceName || '',
  notes: visit.notes || '',
  isFirstVisit: visit.isFirstVisit === true,
});

const serializeStageHistory = (item) => ({
  id: item._id?.toString?.() || String(item.id || ''),
  stage: item.stage,
  changedAt: dateTimeValue(item.changedAt),
  changedBy: item.changedBy || '',
  changedByUserId: item.changedByUserId || '',
  note: item.note || '',
});

const serializeWorkflowProgress = (item) => ({
  id: item._id?.toString?.() || String(item.id || ''),
  stepId: item.stepId || '',
  day: Number(item.day || 0),
  actionType: item.actionType,
  sentAt: dateTimeValue(item.sentAt),
  status: item.status || 'pending',
  summary: item.summary || '',
});

const serializeWorkflowSteps = (workflow) =>
  (workflow?.steps || []).map((step) => ({
    id: step.id,
    name: step.name,
    day: Number(step.day || 0),
    actions: (step.actions || []).map((action) => ({
      id: action.id,
      type: action.type,
      channel: action.channel || '',
      template: action.template || '',
      preview: action.preview || '',
      method: action.method || '',
      noteTemplate: action.noteTemplate || '',
      message: action.message || '',
      urgency: action.urgency || '',
      role: action.role || '',
    })),
  }));

const serializeVisitor = (visitorDocument) => {
  const visitor = visitorDocument.toObject ? visitorDocument.toObject() : visitorDocument;
  const visits = Array.isArray(visitor.visits) ? visitor.visits.map(serializeVisit) : [];
  const followUps = Array.isArray(visitor.followUps) ? visitor.followUps.map(serializeFollowUp) : [];
  const nextPendingFollowUp = getNextPendingFollowUp(followUps);
  const lastCompletedFollowUp = getLastCompletedFollowUp(followUps);

  return {
    id: visitor._id?.toString?.() || String(visitor.id || ''),
    _id: visitor._id?.toString?.() || String(visitor.id || ''),
    visitorId: visitor.visitorId,
    tenantId: visitor.tenantId,
    firstName: visitor.firstName,
    lastName: visitor.lastName,
    fullName: buildVisitorFullName(visitor),
    phone: visitor.phone || '',
    email: visitor.email || '',
    gender: visitor.gender || '',
    ageGroup: visitor.ageGroup || '',
    heardAboutUs: visitor.heardAboutUs || '',
    referredByMember: visitor.referredByMember || null,
    branch: visitor.branch || '',
    firstVisitDate: dateOnly(visitor.firstVisitDate),
    interests: Array.isArray(visitor.interests) ? visitor.interests : [],
    prayerRequest: visitor.prayerRequest || '',
    notes: visitor.notes || '',
    photoUrl: visitor.photoUrl || '',
    stage: visitor.stage,
    stageChangedAt: dateTimeValue(visitor.stageChangedAt),
    assignedTo: serializeCareLeader(visitor.assignedTo),
    converted: visitor.converted === true,
    convertedAt: dateTimeValue(visitor.convertedAt),
    conversion: visitor.conversion || null,
    createdAt: dateTimeValue(visitor.createdAt),
    updatedAt: dateTimeValue(visitor.updatedAt),
    visits,
    totalVisits: visits.length,
    followUps,
    nextPendingFollowUp,
    lastCompletedFollowUp,
    followUpStatus: getFollowUpStatus(followUps),
    daysSinceFirstVisit: getDaysBetween(visitor.firstVisitDate),
    daysInCurrentStage: getDaysBetween(visitor.stageChangedAt || visitor.firstVisitDate),
    stageHistory: Array.isArray(visitor.stageHistory) ? visitor.stageHistory.map(serializeStageHistory) : [],
    workflowProgress: Array.isArray(visitor.workflowProgress)
      ? visitor.workflowProgress.map(serializeWorkflowProgress)
      : [],
    survey: visitor.survey
      ? {
          experience: visitor.survey.experience ?? null,
          serviceQuality: visitor.survey.serviceQuality ?? null,
          welcomeFeeling: visitor.survey.welcomeFeeling ?? null,
          feedback: visitor.survey.feedback || '',
          wouldReturn: visitor.survey.wouldReturn ?? null,
          submittedAt: dateTimeValue(visitor.survey.submittedAt),
        }
      : null,
  };
};

const buildPagination = (query = {}, fallbackLimit = 10) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || fallbackLimit, 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const resolveVisitorFilters = (tenantId, query = {}) => {
  const filters = { tenantId };
  const search = normalizeString(query.search);
  const stage = normalizeString(query.stage);
  const branch = normalizeString(query.branch);
  const assignedTo = normalizeString(query.assignedTo);
  const fromDate = parseDate(query.fromDate || query.from);
  const toDate = parseDate(query.toDate || query.to);
  const converted = parseBool(query.converted);

  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filters.$or = [
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
      { email: regex },
      { visitorId: regex },
    ];
  }

  if (stage && stage !== 'all') {
    filters.stage = stage;
  }

  if (branch && branch !== 'all') {
    filters.branch = branch;
  }

  if (assignedTo && assignedTo !== 'all') {
    filters.$and = [...(filters.$and || []), { $or: [{ 'assignedTo.id': assignedTo }, { 'assignedTo.userId': assignedTo }] }];
  }

  if (typeof converted === 'boolean') {
    filters.converted = converted;
  }

  if (fromDate || toDate) {
    filters.firstVisitDate = {
      ...(fromDate ? { $gte: startOfDay(fromDate) } : {}),
      ...(toDate ? { $lte: endOfDay(toDate) } : {}),
    };
  }

  return filters;
};

const getVisitorQueryById = (tenantId, visitorId) => {
  const normalizedId = String(visitorId || '').trim();
  if (!normalizedId) {
    throw createHttpError(404, 'Visitor not found.');
  }

  if (mongoose.isValidObjectId(normalizedId)) {
    return {
      tenantId,
      $or: [{ _id: normalizedId }, { visitorId: normalizedId }],
    };
  }

  return {
    tenantId,
    visitorId: normalizedId,
  };
};

const getVisitorOrThrow = async (tenantId, visitorId) => {
  const visitor = await Visitor.findOne(getVisitorQueryById(tenantId, visitorId));
  if (!visitor) {
    throw createHttpError(404, 'Visitor not found.');
  }

  return visitor;
};

const getAssignableLeaders = async (tenantId) => {
  const users = await User.find({
    tenantId,
    role: { $in: ASSIGNABLE_LEADER_ROLES },
    isActive: true,
  })
    .select('_id fullName username role photoUrl')
    .sort({ fullName: 1, username: 1 });

  return users.map((user) => ({
    id: String(user._id),
    userId: String(user._id),
    name: user.fullName || user.username || String(user._id),
    role: user.role,
    photoUrl: user.photoUrl || '',
  }));
};

const pickLeaderForVisitor = async (tenantId, branch) => {
  const leaders = await getAssignableLeaders(tenantId);
  if (!leaders.length) {
    return null;
  }

  if (branch) {
    const branchUsers = await User.find({
      tenantId,
      role: { $in: ASSIGNABLE_LEADER_ROLES },
      isActive: true,
      $or: [{ allBranches: true }, { assignedBranches: branch }],
    })
      .select('_id fullName username role photoUrl')
      .sort({ fullName: 1, username: 1 })
      .limit(1);

    if (branchUsers[0]) {
      return {
        id: String(branchUsers[0]._id),
        userId: String(branchUsers[0]._id),
        name: branchUsers[0].fullName || branchUsers[0].username || String(branchUsers[0]._id),
        role: branchUsers[0].role,
        photoUrl: branchUsers[0].photoUrl || '',
      };
    }
  }

  return leaders[0];
};

const getWorkflowForTenant = async (tenantId) => {
  let workflow = await VisitorWorkflow.findOne({ tenantId });
  if (!workflow) {
    workflow = await VisitorWorkflow.create({
      tenantId,
      isActive: true,
      steps: DEFAULT_VISITOR_WORKFLOW_STEPS,
    });
  }

  return workflow;
};

const ensureUniqueVisitorContact = async (tenantId, { phone, email }, excludeVisitorId) => {
  const checks = [];

  if (phone) {
    checks.push(
      Visitor.findOne({
        tenantId,
        phone,
        ...(excludeVisitorId ? { _id: { $ne: excludeVisitorId } } : {}),
      }).select('_id'),
    );
  } else {
    checks.push(Promise.resolve(null));
  }

  if (email) {
    checks.push(
      Visitor.findOne({
        tenantId,
        email,
        ...(excludeVisitorId ? { _id: { $ne: excludeVisitorId } } : {}),
      }).select('_id'),
    );
  } else {
    checks.push(Promise.resolve(null));
  }

  const [phoneMatch, emailMatch] = await Promise.all(checks);

  if (phoneMatch) {
    throw createHttpError(409, 'A visitor with this phone already exists.');
  }

  if (emailMatch) {
    throw createHttpError(409, 'A visitor with this email already exists.');
  }
};

const buildWorkflowProgressFromSteps = (steps = []) =>
  steps
    .flatMap((step) =>
      (step.actions || []).map((action) => ({
        stepId: step.id,
        day: Number(step.day || 0),
        actionType: action.type,
        sentAt: action.type === 'send_message' ? new Date() : undefined,
        status: action.type === 'send_message' ? 'completed' : 'pending',
        summary: formatStageLabel(action.type),
      })),
    )
    .slice(0, 3);

const buildAutoFollowUpsFromWorkflow = (steps = []) =>
  steps.flatMap((step) =>
    (step.actions || [])
      .filter((action) => action.type === 'create_follow_up')
      .map((action) => ({
        method: action.method || 'call',
        scheduledDate: addDays(new Date(), Number(step.day || 0)),
        status: 'pending',
        notes: action.noteTemplate || 'Automatically created follow-up.',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
  );

const monthLabel = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'short' }).format(value);

export const getVisitorAssignableLeaders = async (tenantId) => getAssignableLeaders(tenantId);

export const searchVisitors = async (tenantId, query = {}) => {
  const search = normalizeString(query.search || query.phone);
  if (!search) {
    return { items: [] };
  }

  const regex = new RegExp(escapeRegex(search), 'i');
  const visitors = await Visitor.find({
    tenantId,
    $or: [
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
      { visitorId: regex },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(query.limit) || 8, 1), 25));

  return {
    items: visitors.map(serializeVisitor),
  };
};

export const checkVisitorDuplicateByPhone = async (tenantId, phone) => {
  const normalizedPhone = normalizeString(phone);
  if (!normalizedPhone) {
    return null;
  }

  const visitor = await Visitor.findOne({ tenantId, phone: normalizedPhone }).sort({ createdAt: -1 });
  return visitor ? serializeVisitor(visitor) : null;
};

export const registerVisitor = async (tenantId, payload = {}, actor = {}) => {
  const firstName = normalizeString(payload.firstName);
  const lastName = normalizeString(payload.lastName);
  const phone = normalizeString(payload.phone);
  const email = normalizeString(payload.email, { lowercase: true });
  const branch = normalizeString(payload.branch);

  if (!firstName || !lastName) {
    throw createHttpError(400, 'First name and last name are required.');
  }

  if (phone || email) {
    await ensureUniqueVisitorContact(tenantId, { phone, email });
  }

  const [leader, workflow] = await Promise.all([
    pickLeaderForVisitor(tenantId, branch),
    getWorkflowForTenant(tenantId),
  ]);

  const firstVisitDate = parseDate(payload.firstVisitDate) || new Date();
  const automaticFollowUps = workflow.isActive ? buildAutoFollowUpsFromWorkflow(workflow.steps) : [];

  const visitor = await Visitor.create({
    tenantId,
    firstName,
    lastName,
    phone,
    email,
    gender: normalizeString(payload.gender),
    ageGroup: normalizeString(payload.ageGroup),
    heardAboutUs: normalizeString(payload.heardAboutUs),
    referredByMember: payload.referredByMember?.memberId
      ? {
          memberId: normalizeString(payload.referredByMember.memberId),
          memberName: normalizeString(payload.referredByMember.memberName),
        }
      : undefined,
    branch,
    firstVisitDate,
    interests: normalizeArray(payload.interests),
    prayerRequest: normalizeString(payload.prayerRequest),
    notes: normalizeString(payload.notes),
    photoUrl: normalizeString(payload.photoUrl),
    stage: 'new_visitor',
    stageChangedAt: new Date(),
    assignedTo: leader || undefined,
    converted: false,
    visits: [
      {
        date: firstVisitDate,
        serviceName: normalizeString(payload.serviceName) || 'Welcome Service',
        notes: normalizeString(payload.notes) || 'First visit recorded from visitor registration.',
        isFirstVisit: true,
      },
    ],
    followUps: automaticFollowUps,
    stageHistory: [
      {
        stage: 'new_visitor',
        changedAt: new Date(),
        changedBy: actor.name || actor.role || 'System',
        changedByUserId: actor.userId,
        note: 'Visitor registered at church entrance.',
      },
    ],
    workflowProgress: workflow.isActive ? buildWorkflowProgressFromSteps(workflow.steps) : [],
    createdBy: actor.userId,
    updatedBy: actor.userId,
  });

  return {
    visitor: serializeVisitor(visitor),
    message: 'Visitor registered successfully.',
    assignedCareLeader: serializeCareLeader(leader),
  };
};

export const getVisitors = async (tenantId, query = {}) => {
  const { page, limit, skip } = buildPagination(query, 10);
  const filters = resolveVisitorFilters(tenantId, query);
  const [total, visitors, careLeaders, branches] = await Promise.all([
    Visitor.countDocuments(filters),
    Visitor.find(filters).sort({ firstVisitDate: -1, createdAt: -1 }).skip(skip).limit(limit),
    getAssignableLeaders(tenantId),
    Visitor.distinct('branch', { tenantId }),
  ]);

  return {
    items: visitors.map(serializeVisitor),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    careLeaders,
    branches: branches.filter(Boolean).sort(),
  };
};

export const getVisitorById = async (tenantId, visitorId) => {
  const visitor = await getVisitorOrThrow(tenantId, visitorId);
  return serializeVisitor(visitor);
};

export const updateVisitorStage = async (tenantId, visitorId, stage, note = '', actor = {}) => {
  if (!visitorStages.includes(stage)) {
    throw createHttpError(400, 'Visitor stage is invalid.');
  }

  const visitor = await getVisitorOrThrow(tenantId, visitorId);
  visitor.stage = stage;
  visitor.stageChangedAt = new Date();
  visitor.converted = stage === 'converted' ? true : visitor.converted;
  if (stage === 'converted' && !visitor.convertedAt) {
    visitor.convertedAt = new Date();
  }
  visitor.stageHistory.unshift({
    stage,
    changedAt: new Date(),
    changedBy: actor.name || actor.role || 'Workspace User',
    changedByUserId: actor.userId,
    note: normalizeString(note) || `Stage updated to ${formatStageLabel(stage)}.`,
  });
  visitor.updatedBy = actor.userId;
  await visitor.save();
  return serializeVisitor(visitor);
};

export const assignVisitorsToCareLeader = async (tenantId, visitorIds = [], leaderId, actor = {}) => {
  const leaders = await getAssignableLeaders(tenantId);
  const leader = leaders.find((item) => item.id === String(leaderId) || item.userId === String(leaderId));

  if (!leader) {
    throw createHttpError(404, 'Care leader not found.');
  }

  const visitors = await Visitor.find({
    tenantId,
    $or: [
      { _id: { $in: visitorIds.filter((id) => mongoose.isValidObjectId(id)) } },
      { visitorId: { $in: visitorIds.map((id) => String(id)) } },
    ],
  });

  if (!visitors.length) {
    throw createHttpError(404, 'No visitors found for assignment.');
  }

  await Promise.all(
    visitors.map(async (visitor) => {
      visitor.assignedTo = leader;
      visitor.updatedBy = actor.userId;
      await visitor.save();
    }),
  );

  return {
    leader,
    updatedIds: visitors.map((visitor) => visitor._id.toString()),
  };
};

export const recordVisitorReturnVisit = async (tenantId, visitorId, payload = {}, actor = {}) => {
  const visitor = await getVisitorOrThrow(tenantId, visitorId);
  const visitDate = parseDate(payload.date) || new Date();
  const shouldPromoteToSecondVisit = visitor.stage === 'new_visitor';

  visitor.visits.push({
    date: visitDate,
    serviceName: normalizeString(payload.serviceName) || 'Return Visit Service',
    notes: normalizeString(payload.notes),
    isFirstVisit: false,
  });

  if (shouldPromoteToSecondVisit) {
    visitor.stage = 'second_visit';
    visitor.stageChangedAt = new Date();
    visitor.stageHistory.unshift({
      stage: 'second_visit',
      changedAt: new Date(),
      changedBy: actor.name || actor.role || 'Workspace User',
      changedByUserId: actor.userId,
      note: 'Visitor recorded a return visit.',
    });
  }

  visitor.updatedBy = actor.userId;
  await visitor.save();
  return serializeVisitor(visitor);
};

export const createVisitorFollowUp = async (tenantId, visitorId, payload = {}, actor = {}) => {
  const visitor = await getVisitorOrThrow(tenantId, visitorId);
  const scheduledDate = parseDate(payload.scheduledDate) || new Date();

  visitor.followUps.unshift({
    method: normalizeString(payload.method) || 'call',
    scheduledDate,
    status: 'pending',
    notes: normalizeString(payload.notes),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  visitor.updatedBy = actor.userId;
  await visitor.save();
  return serializeVisitor(visitor);
};

export const completeVisitorFollowUp = async (tenantId, visitorId, followUpId, payload = {}, actor = {}) => {
  const visitor = await getVisitorOrThrow(tenantId, visitorId);
  const followUp = visitor.followUps.id(followUpId);

  if (!followUp) {
    throw createHttpError(404, 'Follow-up item not found.');
  }

  followUp.status = 'completed';
  followUp.outcome = normalizeString(payload.outcome);
  followUp.notes = normalizeString(payload.notes) || followUp.notes;
  followUp.updatedAt = new Date();
  followUp.completedAt = new Date();
  followUp.completedBy = {
    userId: actor.userId,
    role: actor.role,
    name: actor.name,
  };

  if (parseBool(payload.scheduleNextFollowUp) === true) {
    visitor.followUps.unshift({
      method: normalizeString(payload.nextMethod) || 'call',
      scheduledDate: parseDate(payload.nextScheduledDate) || addDays(new Date(), 2),
      status: 'pending',
      notes: normalizeString(payload.nextNotes) || 'Next follow-up scheduled from completion flow.',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  visitor.updatedBy = actor.userId;
  await visitor.save();
  return serializeVisitor(visitor);
};

export const rescheduleVisitorFollowUp = async (tenantId, visitorId, followUpId, payload = {}, actor = {}) => {
  const visitor = await getVisitorOrThrow(tenantId, visitorId);
  const followUp = visitor.followUps.id(followUpId);

  if (!followUp) {
    throw createHttpError(404, 'Follow-up item not found.');
  }

  followUp.method = normalizeString(payload.method) || followUp.method;
  followUp.scheduledDate = parseDate(payload.scheduledDate) || followUp.scheduledDate;
  followUp.notes = normalizeString(payload.notes) || followUp.notes;
  followUp.updatedAt = new Date();
  visitor.updatedBy = actor.userId;
  await visitor.save();
  return serializeVisitor(visitor);
};

export const convertVisitorToMember = async (tenantId, visitorId, payload = {}, actor = {}) => {
  const visitor = await getVisitorOrThrow(tenantId, visitorId);

  if (visitor.converted === true && visitor.conversion?.memberId) {
    return serializeVisitor(visitor);
  }

  const memberPayload = {
    firstName: normalizeString(payload.firstName) || visitor.firstName,
    lastName: normalizeString(payload.lastName) || visitor.lastName,
    phone: normalizeString(payload.phone) || visitor.phone,
    email: normalizeString(payload.email, { lowercase: true }) || visitor.email,
    gender: normalizeString(payload.gender) || visitor.gender,
    branch: normalizeString(payload.branch) || visitor.branch,
    membershipStatus: normalizeString(payload.membershipStatus) || 'member',
    baptismStatus: normalizeString(payload.baptismStatus) || 'not_baptised',
    salvationDate: parseDate(payload.salvationDate),
    ministry: normalizeString(payload.ministry),
    notes: normalizeString(payload.notes) || visitor.notes,
  };

  const member = await memberService.createMember(tenantId, memberPayload, actor.userId);

  visitor.converted = true;
  visitor.convertedAt = new Date();
  visitor.stage = 'converted';
  visitor.stageChangedAt = new Date();
  visitor.conversion = {
    memberId: member.memberId,
    convertedAt: visitor.convertedAt,
    convertedBy: actor.userId,
    membershipStatus: memberPayload.membershipStatus,
    baptismStatus: memberPayload.baptismStatus,
    salvationDate: memberPayload.salvationDate,
  };
  visitor.stageHistory.unshift({
    stage: 'converted',
    changedAt: new Date(),
    changedBy: actor.name || actor.role || 'Workspace User',
    changedByUserId: actor.userId,
    note: 'Converted to member profile from visitor detail.',
  });
  visitor.updatedBy = actor.userId;
  await visitor.save();

  return serializeVisitor(visitor);
};

export const getVisitorPipeline = async (tenantId, query = {}) => {
  const filters = resolveVisitorFilters(tenantId, query);
  const [visitors, careLeaders] = await Promise.all([
    Visitor.find(filters).sort({ updatedAt: -1 }),
    getAssignableLeaders(tenantId),
  ]);

  return {
    stages: visitorStages.map((stage) => ({
      stage,
      label: formatStageLabel(stage),
      items: visitors.filter((visitor) => visitor.stage === stage).map(serializeVisitor),
    })),
    careLeaders,
  };
};

export const getVisitorFollowUps = async (tenantId, query = {}) => {
  const filters = resolveVisitorFilters(tenantId, query);
  const visitors = await Visitor.find(filters).sort({ createdAt: -1 });
  const today = dateOnly(new Date());

  const items = visitors.flatMap((visitor) => {
    const normalizedVisitor = serializeVisitor(visitor);
    return normalizedVisitor.followUps.map((followUp) => ({
      ...followUp,
      visitorId: normalizedVisitor.id,
      visitorName: normalizedVisitor.fullName,
      visitorPhone: normalizedVisitor.phone,
      stage: normalizedVisitor.stage,
      branch: normalizedVisitor.branch,
      assignedTo: normalizedVisitor.assignedTo,
      overdueDays:
        followUp.status === 'completed' || !followUp.scheduledDate || followUp.scheduledDate >= today
          ? 0
          : getDaysBetween(followUp.scheduledDate),
    }));
  });

  return {
    items,
    overdue: items.filter((item) => item.status !== 'completed' && item.scheduledDate < today),
    today: items.filter((item) => item.scheduledDate === today),
    upcoming: items.filter((item) => item.status !== 'completed' && item.scheduledDate > today),
  };
};

export const getVisitorWorkflow = async (tenantId) => {
  const workflow = await getWorkflowForTenant(tenantId);
  return serializeWorkflowSteps(workflow);
};

export const saveVisitorWorkflow = async (tenantId, payload, actor = {}) => {
  const workflow = await getWorkflowForTenant(tenantId);
  const stepsInput = Array.isArray(payload) ? payload : payload?.steps;
  const nextSteps = (Array.isArray(stepsInput) ? stepsInput : []).map((step, index) => ({
    id: normalizeString(step.id) || `step-${index + 1}`,
    name: normalizeString(step.name) || `Workflow Step ${index + 1}`,
    day: Math.max(Number(step.day) || 0, 0),
    actions: (Array.isArray(step.actions) ? step.actions : []).map((action, actionIndex) => ({
      id: normalizeString(action.id) || `action-${index + 1}-${actionIndex + 1}`,
      type: normalizeString(action.type) || 'send_message',
      channel: normalizeString(action.channel),
      template: normalizeString(action.template),
      preview: normalizeString(action.preview),
      method: normalizeString(action.method),
      noteTemplate: normalizeString(action.noteTemplate),
      message: normalizeString(action.message),
      urgency: normalizeString(action.urgency),
      role: normalizeString(action.role),
    })),
  }));

  workflow.steps = nextSteps;
  if (typeof payload?.isActive === 'boolean') {
    workflow.isActive = payload.isActive;
  }
  workflow.updatedBy = actor.userId;
  await workflow.save();
  return serializeWorkflowSteps(workflow);
};

export const testVisitorWorkflow = async (tenantId, payload) => {
  const steps = Array.isArray(payload) ? payload : payload?.steps || (await getVisitorWorkflow(tenantId));
  return (Array.isArray(steps) ? steps : []).map((step) => ({
    id: step.id,
    day: Number(step.day || 0),
    name: step.name,
    actionsSummary: (step.actions || []).map((action) => String(action.type || '').replaceAll('_', ' ')).join(', '),
  }));
};

export const getVisitorReports = async (tenantId) => {
  const visitors = (await Visitor.find({ tenantId }).sort({ firstVisitDate: 1 })).map(serializeVisitor);
  const totalVisitors = visitors.length;
  const convertedVisitors = visitors.filter((visitor) => visitor.converted);
  const converted = convertedVisitors.length;

  const funnel = visitorStages.map((stage) => {
    const count = visitors.filter((visitor) => visitor.stage === stage).length;
    return {
      stage,
      label: formatStageLabel(stage),
      count,
      percentage: percentage(count, totalVisitors),
    };
  });

  const dropOff = funnel.slice(0, -1).map((item, index) => ({
    from: item.label,
    to: funnel[index + 1].label,
    dropOffPercentage: item.count ? Math.max(0, 100 - percentage(funnel[index + 1].count, item.count)) : 0,
    averageDaysStuck:
      visitors.filter((visitor) => visitor.stage === item.stage).reduce((sum, visitor) => sum + visitor.daysInCurrentStage, 0) /
        Math.max(visitors.filter((visitor) => visitor.stage === item.stage).length, 1) || 0,
  }));

  const now = new Date();
  const conversionTrend = Array.from({ length: 12 }, (_, index) => {
    const current = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    const monthVisitors = visitors.filter((visitor) => {
      const visitorDate = new Date(visitor.firstVisitDate);
      return (
        visitorDate.getFullYear() === current.getFullYear() &&
        visitorDate.getMonth() === current.getMonth()
      );
    });
    const monthConverted = monthVisitors.filter((visitor) => visitor.converted).length;

    return {
      month: monthLabel(current),
      rate: percentage(monthConverted, monthVisitors.length),
    };
  });

  const heardAbout = [...new Set(visitors.map((visitor) => visitor.heardAboutUs).filter(Boolean))].map((label) => ({
    label,
    value: visitors.filter((visitor) => visitor.heardAboutUs === label).length,
  }));

  const branchBreakdown = [...new Set(visitors.map((visitor) => visitor.branch).filter(Boolean))].map((label) => ({
    label,
    value: visitors.filter((visitor) => visitor.branch === label).length,
  }));

  const topReferrerMap = new Map();
  for (const visitor of visitors) {
    const memberId = visitor.referredByMember?.memberId;
    if (!memberId) {
      continue;
    }

    const current = topReferrerMap.get(memberId) || {
      memberId,
      name: visitor.referredByMember.memberName || memberId,
      referrals: 0,
      converted: 0,
    };
    current.referrals += 1;
    if (visitor.converted) {
      current.converted += 1;
    }
    topReferrerMap.set(memberId, current);
  }

  const topReferrers = [...topReferrerMap.values()]
    .map((item) => ({
      ...item,
      successRate: percentage(item.converted, item.referrals),
    }))
    .sort((left, right) => right.referrals - left.referrals)
    .slice(0, 10);

  const surveys = visitors.map((visitor) => visitor.survey).filter(Boolean);
  const averageMetric = (field) =>
    surveys.length
      ? Number((surveys.reduce((sum, item) => sum + Number(item[field] || 0), 0) / surveys.length).toFixed(1))
      : 0;

  return {
    totalVisitors,
    converted,
    conversionRate: percentage(converted, totalVisitors),
    averageDaysToConvert: converted
      ? Math.round(
          convertedVisitors.reduce((sum, visitor) => sum + getDaysBetween(visitor.firstVisitDate, visitor.convertedAt), 0) /
            converted,
        )
      : 0,
    funnel,
    dropOff,
    conversionTrend,
    heardAbout,
    branchBreakdown,
    topReferrers,
    satisfaction: {
      score: averageMetric('experience'),
      experience: averageMetric('experience'),
      serviceQuality: averageMetric('serviceQuality'),
      welcomeFeeling: averageMetric('welcomeFeeling'),
      wouldReturn: percentage(
        surveys.filter((item) => item.wouldReturn === true).length,
        surveys.length,
      ),
      topWords: surveys
        .flatMap((item) => String(item.feedback || '').split(/\s+/))
        .map((word) => word.toLowerCase().replace(/[^a-z]/g, ''))
        .filter((word) => word.length > 3)
        .slice(0, 10),
    },
    referralTrend: Array.from({ length: 8 }, (_, index) => {
      const weekStart = addDays(startOfDay(new Date()), -(7 * (7 - index)));
      const weekEnd = endOfDay(addDays(weekStart, 6));
      return {
        period: `W${index + 1}`,
        referrals: visitors.filter((visitor) => {
          const firstVisit = parseDate(visitor.firstVisitDate);
          return firstVisit && firstVisit >= weekStart && firstVisit <= weekEnd && visitor.referredByMember?.memberId;
        }).length,
      };
    }),
  };
};

export const getPlatformVisitorOverview = async () => {
  const [tenants, visitors, workflows] = await Promise.all([
    Tenant.find({ isActive: true, isSuspended: { $ne: true } }).select('tenantId churchName'),
    Visitor.find({}).sort({ createdAt: -1 }),
    VisitorWorkflow.find({}).select('tenantId isActive'),
  ]);

  const workflowMap = new Map(workflows.map((workflow) => [workflow.tenantId, workflow.isActive === true]));
  const serializedVisitors = visitors.map(serializeVisitor);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const tenantsTable = tenants.map((tenant) => {
    const tenantVisitors = serializedVisitors.filter((visitor) => visitor.tenantId === tenant.tenantId);
    const convertedCount = tenantVisitors.filter((visitor) => visitor.converted).length;
    const pendingFollowUps = tenantVisitors.reduce(
      (sum, visitor) => sum + visitor.followUps.filter((followUp) => followUp.status !== 'completed').length,
      0,
    );

    return {
      tenantId: tenant.tenantId,
      churchName: tenant.churchName,
      visitorsThisMonth: tenantVisitors.filter((visitor) => {
        const date = parseDate(visitor.firstVisitDate);
        return date && date >= monthStart;
      }).length,
      totalVisitors: tenantVisitors.length,
      converted: convertedCount,
      conversionRate: percentage(convertedCount, tenantVisitors.length),
      pendingFollowUps,
      workflowActive: workflowMap.get(tenant.tenantId) !== false,
    };
  });

  return {
    totalVisitors: serializedVisitors.length,
    averageConversionRate: tenantsTable.length
      ? Math.round(
          tenantsTable.reduce((sum, item) => sum + Number(item.conversionRate || 0), 0) / tenantsTable.length,
        )
      : 0,
    pendingFollowUps: serializedVisitors.reduce(
      (sum, visitor) => sum + visitor.followUps.filter((followUp) => followUp.status !== 'completed').length,
      0,
    ),
    lostVisitors: serializedVisitors.filter((visitor) => visitor.stage === 'lost').length,
    tenants: tenantsTable.sort((left, right) => right.conversionRate - left.conversionRate),
  };
};

export const getVisitorConversionCandidates = async (tenantId, query = {}) => {
  const search = normalizeString(query.search);
  const regex = search ? new RegExp(escapeRegex(search), 'i') : null;
  const members = await Member.find({
    tenantId,
    isDeleted: false,
    ...(regex
      ? {
          $or: [
            { firstName: regex },
            { lastName: regex },
            { memberId: regex },
            { phone: regex },
          ],
        }
      : {}),
  })
    .select('memberId firstName lastName phone email branch')
    .sort({ firstName: 1, lastName: 1 })
    .limit(Math.min(Math.max(Number(query.limit) || 8, 1), 25));

  return {
    items: members.map((member) => ({
      memberId: member.memberId,
      fullName: [member.firstName, member.lastName].filter(Boolean).join(' '),
      phone: member.phone || '',
      email: member.email || '',
      branch: member.branch || '',
    })),
  };
};
