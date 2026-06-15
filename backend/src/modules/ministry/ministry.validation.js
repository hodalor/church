import { body, param } from 'express-validator';
import { ministryTypes } from './models/ministry.model.js';

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));

const ministryIdParamValidation = [
  param('ministryId').trim().notEmpty().withMessage('Ministry ID is required.'),
];

const memberIdParamValidation = [
  param('memberId').trim().notEmpty().withMessage('Member ID is required.'),
];

const meetingIdParamValidation = [
  param('meetingId').trim().notEmpty().withMessage('Meeting ID is required.'),
];

const createMinistryValidation = [
  body('name').trim().notEmpty().withMessage('Ministry name is required.'),
  body('type')
    .optional({ values: 'falsy' })
    .isIn(ministryTypes)
    .withMessage('Ministry type is invalid.'),
  body('logoUrl').optional({ values: 'falsy' }).isURL().withMessage('Logo URL must be valid.'),
  body('establishedDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Established date must be a valid date.'),
];

const updateMinistryValidation = createMinistryValidation.map((validator, index) =>
  index === 0 ? body('name').optional().trim().notEmpty().withMessage('Ministry name is required.') : validator,
);

const ministryMemberValidation = [
  body('memberId').trim().notEmpty().withMessage('Member ID is required.'),
  body('role').optional({ values: 'falsy' }).trim().isLength({ min: 2 }).withMessage('Role is invalid.'),
];

const bulkAddMembersValidation = [
  body('members').isArray({ min: 1 }).withMessage('Members must be a non-empty array.'),
];

const createMeetingValidation = [
  body('date').custom(validDate).withMessage('Meeting date must be valid.'),
  body('status')
    .optional({ values: 'falsy' })
    .isIn(['scheduled', 'completed', 'cancelled'])
    .withMessage('Meeting status is invalid.'),
];

const recordMeetingAttendanceValidation = [
  body('attendeeIds').isArray().withMessage('Attendee IDs must be an array.'),
];

export {
  bulkAddMembersValidation,
  createMeetingValidation,
  createMinistryValidation,
  meetingIdParamValidation,
  memberIdParamValidation,
  ministryIdParamValidation,
  ministryMemberValidation,
  recordMeetingAttendanceValidation,
  updateMinistryValidation,
};
