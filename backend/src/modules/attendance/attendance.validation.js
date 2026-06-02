import { body, param, query } from 'express-validator';

const phoneRegex = /^[+()\-\s\d]{7,20}$/;

const validDate = (value) => !value || !Number.isNaN(Date.parse(value));

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
];

const reportRangeValidation = [
  query('period')
    .optional({ values: 'falsy' })
    .isIn(['week', 'month', 'quarter', 'year', 'custom'])
    .withMessage('Period is invalid.'),
  query('from').optional({ values: 'falsy' }).custom(validDate).withMessage('From date must be valid.'),
  query('to').optional({ values: 'falsy' }).custom(validDate).withMessage('To date must be valid.'),
  query('branch').optional({ values: 'falsy' }).trim().isString().withMessage('Branch must be a string.'),
];

const serviceIdParamValidation = [
  param('serviceId').trim().isMongoId().withMessage('Service ID must be a valid ID.'),
];

const checkInIdParamValidation = [
  param('checkInId').trim().isMongoId().withMessage('Check-in ID must be a valid ID.'),
];

const listServicesValidation = [
  ...paginationValidation,
  query('status')
    .optional({ values: 'falsy' })
    .isIn(['open', 'upcoming', 'past', 'completed', 'all'])
    .withMessage('Status is invalid.'),
  query('type').optional({ values: 'falsy' }).trim().isString().withMessage('Type must be a string.'),
  query('branch').optional({ values: 'falsy' }).trim().isString().withMessage('Branch must be a string.'),
  query('from').optional({ values: 'falsy' }).custom(validDate).withMessage('From date must be valid.'),
  query('to').optional({ values: 'falsy' }).custom(validDate).withMessage('To date must be valid.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const createServiceValidation = [
  body('title').trim().notEmpty().withMessage('Service title is required.'),
  body('type').optional({ values: 'falsy' }).trim().isString().withMessage('Service type must be a string.'),
  body('date')
    .custom((value, { req }) => validDate(value || req.body.serviceDate))
    .withMessage('A valid service date is required.'),
  body('serviceDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Service date must be valid.'),
  body('startTime').optional({ values: 'falsy' }).trim().isString().withMessage('Start time must be a string.'),
  body('endTime').optional({ values: 'falsy' }).trim().isString().withMessage('End time must be a string.'),
  body('branch').optional({ values: 'falsy' }).trim().isString().withMessage('Branch must be a string.'),
  body('location').optional({ values: 'falsy' }).trim().isString().withMessage('Location must be a string.'),
  body('expectedAttendance')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Expected attendance must be zero or more.'),
  body('notes').optional({ values: 'falsy' }).trim().isString().withMessage('Notes must be a string.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const updateServiceValidation = [
  ...serviceIdParamValidation,
  body('title').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Service title cannot be empty.'),
  body('type').optional({ values: 'falsy' }).trim().isString().withMessage('Service type must be a string.'),
  body('date').optional({ values: 'falsy' }).custom(validDate).withMessage('Date must be valid.'),
  body('serviceDate')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Service date must be valid.'),
  body('startTime').optional({ values: 'falsy' }).trim().isString().withMessage('Start time must be a string.'),
  body('endTime').optional({ values: 'falsy' }).trim().isString().withMessage('End time must be a string.'),
  body('branch').optional({ values: 'falsy' }).trim().isString().withMessage('Branch must be a string.'),
  body('location').optional({ values: 'falsy' }).trim().isString().withMessage('Location must be a string.'),
  body('expectedAttendance')
    .optional({ values: 'falsy' })
    .isInt({ min: 0 })
    .withMessage('Expected attendance must be zero or more.'),
  body('notes').optional({ values: 'falsy' }).trim().isString().withMessage('Notes must be a string.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const toggleServiceCheckInValidation = [
  ...serviceIdParamValidation,
  body('isOpen').isBoolean().withMessage('isOpen must be true or false.').toBoolean(),
];

const updateOfflineCountValidation = [
  ...serviceIdParamValidation,
  body('adults').optional().isInt({ min: 0 }).withMessage('Adults must be zero or more.'),
  body('children').optional().isInt({ min: 0 }).withMessage('Children must be zero or more.'),
  body('visitors').optional().isInt({ min: 0 }).withMessage('Visitors must be zero or more.'),
];

const serviceAttendanceValidation = [
  ...serviceIdParamValidation,
  ...paginationValidation,
  query('type')
    .optional({ values: 'falsy' })
    .isIn(['member', 'visitor', 'child', 'online'])
    .withMessage('Attendance type is invalid.'),
  query('method')
    .optional({ values: 'falsy' })
    .isIn(['qr', 'manual', 'visitor_form', 'child_check_in', 'online'])
    .withMessage('Attendance method is invalid.'),
];

const removeCheckInValidation = [...serviceIdParamValidation, ...checkInIdParamValidation];

const searchCheckInMembersValidation = [
  query('search').optional({ values: 'falsy' }).trim().isString().withMessage('Search must be a string.'),
  query('limit').optional().isInt({ min: 1, max: 25 }).withMessage('Limit must be between 1 and 25.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const qrCheckInValidation = [
  ...serviceIdParamValidation,
  body().custom((value) => {
    const qrValue = value?.qrCode || value?.qrData;
    return typeof qrValue === 'string' && qrValue.trim().length > 0;
  }).withMessage('QR code data is required.'),
];

const manualCheckInValidation = [
  ...serviceIdParamValidation,
  body('memberId').trim().notEmpty().withMessage('Member ID is required.'),
];

const visitorCheckInValidation = [
  ...serviceIdParamValidation,
  body().custom((value) => {
    const visitorName = value?.name || value?.visitorName;
    return typeof visitorName === 'string' && visitorName.trim().length > 0;
  }).withMessage('Visitor name is required.'),
  body('phone')
    .optional({ values: 'falsy' })
    .matches(phoneRegex)
    .withMessage('Phone number format is invalid.'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Email must be valid.'),
  body('firstTimer').optional().isBoolean().withMessage('firstTimer must be true or false.').toBoolean(),
];

const childCheckInValidation = [
  ...serviceIdParamValidation,
  body().custom((value) => {
    const parentMemberId = value?.parentMemberId || value?.memberId;
    return typeof parentMemberId === 'string' && parentMemberId.trim().length > 0;
  }).withMessage('Parent member ID is required.'),
  body().custom((value) => {
    const childName = value?.childName || value?.name;
    return typeof childName === 'string' && childName.trim().length > 0;
  }).withMessage('Child name is required.'),
  body('childAge').optional().isInt({ min: 0 }).withMessage('Child age must be zero or more.'),
  body('age').optional().isInt({ min: 0 }).withMessage('Age must be zero or more.'),
];

const liveCheckInsValidation = [
  ...serviceIdParamValidation,
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
];

const memberAttendanceReportValidation = [
  param('memberId').trim().notEmpty().withMessage('Member ID is required.'),
  ...reportRangeValidation,
];

const absenteesValidation = [
  query('branch').optional({ values: 'falsy' }).trim().isString().withMessage('Branch must be a string.'),
  query('department').optional({ values: 'falsy' }).trim().isString().withMessage('Department must be a string.'),
  query('search').optional({ values: 'falsy' }).trim().isString().withMessage('Search must be a string.'),
  query('missedCount').optional().isInt({ min: 1, max: 8 }).withMessage('Missed count must be between 1 and 8.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID cannot be empty.'),
];

const platformAttendanceOverviewValidation = [
  query('country').optional({ values: 'falsy' }).trim().isString().withMessage('Country must be a string.'),
  query('planType')
    .optional({ values: 'falsy' })
    .isIn(['small', 'medium', 'mega'])
    .withMessage('Plan type is invalid.'),
];

export {
  absenteesValidation,
  createServiceValidation,
  liveCheckInsValidation,
  listServicesValidation,
  memberAttendanceReportValidation,
  platformAttendanceOverviewValidation,
  qrCheckInValidation,
  removeCheckInValidation,
  reportRangeValidation,
  searchCheckInMembersValidation,
  serviceAttendanceValidation,
  serviceIdParamValidation,
  toggleServiceCheckInValidation,
  updateOfflineCountValidation,
  updateServiceValidation,
  visitorCheckInValidation,
  childCheckInValidation,
  manualCheckInValidation,
};
