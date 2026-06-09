import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import {
  analyticsActor,
  ensureAnalyticsCapability,
  resolveScopedTenantId,
} from '../analytics/analytics.access.js';
import * as aiAssistantService from './aiAssistant.service.js';

const injectRequestMeta = (req, payload = {}) => ({
  ...payload,
  tenantId: resolveScopedTenantId(req),
  requestedBy: req.user?.userId || analyticsActor(req).name || '',
});

export const generateSermonDraft = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['ai.create']);
  const data = await aiAssistantService.generateSermonDraft(injectRequestMeta(req, req.body));
  return success(res, data, 'Sermon draft generated successfully.');
});

export const generateAnnouncement = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['ai.create']);
  const data = await aiAssistantService.generateAnnouncement(injectRequestMeta(req, req.body));
  return success(res, data, 'Announcement generated successfully.');
});

export const generateMeetingSummary = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['ai.create']);
  const data = await aiAssistantService.generateMeetingSummary(injectRequestMeta(req, req.body));
  return success(res, data, 'Meeting summary generated successfully.');
});

export const generateMemberNarrative = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['ai.create']);
  const data = await aiAssistantService.generateMemberNarrative(injectRequestMeta(req, req.body));
  return success(res, data, 'Member narrative generated successfully.');
});

export const generateGrowthAnalysis = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['ai.create']);
  const data = await aiAssistantService.generateGrowthAnalysis(injectRequestMeta(req, req.body));
  return success(res, data, 'Growth analysis generated successfully.');
});

export const generatePrayerPoints = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['ai.create']);
  const data = await aiAssistantService.generatePrayerPoints(injectRequestMeta(req, req.body));
  return success(res, data, 'Prayer points generated successfully.');
});

export const generateDevotional = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['ai.create']);
  const data = await aiAssistantService.generateDevotional(injectRequestMeta(req, req.body));
  return success(res, data, 'Devotional generated successfully.');
});

export const getAIRequestHistory = asyncHandler(async (req, res) => {
  ensureAnalyticsCapability(req, ['ai.view', 'ai.history.view']);
  const data = await aiAssistantService.getAIRequestHistory(resolveScopedTenantId(req), req.query);
  return success(res, data, 'AI request history fetched successfully.');
});
