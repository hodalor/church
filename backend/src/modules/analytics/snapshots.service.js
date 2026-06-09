import { createHttpError } from '../../utils/httpError.js';
import AnalyticsSnapshot from './models/analyticsSnapshot.model.js';
import {
  buildGrowthMetric,
  getDateRangeForPeriod,
  getPreviousRange,
} from './analytics.helpers.js';
import {
  getScopedMetricsBundle,
  resolveAllowedBranchContext,
  resolveBranchProfileById,
} from './analytics.access.js';

const normalizeTenantId = (value) => String(value || '').trim().toLowerCase();

const buildSnapshotPayload = async ({
  tenantId,
  actor = {},
  period,
  snapshotDate,
  branchId,
  branchName,
}) => {
  const { start, end } = getDateRangeForPeriod({
    period,
    date: snapshotDate,
  });

  const metrics = await getScopedMetricsBundle({
    tenantId,
    actor,
    branchId,
    branch: branchName,
    start,
    end,
  });

  return {
    tenantId,
    branchId: branchId || null,
    snapshotDate: start,
    period,
    ...metrics,
  };
};

const compareSections = (current = {}, previous = {}) => {
  const next = {};

  Object.keys(current).forEach((key) => {
    const currentValue = current[key];
    const previousValue = previous[key];

    if (typeof currentValue === 'number') {
      next[key] = {
        current: currentValue,
        previous: Number(previousValue || 0),
        ...buildGrowthMetric(currentValue, previousValue),
      };
      return;
    }

    if (currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)) {
      next[key] = compareSections(currentValue, previousValue || {});
    }
  });

  return next;
};

export const generateSnapshot = async (tenantId, payload = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const period = String(payload.period || 'monthly').trim();
  const snapshotDate = payload.snapshotDate ? new Date(payload.snapshotDate) : new Date();
  let branchId = null;
  let branchName;

  if (payload.branchId) {
    const profile = await resolveBranchProfileById({
      tenantId: normalizedTenantId,
      branchId: payload.branchId,
      actor,
    });
    branchId = profile.branchId;
    branchName = profile.branchName;
  }

  const snapshotPayload = await buildSnapshotPayload({
    tenantId: normalizedTenantId,
    actor,
    period,
    snapshotDate,
    branchId,
    branchName,
  });

  await AnalyticsSnapshot.findOneAndUpdate(
    {
      tenantId: snapshotPayload.tenantId,
      branchId: snapshotPayload.branchId,
      period: snapshotPayload.period,
      snapshotDate: snapshotPayload.snapshotDate,
    },
    { $set: snapshotPayload },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return snapshotPayload;
};

export const getSnapshots = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const period = query.period ? String(query.period).trim() : undefined;
  const filters = {
    tenantId: normalizedTenantId,
    ...(period ? { period } : {}),
  };

  if (query.from || query.to) {
    filters.snapshotDate = {
      ...(query.from ? { $gte: new Date(query.from) } : {}),
      ...(query.to ? { $lte: new Date(query.to) } : {}),
    };
  }

  if (query.branchId) {
    const profile = await resolveBranchProfileById({
      tenantId: normalizedTenantId,
      branchId: query.branchId,
      actor,
    });
    filters.branchId = profile.branchId;
  } else {
    const context = await resolveAllowedBranchContext({ tenantId: normalizedTenantId, actor });
    if (context.branchNames.length && context.branchNames.length !== context.allBranchNames.length) {
      filters.branchId = {
        $in: context.branchNames.map((name) => context.branchIdByName.get(name)).filter(Boolean),
      };
    }
  }

  const items = await AnalyticsSnapshot.find(filters)
    .sort({ snapshotDate: -1, createdAt: -1 })
    .limit(Math.min(Number(query.limit) || 24, 100))
    .lean();

  return {
    items,
    total: items.length,
  };
};

export const comparePeriodsSnapshot = async (tenantId, query = {}, actor = {}) => {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const period = String(query.period || 'monthly').trim();
  const date = query.date ? new Date(query.date) : new Date();
  const currentRange = getDateRangeForPeriod({ period, date });
  const previousRange = getPreviousRange(currentRange);

  let branchId = null;
  let branchName;
  if (query.branchId) {
    const profile = await resolveBranchProfileById({
      tenantId: normalizedTenantId,
      branchId: query.branchId,
      actor,
    });
    branchId = profile.branchId;
    branchName = profile.branchName;
  }

  const currentSnapshot =
    (await AnalyticsSnapshot.findOne({
      tenantId: normalizedTenantId,
      branchId,
      period,
      snapshotDate: currentRange.start,
    }).lean()) ||
    (await buildSnapshotPayload({
      tenantId: normalizedTenantId,
      actor,
      period,
      snapshotDate: currentRange.start,
      branchId,
      branchName,
    }));

  const previousSnapshot =
    (await AnalyticsSnapshot.findOne({
      tenantId: normalizedTenantId,
      branchId,
      period,
      snapshotDate: previousRange.start,
    }).lean()) ||
    (await buildSnapshotPayload({
      tenantId: normalizedTenantId,
      actor,
      period,
      snapshotDate: previousRange.start,
      branchId,
      branchName,
    }));

  if (!currentSnapshot) {
    throw createHttpError(404, 'Current snapshot could not be generated.');
  }

  return {
    period,
    current: currentSnapshot,
    previous: previousSnapshot,
    comparison: compareSections(currentSnapshot, previousSnapshot || {}),
  };
};
