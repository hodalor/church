import { Router } from 'express';
import auth from '../../middleware/auth.js';
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

pastoralRouter.post('/cases', createCaseValidation, validate, pastoralController.createCase);
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
pastoralRouter.patch('/cases/:caseId', updateCaseValidation, validate, pastoralController.updateCase);
pastoralRouter.patch('/cases/:caseId/assign', assignCaseValidation, validate, pastoralController.assignCase);
pastoralRouter.patch(
  '/cases/:caseId/status',
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
  updateAppointmentValidation,
  validate,
  pastoralController.updateAppointment,
);
pastoralRouter.patch(
  '/appointments/:appointmentId/status',
  updateAppointmentStatusValidation,
  validate,
  pastoralController.updateAppointmentStatus,
);
pastoralRouter.delete(
  '/appointments/:appointmentId',
  cancelAppointmentValidation,
  validate,
  pastoralController.cancelAppointment,
);

pastoralRouter.post('/tracks', createTrackValidation, validate, pastoralController.createTrack);
pastoralRouter.get('/tracks', listTracksValidation, validate, pastoralController.getAllTracks);
pastoralRouter.patch('/tracks/:trackId', updateTrackValidation, validate, pastoralController.updateTrack);

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
