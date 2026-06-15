import { Router } from 'express';
import auth from '../../middleware/auth.js';
import requireRoles from '../../middleware/requireRoles.js';
import tenantScope from '../../middleware/tenantScope.js';
import * as familyAnalyticsController from './familyAnalytics.controller.js';

const familyAnalyticsRouter = Router();

familyAnalyticsRouter.use(auth, tenantScope, requireRoles('super_admin', 'head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'));

familyAnalyticsRouter.get('/overview', familyAnalyticsController.getFamilyOverview);
familyAnalyticsRouter.get('/segments', familyAnalyticsController.getFamilySegments);
familyAnalyticsRouter.get('/at-risk', familyAnalyticsController.getAtRiskFamilies);

export default familyAnalyticsRouter;
