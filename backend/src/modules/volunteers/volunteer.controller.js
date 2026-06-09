import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import { hasAnyCapability } from '../access/capabilities.js';
import { scopeBranchQuery } from '../../utils/branchScope.js';
import * as volunteerService from './volunteer.service.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId ||
      req.body?.tenantId ||
      req.headers['x-tenant-id'] ||
      req.params?.tenantId;

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for super admin volunteer requests.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

const ensureVolunteerCapability = (req, capabilityOptions) => {
  if (req.user?.role === 'super_admin') {
    return;
  }

  const requiredCapabilities = Array.isArray(capabilityOptions)
    ? capabilityOptions
    : [capabilityOptions];

  if (!hasAnyCapability(req.user?.capabilities || [], requiredCapabilities)) {
    throw createHttpError(403, 'You do not have permission for this volunteer action.');
  }
};

const ensureSuperAdmin = (req) => {
  if (req.user?.role !== 'super_admin') {
    throw createHttpError(403, 'Super admin access is required for this volunteer action.');
  }
};

const volunteerActor = (req) => ({
  userId: req.user?.userId,
  role: req.user?.role,
  name: req.user?.fullName || req.user?.username || req.user?.role,
  allBranches: req.user?.allBranches,
  assignedBranches: req.user?.assignedBranches,
});

export const registerVolunteer = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.create', 'volunteers.overview.create']);
  const data = await volunteerService.registerVolunteer(
    resolveScopedTenantId(req),
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Volunteer registered successfully.', 201);
});

export const getAllVolunteers = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.view', 'volunteers.overview.view']);
  const data = await volunteerService.getAllVolunteers(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
    volunteerActor(req),
  );
  return success(res, data, 'Volunteers fetched successfully.');
});

export const getVolunteerStats = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.view', 'volunteers.reports.view']);
  const data = await volunteerService.getVolunteerStats(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
    volunteerActor(req),
  );
  return success(res, data, 'Volunteer statistics fetched successfully.');
});

export const getAvailableVolunteers = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.view', 'volunteers.rosters.view']);
  const data = await volunteerService.getAvailableVolunteers(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
    volunteerActor(req),
  );
  return success(res, data, 'Available volunteers fetched successfully.');
});

export const getVolunteerById = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.view', 'volunteers.overview.view']);
  const data = await volunteerService.getVolunteerById(
    resolveScopedTenantId(req),
    req.params.volunteerId,
    volunteerActor(req),
  );
  return success(res, data, 'Volunteer fetched successfully.');
});

export const getVolunteerByMemberId = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.view', 'volunteers.overview.view']);
  const data = await volunteerService.getVolunteerByMemberId(
    resolveScopedTenantId(req),
    req.params.memberId,
    volunteerActor(req),
  );
  return success(res, data, 'Volunteer fetched successfully.');
});

export const updateVolunteer = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.overview.modify']);
  const data = await volunteerService.updateVolunteer(
    resolveScopedTenantId(req),
    req.params.volunteerId,
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Volunteer updated successfully.');
});

export const updateVolunteerStatus = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.overview.modify']);
  const data = await volunteerService.updateVolunteerStatus(
    resolveScopedTenantId(req),
    req.params.volunteerId,
    req.body.status,
    volunteerActor(req),
  );
  return success(res, data, 'Volunteer status updated successfully.');
});

export const updatePerformance = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.reports.view']);
  const data = await volunteerService.updatePerformance(
    resolveScopedTenantId(req),
    req.params.volunteerId,
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Volunteer performance updated successfully.');
});

export const addTraining = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.trainings.create']);
  const data = await volunteerService.addTraining(
    resolveScopedTenantId(req),
    req.params.volunteerId,
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Volunteer training added successfully.');
});

export const removeVolunteer = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.delete']);
  const data = await volunteerService.removeVolunteer(
    resolveScopedTenantId(req),
    req.params.volunteerId,
    volunteerActor(req),
  );
  return success(res, data, 'Volunteer removed successfully.');
});

export const createRoster = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.create', 'volunteers.rosters.create']);
  const data = await volunteerService.createRoster(
    resolveScopedTenantId(req),
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Duty roster created successfully.', 201);
});

export const getAllRosters = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.view', 'volunteers.rosters.view']);
  const data = await volunteerService.getAllRosters(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
    volunteerActor(req),
  );
  return success(res, data, 'Duty rosters fetched successfully.');
});

export const getUpcomingRosters = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.view', 'volunteers.rosters.view']);
  const data = await volunteerService.getUpcomingRosters(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
    volunteerActor(req),
  );
  return success(res, data, 'Upcoming duty rosters fetched successfully.');
});

export const getRosterById = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.view', 'volunteers.rosters.view']);
  const data = await volunteerService.getRosterById(
    resolveScopedTenantId(req),
    req.params.rosterId,
    volunteerActor(req),
  );
  return success(res, data, 'Duty roster fetched successfully.');
});

export const updateRoster = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.rosters.modify']);
  const data = await volunteerService.updateRoster(
    resolveScopedTenantId(req),
    req.params.rosterId,
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Duty roster updated successfully.');
});

export const deleteRoster = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.delete', 'volunteers.rosters.modify']);
  const data = await volunteerService.deleteRoster(
    resolveScopedTenantId(req),
    req.params.rosterId,
    volunteerActor(req),
  );
  return success(res, data, 'Duty roster deleted successfully.');
});

export const addAssignment = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.rosters.create']);
  const data = await volunteerService.addAssignment(
    resolveScopedTenantId(req),
    req.params.rosterId,
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Roster assignment added successfully.');
});

export const updateAssignment = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.rosters.modify']);
  const data = await volunteerService.updateAssignment(
    resolveScopedTenantId(req),
    req.params.rosterId,
    req.params.assignmentId,
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Roster assignment updated successfully.');
});

export const removeAssignment = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.rosters.modify']);
  const data = await volunteerService.removeAssignment(
    resolveScopedTenantId(req),
    req.params.rosterId,
    req.params.assignmentId,
    volunteerActor(req),
  );
  return success(res, data, 'Roster assignment removed successfully.');
});

export const publishRoster = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.rosters.publish']);
  const data = await volunteerService.publishRoster(
    resolveScopedTenantId(req),
    req.params.rosterId,
    volunteerActor(req),
  );
  return success(res, data, 'Duty roster published successfully.');
});

export const autoGenerateRoster = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.create', 'volunteers.rosters.create']);
  const data = await volunteerService.autoGenerateRoster(
    resolveScopedTenantId(req),
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Duty roster generated successfully.', 201);
});

export const markAttendance = asyncHandler(async (req, res) => {
  ensureVolunteerCapability(req, ['volunteers.modify', 'volunteers.rosters.modify']);
  const data = await volunteerService.markAttendance(
    resolveScopedTenantId(req),
    req.params.rosterId,
    req.params.assignmentId,
    req.body,
    volunteerActor(req),
  );
  return success(res, data, 'Roster attendance updated successfully.');
});

export const getPlatformVolunteerOverview = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await volunteerService.getPlatformVolunteerOverview();
  return success(res, data, 'Platform volunteer overview fetched successfully.');
});
