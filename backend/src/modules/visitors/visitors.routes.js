import { Router } from 'express';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as visitorsController from './visitors.controller.js';
import {
  assignVisitorsValidation,
  completeFollowUpValidation,
  convertVisitorValidation,
  createFollowUpValidation,
  duplicatePhoneValidation,
  kioskRegisterVisitorValidation,
  listVisitorsValidation,
  registerVisitorValidation,
  rescheduleFollowUpValidation,
  returnVisitValidation,
  stageUpdateValidation,
  visitorIdParamValidation,
  workflowValidation,
} from './visitors.validation.js';

const visitorsRouter = Router();
const adminVisitorsRouter = Router();

visitorsRouter.post(
  '/kiosk/register',
  kioskRegisterVisitorValidation,
  validate,
  visitorsController.registerVisitorFromKiosk,
);

visitorsRouter.use(auth, tenantScope);

visitorsRouter.get('/assignable-leaders', visitorsController.getVisitorAssignableLeaders);
visitorsRouter.get('/search', listVisitorsValidation, validate, visitorsController.searchVisitors);
visitorsRouter.get(
  '/duplicate-check',
  duplicatePhoneValidation,
  validate,
  visitorsController.checkVisitorDuplicateByPhone,
);
visitorsRouter.post('/', auditMiddleware('visitors', 'Visitor'), registerVisitorValidation, validate, visitorsController.registerVisitor);
visitorsRouter.get('/', listVisitorsValidation, validate, visitorsController.getVisitors);
visitorsRouter.get('/pipeline', listVisitorsValidation, validate, visitorsController.getVisitorPipeline);
visitorsRouter.get('/follow-ups', listVisitorsValidation, validate, visitorsController.getVisitorFollowUps);
visitorsRouter.get('/workflow', visitorsController.getVisitorWorkflow);
visitorsRouter.put('/workflow', auditMiddleware('visitors', 'VisitorWorkflow'), workflowValidation, validate, visitorsController.saveVisitorWorkflow);
visitorsRouter.post('/workflow/test', workflowValidation, validate, visitorsController.testVisitorWorkflow);
visitorsRouter.get('/reports', visitorsController.getVisitorReports);
visitorsRouter.post('/assign', auditMiddleware('visitors', 'Visitor', { action: 'ASSIGN' }), assignVisitorsValidation, validate, visitorsController.assignVisitorsToCareLeader);
visitorsRouter.get(
  '/:visitorId',
  visitorIdParamValidation,
  validate,
  visitorsController.getVisitorById,
);
visitorsRouter.patch(
  '/:visitorId/stage',
  auditMiddleware('visitors', 'Visitor', { action: 'STATUS_CHANGE' }),
  stageUpdateValidation,
  validate,
  visitorsController.updateVisitorStage,
);
visitorsRouter.post(
  '/:visitorId/return-visit',
  returnVisitValidation,
  validate,
  visitorsController.recordVisitorReturnVisit,
);
visitorsRouter.post(
  '/:visitorId/follow-ups',
  createFollowUpValidation,
  validate,
  visitorsController.createVisitorFollowUp,
);
visitorsRouter.post(
  '/:visitorId/follow-ups/:followUpId/complete',
  completeFollowUpValidation,
  validate,
  visitorsController.completeVisitorFollowUp,
);
visitorsRouter.patch(
  '/:visitorId/follow-ups/:followUpId/reschedule',
  rescheduleFollowUpValidation,
  validate,
  visitorsController.rescheduleVisitorFollowUp,
);
visitorsRouter.post(
  '/:visitorId/convert',
  auditMiddleware('visitors', 'Visitor', { action: 'STATUS_CHANGE' }),
  convertVisitorValidation,
  validate,
  visitorsController.convertVisitorToMember,
);

adminVisitorsRouter.use(auth, isSuperAdmin);
adminVisitorsRouter.get('/overview', visitorsController.getPlatformVisitorOverview);

export { visitorsRouter, adminVisitorsRouter };
