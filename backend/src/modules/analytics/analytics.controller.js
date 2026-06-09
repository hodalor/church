import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import {
  analyticsActor,
  ensureAnalyticsCapability,
  resolveScopedTenantId,
} from './analytics.access.js';
import * as branchService from './branches.service.js';
import * as hqService from './hq.service.js';
import * as insightsService from './insights.service.js';
import * as platformService from './platform.service.js';
import * as snapshotsService from './snapshots.service.js';

const ensureSuperAdmin = (req) => {
  if (req.user?.role !== 'super_admin') {
    throw createHttpError(403, 'Super admin access is required for this action.');
  }
};

export const createBranch = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['branches.create']);
  const data = await branchService.createBranch(resolveScopedTenantId(req), req.body, analyticsActor(req));
  return success(res, data, 'Branch created successfully.', 201);
});

export const getAllBranches = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['branches.view']);
  const data = await branchService.getAllBranches(resolveScopedTenantId(req), req.query, analyticsActor(req));
  return success(res, data, 'Branches fetched successfully.');
});

export const getBranchById = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['branches.view']);
  const data = await branchService.getBranchById(
    resolveScopedTenantId(req),
    req.params.branchId,
    analyticsActor(req),
  );
  return success(res, data, 'Branch fetched successfully.');
});

export const updateBranch = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['branches.modify']);
  const data = await branchService.updateBranch(
    resolveScopedTenantId(req),
    req.params.branchId,
    req.body,
    analyticsActor(req),
  );
  return success(res, data, 'Branch updated successfully.');
});

export const deactivateBranch = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['branches.delete']);
  const data = await branchService.deactivateBranch(
    resolveScopedTenantId(req),
    req.params.branchId,
    analyticsActor(req),
  );
  return success(res, data, 'Branch deactivated successfully.');
});

export const getBranchMetrics = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['branches.view', 'branches.metrics.view']);
  const data = await branchService.getBranchMetrics(
    resolveScopedTenantId(req),
    req.params.branchId,
    analyticsActor(req),
  );
  return success(res, data, 'Branch metrics fetched successfully.');
});

export const getBranchSnapshot = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['branches.view', 'branches.snapshot.view', 'analytics.view']);
  const data = await branchService.getBranchSnapshot(
    resolveScopedTenantId(req),
    req.params.branchId,
    req.query,
    analyticsActor(req),
  );
  return success(res, data, 'Branch snapshot fetched successfully.');
});

export const refreshBranchCache = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['branches.modify', 'branches.metrics.refresh']);
  const data = await branchService.refreshBranchCacheById(
    resolveScopedTenantId(req),
    req.params.branchId,
    analyticsActor(req),
  );
  return success(res, data, 'Branch cache refreshed successfully.');
});

export const getHQOverview = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['hq.view', 'hq.overview.view']);
  const data = await hqService.getHQOverview(resolveScopedTenantId(req), analyticsActor(req));
  return success(res, data, 'HQ overview fetched successfully.');
});

export const getBranchComparison = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['hq.view', 'hq.comparison.view']);
  const data = await hqService.getBranchComparison(
    resolveScopedTenantId(req),
    req.query,
    analyticsActor(req),
  );
  return success(res, data, 'Branch comparison fetched successfully.');
});

export const getGrowthTrends = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['hq.view', 'hq.growth.view']);
  const data = await hqService.getGrowthTrends(
    resolveScopedTenantId(req),
    req.query,
    analyticsActor(req),
  );
  return success(res, data, 'Growth trends fetched successfully.');
});

export const getFinancialIntelligence = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['hq.view', 'hq.finance.view']);
  const data = await hqService.getFinancialIntelligence(
    resolveScopedTenantId(req),
    req.query,
    analyticsActor(req),
  );
  return success(res, data, 'Financial intelligence fetched successfully.');
});

export const getMemberIntelligence = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['hq.view', 'hq.members.view']);
  const data = await hqService.getMemberIntelligence(
    resolveScopedTenantId(req),
    analyticsActor(req),
    req.query,
  );
  return success(res, data, 'Member intelligence fetched successfully.');
});

export const getOperationalHealth = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['hq.view', 'hq.operations.view']);
  const data = await hqService.getOperationalHealth(
    resolveScopedTenantId(req),
    analyticsActor(req),
    req.query,
  );
  return success(res, data, 'Operational health fetched successfully.');
});

export const getConsolidatedReport = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['hq.view', 'hq.reports.view']);
  const data = await hqService.getConsolidatedReport(
    resolveScopedTenantId(req),
    req.query,
    analyticsActor(req),
  );
  return success(res, data, 'Consolidated report fetched successfully.');
});

export const getAllInsights = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['insights.view']);
  const data = await insightsService.getAllInsights(
    resolveScopedTenantId(req),
    req.query,
    analyticsActor(req),
  );
  return success(res, data, 'Insights fetched successfully.');
});

export const getCriticalInsights = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['insights.view', 'insights.critical.view']);
  const data = await insightsService.getCriticalInsights(
    resolveScopedTenantId(req),
    req.query,
    analyticsActor(req),
  );
  return success(res, data, 'Critical insights fetched successfully.');
});

export const markInsightRead = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['insights.modify', 'insights.management.modify']);
  const data = await insightsService.markInsightRead(
    resolveScopedTenantId(req),
    req.params.insightId,
    analyticsActor(req),
  );
  return success(res, data, 'Insight marked as read.');
});

export const markInsightActioned = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['insights.modify', 'insights.management.modify']);
  const data = await insightsService.markInsightActioned(
    resolveScopedTenantId(req),
    req.params.insightId,
    analyticsActor(req),
  );
  return success(res, data, 'Insight marked as actioned.');
});

export const generateInsights = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['insights.create']);
  const data = await insightsService.generateInsights(
    resolveScopedTenantId(req),
    req.body,
    analyticsActor(req),
  );
  return success(res, data, 'Insights generated successfully.');
});

export const getSnapshots = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['analytics.view', 'analytics.snapshots.view']);
  const data = await snapshotsService.getSnapshots(
    resolveScopedTenantId(req),
    req.query,
    analyticsActor(req),
  );
  return success(res, data, 'Analytics snapshots fetched successfully.');
});

export const comparePeriodsSnapshot = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['analytics.view', 'analytics.compare.view']);
  const data = await snapshotsService.comparePeriodsSnapshot(
    resolveScopedTenantId(req),
    req.query,
    analyticsActor(req),
  );
  return success(res, data, 'Analytics period comparison fetched successfully.');
});

export const generateSnapshot = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['analytics.create', 'analytics.snapshots.create']);
  const data = await snapshotsService.generateSnapshot(
    resolveScopedTenantId(req),
    req.body,
    analyticsActor(req),
  );
  return success(res, data, 'Analytics snapshot generated successfully.', 201);
});

export const getPlatformOverview = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await platformService.getPlatformOverview();
  return success(res, data, 'Platform overview fetched successfully.');
});

export const getPlatformGrowthTrends = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await platformService.getPlatformGrowthTrends(req.query);
  return success(res, data, 'Platform growth trends fetched successfully.');
});

export const getPlatformHealthScores = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await platformService.getPlatformHealthScores();
  return success(res, data, 'Platform health scores fetched successfully.');
});

export const getPlatformRevenue = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await platformService.getPlatformRevenue(req.query);
  return success(res, data, 'Platform revenue fetched successfully.');
});

export const getTenantComparison = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await platformService.getTenantComparison();
  return success(res, data, 'Tenant comparison fetched successfully.');
});
