import { body, param, query } from 'express-validator';
import { ageGroupOptions, followUpMethods, followUpOutcomes, visitorStages } from './visitor.model.js';

const phoneRegex = /^[+()\-\s\d]{7,20}$/;
const validDate = (value) => !value || !Number.isNaN(Date.parse(value));

const visitorIdParamValidation = [
  param('visitorId').trim().notEmpty().withMessage('Visitor ID is required.'),
];

const followUpIdParamValidation = [
  ...visitorIdParamValidation,
  param('followUpId').trim().notEmpty().withMessage('Follow-up ID is required.'),
];

const listVisitorsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('fromDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('From date must be valid.'),
  query('toDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('To date must be valid.'),
];

const registerVisitorValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('phone')
    .optional({ values: 'falsy' })
    .matches(phoneRegex)
    .withMessage('Phone number format is invalid.'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email must be valid.'),
  body('ageGroup')
    .optional({ values: 'falsy' })
    .isIn(ageGroupOptions)
    .withMessage('Age group is invalid.'),
  body('gender')
    .optional({ values: 'falsy' })
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender is invalid.'),
  body('firstVisitDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('First visit date must be valid.'),
  body('interests').optional().isArray().withMessage('Interests must be an array.'),
];

const duplicatePhoneValidation = [
  query('phone').trim().notEmpty().withMessage('Phone number is required.'),
];

const stageUpdateValidation = [
  ...visitorIdParamValidation,
  body('stage').trim().isIn(visitorStages).withMessage('Visitor stage is invalid.'),
  body('note').optional({ values: 'falsy' }).trim(),
];

const assignVisitorsValidation = [
  body('visitorIds')
    .isArray({ min: 1 })
    .withMessage('Visitor IDs must be a non-empty array.'),
  body('leaderId').trim().notEmpty().withMessage('Leader ID is required.'),
];

const returnVisitValidation = [
  ...visitorIdParamValidation,
  body('date').optional({ values: 'falsy' }).custom(validDate).withMessage('Visit date must be valid.'),
  body('serviceName').optional({ values: 'falsy' }).trim(),
  body('notes').optional({ values: 'falsy' }).trim(),
];

const createFollowUpValidation = [
  ...visitorIdParamValidation,
  body('method')
    .optional({ values: 'falsy' })
    .isIn(followUpMethods)
    .withMessage('Follow-up method is invalid.'),
  body('scheduledDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Scheduled date must be valid.'),
  body('notes').optional({ values: 'falsy' }).trim(),
];

const completeFollowUpValidation = [
  ...followUpIdParamValidation,
  body('outcome')
    .optional({ values: 'falsy' })
    .isIn(followUpOutcomes)
    .withMessage('Follow-up outcome is invalid.'),
  body('notes').optional({ values: 'falsy' }).trim(),
  body('nextScheduledDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Next scheduled date must be valid.'),
  body('nextMethod')
    .optional({ values: 'falsy' })
    .isIn(followUpMethods)
    .withMessage('Next follow-up method is invalid.'),
];

const rescheduleFollowUpValidation = [
  ...followUpIdParamValidation,
  body('scheduledDate')
    .custom(validDate)
    .withMessage('Scheduled date must be valid.'),
  body('method')
    .optional({ values: 'falsy' })
    .isIn(followUpMethods)
    .withMessage('Follow-up method is invalid.'),
  body('notes').optional({ values: 'falsy' }).trim(),
];

const convertVisitorValidation = [
  ...visitorIdParamValidation,
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email must be valid.'),
  body('phone')
    .optional({ values: 'falsy' })
    .matches(phoneRegex)
    .withMessage('Phone number format is invalid.'),
  body('salvationDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Salvation date must be valid.'),
];

const workflowValidation = [
  body().custom((value) => {
    const steps = Array.isArray(value) ? value : value?.steps;
    if (!Array.isArray(steps)) {
      throw new Error('Workflow payload must be an array of steps.');
    }
    return true;
  }),
];

export {
  assignVisitorsValidation,
  completeFollowUpValidation,
  convertVisitorValidation,
  createFollowUpValidation,
  duplicatePhoneValidation,
  followUpIdParamValidation,
  listVisitorsValidation,
  registerVisitorValidation,
  rescheduleFollowUpValidation,
  returnVisitValidation,
  stageUpdateValidation,
  visitorIdParamValidation,
  workflowValidation,
};
