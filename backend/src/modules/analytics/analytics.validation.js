import { body, param, query } from 'express-validator';

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));

export const branchIdParamValidation = [
  param('branchId').trim().notEmpty().withMessage('Branch ID is required.'),
];

export const insightIdParamValidation = [
  param('insightId').isMongoId().withMessage('Insight ID is invalid.'),
];

export const createBranchValidation = [
  body('branchName').trim().isLength({ min: 2 }).withMessage('Branch name is required.'),
  body('branchCode').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Branch code is invalid.'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Branch email must be valid.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false.').toBoolean(),
  body('isHeadquarters')
    .optional()
    .isBoolean()
    .withMessage('isHeadquarters must be true or false.')
    .toBoolean(),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const updateBranchValidation = [
  ...branchIdParamValidation,
  body('branchName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2 })
    .withMessage('Branch name is invalid.'),
  body('branchCode').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Branch code is invalid.'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Branch email must be valid.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false.').toBoolean(),
  body('isHeadquarters')
    .optional()
    .isBoolean()
    .withMessage('isHeadquarters must be true or false.')
    .toBoolean(),
];

export const analyticsQueryValidation = [
  query('period')
    .optional({ values: 'falsy' })
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period is invalid.'),
  query('date').optional({ values: 'falsy' }).custom(validDate).withMessage('Date must be valid.'),
  query('from').optional({ values: 'falsy' }).custom(validDate).withMessage('From date must be valid.'),
  query('to').optional({ values: 'falsy' }).custom(validDate).withMessage('To date must be valid.'),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200.'),
  query('months').optional().isInt({ min: 3, max: 24 }).withMessage('Months must be between 3 and 24.'),
  query('year').optional().isInt({ min: 2000, max: 3000 }).withMessage('Year is invalid.'),
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month is invalid.'),
  query('metric')
    .optional({ values: 'falsy' })
    .isIn(['attendance', 'income', 'members', 'growth', 'health'])
    .withMessage('Metric is invalid.'),
  query('branchId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Branch ID is invalid.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const generateSnapshotValidation = [
  body('period')
    .optional({ values: 'falsy' })
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Period is invalid.'),
  body('snapshotDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Snapshot date must be valid.'),
  body('branchId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Branch ID is invalid.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const insightListValidation = [
  ...analyticsQueryValidation,
  query('severity')
    .optional({ values: 'falsy' })
    .isIn(['info', 'warning', 'critical'])
    .withMessage('Severity is invalid.'),
  query('isRead').optional().isBoolean().withMessage('isRead must be true or false.').toBoolean(),
  query('isActioned')
    .optional()
    .isBoolean()
    .withMessage('isActioned must be true or false.')
    .toBoolean(),
];
