import { body, param } from 'express-validator';

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));

const groupIdParamValidation = [
  param('groupId').trim().notEmpty().withMessage('Group ID is required.'),
];

const prospectIdParamValidation = [
  param('prospectId').trim().notEmpty().withMessage('Prospect ID is required.'),
];

const sessionIdParamValidation = [
  param('sessionId').trim().notEmpty().withMessage('Session ID is required.'),
];

const createGroupValidation = [
  body('name').trim().notEmpty().withMessage('Group name is required.'),
  body('startedDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Started date must be valid.'),
];

const updateGroupValidation = [
  body('name').optional().trim().notEmpty().withMessage('Group name is required.'),
];

const createProspectValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('firstContactDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('First contact date must be valid.'),
];

const updateProspectValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name is required.'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name is required.'),
];

const createSessionValidation = [
  body('date').custom(validDate).withMessage('Session date must be valid.'),
  body('attendees').optional().isArray().withMessage('Attendees must be an array.'),
];

export {
  createGroupValidation,
  createProspectValidation,
  createSessionValidation,
  groupIdParamValidation,
  prospectIdParamValidation,
  sessionIdParamValidation,
  updateGroupValidation,
  updateProspectValidation,
};
