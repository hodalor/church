import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import { hasCapability } from '../access/capabilities.js';
import * as pastoralService from './pastoral.service.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId ||
      req.body?.tenantId ||
      req.headers['x-tenant-id'] ||
      req.params?.tenantId;

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for super admin pastoral requests.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

const ensurePastoralCapability = (req, capability) => {
  if (req.user?.role === 'super_admin') {
    return;
  }

  if (!pastoralService.pastoralAccess.pastoralAccessRoles.includes(req.user?.role)) {
    throw createHttpError(403, 'You do not have permission for this pastoral care action.');
  }

  if (!hasCapability(req.user?.capabilities || [], capability)) {
    throw createHttpError(403, 'You do not have permission for this pastoral care action.');
  }
};

const ensureSuperAdmin = (req) => {
  if (req.user?.role !== 'super_admin') {
    throw createHttpError(403, 'Super admin access is required for this pastoral action.');
  }
};

const pastoralActor = (req) => ({
  userId: req.user?.userId,
  role: req.user?.role,
  name: req.user?.fullName || req.user?.username || req.user?.role,
});

export const createCase = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.create');
  const data = await pastoralService.createCase(resolveScopedTenantId(req), req.body, pastoralActor(req));
  return success(res, data, 'Care case created successfully.', 201);
});

export const getAllCases = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getAllCases(resolveScopedTenantId(req), req.query, pastoralActor(req));
  return success(res, data, 'Care cases fetched successfully.');
});

export const getCareStats = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getCareStats(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Pastoral care statistics fetched successfully.');
});

export const getMyCases = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getMyCases(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Assigned care cases fetched successfully.');
});

export const getUrgentCases = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getUrgentCases(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Urgent care cases fetched successfully.');
});

export const getMemberCases = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getMemberCases(
    resolveScopedTenantId(req),
    req.params.memberId,
    pastoralActor(req),
  );
  return success(res, data, 'Member care cases fetched successfully.');
});

export const getCaseById = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getCaseById(
    resolveScopedTenantId(req),
    req.params.caseId,
    pastoralActor(req),
  );
  return success(res, data, 'Care case fetched successfully.');
});

export const updateCase = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.updateCase(
    resolveScopedTenantId(req),
    req.params.caseId,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Care case updated successfully.');
});

export const assignCase = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.assignCase(
    resolveScopedTenantId(req),
    req.params.caseId,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Care case assigned successfully.');
});

export const updateCaseStatus = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.updateCaseStatus(
    resolveScopedTenantId(req),
    req.params.caseId,
    req.body.status,
    req.body.resolutionNotes,
    pastoralActor(req),
  );
  return success(res, data, 'Care case status updated successfully.');
});

export const addInteraction = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.addInteraction(
    resolveScopedTenantId(req),
    req.params.caseId,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Care interaction added successfully.');
});

export const updateInteraction = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.updateInteraction(
    resolveScopedTenantId(req),
    req.params.caseId,
    req.params.interactionId,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Care interaction updated successfully.');
});

export const addMilestone = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.addMilestone(
    resolveScopedTenantId(req),
    req.params.caseId,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Care milestone added successfully.');
});

export const addPrayerRequest = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.addPrayerRequest(
    resolveScopedTenantId(req),
    req.params.caseId,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Prayer request added successfully.');
});

export const markPrayerAnswered = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.markPrayerAnswered(
    resolveScopedTenantId(req),
    req.params.caseId,
    req.params.prId,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Prayer request marked as answered successfully.');
});

export const createAppointment = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.create');
  const data = await pastoralService.createAppointment(resolveScopedTenantId(req), req.body, pastoralActor(req));
  return success(res, data, 'Appointment created successfully.', 201);
});

export const getAllAppointments = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getAllAppointments(resolveScopedTenantId(req), req.query, pastoralActor(req));
  return success(res, data, 'Appointments fetched successfully.');
});

export const getTodayAppointments = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getTodayAppointments(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Today appointments fetched successfully.');
});

export const getUpcomingAppointments = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getUpcomingAppointments(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Upcoming appointments fetched successfully.');
});

export const getMyAppointments = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getMyAppointments(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Assigned appointments fetched successfully.');
});

export const getAppointmentById = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getAppointmentById(
    resolveScopedTenantId(req),
    req.params.appointmentId,
    pastoralActor(req),
  );
  return success(res, data, 'Appointment fetched successfully.');
});

export const updateAppointment = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.updateAppointment(
    resolveScopedTenantId(req),
    req.params.appointmentId,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Appointment updated successfully.');
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.updateAppointmentStatus(
    resolveScopedTenantId(req),
    req.params.appointmentId,
    req.body.status,
    req.body.completionNotes,
    pastoralActor(req),
  );
  return success(res, data, 'Appointment status updated successfully.');
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.cancelAppointment(
    resolveScopedTenantId(req),
    req.params.appointmentId,
    pastoralActor(req),
  );
  return success(res, data, 'Appointment cancelled successfully.');
});

export const createTrack = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.create');
  const data = await pastoralService.createTrack(resolveScopedTenantId(req), req.body, pastoralActor(req));
  return success(res, data, 'Discipleship track created successfully.', 201);
});

export const getAllTracks = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getAllTracks(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Discipleship tracks fetched successfully.');
});

export const updateTrack = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.updateTrack(
    resolveScopedTenantId(req),
    req.params.trackId,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Discipleship track updated successfully.');
});

export const enrollMember = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.create');
  const data = await pastoralService.enrollMember(resolveScopedTenantId(req), req.body, pastoralActor(req));
  return success(res, data, 'Member enrolled successfully.', 201);
});

export const getAllEnrollments = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getAllEnrollments(resolveScopedTenantId(req), req.query, pastoralActor(req));
  return success(res, data, 'Discipleship enrollments fetched successfully.');
});

export const getMemberDiscipleship = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getMemberDiscipleship(
    resolveScopedTenantId(req),
    req.params.memberId,
    pastoralActor(req),
  );
  return success(res, data, 'Member discipleship records fetched successfully.');
});

export const completeStep = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.completeStep(
    resolveScopedTenantId(req),
    req.params.enrollmentId,
    req.body.stepNumber,
    req.body,
    pastoralActor(req),
  );
  return success(res, data, 'Discipleship step completed successfully.');
});

export const updateEnrollmentStatus = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.modify');
  const data = await pastoralService.updateEnrollmentStatus(
    resolveScopedTenantId(req),
    req.params.enrollmentId,
    req.body.status,
    req.body.notes,
    pastoralActor(req),
  );
  return success(res, data, 'Discipleship enrollment status updated successfully.');
});

export const getPastoralCareReport = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getPastoralCareReport(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Pastoral care summary fetched successfully.');
});

export const getPastorWorkloadReport = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getPastorWorkloadReport(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Pastoral workload report fetched successfully.');
});

export const getWelfareReport = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getWelfareReport(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Welfare report fetched successfully.');
});

export const getDiscipleshipReport = asyncHandler(async (req, res) => {
  ensurePastoralCapability(req, 'pastoral.view');
  const data = await pastoralService.getDiscipleshipReport(resolveScopedTenantId(req), pastoralActor(req));
  return success(res, data, 'Discipleship report fetched successfully.');
});

export const getPlatformPastoralOverview = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await pastoralService.getPlatformPastoralOverview();
  return success(res, data, 'Platform pastoral overview fetched successfully.');
});
