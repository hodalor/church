import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { normalizeString, requireTenantIdForSuperAdmin } from '../../utils/phase11Helpers.js';
import * as strategicService from './strategic.service.js';

const resolveTenantId = (req) => requireTenantIdForSuperAdmin(req);

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await strategicService.createPlan(resolveTenantId(req), req.body, req.user.userId);
  return success(res, plan, 'Strategic plan created successfully.', 201);
});

export const getPlans = asyncHandler(async (req, res) => {
  const data = await strategicService.getPlans(resolveTenantId(req), req.query);
  return success(res, data, 'Strategic plans fetched successfully.');
});

export const getPlanById = asyncHandler(async (req, res) => {
  const plan = await strategicService.getPlanById(resolveTenantId(req), normalizeString(req.params.planId));
  return success(res, plan, 'Strategic plan fetched successfully.');
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await strategicService.updatePlan(
    resolveTenantId(req),
    normalizeString(req.params.planId),
    req.body,
    req.user.userId,
  );
  return success(res, plan, 'Strategic plan updated successfully.');
});

export const createKpi = asyncHandler(async (req, res) => {
  const kpi = await strategicService.createKpi(resolveTenantId(req), req.body, req.user.userId);
  return success(res, kpi, 'Strategic KPI created successfully.', 201);
});

export const getKpis = asyncHandler(async (req, res) => {
  const kpis = await strategicService.getKpis(resolveTenantId(req), req.query);
  return success(res, kpis, 'Strategic KPIs fetched successfully.');
});

export const updateKpi = asyncHandler(async (req, res) => {
  const kpi = await strategicService.updateKpi(
    resolveTenantId(req),
    normalizeString(req.params.kpiId),
    req.body,
    req.user.userId,
  );
  return success(res, kpi, 'Strategic KPI updated successfully.');
});

export const createInitiative = asyncHandler(async (req, res) => {
  const initiative = await strategicService.createInitiative(resolveTenantId(req), req.body, req.user.userId);
  return success(res, initiative, 'Strategic initiative created successfully.', 201);
});

export const getInitiatives = asyncHandler(async (req, res) => {
  const initiatives = await strategicService.getInitiatives(resolveTenantId(req), req.query);
  return success(res, initiatives, 'Strategic initiatives fetched successfully.');
});

export const updateInitiative = asyncHandler(async (req, res) => {
  const initiative = await strategicService.updateInitiative(
    resolveTenantId(req),
    normalizeString(req.params.initiativeId),
    req.body,
    req.user.userId,
  );
  return success(res, initiative, 'Strategic initiative updated successfully.');
});

export const getBalancedScorecard = asyncHandler(async (req, res) => {
  const data = await strategicService.getBalancedScorecard(resolveTenantId(req));
  return success(res, data, 'Balanced scorecard fetched successfully.');
});

export const getStrategicOverview = asyncHandler(async (req, res) => {
  const data = await strategicService.getStrategicOverview(resolveTenantId(req));
  return success(res, data, 'Strategic overview fetched successfully.');
});

export const getStrategicAcrossTenants = asyncHandler(async (req, res) => {
  const data = await strategicService.getStrategicAcrossTenants(req.query);
  return success(res, data, 'Platform strategic plans fetched successfully.');
});
