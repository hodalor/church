import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import * as memberService from './member.service.js';
import { createHttpError } from '../../utils/httpError.js';
import { ensureBranchAccess, scopeBranchQuery } from '../../utils/branchScope.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query.tenantId || req.body?.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for super admin member requests.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

export const createMember = asyncHandler(async (req, res) => {
  ensureBranchAccess(req.user, req.body.branch, 'You do not have access to create members in this branch.');
  const member = await memberService.createMember(
    resolveScopedTenantId(req),
    req.body,
    req.user.userId,
  );
  return success(res, member, 'Member created successfully.', 201);
});

export const getAllMembers = asyncHandler(async (req, res) => {
  const data = await memberService.getAllMembers(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Members fetched successfully.');
});

export const searchMembers = asyncHandler(async (req, res) => {
  const data = await memberService.searchMembers(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Members search completed successfully.');
});

export const getMemberStats = asyncHandler(async (req, res) => {
  const data = await memberService.getMemberStats(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Member statistics fetched successfully.');
});

export const getMembersByHealthStatus = asyncHandler(async (req, res) => {
  const data = await memberService.getMembersByHealthStatus(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Health score list fetched successfully.');
});

export const getMemberById = asyncHandler(async (req, res) => {
  const member = await memberService.getMemberById(
    resolveScopedTenantId(req),
    req.params.memberId,
    req.user,
  );
  return success(res, member, 'Member fetched successfully.');
});

export const updateMember = asyncHandler(async (req, res) => {
  const member = await memberService.updateMember(
    resolveScopedTenantId(req),
    req.params.memberId,
    req.body,
    req.user.userId,
    req.user,
  );
  return success(res, member, 'Member updated successfully.');
});

export const updateMemberPhoto = asyncHandler(async (req, res) => {
  const member = await memberService.updateMemberPhoto(
    resolveScopedTenantId(req),
    req.params.memberId,
    req.body.photoUrl,
    req.user.userId,
    req.user,
  );
  return success(res, member, 'Member photo updated successfully.');
});

export const recalculateHealthScore = asyncHandler(async (req, res) => {
  const healthScore = await memberService.recalculateHealthScore(
    resolveScopedTenantId(req),
    req.params.memberId,
    req.user,
  );
  return success(res, healthScore, 'Member health score recalculated successfully.');
});

export const softDeleteMember = asyncHandler(async (req, res) => {
  const member = await memberService.softDeleteMember(
    resolveScopedTenantId(req),
    req.params.memberId,
    req.user.userId,
    req.user,
  );
  return success(res, member, 'Member deleted successfully.');
});

export const restoreMember = asyncHandler(async (req, res) => {
  const member = await memberService.restoreMember(
    resolveScopedTenantId(req),
    req.params.memberId,
    req.user.userId,
    req.user,
  );
  return success(res, member, 'Member restored successfully.');
});

export const getMemberQrCode = asyncHandler(async (req, res) => {
  const qrCode = await memberService.getMemberQrCode(
    resolveScopedTenantId(req),
    req.params.memberId,
  );
  return success(res, { memberId: req.params.memberId, qrCode }, 'Member QR code fetched successfully.');
});

export const bulkImportMembers = asyncHandler(async (req, res) => {
  const result = await memberService.bulkImportMembers(
    resolveScopedTenantId(req),
    req.body,
    req.user.userId,
  );
  return success(res, result, 'Bulk import completed successfully.');
});

export const exportMembers = asyncHandler(async (req, res) => {
  const members = await memberService.exportMembers(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, members, 'Members export prepared successfully.');
});

export const getFamilyGroup = asyncHandler(async (req, res) => {
  const data = await memberService.getFamilyGroup(
    resolveScopedTenantId(req),
    req.params.familyGroupId,
  );
  return success(res, data, 'Family group fetched successfully.');
});
