import { Router } from 'express';
import auth from '../../middleware/auth.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as attendanceController from './attendance.controller.js';
import {
  absenteesValidation,
  createServiceValidation,
  liveCheckInsValidation,
  listServicesValidation,
  manualCheckInValidation,
  memberAttendanceReportValidation,
  platformAttendanceOverviewValidation,
  qrCheckInValidation,
  removeCheckInValidation,
  reportRangeValidation,
  searchCheckInMembersValidation,
  serviceAttendanceValidation,
  serviceIdParamValidation,
  toggleServiceCheckInValidation,
  updateOfflineCountValidation,
  updateServiceValidation,
  visitorCheckInValidation,
  childCheckInValidation,
} from './attendance.validation.js';

const attendanceRouter = Router();
const adminAttendanceRouter = Router();

attendanceRouter.use(auth, tenantScope);

attendanceRouter.get('/services', listServicesValidation, validate, attendanceController.listServices);
attendanceRouter.post('/services', createServiceValidation, validate, attendanceController.createService);
attendanceRouter.get(
  '/services/:serviceId',
  serviceIdParamValidation,
  validate,
  attendanceController.getServiceById,
);
attendanceRouter.patch(
  '/services/:serviceId',
  updateServiceValidation,
  validate,
  attendanceController.updateService,
);
attendanceRouter.delete(
  '/services/:serviceId',
  serviceIdParamValidation,
  validate,
  attendanceController.deleteService,
);
attendanceRouter.patch(
  '/services/:serviceId/check-in',
  toggleServiceCheckInValidation,
  validate,
  attendanceController.toggleServiceCheckIn,
);
attendanceRouter.post(
  '/services/:serviceId/compute-stats',
  serviceIdParamValidation,
  validate,
  attendanceController.computeServiceStats,
);
attendanceRouter.patch(
  '/services/:serviceId/offline-count',
  updateOfflineCountValidation,
  validate,
  attendanceController.updateOfflineCount,
);
attendanceRouter.get(
  '/services/:serviceId/check-ins',
  serviceAttendanceValidation,
  validate,
  attendanceController.getServiceAttendance,
);
attendanceRouter.delete(
  '/services/:serviceId/check-ins/:checkInId',
  removeCheckInValidation,
  validate,
  attendanceController.removeCheckIn,
);
attendanceRouter.get(
  '/services/:serviceId/live',
  liveCheckInsValidation,
  validate,
  attendanceController.getLiveCheckIns,
);
attendanceRouter.post(
  '/services/:serviceId/check-in/online',
  serviceIdParamValidation,
  validate,
  attendanceController.onlineCheckIn,
);
attendanceRouter.post(
  '/services/:serviceId/check-in/qr',
  qrCheckInValidation,
  validate,
  attendanceController.qrCheckIn,
);
attendanceRouter.post(
  '/services/:serviceId/check-in/member',
  manualCheckInValidation,
  validate,
  attendanceController.manualCheckIn,
);
attendanceRouter.post(
  '/services/:serviceId/check-in/visitor',
  visitorCheckInValidation,
  validate,
  attendanceController.visitorCheckIn,
);
attendanceRouter.post(
  '/services/:serviceId/check-in/child',
  childCheckInValidation,
  validate,
  attendanceController.childCheckIn,
);
attendanceRouter.get(
  '/check-in/search',
  searchCheckInMembersValidation,
  validate,
  attendanceController.searchCheckInMembers,
);
attendanceRouter.get('/reports/my-history', attendanceController.getMyAttendanceHistory);
attendanceRouter.get(
  '/reports/summary',
  reportRangeValidation,
  validate,
  attendanceController.getAttendanceSummary,
);
attendanceRouter.get(
  '/reports/trends',
  reportRangeValidation,
  validate,
  attendanceController.getAttendanceTrends,
);
attendanceRouter.get(
  '/reports/heatmap',
  reportRangeValidation,
  validate,
  attendanceController.getAttendanceHeatmap,
);
attendanceRouter.get(
  '/reports/retention',
  reportRangeValidation,
  validate,
  attendanceController.getAttendanceRetention,
);
attendanceRouter.get(
  '/reports/branch-comparison',
  reportRangeValidation,
  validate,
  attendanceController.getBranchAttendanceComparison,
);
attendanceRouter.get(
  '/reports/member/:memberId',
  memberAttendanceReportValidation,
  validate,
  attendanceController.getMemberAttendanceReport,
);
attendanceRouter.get('/absentees', absenteesValidation, validate, attendanceController.getAbsentees);

adminAttendanceRouter.use(auth, isSuperAdmin);
adminAttendanceRouter.get(
  '/overview',
  platformAttendanceOverviewValidation,
  validate,
  attendanceController.getPlatformAttendanceOverview,
);

export { attendanceRouter, adminAttendanceRouter };
