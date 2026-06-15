import { Router } from 'express';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import requireRoles from '../../middleware/requireRoles.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as leadershipController from './leadership.controller.js';
import {
  candidateIdParamValidation,
  createCandidateValidation,
  createPlanValidation,
  planIdParamValidation,
  updateCandidateValidation,
  updatePlanValidation,
} from './leadership.validation.js';

const leadershipRouter = Router();
const adminLeadershipRouter = Router();

leadershipRouter.use(auth, tenantScope, requireRoles('super_admin', 'head_pastor', 'associate_pastor', 'branch_pastor'));

leadershipRouter.post('/candidates', auditMiddleware('leadership', 'LeadershipCandidate'), createCandidateValidation, validate, leadershipController.createCandidate);
leadershipRouter.get('/candidates', leadershipController.getCandidates);
leadershipRouter.get('/stats', leadershipController.getLeadershipStats);
leadershipRouter.get('/reports/overview', leadershipController.getLeadershipOverview);
leadershipRouter.get('/candidates/:candidateId', candidateIdParamValidation, validate, leadershipController.getCandidateById);
leadershipRouter.patch('/candidates/:candidateId', auditMiddleware('leadership', 'LeadershipCandidate'), [...candidateIdParamValidation, ...updateCandidateValidation], validate, leadershipController.updateCandidate);

leadershipRouter.post('/plans', auditMiddleware('leadership', 'SuccessionPlan'), createPlanValidation, validate, leadershipController.createPlan);
leadershipRouter.get('/plans', leadershipController.getPlans);
leadershipRouter.get('/plans/:planId', planIdParamValidation, validate, leadershipController.getPlanById);
leadershipRouter.patch('/plans/:planId', auditMiddleware('leadership', 'SuccessionPlan'), [...planIdParamValidation, ...updatePlanValidation], validate, leadershipController.updatePlan);

adminLeadershipRouter.use(auth, isSuperAdmin);
adminLeadershipRouter.get('/leadership', leadershipController.getLeadershipAcrossTenants);

export { adminLeadershipRouter, leadershipRouter };
