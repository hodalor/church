import { Router } from 'express';
import auth from '../../middleware/auth.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as analyticsController from './analytics.controller.js';
import {
  analyticsQueryValidation,
  generateSnapshotValidation,
} from './analytics.validation.js';

const analyticsRouter = Router();

analyticsRouter.use(auth, tenantScope);

analyticsRouter.get('/snapshots', analyticsQueryValidation, validate, analyticsController.getSnapshots);
analyticsRouter.get('/compare', analyticsQueryValidation, validate, analyticsController.comparePeriodsSnapshot);
analyticsRouter.post('/generate', generateSnapshotValidation, validate, analyticsController.generateSnapshot);

export default analyticsRouter;
