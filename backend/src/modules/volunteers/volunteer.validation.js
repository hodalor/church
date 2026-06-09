import { body, param, query } from 'express-validator';
import { volunteerStatuses } from './models/volunteer.model.js';

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));

export const volunteerIdParamValidation = [
  param('volunteerId').trim().isMongoId().withMessage('Volunteer ID is invalid.'),
];

export const rosterIdParamValidation = [
  param('rosterId').trim().notEmpty().withMessage('Roster ID is required.'),
];

export const assignmentIdParamValidation = [
  param('assignmentId').trim().notEmpty().withMessage('Assignment ID is required.'),
];

export const volunteerListValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('status')
    .optional({ values: 'falsy' })
    .isIn(volunteerStatuses)
    .withMessage('Volunteer status is invalid.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
  query('date').optional({ values: 'falsy' }).custom(validDate).withMessage('Date must be valid.'),
];

export const registerVolunteerValidation = [
  body('memberId').trim().notEmpty().withMessage('Member ID is required.'),
  body('departments')
    .isArray({ min: 1 })
    .withMessage('Departments must be an array with at least one item.'),
  body('departments.*').trim().notEmpty().withMessage('Department entries cannot be empty.'),
  body('skills').optional().isArray().withMessage('Skills must be an array.'),
  body('skills.*').optional().trim().notEmpty().withMessage('Skill entries cannot be empty.'),
  body('availability').optional().isObject().withMessage('Availability must be an object.'),
  body('supervisorId')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Supervisor ID is invalid.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

export const updateVolunteerValidation = [
  ...volunteerIdParamValidation,
  body('departments')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Departments must be an array with at least one item.'),
  body('skills').optional().isArray().withMessage('Skills must be an array.'),
  body('availability').optional().isObject().withMessage('Availability must be an object.'),
  body('primaryDepartment')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Primary department is invalid.'),
  body('supervisorId')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Supervisor ID is invalid.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
];

export const updateVolunteerStatusValidation = [
  ...volunteerIdParamValidation,
  body('status').isIn(volunteerStatuses).withMessage('Volunteer status is invalid.'),
];

export const updatePerformanceValidation = [
  ...volunteerIdParamValidation,
  body('totalAssignments')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Total assignments must be 0 or more.'),
  body('attended').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Attended must be 0 or more.'),
  body('absent').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('Absent must be 0 or more.'),
  body('reliabilityScore')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0, max: 100 })
    .withMessage('Reliability score must be between 0 and 100.'),
  body('badges').optional().isArray().withMessage('Badges must be an array.'),
];

export const addTrainingValidation = [
  ...volunteerIdParamValidation,
  body('title').trim().notEmpty().withMessage('Training title is required.'),
  body('completedAt')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Completion date must be valid.'),
  body('certUrl').optional({ values: 'falsy' }).isURL().withMessage('Certificate URL must be valid.'),
  body('conductedBy')
    .optional({ values: 'falsy' })
    .trim()
    .notEmpty()
    .withMessage('Conducted by must be valid.'),
];

export const createRosterValidation = [
  body('title').trim().notEmpty().withMessage('Roster title is required.'),
  body('date').custom(validDate).withMessage('Roster date must be valid.'),
  body('branch').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Branch is invalid.'),
  body('serviceId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Service ID is invalid.'),
  body('eventId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Event ID is invalid.'),
  body('assignments').optional().isArray().withMessage('Assignments must be an array.'),
  body('assignments.*.department')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assignment department is invalid.'),
  body('assignments.*.role').optional().trim().notEmpty().withMessage('Assignment role is invalid.'),
  body('assignments.*.volunteerId')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Assignment volunteer ID is invalid.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

export const rosterListValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('from').optional({ values: 'falsy' }).custom(validDate).withMessage('From date must be valid.'),
  query('to').optional({ values: 'falsy' }).custom(validDate).withMessage('To date must be valid.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

export const updateRosterValidation = [
  ...rosterIdParamValidation,
  body('title').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Roster title is invalid.'),
  body('date').optional({ values: 'falsy' }).custom(validDate).withMessage('Roster date must be valid.'),
  body('branch').optional().isString().withMessage('Branch must be a string.'),
  body('serviceId').optional().isString().withMessage('Service ID must be a string.'),
  body('eventId').optional().isString().withMessage('Event ID must be a string.'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be true or false.').toBoolean(),
];

export const addAssignmentValidation = [
  ...rosterIdParamValidation,
  body('department').trim().notEmpty().withMessage('Department is required.'),
  body('role').trim().notEmpty().withMessage('Role is required.'),
  body('volunteerId').trim().isMongoId().withMessage('Volunteer ID is invalid.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
];

export const updateAssignmentValidation = [
  ...rosterIdParamValidation,
  ...assignmentIdParamValidation,
  body('department').optional().isString().withMessage('Department must be a string.'),
  body('role').optional().isString().withMessage('Role must be a string.'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(['assigned', 'confirmed', 'declined', 'attended', 'absent'])
    .withMessage('Assignment status is invalid.'),
  body('declinedReason').optional().isString().withMessage('Declined reason must be a string.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
];

export const autoGenerateRosterValidation = [
  body('serviceId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Service ID is invalid.'),
  body('date').custom(validDate).withMessage('Roster date must be valid.'),
  body('departments').isArray({ min: 1 }).withMessage('Departments must contain at least one item.'),
  body('volunteerCountPerDepartment')
    .isObject()
    .withMessage('Volunteer count per department must be an object.'),
  body('branch').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Branch is invalid.'),
  body('title').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Title is invalid.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

export const markAssignmentAttendanceValidation = [
  ...rosterIdParamValidation,
  ...assignmentIdParamValidation,
  body('status')
    .isIn(['attended', 'absent'])
    .withMessage('Attendance status must be attended or absent.'),
];
