import { Router } from 'express';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import requireRoles from '../../middleware/requireRoles.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as ministryController from './ministry.controller.js';
import {
  bulkAddMembersValidation,
  createMeetingValidation,
  createMinistryValidation,
  meetingIdParamValidation,
  memberIdParamValidation,
  ministryIdParamValidation,
  ministryMemberValidation,
  recordMeetingAttendanceValidation,
  updateMinistryValidation,
} from './ministry.validation.js';

const ministryRouter = Router();
const adminMinistryRouter = Router();

ministryRouter.use(auth, tenantScope, requireRoles('super_admin', 'head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader', 'volunteer_leader'));

ministryRouter.post('/', auditMiddleware('ministry', 'Ministry'), createMinistryValidation, validate, ministryController.createMinistry);
ministryRouter.get('/', ministryController.getAllMinistries);
ministryRouter.get('/stats', ministryController.getMinistryStats);
ministryRouter.get('/reports/overview', ministryController.getMinistryOverviewReport);
ministryRouter.get('/reports/:ministryId', ministryIdParamValidation, validate, ministryController.getMinistryReport);
ministryRouter.get('/member/:memberId/ministries', memberIdParamValidation, validate, ministryController.getMemberMinistries);
ministryRouter.get('/:ministryId', ministryIdParamValidation, validate, ministryController.getMinistryById);
ministryRouter.patch('/:ministryId', auditMiddleware('ministry', 'Ministry'), updateMinistryValidation, validate, ministryController.updateMinistry);
ministryRouter.delete('/:ministryId', auditMiddleware('ministry', 'Ministry'), ministryIdParamValidation, validate, ministryController.deactivateMinistry);

ministryRouter.post(
  '/:ministryId/members',
  auditMiddleware('ministry', 'MinistryMember'),
  [...ministryIdParamValidation, ...ministryMemberValidation],
  validate,
  ministryController.addMemberToMinistry,
);
ministryRouter.get('/:ministryId/members', ministryIdParamValidation, validate, ministryController.getMinistryMembers);
ministryRouter.patch(
  '/:ministryId/members/:memberId',
  auditMiddleware('ministry', 'MinistryMember'),
  [...ministryIdParamValidation, ...memberIdParamValidation],
  validate,
  ministryController.updateMemberRole,
);
ministryRouter.delete(
  '/:ministryId/members/:memberId',
  auditMiddleware('ministry', 'MinistryMember'),
  [...ministryIdParamValidation, ...memberIdParamValidation],
  validate,
  ministryController.removeMemberFromMinistry,
);
ministryRouter.post(
  '/:ministryId/members/bulk',
  auditMiddleware('ministry', 'MinistryMember', { action: 'BULK_ACTION' }),
  [...ministryIdParamValidation, ...bulkAddMembersValidation],
  validate,
  ministryController.bulkAddMembers,
);

ministryRouter.post(
  '/:ministryId/meetings',
  auditMiddleware('ministry', 'MinistryMeeting'),
  [...ministryIdParamValidation, ...createMeetingValidation],
  validate,
  ministryController.createMeeting,
);
ministryRouter.get('/:ministryId/meetings', ministryIdParamValidation, validate, ministryController.getMinistryMeetings);
ministryRouter.get(
  '/:ministryId/meetings/:meetingId',
  [...ministryIdParamValidation, ...meetingIdParamValidation],
  validate,
  ministryController.getMeetingById,
);
ministryRouter.patch(
  '/:ministryId/meetings/:meetingId',
  auditMiddleware('ministry', 'MinistryMeeting'),
  [...ministryIdParamValidation, ...meetingIdParamValidation],
  validate,
  ministryController.updateMeeting,
);
ministryRouter.post(
  '/:ministryId/meetings/:meetingId/attendance',
  auditMiddleware('ministry', 'MinistryMeeting', { action: 'STATUS_CHANGE' }),
  [...ministryIdParamValidation, ...meetingIdParamValidation, ...recordMeetingAttendanceValidation],
  validate,
  ministryController.recordMeetingAttendance,
);

adminMinistryRouter.use(auth, isSuperAdmin);
adminMinistryRouter.get('/ministries', ministryController.getAllMinistriesAcrossTenants);

export { adminMinistryRouter, ministryRouter };
