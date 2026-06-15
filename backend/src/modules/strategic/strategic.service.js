import StrategicInitiative from './models/strategicInitiative.model.js';
import StrategicKPI from './models/strategicKpi.model.js';
import StrategicPlan from './models/strategicPlan.model.js';
import { createHttpError } from '../../utils/httpError.js';
import {
  buildPagination,
  compactObject,
  generateSequence,
  normalizeArray,
  normalizeString,
  parseDate,
  parseNumber,
} from '../../utils/phase11Helpers.js';

const buildPlanPayload = (payload = {}) =>
  compactObject({
    title: normalizeString(payload.title),
    vision: normalizeString(payload.vision),
    periodStart: parseDate(payload.periodStart),
    periodEnd: parseDate(payload.periodEnd),
    ownerId: normalizeString(payload.ownerId),
    ownerName: normalizeString(payload.ownerName),
    status: normalizeString(payload.status),
    focusAreas: normalizeArray(payload.focusAreas),
  });

const buildKpiPayload = (payload = {}) =>
  compactObject({
    planId: normalizeString(payload.planId),
    title: normalizeString(payload.title),
    category: normalizeString(payload.category),
    ownerId: normalizeString(payload.ownerId),
    ownerName: normalizeString(payload.ownerName),
    unit: normalizeString(payload.unit),
    baselineValue: parseNumber(payload.baselineValue),
    targetValue: parseNumber(payload.targetValue),
    currentValue: parseNumber(payload.currentValue),
    status: normalizeString(payload.status),
    measurements: Array.isArray(payload.measurements)
      ? payload.measurements
          .map((item) =>
            compactObject({
              period: normalizeString(item?.period),
              value: parseNumber(item?.value),
              notes: normalizeString(item?.notes),
              recordedAt: parseDate(item?.recordedAt),
            }),
          )
          .filter((item) => item.period)
      : [],
  });

const buildInitiativePayload = (payload = {}) =>
  compactObject({
    planId: normalizeString(payload.planId),
    kpiId: normalizeString(payload.kpiId),
    title: normalizeString(payload.title),
    ownerId: normalizeString(payload.ownerId),
    ownerName: normalizeString(payload.ownerName),
    description: normalizeString(payload.description),
    progress: parseNumber(payload.progress),
    status: normalizeString(payload.status),
    startDate: parseDate(payload.startDate),
    dueDate: parseDate(payload.dueDate),
    notes: normalizeString(payload.notes),
  });

const findPlanOrThrow = async (tenantId, planId) => {
  const plan = await StrategicPlan.findOne({ tenantId, planId });
  if (!plan) {
    throw createHttpError(404, 'Strategic plan not found.');
  }
  return plan;
};

const findKpiOrThrow = async (tenantId, kpiId) => {
  const kpi = await StrategicKPI.findOne({ tenantId, kpiId });
  if (!kpi) {
    throw createHttpError(404, 'Strategic KPI not found.');
  }
  return kpi;
};

const findInitiativeOrThrow = async (tenantId, initiativeId) => {
  const initiative = await StrategicInitiative.findOne({ tenantId, initiativeId });
  if (!initiative) {
    throw createHttpError(404, 'Strategic initiative not found.');
  }
  return initiative;
};

export const createPlan = async (tenantId, data, createdBy) => {
  const payload = buildPlanPayload(data);
  if (!payload.title) {
    throw createHttpError(400, 'Strategic plan title is required.');
  }

  return StrategicPlan.create({
    tenantId,
    planId: await generateSequence(StrategicPlan, tenantId, 'planId', 'STR'),
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
    StrategicPlan.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    StrategicPlan.countDocuments(filters),
  ]);

  return { plans, total, page, totalPages: Math.ceil(total / limit) || 1 };
};

export const getPlanById = async (tenantId, planId) => findPlanOrThrow(tenantId, planId);

export const updatePlan = async (tenantId, planId, data, updatedBy) => {
  const plan = await findPlanOrThrow(tenantId, planId);
  Object.assign(plan, buildPlanPayload(data), { updatedBy, updatedAt: new Date() });
  await plan.save();
  return plan;
};

