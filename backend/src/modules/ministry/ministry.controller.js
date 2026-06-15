import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { normalizeString, requireTenantIdForSuperAdmin } from '../../utils/phase11Helpers.js';
import * as ministryService from './ministry.service.js';

const resolveTenantId = (req) => requireTenantIdForSuperAdmin(req);

export const createMinistry = asyncHandler(async (req, res) => {
  const ministry = await ministryService.createMinistry(resolveTenantId(req), req.body, req.user.userId);
  return success(res, ministry, 'Ministry created successfully.', 201);
});

export const getAllMinistries = asyncHandler(async (req, res) => {
  const data = await ministryService.getAllMinistries(resolveTenantId(req), req.query);
  return success(res, data, 'Ministries fetched successfully.');
});

export const getMinistryStats = asyncHandler(async (req, res) => {
  const data = await ministryService.getMinistryStats(resolveTenantId(req));
  return success(res, data, 'Ministry statistics fetched successfully.');
});

export const getMinistryById = asyncHandler(async (req, res) => {
  const ministry = await ministryService.getMinistryById(resolveTenantId(req), normalizeString(req.params.ministryId));
  return success(res, ministry, 'Ministry fetched successfully.');
});

export const updateMinistry = asyncHandler(async (req, res) => {
  const ministry = await ministryService.updateMinistry(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    req.body,
    req.user.userId,
  );
  return success(res, ministry, 'Ministry updated successfully.');
});

export const deactivateMinistry = asyncHandler(async (req, res) => {
  const ministry = await ministryService.deactivateMinistry(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    req.user.userId,
  );
  return success(res, ministry, 'Ministry deactivated successfully.');
});

export const addMemberToMinistry = asyncHandler(async (req, res) => {
  const membership = await ministryService.addMemberToMinistry(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    normalizeString(req.body.memberId),
    req.body.role,
    req.user.userId,
    req.body.notes,
  );
  return success(res, membership, 'Member added to ministry successfully.', 201);
});

export const getMinistryMembers = asyncHandler(async (req, res) => {
  const memberships = await ministryService.getMinistryMembers(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    req.query,
  );
  return success(res, memberships, 'Ministry members fetched successfully.');
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const membership = await ministryService.updateMemberRole(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    normalizeString(req.params.memberId),
    req.body,
    req.user.userId,
  );
  return success(res, membership, 'Ministry member updated successfully.');
});

export const removeMemberFromMinistry = asyncHandler(async (req, res) => {
  const membership = await ministryService.removeMemberFromMinistry(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    normalizeString(req.params.memberId),
  );
  return success(res, membership, 'Member removed from ministry successfully.');
});

export const bulkAddMembers = asyncHandler(async (req, res) => {
  const data = await ministryService.bulkAddMembers(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    req.body.members || req.body,
    req.user.userId,
  );
  return success(res, data, 'Bulk ministry member import completed successfully.');
});

export const getMemberMinistries = asyncHandler(async (req, res) => {
  const ministries = await ministryService.getMemberMinistries(
    resolveTenantId(req),
    normalizeString(req.params.memberId),
  );
  return success(res, ministries, 'Member ministries fetched successfully.');
});

export const createMeeting = asyncHandler(async (req, res) => {
  const meeting = await ministryService.createMeeting(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    req.body,
    req.user.userId,
  );
  return success(res, meeting, 'Ministry meeting created successfully.', 201);
});

export const getMinistryMeetings = asyncHandler(async (req, res) => {
  const meetings = await ministryService.getMinistryMeetings(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    req.query,
  );
  return success(res, meetings, 'Ministry meetings fetched successfully.');
});

export const getMeetingById = asyncHandler(async (req, res) => {
  const meeting = await ministryService.getMeetingById(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    normalizeString(req.params.meetingId),
  );
  return success(res, meeting, 'Meeting fetched successfully.');
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await ministryService.updateMeeting(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    normalizeString(req.params.meetingId),
    req.body,
  );
  return success(res, meeting, 'Meeting updated successfully.');
});

export const recordMeetingAttendance = asyncHandler(async (req, res) => {
  const meeting = await ministryService.recordMeetingAttendance(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
    normalizeString(req.params.meetingId),
    req.body.attendeeIds || [],
    req.user,
  );
  return success(res, meeting, 'Meeting attendance recorded successfully.');
});

export const getMinistryOverviewReport = asyncHandler(async (req, res) => {
  const data = await ministryService.getMinistryOverviewReport(resolveTenantId(req));
  return success(res, data, 'Ministry overview report fetched successfully.');
});

export const getMinistryReport = asyncHandler(async (req, res) => {
  const data = await ministryService.getMinistryReport(
    resolveTenantId(req),
    normalizeString(req.params.ministryId),
  );
  return success(res, data, 'Ministry report fetched successfully.');
});

export const getAllMinistriesAcrossTenants = asyncHandler(async (req, res) => {
  const data = await ministryService.getAllMinistriesAcrossTenants(req.query);
  return success(res, data, 'Platform ministries fetched successfully.');
});
