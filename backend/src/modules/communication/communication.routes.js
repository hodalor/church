import { Router } from 'express';
import { param } from 'express-validator';
import auth from '../../middleware/auth.js';
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
router.post('/broadcasts', createBroadcastValidation, validate, communicationController.createBroadcast);
router.get('/broadcasts', listValidation, validate, communicationController.listBroadcasts);
router.get(
  '/broadcasts/:broadcastId',
  [param('broadcastId').trim().notEmpty().withMessage('Broadcast ID is required.')],
  validate,
  communicationController.getBroadcast,
);
router.patch('/broadcasts/:broadcastId', updateBroadcastValidation, validate, communicationController.updateBroadcast);
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
  [param('broadcastId').trim().notEmpty().withMessage('Broadcast ID is required.')],
  validate,
  communicationController.deleteBroadcast,
);

router.get('/templates', communicationController.listTemplates);
router.post('/templates', templateValidation, validate, communicationController.createTemplate);
router.patch('/templates/:templateId', updateTemplateValidation, validate, communicationController.updateTemplate);
router.delete(
  '/templates/:templateId',
  [param('templateId').trim().notEmpty().withMessage('Template ID is required.')],
  validate,
  communicationController.deleteTemplate,
);
router.post('/templates/preview', templatePreviewValidation, validate, communicationController.previewTemplate);

router.get('/prayer-requests', communicationController.listPrayerRequests);
router.post('/prayer-requests', prayerRequestCreateValidation, validate, communicationController.createPrayerRequest);
router.patch(
  '/prayer-requests/:requestId',
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
router.post('/polls', createPollValidation, validate, communicationController.createPoll);
router.post('/polls/:pollId/close', closePollValidation, validate, communicationController.closePoll);
router.post('/polls/:pollId/vote', voteOnPollValidation, validate, communicationController.voteOnPoll);

router.get('/inbox', listValidation, validate, communicationController.listInbox);
router.get('/inbox/:messageId', inboxMessageValidation, validate, communicationController.getInboxMessage);

export default router;
