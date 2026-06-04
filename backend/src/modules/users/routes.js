import { Router } from 'express';
import { body, param } from 'express-validator';
import * as userController from './controller.js';
import auth from '../../middleware/auth.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import { roles } from './model.js';
import { areCapabilitiesSupported } from '../access/capabilities.js';

const router = Router();

router.use(auth, tenantScope);

router.get('/', userController.listUsers);
router.post(
  '/',
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('pin')
      .matches(/^\d{4,6}$/)
      .withMessage('PIN must be a 4 to 6 digit numeric value.'),
    body('role').isIn(roles).withMessage('Role is invalid.'),
    body('fullName').optional({ values: 'falsy' }).trim().notEmpty(),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email must be valid.'),
    body('phone')
      .optional({ values: 'falsy' })
      .matches(/^[+()\-\s\d]{7,20}$/)
      .withMessage('Phone number format is invalid.'),
    body('allBranches').optional().isBoolean().withMessage('All branches flag must be true or false.'),
    body('assignedBranches').optional().isArray().withMessage('Assigned branches must be an array.'),
    body('memberId').optional({ values: 'falsy' }).trim().notEmpty(),
    body('photoUrl').optional({ values: 'falsy' }).isURL().withMessage('Photo URL must be valid.'),
    body('capabilities')
      .optional()
      .custom((value) => areCapabilitiesSupported(value))
      .withMessage('Capabilities contain unsupported permissions.'),
  ],
  validate,
  userController.createUser,
);
router.patch(
  '/:userId',
  [
    param('userId').isMongoId().withMessage('User ID is invalid.'),
    body('username').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Username is required.'),
    body('pin')
      .optional({ values: 'falsy' })
      .matches(/^\d{4,6}$/)
      .withMessage('PIN must be a 4 to 6 digit numeric value.'),
    body('role').optional({ values: 'falsy' }).isIn(roles).withMessage('Role is invalid.'),
    body('fullName').optional({ values: 'falsy' }).trim().notEmpty(),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email must be valid.'),
    body('phone')
      .optional({ values: 'falsy' })
      .matches(/^[+()\-\s\d]{7,20}$/)
      .withMessage('Phone number format is invalid.'),
    body('allBranches').optional().isBoolean().withMessage('All branches flag must be true or false.'),
    body('assignedBranches').optional().isArray().withMessage('Assigned branches must be an array.'),
    body('memberId').optional({ values: 'falsy' }).trim(),
    body('photoUrl').optional({ values: 'falsy' }).isURL().withMessage('Photo URL must be valid.'),
    body('capabilities')
      .optional()
      .custom((value) => areCapabilitiesSupported(value))
      .withMessage('Capabilities contain unsupported permissions.'),
  ],
  validate,
  userController.updateUser,
);

export default router;