export const createKpi = async (tenantId, data, createdBy) => {
  const payload = buildKpiPayload(data);
  if (!payload.title) {
    throw createHttpError(400, 'KPI title is required.');
  }

  return StrategicKPI.create({
    tenantId,
    kpiId: await generateSequence(StrategicKPI, tenantId, 'kpiId', 'KPI'),
    ...payload,
    createdBy,
    updatedBy: createdBy,
  });
};

export const getKpis = async (tenantId, query = {}) => {
  const filters = {
    tenantId,
    ...(query.planId ? { planId: normalizeString(query.planId) } : {}),
  };

  return StrategicKPI.find(filters).sort({ createdAt: -1 });
};

export const updateKpi = async (tenantId, kpiId, data, updatedBy) => {
  const kpi = await findKpiOrThrow(tenantId, kpiId);
  const payload = buildKpiPayload(data);
  if (Array.isArray(payload.measurements) && payload.measurements.length) {
    kpi.measurements = [...(kpi.measurements || []), ...payload.measurements];
    delete payload.measurements;
  }
  Object.assign(kpi, payload, { updatedBy, updatedAt: new Date() });
  await kpi.save();
  return kpi;
};

export const createInitiative = async (tenantId, data, createdBy) => {
  const payload = buildInitiativePayload(data);
  if (!payload.title) {
    throw createHttpError(400, 'Initiative title is required.');
  }

  return StrategicInitiative.create({
    tenantId,
    initiativeId: await generateSequence(StrategicInitiative, tenantId, 'initiativeId', 'INI'),
    ...payload,
    createdBy,
    updatedBy: createdBy,
  });
};

export const getInitiatives = async (tenantId, query = {}) => {
  const filters = {
    tenantId,
    ...(query.planId ? { planId: normalizeString(query.planId) } : {}),
    ...(query.status ? { status: normalizeString(query.status) } : {}),
  };

  return StrategicInitiative.find(filters).sort({ createdAt: -1 });
};

export const updateInitiative = async (tenantId, initiativeId, data, updatedBy) => {
  const initiative = await findInitiativeOrThrow(tenantId, initiativeId);
  Object.assign(initiative, buildInitiativePayload(data), { updatedBy, updatedAt: new Date() });
  await initiative.save();
  return initiative;
};

export const getBalancedScorecard = async (tenantId) => {
  const [plans, kpis, initiatives] = await Promise.all([
    StrategicPlan.find({ tenantId }),
    StrategicKPI.find({ tenantId }),
    StrategicInitiative.find({ tenantId }),
  ]);

  return {
    plans,
    summary: {
      totalPlans: plans.length,
      activePlans: plans.filter((item) => item.status === 'active').length,
      totalKpis: kpis.length,
      offTrackKpis: kpis.filter((item) => item.status === 'off_track').length,
      totalInitiatives: initiatives.length,
      blockedInitiatives: initiatives.filter((item) => item.status === 'blocked').length,
    },
    kpiStatusBreakdown: {
      onTrack: kpis.filter((item) => item.status === 'on_track').length,
      atRisk: kpis.filter((item) => item.status === 'at_risk').length,
      offTrack: kpis.filter((item) => item.status === 'off_track').length,
    },
  };
};

export const getStrategicOverview = async (tenantId) => {
  const [scorecard, initiatives] = await Promise.all([
    getBalancedScorecard(tenantId),
    StrategicInitiative.find({ tenantId }).sort({ dueDate: 1 }),
  ]);

  return {
    ...scorecard,
    upcomingDeadlines: initiatives.filter((item) => item.dueDate).slice(0, 10),
  };
};

export const getStrategicAcrossTenants = async (query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {
    ...(query.tenantId ? { tenantId: normalizeString(query.tenantId, { lowercase: true }) } : {}),
  };

  const [plans, total] = await Promise.all([
    StrategicPlan.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
    StrategicPlan.countDocuments(filters),
  ]);

  return {
    plans,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};
