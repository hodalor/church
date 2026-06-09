import {
  addMonths,
  getDateRangeForPeriod,
  round,
  Tenant,
} from './analytics.helpers.js';
import { getScopedMetricsBundle } from './analytics.access.js';
import BranchProfile from './models/branchProfile.model.js';
import AiInsight from './models/aiInsight.model.js';
import { getBranchComparison } from './hq.service.js';

const normalizeInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getMonthLabel = (date) =>
  date.toLocaleString('en-US', { month: 'short' });

const listPlatformTenants = async () =>
  Tenant.find({
    isActive: true,
  })
    .select('tenantId churchName country subscriptionPlan createdAt')
    .lean();

const getTenantSnapshot = async (tenantId, date = new Date()) => {
  const range = getDateRangeForPeriod({ period: 'monthly', date });
  const metrics = await getScopedMetricsBundle({
    tenantId,
    actor: {},
    start: range.start,
    end: range.end,
  });
  const branches = await BranchProfile.find({
    tenantId,
    isActive: true,
  })
    .select('cachedMetrics')
    .lean();
  const avgHealth = branches.length
    ? round(
        branches.reduce((sum, item) => sum + Number(item.cachedMetrics?.healthScore || 0), 0) /
          branches.length,
        1,
      )
    : 0;

  return {
    range,
    metrics,
    branchCount: branches.length,
    avgHealth,
  };
};

export const getPlatformOverview = async () => {
  const tenants = await listPlatformTenants();
  const snapshots = await Promise.all(tenants.map((tenant) => getTenantSnapshot(tenant.tenantId)));
  const criticalInsights = await AiInsight.countDocuments({ severity: 'critical' });

  const totals = snapshots.reduce(
    (sum, snapshot) => ({
      members: sum.members + Number(snapshot.metrics.members.total || 0),
      income: sum.income + Number(snapshot.metrics.finance.totalIncome || 0),
      attendance: sum.attendance + Number(snapshot.metrics.attendance.totalHeadcount || 0),
      branches: sum.branches + Number(snapshot.branchCount || 0),
    }),
    { members: 0, income: 0, attendance: 0, branches: 0 },
  );

  const topTenantIndex = snapshots.reduce(
    (bestIndex, snapshot, index, array) =>
      snapshot.avgHealth > Number(array[bestIndex]?.avgHealth || 0) ? index : bestIndex,
    0,
  );

  return {
    summary: {
      totalTenants: tenants.length,
      totalMembers: totals.members,
      totalBranches: totals.branches,
      totalIncome: round(totals.income, 2),
      totalAttendance: totals.attendance,
      criticalInsights,
    },
    topTenant: tenants[topTenantIndex]
      ? {
          tenantId: tenants[topTenantIndex].tenantId,
          churchName: tenants[topTenantIndex].churchName,
          healthScore: snapshots[topTenantIndex].avgHealth,
        }
      : null,
    tenants: tenants.map((tenant, index) => ({
      tenantId: tenant.tenantId,
      churchName: tenant.churchName,
      branches: snapshots[index].branchCount,
      members: snapshots[index].metrics.members.total,
      income: snapshots[index].metrics.finance.totalIncome,
      healthScore: snapshots[index].avgHealth,
    })),
  };
};

export const getPlatformGrowthTrends = async (query = {}) => {
  const months = Math.max(Math.min(normalizeInteger(query.months, 12), 24), 3);
  const tenants = await listPlatformTenants();
  const items = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = addMonths(new Date(), -index);
    const snapshots = await Promise.all(tenants.map((tenant) => getTenantSnapshot(tenant.tenantId, date)));
    items.push({
      month: getMonthLabel(date),
      year: date.getFullYear(),
      tenants: tenants.length,
      members: snapshots.reduce((sum, item) => sum + Number(item.metrics.members.total || 0), 0),
      attendance: snapshots.reduce(
        (sum, item) => sum + Number(item.metrics.attendance.totalHeadcount || 0),
        0,
      ),
      income: round(
        snapshots.reduce((sum, item) => sum + Number(item.metrics.finance.totalIncome || 0), 0),
        2,
      ),
    });
  }

  return {
    items,
  };
};

export const getPlatformHealthScores = async () => {
  const tenants = await listPlatformTenants();
  const rows = await Promise.all(
    tenants.map(async (tenant) => {
      const snapshot = await getTenantSnapshot(tenant.tenantId);
      return {
        tenantId: tenant.tenantId,
        churchName: tenant.churchName,
        healthScore: snapshot.avgHealth,
        members: snapshot.metrics.members.total,
        branches: snapshot.branchCount,
      };
    }),
  );

  return {
    items: rows.sort((left, right) => right.healthScore - left.healthScore),
  };
};

export const getPlatformRevenue = async (query = {}) => {
  const year = normalizeInteger(query.year, new Date().getFullYear());
  const tenants = await listPlatformTenants();
  const monthly = [];

  for (let month = 0; month < 12; month += 1) {
    const date = new Date(year, month, 1);
    const snapshots = await Promise.all(tenants.map((tenant) => getTenantSnapshot(tenant.tenantId, date)));
    monthly.push({
      month: getMonthLabel(date),
      year,
      income: round(
        snapshots.reduce((sum, item) => sum + Number(item.metrics.finance.totalIncome || 0), 0),
        2,
      ),
      expenses: round(
        snapshots.reduce((sum, item) => sum + Number(item.metrics.finance.totalExpenses || 0), 0),
        2,
      ),
    });
  }

  const byTenant = await Promise.all(
    tenants.map(async (tenant) => {
      const snapshot = await getTenantSnapshot(tenant.tenantId, new Date(year, new Date().getMonth(), 1));
      return {
        tenantId: tenant.tenantId,
        churchName: tenant.churchName,
        income: snapshot.metrics.finance.totalIncome,
        expenses: snapshot.metrics.finance.totalExpenses,
        net: snapshot.metrics.finance.netBalance,
      };
    }),
  );

  return {
    monthly,
    byTenant: byTenant.sort((left, right) => right.income - left.income),
  };
};

export const getTenantComparison = async () => {
  const tenants = await listPlatformTenants();
  const items = await Promise.all(
    tenants.map(async (tenant) => {
      const snapshot = await getTenantSnapshot(tenant.tenantId);
      const branches = await getBranchComparison(tenant.tenantId, {}, {});
      return {
        tenantId: tenant.tenantId,
        churchName: tenant.churchName,
        members: snapshot.metrics.members.total,
        activeMembers: snapshot.metrics.members.active,
        branches: snapshot.branchCount,
        attendance: snapshot.metrics.attendance.totalHeadcount,
        income: snapshot.metrics.finance.totalIncome,
        conversionRate: snapshot.metrics.visitors.conversionRate,
        healthScore: snapshot.avgHealth,
        topBranch: branches.items[0]?.branchName || null,
      };
    }),
  );

  return {
    items: items.sort((left, right) => right.healthScore - left.healthScore),
  };
};
