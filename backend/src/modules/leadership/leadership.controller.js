import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { normalizeString, requireTenantIdForSuperAdmin } from '../../utils/phase11Helpers.js';
import * as leadershipService from './leadership.service.js';

const resolveTenantId = (req) => requireTenantIdForSuperAdmin(req);

export const createCandidate = asyncHandler(async (req, res) => {
  const candidate = await leadershipService.createCandidate(resolveTenantId(req), req.body, req.user.userId);
  return success(res, candidate, 'Leadership candidate created successfully.', 201);
});

export const getCandidates = asyncHandler(async (req, res) => {
  const data = await leadershipService.getCandidates(resolveTenantId(req), req.query);
  return success(res, data, 'Leadership candidates fetched successfully.');
});

export const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await leadershipService.getCandidateById(resolveTenantId(req), normalizeString(req.params.candidateId));
  return success(res, candidate, 'Leadership candidate fetched successfully.');
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await leadershipService.updateCandidate(
    resolveTenantId(req),
    normalizeString(req.params.candidateId),
    req.body,
    req.user.userId,
  );
  return success(res, candidate, 'Leadership candidate updated successfully.');
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await leadershipService.createPlan(resolveTenantId(req), req.body, req.user.userId);
  return success(res, plan, 'Succession plan created successfully.', 201);
});

export const getPlans = asyncHandler(async (req, res) => {
  const data = await leadershipService.getPlans(resolveTenantId(req), req.query);
  return success(res, data, 'Succession plans fetched successfully.');
});

export const getPlanById = asyncHandler(async (req, res) => {
  const plan = await leadershipService.getPlanById(resolveTenantId(req), normalizeString(req.params.planId));
  return success(res, plan, 'Succession plan fetched successfully.');
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await leadershipService.updatePlan(
    resolveTenantId(req),
    normalizeString(req.params.planId),
    req.body,
    req.user.userId,
  );
  return success(res, plan, 'Succession plan updated successfully.');
});

export const getLeadershipStats = asyncHandler(async (req, res) => {
  const data = await leadershipService.getLeadershipStats(resolveTenantId(req));
  return success(res, data, 'Leadership statistics fetched successfully.');
});

export const getLeadershipOverview = asyncHandler(async (req, res) => {
  const data = await leadershipService.getLeadershipOverview(resolveTenantId(req));
  return success(res, data, 'Leadership overview fetched successfully.');
});

export const getLeadershipAcrossTenants = asyncHandler(async (req, res) => {
  const data = await leadershipService.getLeadershipAcrossTenants(req.query);
  return success(res, data, 'Platform leadership data fetched successfully.');
});
