import { Router } from 'express';
import auth from '../../middleware/auth.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as analyticsController from './analytics.controller.js';
import {
  insightIdParamValidation,
  insightListValidation,
} from './analytics.validation.js';

const insightsRouter = Router();

insightsRouter.use(auth, tenantScope);

insightsRouter.get('/', insightListValidation, validate, analyticsController.getAllInsights);
insightsRouter.get('/critical', insightListValidation, validate, analyticsController.getCriticalInsights);
insightsRouter.patch(
  '/:insightId/read',
  insightIdParamValidation,
  validate,
  analyticsController.markInsightRead,
);
insightsRouter.patch(
  '/:insightId/actioned',
  insightIdParamValidation,
  validate,
  analyticsController.markInsightActioned,
);
insightsRouter.post('/generate', analyticsController.generateInsights);

export default insightsRouter;
