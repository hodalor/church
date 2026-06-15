import { Router } from 'express';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import requireRoles from '../../middleware/requireRoles.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as strategicController from './strategic.controller.js';
import {
  createInitiativeValidation,
  createKpiValidation,
  createPlanValidation,
  initiativeIdParamValidation,
  kpiIdParamValidation,
  planIdParamValidation,
  updateInitiativeValidation,
  updateKpiValidation,
  updatePlanValidation,
} from './strategic.validation.js';

const strategicRouter = Router();
const adminStrategicRouter = Router();

strategicRouter.use(auth, tenantScope, requireRoles('super_admin', 'head_pastor', 'associate_pastor', 'branch_pastor', 'treasurer'));

strategicRouter.post('/plans', auditMiddleware('strategic', 'StrategicPlan'), createPlanValidation, validate, strategicController.createPlan);
strategicRouter.get('/plans', strategicController.getPlans);
strategicRouter.get('/plans/:planId', planIdParamValidation, validate, strategicController.getPlanById);
strategicRouter.patch('/plans/:planId', auditMiddleware('strategic', 'StrategicPlan'), [...planIdParamValidation, ...updatePlanValidation], validate, strategicController.updatePlan);

strategicRouter.post('/kpis', auditMiddleware('strategic', 'StrategicKPI'), createKpiValidation, validate, strategicController.createKpi);
strategicRouter.get('/kpis', strategicController.getKpis);
strategicRouter.patch('/kpis/:kpiId', auditMiddleware('strategic', 'StrategicKPI'), [...kpiIdParamValidation, ...updateKpiValidation], validate, strategicController.updateKpi);

strategicRouter.post('/initiatives', auditMiddleware('strategic', 'StrategicInitiative'), createInitiativeValidation, validate, strategicController.createInitiative);
strategicRouter.get('/initiatives', strategicController.getInitiatives);
strategicRouter.patch('/initiatives/:initiativeId', auditMiddleware('strategic', 'StrategicInitiative'), [...initiativeIdParamValidation, ...updateInitiativeValidation], validate, strategicController.updateInitiative);

strategicRouter.get('/scorecard', strategicController.getBalancedScorecard);
strategicRouter.get('/reports/overview', strategicController.getStrategicOverview);

adminStrategicRouter.use(auth, isSuperAdmin);
adminStrategicRouter.get('/strategic', strategicController.getStrategicAcrossTenants);

export { adminStrategicRouter, strategicRouter };
