import { body, query } from 'express-validator';

export const sermonDraftValidation = [
  body('topic').trim().notEmpty().withMessage('Topic is required.'),
  body('scripture').trim().notEmpty().withMessage('Scripture is required.'),
  body('sermonType').trim().notEmpty().withMessage('Sermon type is required.'),
  body('targetAudience').trim().notEmpty().withMessage('Target audience is required.'),
  body('duration').isInt({ min: 1, max: 240 }).withMessage('Duration must be between 1 and 240 minutes.'),
  body('churchContext').optional({ values: 'falsy' }).isString().withMessage('Church context must be text.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const announcementValidation = [
  body('eventTitle').trim().notEmpty().withMessage('Event title is required.'),
  body('date').trim().notEmpty().withMessage('Date is required.'),
  body('venue').trim().notEmpty().withMessage('Venue is required.'),
  body('keyDetails').trim().notEmpty().withMessage('Key details are required.'),
  body('tone').trim().notEmpty().withMessage('Tone is required.'),
  body('channels').trim().notEmpty().withMessage('Channels are required.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const meetingSummaryValidation = [
  body('meetingTitle').trim().notEmpty().withMessage('Meeting title is required.'),
  body('meetingNotes').trim().notEmpty().withMessage('Meeting notes are required.'),
  body('attendees').optional({ values: 'falsy' }).isString().withMessage('Attendees must be text.'),
  body('desiredTone').optional({ values: 'falsy' }).isString().withMessage('Desired tone must be text.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const memberNarrativeValidation = [
  body('memberName').trim().notEmpty().withMessage('Member name is required.'),
  body('memberSummary').trim().notEmpty().withMessage('Member summary is required.'),
  body('careContext').optional({ values: 'falsy' }).isString().withMessage('Care context must be text.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const growthAnalysisValidation = [
  body('analyticsSummary').trim().notEmpty().withMessage('Analytics summary is required.'),
  body('targetPeriod').trim().notEmpty().withMessage('Target period is required.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const prayerPointsValidation = [
  body('theme').trim().notEmpty().withMessage('Theme is required.'),
  body('context').optional({ values: 'falsy' }).isString().withMessage('Context must be text.'),
  body('audience').optional({ values: 'falsy' }).isString().withMessage('Audience must be text.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const devotionalValidation = [
  body('theme').trim().notEmpty().withMessage('Theme is required.'),
  body('scripture').trim().notEmpty().withMessage('Scripture is required.'),
  body('audience').optional({ values: 'falsy' }).isString().withMessage('Audience must be text.'),
  body('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];

export const aiHistoryValidation = [
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200.'),
  query('feature').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Feature is invalid.'),
  query('tenantId').optional({ values: 'falsy' }).trim().notEmpty().withMessage('Tenant ID is invalid.'),
];
