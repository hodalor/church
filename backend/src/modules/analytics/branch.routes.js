import { Router } from 'express';
import auth from '../../middleware/auth.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as analyticsController from './analytics.controller.js';
import {
  analyticsQueryValidation,
  branchIdParamValidation,
  createBranchValidation,
  updateBranchValidation,
} from './analytics.validation.js';

const branchesRouter = Router();

branchesRouter.use(auth, tenantScope);

branchesRouter.post('/', createBranchValidation, validate, analyticsController.createBranch);
branchesRouter.get('/', analyticsQueryValidation, validate, analyticsController.getAllBranches);
branchesRouter.get('/:branchId', branchIdParamValidation, validate, analyticsController.getBranchById);
branchesRouter.patch('/:branchId', updateBranchValidation, validate, analyticsController.updateBranch);
branchesRouter.delete(
  '/:branchId',
  branchIdParamValidation,
  validate,
  analyticsController.deactivateBranch,
);
branchesRouter.get(
  '/:branchId/metrics',
  [...branchIdParamValidation, ...analyticsQueryValidation],
  validate,
  analyticsController.getBranchMetrics,
);
branchesRouter.get(
  '/:branchId/snapshot',
  [...branchIdParamValidation, ...analyticsQueryValidation],
  validate,
  analyticsController.getBranchSnapshot,
);
branchesRouter.post(
  '/:branchId/refresh-cache',
  branchIdParamValidation,
  validate,
  analyticsController.refreshBranchCache,
);

export default branchesRouter;
