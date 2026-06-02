import asyncHandler from '../../utils/asyncHandler.js';
import * as tenantService from './service.js';
import { success } from '../../utils/apiResponse.js';

export const createTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.createTenant(req.body);
  return success(res, tenant, 'Tenant created successfully.', 201);
});

export const listTenants = asyncHandler(async (req, res) => {
  const tenants = await tenantService.listTenants(req.query);
  return success(res, tenants, 'Tenants fetched successfully.');
});

export const getTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.getTenantById(req.params.tenantId || req.tenantId);
  return success(res, tenant, 'Tenant fetched successfully.');
});

export const updateCurrentTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.updateTenant(req.tenantId, req.body);
  return success(res, tenant, 'Tenant settings updated successfully.');
});

export const updateTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.updateTenant(req.params.tenantId, req.body);
  return success(res, tenant, 'Tenant updated successfully.');
});

export const suspendTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.suspendTenant(req.params.tenantId, req.body.reason);
  return success(res, tenant, 'Tenant suspended successfully.');
});

export const activateTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.activateTenant(req.params.tenantId);
  return success(res, tenant, 'Tenant activated successfully.');
});

export const deleteTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.deleteTenant(req.params.tenantId);
  return success(res, tenant, 'Tenant deactivated successfully.');
});

export const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const analytics = await tenantService.getPlatformAnalytics();
  return success(res, analytics, 'Platform analytics fetched successfully.');
});
