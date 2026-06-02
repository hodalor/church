import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import { hasCapability } from '../access/capabilities.js';
import * as attendanceService from './attendance.service.js';
import {
  ensureBranchAccess,
  ensureDocumentBranchAccess,
  scopeBranchQuery,
} from '../../utils/branchScope.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId ||
      req.body?.tenantId ||
      req.headers['x-tenant-id'] ||
      req.params?.tenantId;

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for super admin attendance requests.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

const ensureAttendanceCapability = (req, capability, options = {}) => {
  const { allowMember = false } = options;

  if (req.user?.role === 'super_admin') {
    return;
  }

  if (allowMember && req.user?.role === 'member') {
    return;
  }

  if (!hasCapability(req.user?.capabilities || [], capability)) {
    throw createHttpError(403, 'You do not have permission for this attendance action.');
  }
};

const ensureLeaderScannerAccess = (req) => {
  if (req.user?.role === 'super_admin') {
    return;
  }

  if (!attendanceService.attendanceRoleAccess.canLeadCheckIn(req.user?.role)) {
    throw createHttpError(403, 'Leader attendance access is required for this action.');
  }
};

const ensureSuperAdmin = (req) => {
  if (req.user?.role !== 'super_admin') {
    throw createHttpError(403, 'Super admin access is required for this attendance action.');
  }
};

const attendanceActor = (req) => ({
  userId: req.user?.userId,
  role: req.user?.role,
  memberId: req.user?.memberId,
});

const ensureServiceBranchAccess = async (req, serviceId) => {
  const service = await attendanceService.getServiceById(resolveScopedTenantId(req), serviceId);
  ensureDocumentBranchAccess(req.user, service.branch, 'You do not have access to this service branch.');
};

export const listServices = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view', { allowMember: true });
  const data = await attendanceService.listServices(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Attendance services fetched successfully.');
});

export const getServiceById = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view', { allowMember: true });
  const data = await attendanceService.getServiceById(resolveScopedTenantId(req), req.params.serviceId);
  ensureDocumentBranchAccess(req.user, data.branch, 'You do not have access to this service branch.');
  return success(res, data, 'Attendance service fetched successfully.');
});

export const createService = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.create');
  ensureLeaderScannerAccess(req);
  ensureBranchAccess(req.user, req.body.branch, 'You do not have access to create services in this branch.');
  const data = await attendanceService.createService(resolveScopedTenantId(req), req.body, attendanceActor(req));
  return success(res, data, 'Attendance service created successfully.', 201);
});

export const updateService = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.modify');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  ensureBranchAccess(req.user, req.body.branch, 'You do not have access to update services in this branch.');
  const data = await attendanceService.updateService(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.body,
    attendanceActor(req),
  );
  return success(res, data, 'Attendance service updated successfully.');
});

export const deleteService = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.delete');
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.deleteService(resolveScopedTenantId(req), req.params.serviceId);
  return success(res, data, 'Attendance service deleted successfully.');
});

export const toggleServiceCheckIn = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.modify');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.toggleServiceCheckIn(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.body.isOpen,
    attendanceActor(req),
  );
  return success(res, data, 'Service check-in status updated successfully.');
});

export const computeServiceStats = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.modify');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.computeServiceStats(resolveScopedTenantId(req), req.params.serviceId);
  return success(res, data, 'Attendance statistics computed successfully.');
});

export const updateOfflineCount = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.modify');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.updateOfflineCount(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.body,
    attendanceActor(req),
  );
  return success(res, data, 'Offline headcount updated successfully.');
});

export const getServiceAttendance = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.getServiceAttendance(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.query,
  );
  return success(res, data, 'Attendance records fetched successfully.');
});

export const removeCheckIn = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.delete');
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.removeCheckIn(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.params.checkInId,
    attendanceActor(req),
  );
  return success(res, data, 'Attendance record removed successfully.');
});

export const searchCheckInMembers = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view');
  ensureLeaderScannerAccess(req);
  const data = await attendanceService.searchCheckInMembers(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Attendance member search completed successfully.');
});

export const onlineCheckIn = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.create', { allowMember: true });
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.onlineCheckIn(
    resolveScopedTenantId(req),
    req.params.serviceId,
    attendanceActor(req),
  );
  return success(res, data, 'Attendance recorded successfully.');
});

export const qrCheckIn = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.create');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.qrCheckIn(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.body.qrCode || req.body.qrData,
    attendanceActor(req),
  );
  return success(res, data, 'QR attendance processed successfully.');
});

export const manualCheckIn = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.create');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.manualCheckIn(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.body.memberId,
    attendanceActor(req),
  );
  return success(res, data, 'Manual attendance processed successfully.');
});

export const visitorCheckIn = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.create');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.visitorCheckIn(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.body,
    attendanceActor(req),
  );
  return success(res, data, 'Visitor attendance processed successfully.');
});

export const childCheckIn = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.create');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.childCheckIn(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.body,
    attendanceActor(req),
  );
  return success(res, data, 'Child attendance processed successfully.');
});

export const getLiveCheckIns = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view');
  ensureLeaderScannerAccess(req);
  await ensureServiceBranchAccess(req, req.params.serviceId);
  const data = await attendanceService.getLiveCheckIns(
    resolveScopedTenantId(req),
    req.params.serviceId,
    req.query,
  );
  return success(res, data, 'Live attendance data fetched successfully.');
});

export const getMyAttendanceHistory = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view', { allowMember: true });
  const data = await attendanceService.getMyAttendanceHistory(resolveScopedTenantId(req), attendanceActor(req));
  return success(res, data, 'Attendance history fetched successfully.');
});

export const getAttendanceSummary = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view');
  const data = await attendanceService.getAttendanceSummary(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Attendance summary fetched successfully.');
});

export const getAttendanceTrends = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view');
  const data = await attendanceService.getAttendanceTrends(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Attendance trends fetched successfully.');
});

export const getAttendanceHeatmap = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view');
  const data = await attendanceService.getAttendanceHeatmap(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Attendance heatmap fetched successfully.');
});

export const getAttendanceRetention = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view');
  const data = await attendanceService.getAttendanceRetention(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Attendance retention fetched successfully.');
});

export const getBranchAttendanceComparison = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view');
  const data = await attendanceService.getBranchAttendanceComparison(
    resolveScopedTenantId(req),
    req.query,
  );
  return success(res, data, 'Branch attendance comparison fetched successfully.');
});

export const getMemberAttendanceReport = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view', { allowMember: req.user?.memberId === req.params.memberId });
  const data = await attendanceService.getMemberAttendanceReport(
    resolveScopedTenantId(req),
    req.params.memberId,
    req.query,
  );
  return success(res, data, 'Member attendance report fetched successfully.');
});

export const getAbsentees = asyncHandler(async (req, res) => {
  ensureAttendanceCapability(req, 'attendance.view');
  const data = await attendanceService.getAbsentees(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Absentee follow-up list fetched successfully.');
});

export const getPlatformAttendanceOverview = asyncHandler(async (req, res) => {
  ensureSuperAdmin(req);
  const data = await attendanceService.getPlatformAttendanceOverview(req.query);
  return success(res, data, 'Platform attendance overview fetched successfully.');
});
