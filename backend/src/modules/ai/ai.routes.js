import { Router } from 'express';
import auth from '../../middleware/auth.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as aiController from './ai.controller.js';
import {
  aiHistoryValidation,
  announcementValidation,
  devotionalValidation,
  growthAnalysisValidation,
  meetingSummaryValidation,
  memberNarrativeValidation,
  prayerPointsValidation,
  sermonDraftValidation,
} from './ai.validation.js';

const aiRouter = Router();

aiRouter.use(auth, tenantScope);

aiRouter.post('/sermon-draft', sermonDraftValidation, validate, aiController.generateSermonDraft);
aiRouter.post('/announcement', announcementValidation, validate, aiController.generateAnnouncement);
aiRouter.post('/meeting-summary', meetingSummaryValidation, validate, aiController.generateMeetingSummary);
aiRouter.post('/member-narrative', memberNarrativeValidation, validate, aiController.generateMemberNarrative);
aiRouter.post('/growth-analysis', growthAnalysisValidation, validate, aiController.generateGrowthAnalysis);
aiRouter.post('/prayer-points', prayerPointsValidation, validate, aiController.generatePrayerPoints);
aiRouter.post('/devotional', devotionalValidation, validate, aiController.generateDevotional);
aiRouter.get('/history', aiHistoryValidation, validate, aiController.getAIRequestHistory);

export default aiRouter;
