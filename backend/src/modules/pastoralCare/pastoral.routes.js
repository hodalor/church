import { Router } from 'express';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as pastoralController from './pastoral.controller.js';
import {
  addInteractionValidation,
  addMilestoneValidation,
  addPrayerRequestValidation,
  assignCaseValidation,
  cancelAppointmentValidation,
  caseIdParamValidation,
  completeStepValidation,
  createAppointmentValidation,
  createCaseValidation,
  createTrackValidation,
  enrollMemberValidation,
  listAppointmentsValidation,
  listCasesValidation,
  listEnrollmentsValidation,
  listTracksValidation,
  markPrayerAnsweredValidation,
  memberIdParamValidation,
  pastoralReportsValidation,
  updateAppointmentStatusValidation,
  updateAppointmentValidation,
  updateCaseStatusValidation,
  updateCaseValidation,
  updateEnrollmentStatusValidation,
  updateInteractionValidation,
  updateTrackValidation,
} from './pastoral.validation.js';

const pastoralRouter = Router();
const adminPastoralRouter = Router();

pastoralRouter.use(auth, tenantScope);

pastoralRouter.post('/cases', auditMiddleware('pastoral', 'CareCase'), createCaseValidation, validate, pastoralController.createCase);
pastoralRouter.get('/cases', listCasesValidation, validate, pastoralController.getAllCases);
pastoralRouter.get('/cases/stats', pastoralReportsValidation, validate, pastoralController.getCareStats);
pastoralRouter.get('/cases/my', pastoralReportsValidation, validate, pastoralController.getMyCases);
pastoralRouter.get('/cases/urgent', pastoralReportsValidation, validate, pastoralController.getUrgentCases);
pastoralRouter.get(
  '/cases/member/:memberId',
  memberIdParamValidation,
  validate,
  pastoralController.getMemberCases,
);
pastoralRouter.get('/cases/:caseId', caseIdParamValidation, validate, pastoralController.getCaseById);
pastoralRouter.patch('/cases/:caseId', auditMiddleware('pastoral', 'CareCase'), updateCaseValidation, validate, pastoralController.updateCase);
pastoralRouter.patch('/cases/:caseId/assign', auditMiddleware('pastoral', 'CareCase', { action: 'ASSIGN' }), assignCaseValidation, validate, pastoralController.assignCase);
pastoralRouter.patch(
  '/cases/:caseId/status',
  auditMiddleware('pastoral', 'CareCase', { action: 'STATUS_CHANGE' }),
  updateCaseStatusValidation,
  validate,
  pastoralController.updateCaseStatus,
);
pastoralRouter.post(
  '/cases/:caseId/interactions',
  addInteractionValidation,
  validate,
  pastoralController.addInteraction,
);
pastoralRouter.patch(
  '/cases/:caseId/interactions/:interactionId',
  updateInteractionValidation,
  validate,
  pastoralController.updateInteraction,
);
pastoralRouter.post(
  '/cases/:caseId/milestones',
  addMilestoneValidation,
  validate,
  pastoralController.addMilestone,
);
pastoralRouter.post(
  '/cases/:caseId/prayer-requests',
  addPrayerRequestValidation,
  validate,
  pastoralController.addPrayerRequest,
);
pastoralRouter.patch(
  '/cases/:caseId/prayer-requests/:prId/answered',
  markPrayerAnsweredValidation,
  validate,
  pastoralController.markPrayerAnswered,
);

pastoralRouter.post(
  '/appointments',
  auditMiddleware('pastoral', 'Appointment'),
  createAppointmentValidation,
  validate,
  pastoralController.createAppointment,
);
pastoralRouter.get(
  '/appointments',
  listAppointmentsValidation,
  validate,
  pastoralController.getAllAppointments,
);
pastoralRouter.get(
  '/appointments/today',
  pastoralReportsValidation,
  validate,
  pastoralController.getTodayAppointments,
);
pastoralRouter.get(
  '/appointments/upcoming',
  pastoralReportsValidation,
  validate,
  pastoralController.getUpcomingAppointments,
);
pastoralRouter.get('/appointments/my', pastoralReportsValidation, validate, pastoralController.getMyAppointments);
pastoralRouter.get(
  '/appointments/:appointmentId',
  cancelAppointmentValidation,
  validate,
  pastoralController.getAppointmentById,
);
pastoralRouter.patch(
  '/appointments/:appointmentId',
  auditMiddleware('pastoral', 'Appointment'),
  updateAppointmentValidation,
  validate,
  pastoralController.updateAppointment,
);
pastoralRouter.patch(
  '/appointments/:appointmentId/status',
  auditMiddleware('pastoral', 'Appointment', { action: 'STATUS_CHANGE' }),
  updateAppointmentStatusValidation,
  validate,
  pastoralController.updateAppointmentStatus,
);
pastoralRouter.delete(
  '/appointments/:appointmentId',
  auditMiddleware('pastoral', 'Appointment'),
  cancelAppointmentValidation,
  validate,
  pastoralController.cancelAppointment,
);

pastoralRouter.post('/tracks', auditMiddleware('pastoral', 'DiscipleshipTrack'), createTrackValidation, validate, pastoralController.createTrack);
pastoralRouter.get('/tracks', listTracksValidation, validate, pastoralController.getAllTracks);
pastoralRouter.patch('/tracks/:trackId', auditMiddleware('pastoral', 'DiscipleshipTrack'), updateTrackValidation, validate, pastoralController.updateTrack);

pastoralRouter.post('/discipleship/enroll', enrollMemberValidation, validate, pastoralController.enrollMember);
pastoralRouter.get(
  '/discipleship',
  listEnrollmentsValidation,
  validate,
  pastoralController.getAllEnrollments,
);
pastoralRouter.get(
  '/discipleship/member/:memberId',
  memberIdParamValidation,
  validate,
  pastoralController.getMemberDiscipleship,
);
pastoralRouter.patch(
  '/discipleship/:enrollmentId/step',
  completeStepValidation,
  validate,
  pastoralController.completeStep,
);
pastoralRouter.patch(
  '/discipleship/:enrollmentId/status',
  updateEnrollmentStatusValidation,
  validate,
  pastoralController.updateEnrollmentStatus,
);

pastoralRouter.get(
  '/reports/summary',
  pastoralReportsValidation,
  validate,
  pastoralController.getPastoralCareReport,
);
pastoralRouter.get(
  '/reports/workload',
  pastoralReportsValidation,
  validate,
  pastoralController.getPastorWorkloadReport,
);
pastoralRouter.get(
  '/reports/welfare',
  pastoralReportsValidation,
  validate,
  pastoralController.getWelfareReport,
);
pastoralRouter.get(
  '/reports/discipleship',
  pastoralReportsValidation,
  validate,
  pastoralController.getDiscipleshipReport,
);

adminPastoralRouter.use(auth, tenantScope, isSuperAdmin);
adminPastoralRouter.get('/overview', pastoralController.getPlatformPastoralOverview);

export { pastoralRouter, adminPastoralRouter };
