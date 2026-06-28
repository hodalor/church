import { Router } from 'express';
import auth from '../../middleware/auth.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as analyticsController from './analytics.controller.js';
import { analyticsQueryValidation } from './analytics.validation.js';

const hqRouter = Router();

hqRouter.use(auth, tenantScope);

hqRouter.get('/overview', analyticsQueryValidation, validate, analyticsController.getHQOverview);
hqRouter.get('/branch-comparison', analyticsQueryValidation, validate, analyticsController.getBranchComparison);
hqRouter.get('/growth-trends', analyticsQueryValidation, validate, analyticsController.getGrowthTrends);
hqRouter.get(
  '/financial-intelligence',
  analyticsQueryValidation,
  validate,
  analyticsController.getFinancialIntelligence,
);
hqRouter.get('/member-intelligence', analyticsQueryValidation, validate, analyticsController.getMemberIntelligence);
hqRouter.get('/operational-health', analyticsQueryValidation, validate, analyticsController.getOperationalHealth);
hqRouter.get('/consolidated-report', analyticsQueryValidation, validate, analyticsController.getConsolidatedReport);

export default hqRouter;
