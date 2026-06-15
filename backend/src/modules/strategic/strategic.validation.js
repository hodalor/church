import { body, param } from 'express-validator';

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));
const periodRegex = /^\d{4}-(Q[1-4]|W\d{2}|(0[1-9]|1[0-2]))$/;

const planIdParamValidation = [
  param('planId').trim().notEmpty().withMessage('Plan ID is required.'),
];

const kpiIdParamValidation = [
  param('kpiId').trim().notEmpty().withMessage('KPI ID is required.'),
];

const initiativeIdParamValidation = [
  param('initiativeId').trim().notEmpty().withMessage('Initiative ID is required.'),
];

const createPlanValidation = [
  body('title').trim().notEmpty().withMessage('Plan title is required.'),
  body('periodStart').optional({ values: 'falsy' }).custom(validDate).withMessage('Period start must be valid.'),
  body('periodEnd').optional({ values: 'falsy' }).custom(validDate).withMessage('Period end must be valid.'),
];

const updatePlanValidation = [
  body('title').optional().trim().notEmpty().withMessage('Plan title is required.'),
];

const createKpiValidation = [
  body('title').trim().notEmpty().withMessage('KPI title is required.'),
  body('measurements').optional().isArray().withMessage('Measurements must be an array.'),
  body('measurements.*.period')
    .optional({ values: 'falsy' })
    .matches(periodRegex)
    .withMessage('Measurement period must match YYYY-QN, YYYY-WNN, or YYYY-MM.'),
];

const updateKpiValidation = [
  body('title').optional().trim().notEmpty().withMessage('KPI title is required.'),
  body('measurements').optional().isArray().withMessage('Measurements must be an array.'),
  body('measurements.*.period')
    .optional({ values: 'falsy' })
    .matches(periodRegex)
    .withMessage('Measurement period must match YYYY-QN, YYYY-WNN, or YYYY-MM.'),
];

const createInitiativeValidation = [
  body('title').trim().notEmpty().withMessage('Initiative title is required.'),
  body('startDate').optional({ values: 'falsy' }).custom(validDate).withMessage('Start date must be valid.'),
  body('dueDate').optional({ values: 'falsy' }).custom(validDate).withMessage('Due date must be valid.'),
];

const updateInitiativeValidation = [
  body('title').optional().trim().notEmpty().withMessage('Initiative title is required.'),
];

export {
  createInitiativeValidation,
  createKpiValidation,
  createPlanValidation,
  initiativeIdParamValidation,
  kpiIdParamValidation,
  planIdParamValidation,
  updateInitiativeValidation,
  updateKpiValidation,
  updatePlanValidation,
};
