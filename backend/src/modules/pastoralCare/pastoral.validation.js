import { body, param, query } from 'express-validator';
import {
  careCaseTypes,
  careStatuses,
  careUrgencyLevels,
  interactionTypes,
  milestoneTypes,
} from './models/careCase.model.js';
import { appointmentStatuses, appointmentTypes } from './models/appointment.model.js';
import {
  discipleshipStepTypes,
  discipleshipTargetGroups,
} from './models/discipleshipTrack.model.js';
import { discipleshipEnrollmentStatuses } from './models/memberDiscipleship.model.js';

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));
const validPastDate = (value) => !value || (validDate(value) && new Date(value) <= new Date());
const validFutureDate = (value) => validDate(value) && new Date(value) > new Date();

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
];

const caseIdParamValidation = [param('caseId').trim().notEmpty().withMessage('Case ID is required.')];
const appointmentIdParamValidation = [
  param('appointmentId').trim().notEmpty().withMessage('Appointment ID is required.'),
];
const trackIdParamValidation = [param('trackId').trim().notEmpty().withMessage('Track ID is required.')];
const enrollmentIdParamValidation = [
  param('enrollmentId').trim().isMongoId().withMessage('Enrollment ID must be a valid ID.'),
];
const memberIdParamValidation = [param('memberId').trim().notEmpty().withMessage('Member ID is required.')];

