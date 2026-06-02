import asyncHandler from '../../utils/asyncHandler.js';
import * as userService from './service.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import { hasCapability, isCapabilitySubset, normalizeCapabilities } from '../access/capabilities.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId || req.body?.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for super admin user requests.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

const ensurePermission = (req, capability) => {
  if (req.user?.role === 'super_admin' || !Array.isArray(req.user?.capabilities)) {
    return;
  }

  if (!hasCapability(req.user.capabilities, capability)) {
    throw createHttpError(403, 'You do not have permission for this action.');
  }
};

export const listUsers = asyncHandler(async (req, res) => {
  ensurePermission(req, 'users.view');
  const users = await userService.listUsers(resolveScopedTenantId(req));
  return success(res, users, 'Users fetched successfully.');
});

export const createUser = asyncHandler(async (req, res) => {
  ensurePermission(req, 'users.create');

  const requestedCapabilities = normalizeCapabilities(req.body.capabilities);
  if (
    req.user?.role !== 'super_admin' &&
    Array.isArray(req.user?.capabilities) &&
    !isCapabilitySubset(requestedCapabilities, req.user.capabilities)
  ) {
    throw createHttpError(
      403,
      'You can only assign capabilities that exist within your own access scope.',
    );
  }

  const user = await userService.createUser({
    tenantId: resolveScopedTenantId(req),
    username: req.body.username,
    pin: req.body.pin,
    role: req.body.role,
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    allBranches: req.body.allBranches,
    assignedBranches: req.body.assignedBranches,
    memberId: req.body.memberId,
    photoUrl: req.body.photoUrl,
    capabilities: requestedCapabilities,
  });
  return success(res, user, 'User created successfully.', 201);
});
