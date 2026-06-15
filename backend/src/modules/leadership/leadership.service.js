import LeadershipCandidate from './models/leadershipCandidate.model.js';
import SuccessionPlan from './models/successionPlan.model.js';
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

const normalizeDevelopmentPlan = (items = []) =>
  Array.isArray(items)
    ? items
        .map((item) =>
          compactObject({
            title: normalizeString(item?.title),
            dueDate: parseDate(item?.dueDate),
            isCompleted:
              typeof item?.isCompleted === 'boolean'
                ? item.isCompleted
                : String(item?.isCompleted).toLowerCase() === 'true',
          }),
        )
        .filter((item) => item.title)
    : [];

const buildCandidatePayload = (payload = {}) =>
  compactObject({
    memberId: normalizeString(payload.memberId),
    memberName: normalizeString(payload.memberName),
    ministryId: normalizeString(payload.ministryId),
    ministryName: normalizeString(payload.ministryName),
    branch: normalizeString(payload.branch),
    currentRole: normalizeString(payload.currentRole),
    targetRole: normalizeString(payload.targetRole),
    mentorId: normalizeString(payload.mentorId),
    mentorName: normalizeString(payload.mentorName),
    readinessScore: parseNumber(payload.readinessScore),
    successionStatus: normalizeString(payload.successionStatus),
    strengths: normalizeArray(payload.strengths),
    growthAreas: normalizeArray(payload.growthAreas),
    developmentPlan: normalizeDevelopmentPlan(payload.developmentPlan),
    notes: normalizeString(payload.notes),
    isActive: typeof payload.isActive === 'boolean' ? payload.isActive : parseBoolean(payload.isActive),
  });

const buildPlanPayload = (payload = {}) =>
  compactObject({
    title: normalizeString(payload.title),
    roleName: normalizeString(payload.roleName),
    ministryId: normalizeString(payload.ministryId),
    ministryName: normalizeString(payload.ministryName),
    branch: normalizeString(payload.branch),
    currentHolderId: normalizeString(payload.currentHolderId),
    currentHolderName: normalizeString(payload.currentHolderName),
    emergencySuccessorId: normalizeString(payload.emergencySuccessorId),
    emergencySuccessorName: normalizeString(payload.emergencySuccessorName),
    targetTransitionDate: parseDate(payload.targetTransitionDate),
    status: normalizeString(payload.status),
    risks: normalizeArray(payload.risks),
    candidates: Array.isArray(payload.candidates)
      ? payload.candidates
          .map((item) =>
            compactObject({
              candidateId: normalizeString(item?.candidateId),
              candidateName: normalizeString(item?.candidateName),
              readinessScore: parseNumber(item?.readinessScore),
              rank: parseNumber(item?.rank),
              notes: normalizeString(item?.notes),
            }),
          )
          .filter((item) => item.candidateId || item.candidateName)
      : [],
    notes: normalizeString(payload.notes),
  });

const findCandidateOrThrow = async (tenantId, candidateId) => {
  const candidate = await LeadershipCandidate.findOne({ tenantId, candidateId });
  if (!candidate) {
    throw createHttpError(404, 'Leadership candidate not found.');
  }
  return candidate;
};

const findPlanOrThrow = async (tenantId, planId) => {
  const plan = await SuccessionPlan.findOne({ tenantId, planId });
  if (!plan) {
    throw createHttpError(404, 'Succession plan not found.');
  }
  return plan;
};

export const createCandidate = async (tenantId, data, createdBy) => {
  const payload = buildCandidatePayload(data);
  if (!payload.memberName && !payload.memberId) {
    throw createHttpError(400, 'Candidate member information is required.');
  }

  return LeadershipCandidate.create({
    tenantId,
    candidateId: await generateSequence(LeadershipCandidate, tenantId, 'candidateId', 'LDC'),
    ...payload,
    createdBy,
    updatedBy: createdBy,
  });
};

export const getCandidates = async (tenantId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {
    tenantId,
    ...(query.successionStatus ? { successionStatus: normalizeString(query.successionStatus) } : {}),
    ...(query.branch ? { branch: normalizeString(query.branch) } : {}),
  };

  const [candidates, total] = await Promise.all([
    LeadershipCandidate.find(filters).sort({ readinessScore: -1, createdAt: -1 }).skip(skip).limit(limit),
    LeadershipCandidate.countDocuments(filters),
  ]);

  return {
    candidates,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getCandidateById = async (tenantId, candidateId) => findCandidateOrThrow(tenantId, candidateId);

export const updateCandidate = async (tenantId, candidateId, data, updatedBy) => {
  const candidate = await findCandidateOrThrow(tenantId, candidateId);
  Object.assign(candidate, buildCandidatePayload(data), {
    updatedBy,
    updatedAt: new Date(),
  });
  await candidate.save();
  return candidate;
};

export const createPlan = async (tenantId, data, createdBy) => {
  const payload = buildPlanPayload(data);
  if (!payload.title || !payload.roleName) {
    throw createHttpError(400, 'Succession plan title and role are required.');
  }

  return SuccessionPlan.create({
    tenantId,
    planId: await generateSequence(SuccessionPlan, tenantId, 'planId', 'SUC'),
    ...payload,
    createdBy,
    updatedBy: createdBy,
  });
};

export const getPlans = async (tenantId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {
    tenantId,
    ...(query.status ? { status: normalizeString(query.status) } : {}),
  };

  const [plans, total] = await Promise.all([
    SuccessionPlan.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    SuccessionPlan.countDocuments(filters),
  ]);

  return {
    plans,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getPlanById = async (tenantId, planId) => findPlanOrThrow(tenantId, planId);

export const updatePlan = async (tenantId, planId, data, updatedBy) => {
  const plan = await findPlanOrThrow(tenantId, planId);
  Object.assign(plan, buildPlanPayload(data), {
    updatedBy,
    updatedAt: new Date(),
  });
  await plan.save();
  return plan;
};

export const getLeadershipStats = async (tenantId) => {
  const [candidates, plans] = await Promise.all([
    LeadershipCandidate.find({ tenantId }),
    SuccessionPlan.find({ tenantId }),
  ]);

  return {
    candidates: {
      total: candidates.length,
      readyNow: candidates.filter((item) => item.successionStatus === 'ready_now').length,
      inTraining: candidates.filter((item) => item.successionStatus === 'in_training').length,
      avgReadiness: candidates.length
        ? Number(
            (
              candidates.reduce((sum, item) => sum + Number(item.readinessScore || 0), 0) /
              candidates.length
            ).toFixed(2),
          )
        : 0,
    },
    successionPlans: {
      total: plans.length,
      active: plans.filter((item) => item.status === 'active').length,
      ready: plans.filter((item) => item.status === 'ready').length,
      highRisk: plans.filter((item) => (item.candidates || []).length === 0).length,
    },
  };
};

export const getLeadershipOverview = async (tenantId) => {
  const [stats, candidates, plans] = await Promise.all([
    getLeadershipStats(tenantId),
    LeadershipCandidate.find({ tenantId }).sort({ readinessScore: -1 }).limit(5),
    SuccessionPlan.find({ tenantId }).sort({ updatedAt: -1 }).limit(10),
  ]);

  return {
    ...stats,
    topCandidates: candidates,
    recentPlans: plans,
  };
};

export const getLeadershipAcrossTenants = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {
    ...(query.tenantId ? { tenantId: normalizeString(query.tenantId, { lowercase: true }) } : {}),
  };

  const [candidates, total] = await Promise.all([
    LeadershipCandidate.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LeadershipCandidate.countDocuments(filters),
  ]);

  return {
    candidates,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};
