import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import { hasCapability } from '../access/capabilities.js';
import {
  ensureBranchAccess,
  ensureDocumentBranchAccess,
  scopeBranchQuery,
} from '../../utils/branchScope.js';
import * as visitorsService from './visitors.service.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId ||
      req.body?.tenantId ||
      req.headers['x-tenant-id'] ||
      req.params?.tenantId;

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for super admin visitor requests.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

const ensureVisitorsCapability = (req, capability) => {
  if (req.user?.role === 'super_admin') {
    return;
  }

  if (!hasCapability(req.user?.capabilities || [], capability)) {
    throw createHttpError(403, 'You do not have permission for this visitor action.');
  }
};

const ensureSuperAdmin = (req) => {
  if (req.user?.role !== 'super_admin') {
    throw createHttpError(403, 'Super admin access is required for this visitor action.');
  }
};

const visitorActor = (req) => ({
  userId: req.user?.userId,
  role: req.user?.role,
  name: req.user?.fullName || req.user?.username || req.user?.role,
});

const ensureVisitorBranchAccess = async (req, visitorId) => {
  const visitor = await visitorsService.getVisitorById(resolveScopedTenantId(req), visitorId);
  ensureDocumentBranchAccess(req.user, visitor.branch, 'You do not have access to this visitor branch.');
};

export const getVisitorAssignableLeaders = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const data = await visitorsService.getVisitorAssignableLeaders(resolveScopedTenantId(req));
  return success(res, data, 'Visitor care leaders fetched successfully.');
});

export const searchVisitors = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const data = await visitorsService.searchVisitors(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Visitor search completed successfully.');
});

export const checkVisitorDuplicateByPhone = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const data = await visitorsService.checkVisitorDuplicateByPhone(
    resolveScopedTenantId(req),
    req.query.phone,
  );
  return success(res, data, 'Visitor duplicate check completed successfully.');
});

export const registerVisitor = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.create');
  ensureBranchAccess(req.user, req.body.branch, 'You do not have access to register visitors for this branch.');
  const data = await visitorsService.registerVisitor(resolveScopedTenantId(req), req.body, visitorActor(req));
  return success(res, data, 'Visitor registered successfully.', 201);
});

export const getVisitors = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const data = await visitorsService.getVisitors(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Visitors fetched successfully.');
});

export const getVisitorById = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const visitor = await visitorsService.getVisitorById(resolveScopedTenantId(req), req.params.visitorId);
  ensureDocumentBranchAccess(req.user, visitor.branch, 'You do not have access to this visitor branch.');
  return success(res, visitor, 'Visitor fetched successfully.');
});

export const updateVisitorStage = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.modify');
  await ensureVisitorBranchAccess(req, req.params.visitorId);
  const visitor = await visitorsService.updateVisitorStage(
    resolveScopedTenantId(req),
    req.params.visitorId,
    req.body.stage,
    req.body.note,
    visitorActor(req),
  );
  return success(res, visitor, 'Visitor stage updated successfully.');
});

export const assignVisitorsToCareLeader = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.modify');
  const data = await visitorsService.assignVisitorsToCareLeader(
    resolveScopedTenantId(req),
    req.body.visitorIds,
    req.body.leaderId,
    visitorActor(req),
  );
  return success(res, data, 'Visitors assigned successfully.');
});

export const recordVisitorReturnVisit = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.modify');
  await ensureVisitorBranchAccess(req, req.params.visitorId);
  const visitor = await visitorsService.recordVisitorReturnVisit(
    resolveScopedTenantId(req),
    req.params.visitorId,
    req.body,
    visitorActor(req),
  );
  return success(res, visitor, 'Return visit recorded successfully.');
});

export const createVisitorFollowUp = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.modify');
  await ensureVisitorBranchAccess(req, req.params.visitorId);
  const visitor = await visitorsService.createVisitorFollowUp(
    resolveScopedTenantId(req),
    req.params.visitorId,
    req.body,
    visitorActor(req),
  );
  return success(res, visitor, 'Visitor follow-up created successfully.');
});

export const completeVisitorFollowUp = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.modify');
  await ensureVisitorBranchAccess(req, req.params.visitorId);
  const visitor = await visitorsService.completeVisitorFollowUp(
    resolveScopedTenantId(req),
    req.params.visitorId,
    req.params.followUpId,
    req.body,
    visitorActor(req),
  );
  return success(res, visitor, 'Visitor follow-up completed successfully.');
});

export const rescheduleVisitorFollowUp = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.modify');
  await ensureVisitorBranchAccess(req, req.params.visitorId);
  const visitor = await visitorsService.rescheduleVisitorFollowUp(
    resolveScopedTenantId(req),
    req.params.visitorId,
    req.params.followUpId,
    req.body,
    visitorActor(req),
  );
  return success(res, visitor, 'Visitor follow-up rescheduled successfully.');
});

export const convertVisitorToMember = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.modify');
  await ensureVisitorBranchAccess(req, req.params.visitorId);
  const visitor = await visitorsService.convertVisitorToMember(
    resolveScopedTenantId(req),
    req.params.visitorId,
    req.body,
    visitorActor(req),
  );
  return success(res, visitor, 'Visitor converted to member successfully.');
});

export const getVisitorPipeline = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const data = await visitorsService.getVisitorPipeline(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Visitor pipeline fetched successfully.');
});

export const getVisitorFollowUps = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const data = await visitorsService.getVisitorFollowUps(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Visitor follow-ups fetched successfully.');
});

export const getVisitorWorkflow = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const data = await visitorsService.getVisitorWorkflow(resolveScopedTenantId(req));
  return success(res, data, 'Visitor workflow fetched successfully.');
});

export const saveVisitorWorkflow = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.modify');
  const data = await visitorsService.saveVisitorWorkflow(
    resolveScopedTenantId(req),
    req.body,
    visitorActor(req),
  );
  return success(res, data, 'Visitor workflow saved successfully.');
});

export const testVisitorWorkflow = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const data = await visitorsService.testVisitorWorkflow(resolveScopedTenantId(req), req.body);
  return success(res, data, 'Visitor workflow dry run completed successfully.');
});

export const getVisitorReports = asyncHandler(async (req, res) => {
  ensureVisitorsCapability(req, 'visitors.view');
  const data = await visitorsService.getVisitorReports(resolveScopedTenantId(req));
  return success(res, data, 'Visitor reports fetched successfully.');
});

export const getPlatformVisitorOverview = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await visitorsService.getPlatformVisitorOverview();
  return success(res, data, 'Platform visitor overview fetched successfully.');
});
