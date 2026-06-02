import { body, param, query } from 'express-validator';

export const broadcastPreviewValidation = [
  body('message').trim().notEmpty().withMessage('Message is required.'),
  body('audience.type').optional().isString().withMessage('Audience type must be a string.'),
  body('channels').optional().isArray().withMessage('Channels must be an array.'),
];

export const createBroadcastValidation = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('message').trim().notEmpty().withMessage('Message is required.'),
  body('channels').optional().isArray({ min: 1 }).withMessage('At least one channel is required.'),
  body('audience.type').optional().isString().withMessage('Audience type must be a string.'),
  body('status').optional().isIn(['draft', 'scheduled', 'sent']).withMessage('Invalid broadcast status.'),
  body('scheduledAt').optional({ nullable: true }).isISO8601().withMessage('Scheduled time must be a valid date.'),
];

export const updateBroadcastValidation = [
  param('broadcastId').trim().notEmpty().withMessage('Broadcast ID is required.'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.'),
  body('message').optional().trim().notEmpty().withMessage('Message cannot be empty.'),
  body('status')
    .optional()
    .isIn(['draft', 'scheduled', 'sent', 'cancelled'])
    .withMessage('Invalid broadcast status.'),
];

export const templateValidation = [
  body('name').trim().notEmpty().withMessage('Template name is required.'),
  body('body').trim().notEmpty().withMessage('Template body is required.'),
  body('channels').optional().isArray({ min: 1 }).withMessage('Channels must be an array.'),
];

export const updateTemplateValidation = [
  param('templateId').trim().notEmpty().withMessage('Template ID is required.'),
  body('name').optional().trim().notEmpty().withMessage('Template name cannot be empty.'),
  body('body').optional().trim().notEmpty().withMessage('Template body cannot be empty.'),
  body('channels').optional().isArray({ min: 1 }).withMessage('Channels must be an array.'),
];

export const templatePreviewValidation = [
  body('body').trim().notEmpty().withMessage('Body is required.'),
  body('variables').optional().isObject().withMessage('Variables must be an object.'),
];

export const prayerRequestCreateValidation = [
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters.'),
  body('category').optional().isString().withMessage('Category must be a string.'),
  body('urgency').optional().isIn(['normal', 'urgent', 'critical']).withMessage('Invalid urgency.'),
];

export const prayerRequestUpdateValidation = [
  param('requestId').trim().notEmpty().withMessage('Prayer request ID is required.'),
  body('status').optional().isIn(['open', 'in_prayer', 'answered']).withMessage('Invalid prayer request status.'),
  body('testimonial').optional({ nullable: true }).isString().withMessage('Testimonial must be a string.'),
  body('assignedToUserId')
    .optional({ nullable: true })
    .isString()
    .withMessage('Assigned user ID must be a string.'),
  body('assignToMe').optional().isBoolean().withMessage('assignToMe must be a boolean.'),
];

export const prayForRequestValidation = [
  param('requestId').trim().notEmpty().withMessage('Prayer request ID is required.'),
];

export const createPollValidation = [
  body('question').trim().notEmpty().withMessage('Question is required.'),
  body('options').isArray({ min: 2 }).withMessage('At least two options are required.'),
  body('options.*.text').trim().notEmpty().withMessage('Option text is required.'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean.'),
  body('expiresAt').optional({ nullable: true }).isISO8601().withMessage('Expiry date must be valid.'),
];

export const voteOnPollValidation = [
  param('pollId').trim().notEmpty().withMessage('Poll ID is required.'),
  body('optionId').trim().notEmpty().withMessage('Option ID is required.'),
];

export const closePollValidation = [
  param('pollId').trim().notEmpty().withMessage('Poll ID is required.'),
];

export const inboxMessageValidation = [
  param('messageId').trim().notEmpty().withMessage('Message ID is required.'),
];

export const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
];
