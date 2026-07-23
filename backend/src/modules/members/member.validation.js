import { body } from 'express-validator';
import {
  baptismStatuses,
  healthStatuses,
  maritalStatuses,
  membershipStatuses,
  personCategories,
} from './member.model.js';

const phoneRegex = /^[+()\-\s\d]{7,20}$/;

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));

const commonValidators = [
  body('firstName').optional().trim().notEmpty().withMessage('First name is required.'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name is required.'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email must be valid.'),
  body('phone')
    .optional({ values: 'falsy' })
    .matches(phoneRegex)
    .withMessage('Phone number format is invalid.'),
  body('loginPhone')
    .optional({ values: 'falsy' })
    .matches(phoneRegex)
    .withMessage('Login phone format is invalid.'),
  body('altPhone')
    .optional({ values: 'falsy' })
    .matches(phoneRegex)
    .withMessage('Alternate phone number format is invalid.'),
  body('dateOfBirth')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Date of birth must be a valid date.'),
  body('membershipDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Membership date must be a valid date.'),
  body('baptismDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Baptism date must be a valid date.'),
  body('salvationDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Salvation date must be a valid date.'),
  body('membershipStatus')
    .optional({ values: 'falsy' })
    .isIn(membershipStatuses)
    .withMessage('Membership status is invalid.'),
  body('baptismStatus')
    .optional({ values: 'falsy' })
    .isIn(baptismStatuses)
    .withMessage('Baptism status is invalid.'),
  body('maritalStatus')
    .optional({ values: 'falsy' })
    .isIn(maritalStatuses)
    .withMessage('Marital status is invalid.'),
  body('gender')
    .optional({ values: 'falsy' })
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender is invalid.'),
  body('personCategory')
    .optional({ values: 'falsy' })
    .isIn(personCategories)
    .withMessage('Person category is invalid.'),
  body('healthScore.status')
    .optional({ values: 'falsy' })
    .isIn(healthStatuses)
    .withMessage('Health status is invalid.'),
  body('photoUrl').optional({ values: 'falsy' }).isURL().withMessage('Photo URL must be valid.'),
  body('identityDocuments.frontUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('ID front image URL must be valid.'),
  body('identityDocuments.backUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('ID back image URL must be valid.'),
  body('digitalCardUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Digital card URL must be valid.'),
  body('groupingIds').optional().isArray().withMessage('Grouping selections must be an array.'),
  body('familyRelationships')
    .optional()
    .isArray()
    .withMessage('Family relationships must be an array.'),
  body('loginUsername')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Login username is invalid.'),
  body('loginPin')
    .optional({ values: 'falsy' })
    .matches(/^\d{4,6}$/)
    .withMessage('Login PIN must be a 4 to 6 digit numeric value.'),
];

const createMemberValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  ...commonValidators,
];

const updateMemberValidation = commonValidators;

const bulkImportValidation = [
  body()
    .isArray({ min: 1, max: 500 })
    .withMessage('Bulk import payload must be an array with at most 500 items.'),
];

export { bulkImportValidation, createMemberValidation, updateMemberValidation };
