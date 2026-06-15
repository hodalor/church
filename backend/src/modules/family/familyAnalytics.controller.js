import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { requireTenantIdForSuperAdmin } from '../../utils/phase11Helpers.js';
import * as familyAnalyticsService from './familyAnalytics.service.js';

const resolveTenantId = (req) => requireTenantIdForSuperAdmin(req);

export const getFamilyOverview = asyncHandler(async (req, res) => {
  const data = await familyAnalyticsService.getFamilyOverview(resolveTenantId(req));
  return success(res, data, 'Family overview fetched successfully.');
});

export const getFamilySegments = asyncHandler(async (req, res) => {
  const data = await familyAnalyticsService.getFamilySegments(resolveTenantId(req));
  return success(res, data, 'Family segments fetched successfully.');
});

export const getAtRiskFamilies = asyncHandler(async (req, res) => {
  const data = await familyAnalyticsService.getAtRiskFamilies(resolveTenantId(req));
  return success(res, data, 'At-risk families fetched successfully.');
});
