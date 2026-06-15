import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { normalizeString, requireTenantIdForSuperAdmin } from '../../utils/phase11Helpers.js';
import * as auditService from './audit.service.js';

const resolveTenantId = (req) => requireTenantIdForSuperAdmin(req);

export const getAuditLogs = asyncHandler(async (req, res) => {
  const data = await auditService.getAuditLogs(resolveTenantId(req), req.query);
  return success(res, data, 'Audit logs fetched successfully.');
});

export const getSuspiciousActivity = asyncHandler(async (req, res) => {
  const data = await auditService.getSuspiciousActivity(resolveTenantId(req));
  return success(res, data, 'Suspicious activity fetched successfully.');
});

export const getUserAuditTrail = asyncHandler(async (req, res) => {
  const data = await auditService.getUserAuditTrail(
    resolveTenantId(req),
    normalizeString(req.params.userId),
    req.query,
  );
  return success(res, data, 'User audit trail fetched successfully.');
});

export const getModuleAuditTrail = asyncHandler(async (req, res) => {
  const data = await auditService.getModuleAuditTrail(
    resolveTenantId(req),
    normalizeString(req.params.module),
    req.query,
  );
  return success(res, data, 'Module audit trail fetched successfully.');
});

export const getEntityAuditTrail = asyncHandler(async (req, res) => {
  const data = await auditService.getEntityAuditTrail(
    resolveTenantId(req),
    normalizeString(req.params.entityType),
    normalizeString(req.params.entityId),
    req.query,
  );
  return success(res, data, 'Entity audit trail fetched successfully.');
});

export const getLoginHistory = asyncHandler(async (req, res) => {
  const data = await auditService.getLoginHistory(resolveTenantId(req), req.query);
  return success(res, data, 'Login history fetched successfully.');
});

export const getExportHistory = asyncHandler(async (req, res) => {
  const data = await auditService.getExportHistory(resolveTenantId(req), req.query);
  return success(res, data, 'Export history fetched successfully.');
});

export const getAllTenantsAuditSummary = asyncHandler(async (req, res) => {
  const data = await auditService.getAllTenantsAuditSummary(req.query);
  return success(res, data, 'Audit summary across tenants fetched successfully.');
});
