import { body, param, query } from 'express-validator';
import { eventStatuses, eventTypes } from './models/event.model.js';
import { approvalStatuses, registrationStatuses } from './models/registration.model.js';

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));

export const eventIdParamValidation = [
  param('eventId').trim().notEmpty().withMessage('Event ID is required.'),
];

export const registrationIdParamValidation = [
  param('regId').trim().notEmpty().withMessage('Registration ID is required.'),
];

export const createEventValidation = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters.'),
  body('type').optional({ values: 'falsy' }).isIn(eventTypes).withMessage('Event type is invalid.'),
  body('startDate').custom(validDate).withMessage('Start date must be valid.'),
  body('endDate')
    .optional({ values: 'falsy' })
    .custom((value, { req }) => {
      if (!validDate(value)) {
        return false;
      }

      return !req.body.startDate || new Date(value) >= new Date(req.body.startDate);
    })
    .withMessage('End date must be greater than or equal to the start date.'),
  body('maxAttendees')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Max attendees must be a positive integer.'),
  body('ticketTiers').optional().isArray().withMessage('Ticket tiers must be an array.'),
  body('ticketTiers.*.name').optional().trim().notEmpty().withMessage('Ticket tier name is required.'),
  body('ticketTiers.*.price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Ticket tier price must be 0 or more.'),
  body('ticketTiers.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ticket tier quantity must be greater than 0.'),
  body('requiresRegistration')
    .optional()
    .isBoolean()
    .withMessage('requiresRegistration must be true or false.')
    .toBoolean(),
  body('isFree').optional().isBoolean().withMessage('isFree must be true or false.').toBoolean(),
  body('isOnline').optional().isBoolean().withMessage('isOnline must be true or false.').toBoolean(),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be true or false.').toBoolean(),
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be true or false.')
    .toBoolean(),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

export const updateEventValidation = [
  ...eventIdParamValidation,
  body('title')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters.'),
  body('type').optional({ values: 'falsy' }).isIn(eventTypes).withMessage('Event type is invalid.'),
  body('startDate').optional({ values: 'falsy' }).custom(validDate).withMessage('Start date must be valid.'),
  body('endDate').optional({ values: 'falsy' }).custom(validDate).withMessage('End date must be valid.'),
  body('status').optional({ values: 'falsy' }).isIn(eventStatuses).withMessage('Event status is invalid.'),
  body('ticketTiers').optional().isArray().withMessage('Ticket tiers must be an array.'),
  body('maxAttendees')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Max attendees must be a positive integer.'),
  body('isOnline').optional().isBoolean().withMessage('isOnline must be true or false.').toBoolean(),
  body('requiresRegistration')
    .optional()
    .isBoolean()
    .withMessage('requiresRegistration must be true or false.')
    .toBoolean(),
  body('isFree').optional().isBoolean().withMessage('isFree must be true or false.').toBoolean(),
  body('isPublic').optional().isBoolean().withMessage('isPublic must be true or false.').toBoolean(),
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('requiresApproval must be true or false.')
    .toBoolean(),
];

export const listEventsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('status').optional({ values: 'falsy' }).isIn(eventStatuses).withMessage('Event status is invalid.'),
  query('type').optional({ values: 'falsy' }).isIn(eventTypes).withMessage('Event type is invalid.'),
  query('from').optional({ values: 'falsy' }).custom(validDate).withMessage('From date must be valid.'),
  query('to').optional({ values: 'falsy' }).custom(validDate).withMessage('To date must be valid.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

export const updateEventStatusValidation = [
  ...eventIdParamValidation,
  body('status').isIn(eventStatuses).withMessage('Event status is invalid.'),
];

export const registerForEventValidation = [
  ...eventIdParamValidation,
  body('phone')
    .custom((value, { req }) => {
      const memberId = req.body.memberId || req.user?.memberId;
      if (memberId) {
        return true;
      }

      return typeof value === 'string' && value.trim().length >= 7;
    })
    .withMessage('Phone is required for external registrants.'),
  body('tierId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tier ID is invalid.'),
  body('quantity')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer.'),
  body('memberId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Member ID is invalid.'),
  body('externalName')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('External name is invalid.'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email must be valid.'),
  body('isPaid').optional().isBoolean().withMessage('isPaid must be true or false.').toBoolean(),
  body('paymentRef').optional().isString().withMessage('Payment reference must be a string.'),
];

export const updateRegistrationValidation = [
  ...eventIdParamValidation,
  ...registrationIdParamValidation,
  body('status')
    .optional({ values: 'falsy' })
    .isIn(registrationStatuses)
    .withMessage('Registration status is invalid.'),
  body('approvalStatus')
    .optional({ values: 'falsy' })
    .isIn(approvalStatuses)
    .withMessage('Approval status is invalid.'),
  body('isPaid').optional().isBoolean().withMessage('isPaid must be true or false.').toBoolean(),
  body('paymentRef').optional().isString().withMessage('Payment reference must be a string.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
];

export const checkInRegistrationValidation = [
  ...eventIdParamValidation,
  ...registrationIdParamValidation,
  body('method')
    .optional({ values: 'falsy' })
    .isIn(['qr_scan', 'manual'])
    .withMessage('Check-in method is invalid.'),
];

export const approveRegistrationValidation = [
  ...eventIdParamValidation,
  ...registrationIdParamValidation,
  body('approvalStatus')
    .optional({ values: 'falsy' })
    .isIn(['approved', 'rejected'])
    .withMessage('Approval status is invalid.'),
];

export const publicEventsValidation = [
  param('identifier')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Tenant or event identifier cannot be empty.'),
  ...listEventsValidation,
];
