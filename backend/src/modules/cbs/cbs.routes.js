import { Router } from 'express';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import requireRoles from '../../middleware/requireRoles.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as cbsController from './cbs.controller.js';
import {
  createGroupValidation,
  createProspectValidation,
  createSessionValidation,
  groupIdParamValidation,
  prospectIdParamValidation,
  sessionIdParamValidation,
  updateGroupValidation,
  updateProspectValidation,
} from './cbs.validation.js';

const cbsRouter = Router();
const adminCbsRouter = Router();

cbsRouter.use(auth, tenantScope, requireRoles('super_admin', 'head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'));

cbsRouter.post('/groups', auditMiddleware('cbs', 'CBSGroup'), createGroupValidation, validate, cbsController.createGroup);
cbsRouter.get('/groups', cbsController.getGroups);
cbsRouter.get('/groups/stats', cbsController.getCBSStats);
cbsRouter.get('/reports/overview', cbsController.getCBSOverviewReport);
cbsRouter.get('/reports/:groupId', groupIdParamValidation, validate, cbsController.getCBSGroupReport);
cbsRouter.get('/groups/:groupId', groupIdParamValidation, validate, cbsController.getGroupById);
cbsRouter.patch('/groups/:groupId', auditMiddleware('cbs', 'CBSGroup'), [...groupIdParamValidation, ...updateGroupValidation], validate, cbsController.updateGroup);
cbsRouter.delete('/groups/:groupId', auditMiddleware('cbs', 'CBSGroup'), groupIdParamValidation, validate, cbsController.deactivateGroup);

cbsRouter.post(
  '/groups/:groupId/prospects',
  auditMiddleware('cbs', 'CBSProspect'),
  [...groupIdParamValidation, ...createProspectValidation],
  validate,
  cbsController.createProspect,
);
cbsRouter.get('/groups/:groupId/prospects', groupIdParamValidation, validate, cbsController.getGroupProspects);
cbsRouter.patch(
  '/groups/:groupId/prospects/:prospectId',
  auditMiddleware('cbs', 'CBSProspect'),
  [...groupIdParamValidation, ...prospectIdParamValidation, ...updateProspectValidation],
  validate,
  cbsController.updateProspect,
);
cbsRouter.post(
  '/groups/:groupId/prospects/:prospectId/convert',
  auditMiddleware('cbs', 'CBSProspect', { action: 'STATUS_CHANGE' }),
  [...groupIdParamValidation, ...prospectIdParamValidation],
  validate,
  cbsController.convertProspectToMember,
);

cbsRouter.post(
  '/groups/:groupId/sessions',
  auditMiddleware('cbs', 'CBSSession'),
  [...groupIdParamValidation, ...createSessionValidation],
  validate,
  cbsController.createSession,
);
cbsRouter.get('/groups/:groupId/sessions', groupIdParamValidation, validate, cbsController.getSessions);
cbsRouter.get(
  '/groups/:groupId/sessions/:sessionId',
  [...groupIdParamValidation, ...sessionIdParamValidation],
  validate,
  cbsController.getSessionById,
);
cbsRouter.patch(
  '/groups/:groupId/sessions/:sessionId',
  auditMiddleware('cbs', 'CBSSession'),
  [...groupIdParamValidation, ...sessionIdParamValidation],
  validate,
  cbsController.updateSession,
);

adminCbsRouter.use(auth, isSuperAdmin);
adminCbsRouter.get('/cbs', cbsController.getGroupsAcrossTenants);

export { adminCbsRouter, cbsRouter };
