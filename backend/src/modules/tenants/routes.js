import { Router } from 'express';
import { body, param } from 'express-validator';
import * as tenantController from './controller.js';
import auth from '../../middleware/auth.js';
import isSuperAdmin from '../../middleware/isSuperAdmin.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import { areCapabilitiesSupported } from '../access/capabilities.js';

const tenantRouter = Router();
const adminTenantRouter = Router();

const tenantSettingsValidation = [
  body('logoUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Logo URL must be valid.'),
  body('branding.logoUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Client logo URL must be valid.'),
  body('content.branches')
    .optional()
    .isArray()
    .withMessage('Branches must be an array.'),
  body('content.departments')
    .optional()
    .isArray()
    .withMessage('Departments must be an array.'),
  body('content.ministries')
    .optional()
    .isArray()
    .withMessage('Ministries must be an array.'),
  body('content.groupings')
    .optional()
    .isArray()
    .withMessage('Groupings must be an array.'),
];

tenantRouter.use(auth, tenantScope);
tenantRouter.get('/me', tenantController.getTenant);
tenantRouter.patch('/me', tenantSettingsValidation, validate, tenantController.updateCurrentTenant);

adminTenantRouter.use(auth, isSuperAdmin);
adminTenantRouter.get('/', tenantController.listTenants);
adminTenantRouter.get('/analytics/overview', tenantController.getPlatformAnalytics);
adminTenantRouter.post(
  '/',
  [
    body('tenantId')
      .trim()
      .matches(/^[a-z0-9-]{3,20}$/)
      .withMessage('Tenant ID must be 3-20 lowercase letters, numbers, or hyphens.'),
    body('churchName').trim().notEmpty().withMessage('Church name is required.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('phone').trim().notEmpty().withMessage('Phone is required.'),
    body('country').trim().notEmpty().withMessage('Country is required.'),
    body('initialUsername').trim().notEmpty().withMessage('Initial username is required.'),
    body('initialPin')
      .matches(/^\d{4,6}$/)
      .withMessage('Initial PIN must be a 4 to 6 digit numeric value.'),
    ...tenantSettingsValidation,
    body('subscriptionPlan')
      .optional()
      .isIn(['small', 'medium', 'mega'])
      .withMessage('Subscription plan is invalid.'),
    body('capabilities')
      .optional()
      .custom((value) => areCapabilitiesSupported(value))
      .withMessage('Capabilities contain unsupported permissions.'),
    body('initialUserCapabilities')
      .optional()
      .custom((value) => areCapabilitiesSupported(value))
      .withMessage('Initial user capabilities contain unsupported permissions.'),
  ],
  validate,
  tenantController.createTenant,
);
adminTenantRouter.get(
  '/:tenantId',
  [param('tenantId').trim().notEmpty().withMessage('Tenant ID is required.')],
  validate,
  tenantController.getTenant,
);
adminTenantRouter.patch(
  '/:tenantId',
  [
    param('tenantId').trim().notEmpty().withMessage('Tenant ID is required.'),
    ...tenantSettingsValidation,
    body('subscriptionPlan')
      .optional()
      .isIn(['small', 'medium', 'mega'])
      .withMessage('Subscription plan is invalid.'),
    body('capabilities')
      .optional()
      .custom((value) => areCapabilitiesSupported(value))
      .withMessage('Capabilities contain unsupported permissions.'),
  ],
  validate,
  tenantController.updateTenant,
);
adminTenantRouter.patch(
  '/:tenantId/suspend',
  [param('tenantId').trim().notEmpty().withMessage('Tenant ID is required.')],
  validate,
  tenantController.suspendTenant,
);
adminTenantRouter.patch(
  '/:tenantId/activate',
  [param('tenantId').trim().notEmpty().withMessage('Tenant ID is required.')],
  validate,
  tenantController.activateTenant,
);
adminTenantRouter.delete(
  '/:tenantId',
  [param('tenantId').trim().notEmpty().withMessage('Tenant ID is required.')],
  validate,
  tenantController.deleteTenant,
);

export { tenantRouter, adminTenantRouter };
