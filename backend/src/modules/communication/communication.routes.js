import { Router } from 'express';
import { param } from 'express-validator';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as communicationController from './communication.controller.js';
import {
  broadcastPreviewValidation,
  closePollValidation,
  createBroadcastValidation,
  createPollValidation,
  inboxMessageValidation,
  listValidation,
  prayForRequestValidation,
  prayerRequestCreateValidation,
  prayerRequestUpdateValidation,
  templatePreviewValidation,
  templateValidation,
  updateTemplateValidation,
  updateBroadcastValidation,
  voteOnPollValidation,
} from './communication.validation.js';

const router = Router();

router.use(auth, tenantScope);

router.get('/dashboard', communicationController.getDashboard);
router.get('/platform', communicationController.getPlatformStats);

router.post('/broadcasts/preview', broadcastPreviewValidation, validate, communicationController.previewAudience);
router.post(
  '/broadcasts',
  auditMiddleware('communication', 'Broadcast'),
  createBroadcastValidation,
  validate,
  communicationController.createBroadcast,
);
router.get('/broadcasts', listValidation, validate, communicationController.listBroadcasts);
router.get(
  '/broadcasts/:broadcastId',
  [param('broadcastId').trim().notEmpty().withMessage('Broadcast ID is required.')],
  validate,
  communicationController.getBroadcast,
);
router.patch(
  '/broadcasts/:broadcastId',
  auditMiddleware('communication', 'Broadcast'),
  updateBroadcastValidation,
  validate,
  communicationController.updateBroadcast,
);
router.get(
  '/broadcasts/:broadcastId/logs',
  [param('broadcastId').trim().notEmpty().withMessage('Broadcast ID is required.'), ...listValidation],
  validate,
  communicationController.getBroadcastLogs,
);
router.post(
  '/broadcasts/:broadcastId/duplicate',
  [param('broadcastId').trim().notEmpty().withMessage('Broadcast ID is required.')],
  validate,
  communicationController.duplicateBroadcast,
);
router.post(
  '/broadcasts/:broadcastId/cancel',
  auditMiddleware('communication', 'Broadcast', { action: 'STATUS_CHANGE' }),
  [param('broadcastId').trim().notEmpty().withMessage('Broadcast ID is required.')],
  validate,
  communicationController.cancelBroadcast,
);
router.post(
  '/broadcasts/:broadcastId/resend-failed',
  [param('broadcastId').trim().notEmpty().withMessage('Broadcast ID is required.')],
  validate,
  communicationController.resendFailedBroadcast,
);
router.delete(
  '/broadcasts/:broadcastId',
  auditMiddleware('communication', 'Broadcast'),
  [param('broadcastId').trim().notEmpty().withMessage('Broadcast ID is required.')],
  validate,
  communicationController.deleteBroadcast,
);

router.get('/templates', communicationController.listTemplates);
router.post('/templates', auditMiddleware('communication', 'MessageTemplate'), templateValidation, validate, communicationController.createTemplate);
router.patch('/templates/:templateId', auditMiddleware('communication', 'MessageTemplate'), updateTemplateValidation, validate, communicationController.updateTemplate);
router.delete(
  '/templates/:templateId',
  auditMiddleware('communication', 'MessageTemplate'),
  [param('templateId').trim().notEmpty().withMessage('Template ID is required.')],
  validate,
  communicationController.deleteTemplate,
);
router.post('/templates/preview', templatePreviewValidation, validate, communicationController.previewTemplate);

router.get('/prayer-requests', communicationController.listPrayerRequests);
router.post('/prayer-requests', auditMiddleware('communication', 'PrayerRequest'), prayerRequestCreateValidation, validate, communicationController.createPrayerRequest);
router.patch(
  '/prayer-requests/:requestId',
  auditMiddleware('communication', 'PrayerRequest'),
  prayerRequestUpdateValidation,
  validate,
  communicationController.updatePrayerRequest,
);
router.post(
  '/prayer-requests/:requestId/pray',
  prayForRequestValidation,
  validate,
  communicationController.prayForRequest,
);

router.get('/polls', communicationController.listPolls);
router.post('/polls', auditMiddleware('communication', 'Poll'), createPollValidation, validate, communicationController.createPoll);
router.post('/polls/:pollId/close', auditMiddleware('communication', 'Poll', { action: 'STATUS_CHANGE' }), closePollValidation, validate, communicationController.closePoll);
router.post('/polls/:pollId/vote', voteOnPollValidation, validate, communicationController.voteOnPoll);

router.get('/inbox', listValidation, validate, communicationController.listInbox);
router.get('/inbox/:messageId', inboxMessageValidation, validate, communicationController.getInboxMessage);

export default router;
