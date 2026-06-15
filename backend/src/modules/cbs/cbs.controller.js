import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { normalizeString, requireTenantIdForSuperAdmin } from '../../utils/phase11Helpers.js';
import * as cbsService from './cbs.service.js';

const resolveTenantId = (req) => requireTenantIdForSuperAdmin(req);

export const createGroup = asyncHandler(async (req, res) => {
  const group = await cbsService.createGroup(resolveTenantId(req), req.body, req.user.userId);
  return success(res, group, 'CBS group created successfully.', 201);
});

export const getGroups = asyncHandler(async (req, res) => {
  const data = await cbsService.getGroups(resolveTenantId(req), req.query);
  return success(res, data, 'CBS groups fetched successfully.');
});

export const getCBSStats = asyncHandler(async (req, res) => {
  const data = await cbsService.getCBSStats(resolveTenantId(req));
  return success(res, data, 'CBS statistics fetched successfully.');
});

export const getGroupById = asyncHandler(async (req, res) => {
  const group = await cbsService.getGroupById(resolveTenantId(req), normalizeString(req.params.groupId));
  return success(res, group, 'CBS group fetched successfully.');
});

export const updateGroup = asyncHandler(async (req, res) => {
  const group = await cbsService.updateGroup(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
    req.body,
    req.user.userId,
  );
  return success(res, group, 'CBS group updated successfully.');
});

export const deactivateGroup = asyncHandler(async (req, res) => {
  const group = await cbsService.deactivateGroup(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
    req.user.userId,
  );
  return success(res, group, 'CBS group deactivated successfully.');
});

export const createProspect = asyncHandler(async (req, res) => {
  const prospect = await cbsService.createProspect(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
    req.body,
    req.user.userId,
  );
  return success(res, prospect, 'CBS prospect created successfully.', 201);
});

export const getGroupProspects = asyncHandler(async (req, res) => {
  const prospects = await cbsService.getGroupProspects(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
    req.query,
  );
  return success(res, prospects, 'CBS prospects fetched successfully.');
});

export const updateProspect = asyncHandler(async (req, res) => {
  const prospect = await cbsService.updateProspect(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
    normalizeString(req.params.prospectId),
    req.body,
    req.user.userId,
  );
  return success(res, prospect, 'CBS prospect updated successfully.');
});

export const convertProspectToMember = asyncHandler(async (req, res) => {
  const data = await cbsService.convertProspectToMember(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
    normalizeString(req.params.prospectId),
    req.user,
  );
  return success(res, data, 'CBS prospect converted to member successfully.');
});

export const createSession = asyncHandler(async (req, res) => {
  const session = await cbsService.createSession(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
    req.body,
    req.user.userId,
  );
  return success(res, session, 'CBS session created successfully.', 201);
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await cbsService.getSessions(resolveTenantId(req), normalizeString(req.params.groupId));
  return success(res, sessions, 'CBS sessions fetched successfully.');
});

export const getSessionById = asyncHandler(async (req, res) => {
  const session = await cbsService.getSessionById(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
    normalizeString(req.params.sessionId),
  );
  return success(res, session, 'CBS session fetched successfully.');
});

export const updateSession = asyncHandler(async (req, res) => {
  const session = await cbsService.updateSession(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
    normalizeString(req.params.sessionId),
    req.body,
  );
  return success(res, session, 'CBS session updated successfully.');
});

export const getCBSOverviewReport = asyncHandler(async (req, res) => {
  const data = await cbsService.getCBSOverviewReport(resolveTenantId(req));
  return success(res, data, 'CBS overview report fetched successfully.');
});

export const getCBSGroupReport = asyncHandler(async (req, res) => {
  const data = await cbsService.getCBSGroupReport(
    resolveTenantId(req),
    normalizeString(req.params.groupId),
  );
  return success(res, data, 'CBS group report fetched successfully.');
});

export const getGroupsAcrossTenants = asyncHandler(async (req, res) => {
  const data = await cbsService.getGroupsAcrossTenants(req.query);
  return success(res, data, 'Platform CBS groups fetched successfully.');
});