const listCasesValidation = [
  ...paginationValidation,
  query('status')
    .optional({ values: 'falsy' })
    .isIn(careStatuses)
    .withMessage('Care case status is invalid.'),
  query('type').optional({ values: 'falsy' }).isIn(careCaseTypes).withMessage('Care case type is invalid.'),
  query('urgency')
    .optional({ values: 'falsy' })
    .isIn(careUrgencyLevels)
    .withMessage('Care case urgency is invalid.'),
  query('assignedTo').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Assigned user is invalid.'),
  query('memberId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Member ID is invalid.'),
  query('branch').optional({ values: 'falsy' }).trim().isString().withMessage('Branch must be a string.'),
  query('tags').optional({ values: 'falsy' }).isString().withMessage('Tags must be a comma separated string.'),
  query('from').optional({ values: 'falsy' }).custom(validDate).withMessage('From date must be valid.'),
  query('to').optional({ values: 'falsy' }).custom(validDate).withMessage('To date must be valid.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const createCaseValidation = [
  body('memberId').trim().notEmpty().withMessage('Member ID is required.'),
  body('type').isIn(careCaseTypes).withMessage('Care case type is invalid.'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters.'),
  body('urgency')
    .optional({ values: 'falsy' })
    .isIn(careUrgencyLevels)
    .withMessage('Care case urgency is invalid.'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(careStatuses)
    .withMessage('Care case status is invalid.'),
  body('description').optional({ values: 'falsy' }).trim().isString().withMessage('Description must be a string.'),
  body('assignedTo').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Assigned user is invalid.'),
  body('assignedToName')
    .optional({ values: 'falsy' })
    .trim()
    .isString()
    .withMessage('Assigned user name must be a string.'),
  body('tags').optional().isArray().withMessage('Tags must be an array.'),
  body('isConfidential').optional().isBoolean().withMessage('isConfidential must be true or false.').toBoolean(),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const updateCaseValidation = [
  ...caseIdParamValidation,
  body('type')
    .optional({ values: 'falsy' })
    .isIn(careCaseTypes)
    .withMessage('Care case type is invalid.'),
  body('title')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters.'),
  body('description').optional().isString().withMessage('Description must be a string.'),
  body('urgency')
    .optional({ values: 'falsy' })
    .isIn(careUrgencyLevels)
    .withMessage('Care case urgency is invalid.'),
  body('tags').optional().isArray().withMessage('Tags must be an array.'),
  body('isConfidential').optional().isBoolean().withMessage('isConfidential must be true or false.').toBoolean(),
  body('resolutionNotes').optional().isString().withMessage('Resolution notes must be a string.'),
  body('isReferred').optional().isBoolean().withMessage('isReferred must be true or false.').toBoolean(),
  body('referredTo').optional().isString().withMessage('Referred to must be a string.'),
  body('referralNotes').optional().isString().withMessage('Referral notes must be a string.'),
];

const assignCaseValidation = [
  ...caseIdParamValidation,
  body('assignedTo').trim().notEmpty().withMessage('Assigned user ID is required.'),
];

const updateCaseStatusValidation = [
  ...caseIdParamValidation,
  body('status').isIn(careStatuses).withMessage('Care case status is invalid.'),
  body('resolutionNotes').optional().isString().withMessage('Resolution notes must be a string.'),
];

const addInteractionValidation = [
  ...caseIdParamValidation,
  body('type').isIn(interactionTypes).withMessage('Interaction type is invalid.'),
  body('summary').custom((value, { req }) => {
    if (req.body?.isConfidential === true || req.body?.isConfidential === 'true') {
      return true;
    }
    return typeof value === 'string' && value.trim().length >= 5;
  }).withMessage('Summary must be at least 5 characters when the interaction is not confidential.'),
  body('confidentialNotes').optional().isString().withMessage('Confidential notes must be a string.'),
  body('date').optional({ values: 'falsy' }).custom(validPastDate).withMessage('Date must be valid and not in the future.'),
  body('duration').optional({ values: 'falsy' }).isFloat({ min: 1 }).withMessage('Duration must be at least 1 minute.'),
  body('nextSteps').optional().isString().withMessage('Next steps must be a string.'),
  body('nextFollowUpDate').optional({ values: 'falsy' }).custom(validDate).withMessage('Next follow-up date must be valid.'),
  body('location').optional().isString().withMessage('Location must be a string.'),
  body('isConfidential').optional().isBoolean().withMessage('isConfidential must be true or false.').toBoolean(),
];

const updateInteractionValidation = [
  ...caseIdParamValidation,
  param('interactionId').trim().notEmpty().withMessage('Interaction ID is required.'),
  body('type')
    .optional({ values: 'falsy' })
    .isIn(interactionTypes)
    .withMessage('Interaction type is invalid.'),
  body('summary').optional().isString().withMessage('Summary must be a string.'),
  body('confidentialNotes').optional().isString().withMessage('Confidential notes must be a string.'),
  body('date').optional({ values: 'falsy' }).custom(validPastDate).withMessage('Date must be valid and not in the future.'),
  body('duration').optional({ values: 'falsy' }).isFloat({ min: 1 }).withMessage('Duration must be at least 1 minute.'),
  body('nextSteps').optional().isString().withMessage('Next steps must be a string.'),
  body('nextFollowUpDate').optional({ values: 'falsy' }).custom(validDate).withMessage('Next follow-up date must be valid.'),
  body('location').optional().isString().withMessage('Location must be a string.'),
  body('isConfidential').optional().isBoolean().withMessage('isConfidential must be true or false.').toBoolean(),
];

const addMilestoneValidation = [
  ...caseIdParamValidation,
  body('title').trim().notEmpty().withMessage('Milestone title is required.'),
  body('date').optional({ values: 'falsy' }).custom(validDate).withMessage('Milestone date must be valid.'),
  body('notes').optional().isString().withMessage('Milestone notes must be a string.'),
  body('type').optional({ values: 'falsy' }).isIn(milestoneTypes).withMessage('Milestone type is invalid.'),
];

const addPrayerRequestValidation = [
  ...caseIdParamValidation,
  body('request').trim().notEmpty().withMessage('Prayer request is required.'),
  body('date').optional({ values: 'falsy' }).custom(validDate).withMessage('Prayer request date must be valid.'),
];

const markPrayerAnsweredValidation = [
  ...caseIdParamValidation,
  param('prId').trim().isMongoId().withMessage('Prayer request ID must be a valid ID.'),
  body('testimonial').optional().isString().withMessage('Testimonial must be a string.'),
];

const listAppointmentsValidation = [
  ...paginationValidation,
  query('status')
    .optional({ values: 'falsy' })
    .isIn(appointmentStatuses)
    .withMessage('Appointment status is invalid.'),
  query('memberId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Member ID is invalid.'),
  query('assignedTo').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Assigned user is invalid.'),
  query('branch').optional({ values: 'falsy' }).trim().isString().withMessage('Branch must be a string.'),
  query('from').optional({ values: 'falsy' }).custom(validDate).withMessage('From date must be valid.'),
  query('to').optional({ values: 'falsy' }).custom(validDate).withMessage('To date must be valid.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const createAppointmentValidation = [
  body('memberId').trim().notEmpty().withMessage('Member ID is required.'),
  body('scheduledAt').custom(validFutureDate).withMessage('Scheduled time must be a future date.'),
  body('type').optional({ values: 'falsy' }).isIn(appointmentTypes).withMessage('Appointment type is invalid.'),
  body('assignedTo').trim().notEmpty().withMessage('Assigned user is required.'),
  body('title').optional().isString().withMessage('Title must be a string.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
  body('duration').optional({ values: 'falsy' }).isFloat({ min: 1 }).withMessage('Duration must be at least 1 minute.'),
  body('location').optional().isString().withMessage('Location must be a string.'),
  body('meetingLink').optional().isString().withMessage('Meeting link must be a string.'),
  body('isOnline').optional().isBoolean().withMessage('isOnline must be true or false.').toBoolean(),
  body('caseId').optional({ values: 'falsy' }).trim().isString().withMessage('Case ID must be a string.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const updateAppointmentValidation = [
  ...appointmentIdParamValidation,
  body('scheduledAt')
    .optional({ values: 'falsy' })
    .custom(validFutureDate)
    .withMessage('Scheduled time must be a future date.'),
  body('type').optional({ values: 'falsy' }).isIn(appointmentTypes).withMessage('Appointment type is invalid.'),
  body('assignedTo').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Assigned user is invalid.'),
  body('title').optional().isString().withMessage('Title must be a string.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
  body('duration').optional({ values: 'falsy' }).isFloat({ min: 1 }).withMessage('Duration must be at least 1 minute.'),
  body('location').optional().isString().withMessage('Location must be a string.'),
  body('meetingLink').optional().isString().withMessage('Meeting link must be a string.'),
  body('isOnline').optional().isBoolean().withMessage('isOnline must be true or false.').toBoolean(),
];

const updateAppointmentStatusValidation = [
  ...appointmentIdParamValidation,
  body('status').isIn(appointmentStatuses).withMessage('Appointment status is invalid.'),
  body('completionNotes').optional().isString().withMessage('Completion notes must be a string.'),
];

const cancelAppointmentValidation = [...appointmentIdParamValidation];

const createTrackValidation = [
  body('name').trim().isLength({ min: 3, max: 150 }).withMessage('Track name must be between 3 and 150 characters.'),
  body('description').optional().isString().withMessage('Description must be a string.'),
  body('targetGroup')
    .optional({ values: 'falsy' })
    .isIn(discipleshipTargetGroups)
    .withMessage('Target group is invalid.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false.').toBoolean(),
  body('steps').optional().isArray().withMessage('Steps must be an array.'),
  body('steps.*.stepNumber').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Step number must be at least 1.'),
  body('steps.*.title').optional().trim().notEmpty().withMessage('Step title cannot be empty.'),
  body('steps.*.type').optional({ values: 'falsy' }).isIn(discipleshipStepTypes).withMessage('Step type is invalid.'),
  body('steps.*.durationDays')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Step duration must be at least 1 day.'),
  body('steps.*.resources').optional().isArray().withMessage('Step resources must be an array.'),
  body('steps.*.isRequired').optional().isBoolean().withMessage('Step isRequired must be true or false.').toBoolean(),
];

const updateTrackValidation = [
  ...trackIdParamValidation,
  body('name')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Track name must be between 3 and 150 characters.'),
  body('description').optional().isString().withMessage('Description must be a string.'),
  body('targetGroup')
    .optional({ values: 'falsy' })
    .isIn(discipleshipTargetGroups)
    .withMessage('Target group is invalid.'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false.').toBoolean(),
  body('steps').optional().isArray().withMessage('Steps must be an array.'),
  body('steps.*.stepNumber').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Step number must be at least 1.'),
  body('steps.*.title').optional().trim().notEmpty().withMessage('Step title cannot be empty.'),
  body('steps.*.type').optional({ values: 'falsy' }).isIn(discipleshipStepTypes).withMessage('Step type is invalid.'),
  body('steps.*.durationDays')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Step duration must be at least 1 day.'),
  body('steps.*.resources').optional().isArray().withMessage('Step resources must be an array.'),
  body('steps.*.isRequired').optional().isBoolean().withMessage('Step isRequired must be true or false.').toBoolean(),
];

const listTracksValidation = [
  query('isActive').optional().isBoolean().withMessage('isActive must be true or false.').toBoolean(),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const enrollMemberValidation = [
  body('memberId').trim().notEmpty().withMessage('Member ID is required.'),
  body('trackId').trim().notEmpty().withMessage('Track ID is required.'),
  body('assignedTo').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Assigned discipler is invalid.'),
  body('assignedToName').optional({ values: 'falsy' }).isString().withMessage('Assigned discipler name must be a string.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const listEnrollmentsValidation = [
  ...paginationValidation,
  query('status')
    .optional({ values: 'falsy' })
    .isIn(discipleshipEnrollmentStatuses)
    .withMessage('Enrollment status is invalid.'),
  query('trackId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Track ID is invalid.'),
  query('memberId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Member ID is invalid.'),
  query('branch').optional({ values: 'falsy' }).trim().isString().withMessage('Branch must be a string.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const completeStepValidation = [
  ...enrollmentIdParamValidation,
  body('stepNumber').isInt({ min: 1 }).withMessage('Step number must be at least 1.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
  body('completedBy').optional().isString().withMessage('completedBy must be a string.'),
];

const updateEnrollmentStatusValidation = [
  ...enrollmentIdParamValidation,
  body('status').isIn(discipleshipEnrollmentStatuses).withMessage('Enrollment status is invalid.'),
  body('notes').optional().isString().withMessage('Notes must be a string.'),
];

const pastoralReportsValidation = [
  query('branch').optional({ values: 'falsy' }).trim().isString().withMessage('Branch must be a string.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

export {
  addInteractionValidation,
  addMilestoneValidation,
  addPrayerRequestValidation,
  appointmentIdParamValidation,
  assignCaseValidation,
  cancelAppointmentValidation,
  caseIdParamValidation,
  completeStepValidation,
  createAppointmentValidation,
  createCaseValidation,
  createTrackValidation,
  enrollMemberValidation,
  listAppointmentsValidation,
  listCasesValidation,
  listEnrollmentsValidation,
  listTracksValidation,
  markPrayerAnsweredValidation,
  memberIdParamValidation,
  pastoralReportsValidation,
  trackIdParamValidation,
  updateAppointmentStatusValidation,
  updateAppointmentValidation,
  updateCaseStatusValidation,
  updateCaseValidation,
  updateEnrollmentStatusValidation,
  updateInteractionValidation,
  updateTrackValidation,
};
