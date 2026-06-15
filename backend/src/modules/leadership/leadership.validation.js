import { body, param } from 'express-validator';

const candidateIdParamValidation = [
  param('candidateId').trim().notEmpty().withMessage('Candidate ID is required.'),
];

const planIdParamValidation = [
  param('planId').trim().notEmpty().withMessage('Plan ID is required.'),
];

const createCandidateValidation = [
  body('memberId')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Member ID is invalid.'),
  body('memberName')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Member name is invalid.'),
];

const updateCandidateValidation = createCandidateValidation;

const createPlanValidation = [
  body('title').trim().notEmpty().withMessage('Plan title is required.'),
  body('roleName').trim().notEmpty().withMessage('Role name is required.'),
];

const updatePlanValidation = [
  body('title').optional().trim().notEmpty().withMessage('Plan title is required.'),
  body('roleName').optional().trim().notEmpty().withMessage('Role name is required.'),
];

export {
  candidateIdParamValidation,
  createCandidateValidation,
  createPlanValidation,
  planIdParamValidation,
  updateCandidateValidation,
  updatePlanValidation,
};
