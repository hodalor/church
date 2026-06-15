import { Router } from 'express';
import { param } from 'express-validator';
import auth from '../../middleware/auth.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import requireRoles from '../../middleware/requireRoles.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as auditController from './audit.controller.js';

const auditRouter = Router();
const adminAuditRouter = Router();

auditRouter.use(auth, tenantScope, requireRoles('head_pastor', 'super_admin'));

auditRouter.get('/', auditController.getAuditLogs);
auditRouter.get('/suspicious', auditController.getSuspiciousActivity);
auditRouter.get('/logins', auditController.getLoginHistory);
auditRouter.get('/exports', auditController.getExportHistory);
auditRouter.get(
  '/user/:userId',
  [param('userId').trim().notEmpty().withMessage('User ID is required.')],
  validate,
  auditController.getUserAuditTrail,
);
auditRouter.get(
  '/module/:module',
  [param('module').trim().notEmpty().withMessage('Module is required.')],
  validate,
  auditController.getModuleAuditTrail,
);
auditRouter.get(
  '/entity/:entityType/:entityId',
  [
    param('entityType').trim().notEmpty().withMessage('Entity type is required.'),
    param('entityId').trim().notEmpty().withMessage('Entity ID is required.'),
  ],
  validate,
  auditController.getEntityAuditTrail,
);

adminAuditRouter.use(auth, isSuperAdmin);
adminAuditRouter.get('/audit', auditController.getAllTenantsAuditSummary);

export { adminAuditRouter, auditRouter };
