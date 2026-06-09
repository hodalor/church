import { Router } from 'express';
import auth from '../../middleware/auth.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import validate from '../../middleware/validate.js';
import * as analyticsController from './analytics.controller.js';
import { analyticsQueryValidation } from './analytics.validation.js';

const platformRouter = Router();

platformRouter.use(auth, isSuperAdmin);

platformRouter.get('/overview', analyticsController.getPlatformOverview);
platformRouter.get('/growth', analyticsQueryValidation, validate, analyticsController.getPlatformGrowthTrends);
platformRouter.get('/health', analyticsController.getPlatformHealthScores);
platformRouter.get('/revenue', analyticsQueryValidation, validate, analyticsController.getPlatformRevenue);
platformRouter.get('/comparison', analyticsController.getTenantComparison);

export default platformRouter;
