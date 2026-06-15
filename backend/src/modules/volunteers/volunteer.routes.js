import { Router } from 'express';
import { param } from 'express-validator';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as volunteerController from './volunteer.controller.js';
import {
  addAssignmentValidation,
  addTrainingValidation,
  assignmentIdParamValidation,
  autoGenerateRosterValidation,
  createRosterValidation,
  markAssignmentAttendanceValidation,
  registerVolunteerValidation,
  rosterIdParamValidation,
  rosterListValidation,
  updateAssignmentValidation,
  updatePerformanceValidation,
  updateRosterValidation,
  updateVolunteerStatusValidation,
  updateVolunteerValidation,
  volunteerIdParamValidation,
  volunteerListValidation,
} from './volunteer.validation.js';

const volunteersRouter = Router();
const rostersRouter = Router();
const adminVolunteersRouter = Router();

volunteersRouter.use(auth, tenantScope);
rostersRouter.use(auth, tenantScope);

volunteersRouter.post('/', auditMiddleware('volunteers', 'Volunteer'), registerVolunteerValidation, validate, volunteerController.registerVolunteer);
volunteersRouter.get('/', volunteerListValidation, validate, volunteerController.getAllVolunteers);
volunteersRouter.get('/stats', volunteerListValidation, validate, volunteerController.getVolunteerStats);
volunteersRouter.get(
  '/available',
  volunteerListValidation,
  validate,
  volunteerController.getAvailableVolunteers,
);
volunteersRouter.get(
  '/member/:memberId',
  [param('memberId').trim().notEmpty().withMessage('Member ID is required.')],
  validate,
  volunteerController.getVolunteerByMemberId,
);
volunteersRouter.get(
  '/:volunteerId',
  volunteerIdParamValidation,
  validate,
  volunteerController.getVolunteerById,
);
volunteersRouter.patch(
  '/:volunteerId',
  auditMiddleware('volunteers', 'Volunteer'),
  updateVolunteerValidation,
  validate,
  volunteerController.updateVolunteer,
);
volunteersRouter.patch(
  '/:volunteerId/status',
  auditMiddleware('volunteers', 'Volunteer', { action: 'STATUS_CHANGE' }),
  updateVolunteerStatusValidation,
  validate,
  volunteerController.updateVolunteerStatus,
);
volunteersRouter.patch(
  '/:volunteerId/performance',
  updatePerformanceValidation,
  validate,
  volunteerController.updatePerformance,
);
volunteersRouter.post(
  '/:volunteerId/training',
  addTrainingValidation,
  validate,
  volunteerController.addTraining,
);
volunteersRouter.delete(
  '/:volunteerId',
  auditMiddleware('volunteers', 'Volunteer'),
  volunteerIdParamValidation,
  validate,
  volunteerController.removeVolunteer,
);

rostersRouter.post('/', auditMiddleware('volunteers', 'DutyRoster'), createRosterValidation, validate, volunteerController.createRoster);
rostersRouter.get('/', rosterListValidation, validate, volunteerController.getAllRosters);
rostersRouter.get(
  '/upcoming',
  rosterListValidation,
  validate,
  volunteerController.getUpcomingRosters,
);
rostersRouter.get('/:rosterId', rosterIdParamValidation, validate, volunteerController.getRosterById);
rostersRouter.patch('/:rosterId', auditMiddleware('volunteers', 'DutyRoster'), updateRosterValidation, validate, volunteerController.updateRoster);
rostersRouter.delete('/:rosterId', auditMiddleware('volunteers', 'DutyRoster'), rosterIdParamValidation, validate, volunteerController.deleteRoster);
rostersRouter.post(
  '/:rosterId/assign',
  addAssignmentValidation,
  validate,
  volunteerController.addAssignment,
);
rostersRouter.patch(
  '/:rosterId/assignments/:assignmentId',
  updateAssignmentValidation,
  validate,
  volunteerController.updateAssignment,
);
rostersRouter.delete(
  '/:rosterId/assignments/:assignmentId',
  [...rosterIdParamValidation, ...assignmentIdParamValidation],
  validate,
  volunteerController.removeAssignment,
);
rostersRouter.patch(
  '/:rosterId/publish',
  auditMiddleware('volunteers', 'DutyRoster', { action: 'PUBLISH' }),
  rosterIdParamValidation,
  validate,
  volunteerController.publishRoster,
);
rostersRouter.post(
  '/auto-generate',
  autoGenerateRosterValidation,
  validate,
  volunteerController.autoGenerateRoster,
);
rostersRouter.patch(
  '/:rosterId/assignments/:assignmentId/attendance',
  markAssignmentAttendanceValidation,
  validate,
  volunteerController.markAttendance,
);

adminVolunteersRouter.use(auth, isSuperAdmin);
adminVolunteersRouter.get('/overview', volunteerController.getPlatformVolunteerOverview);

export { volunteersRouter, rostersRouter, adminVolunteersRouter };
