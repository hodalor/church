import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import { hasAnyCapability } from '../access/capabilities.js';
import * as communicationService from './communication.service.js';
import {
  ensureBranchAccess,
  ensureDocumentBranchAccess,
  scopeBranchQuery,
} from '../../utils/branchScope.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId ||
      req.body?.tenantId ||
      req.headers['x-tenant-id'] ||
      req.params?.tenantId;

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for this communication request.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

const ensureCapability = (req, capabilityOptions) => {
  if (req.user?.role === 'super_admin') {
    return;
  }

  const requiredCapabilities = Array.isArray(capabilityOptions)
    ? capabilityOptions
    : [capabilityOptions];

  if (!hasAnyCapability(req.user?.capabilities || [], requiredCapabilities)) {
    throw createHttpError(403, 'You do not have permission for this communication action.');
  }
};

export const getDashboard = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.view', 'communication.overview.view']);
  const data = await communicationService.getCommunicationDashboard(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Communication dashboard fetched successfully.');
});

export const previewAudience = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.create', 'communication.broadcasts.create']);
  const data = await communicationService.previewBroadcastAudience(resolveScopedTenantId(req), req.body);
  return success(res, data, 'Audience preview generated successfully.');
});

export const createBroadcast = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.create', 'communication.broadcasts.create']);
  ensureBranchAccess(
    req.user,
    req.body.audience?.branch,
    'You do not have access to create communication for this branch.',
  );
  const data = await communicationService.createBroadcast(resolveScopedTenantId(req), req.body, req.user);
  return success(res, data, 'Broadcast saved successfully.', 201);
});

export const updateBroadcast = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.modify', 'communication.broadcasts.send']);
  ensureBranchAccess(
    req.user,
    req.body.audience?.branch,
    'You do not have access to update communication for this branch.',
  );
  const data = await communicationService.updateBroadcast(
    resolveScopedTenantId(req),
    req.params.broadcastId,
    req.body,
  );
  return success(res, data, 'Broadcast updated successfully.');
});

export const listBroadcasts = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.view', 'communication.broadcasts.view']);
  const data = await communicationService.getBroadcasts(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Broadcasts fetched successfully.');
});

export const getBroadcast = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.view', 'communication.broadcasts.view']);
  const data = await communicationService.getBroadcastById(
    resolveScopedTenantId(req),
    req.params.broadcastId,
  );
  ensureDocumentBranchAccess(
    req.user,
    data.audience?.branch,
    'You do not have access to this broadcast branch.',
  );
  return success(res, data, 'Broadcast fetched successfully.');
});

export const getBroadcastLogs = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.view', 'communication.broadcasts.view']);
  const data = await communicationService.getBroadcastLogs(
    resolveScopedTenantId(req),
    req.params.broadcastId,
    req.query,
  );
  return success(res, data, 'Broadcast logs fetched successfully.');
});

export const duplicateBroadcast = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.create', 'communication.broadcasts.create']);
  const data = await communicationService.duplicateBroadcast(
    resolveScopedTenantId(req),
    req.params.broadcastId,
    req.user,
  );
  return success(res, data, 'Broadcast duplicated successfully.', 201);
});

export const cancelBroadcast = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.modify', 'communication.broadcasts.send']);
  const data = await communicationService.cancelBroadcast(
    resolveScopedTenantId(req),
    req.params.broadcastId,
  );
  return success(res, data, 'Broadcast cancelled successfully.');
});

export const resendFailedBroadcast = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.modify', 'communication.broadcasts.send']);
  const data = await communicationService.resendFailedBroadcast(
    resolveScopedTenantId(req),
    req.params.broadcastId,
  );
  return success(res, data, 'Failed recipients reprocessed successfully.');
});

export const deleteBroadcast = asyncHandler(async (req, res) => {
  ensureCapability(req, 'communication.delete');
  const data = await communicationService.deleteBroadcast(
    resolveScopedTenantId(req),
    req.params.broadcastId,
  );
  return success(res, data, 'Broadcast deleted successfully.');
});

export const listTemplates = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.view', 'communication.templates.view']);
  const data = await communicationService.getTemplates(resolveScopedTenantId(req));
  return success(res, data, 'Templates fetched successfully.');
});

export const createTemplate = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.create', 'communication.templates.create']);
  const data = await communicationService.createTemplate(resolveScopedTenantId(req), req.body, req.user);
  return success(res, data, 'Template created successfully.', 201);
});

export const updateTemplate = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.modify', 'communication.templates.modify']);
  const data = await communicationService.updateTemplate(
    resolveScopedTenantId(req),
    req.params.templateId,
    req.body,
  );
  return success(res, data, 'Template updated successfully.');
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  ensureCapability(req, 'communication.delete');
  const data = await communicationService.deleteTemplate(
    resolveScopedTenantId(req),
    req.params.templateId,
  );
  return success(res, data, 'Template deleted successfully.');
});

export const previewTemplate = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.view', 'communication.templates.view']);
  const data = await communicationService.previewTemplate(req.body);
  return success(res, data, 'Template preview generated successfully.');
});

export const listPrayerRequests = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.view', 'communication.prayer_requests.view']);
  const data = await communicationService.getPrayerRequests(
    resolveScopedTenantId(req),
    req.query,
    req.user,
  );
  return success(res, data, 'Prayer requests fetched successfully.');
});

export const createPrayerRequest = asyncHandler(async (req, res) => {
  const data = await communicationService.submitPrayerRequest(resolveScopedTenantId(req), req.body, req.user);
  return success(res, data, 'Prayer request submitted successfully.', 201);
});

export const prayForRequest = asyncHandler(async (req, res) => {
  const data = await communicationService.incrementPrayerCount(
    resolveScopedTenantId(req),
    req.params.requestId,
    req.user,
  );
  return success(res, data, 'Prayer count updated successfully.');
});

export const updatePrayerRequest = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.modify', 'communication.prayer_requests.respond']);
  const data = await communicationService.updatePrayerRequestStatus(
    resolveScopedTenantId(req),
    req.params.requestId,
    req.body,
    req.user,
  );
  return success(res, data, 'Prayer request updated successfully.');
});

export const listPolls = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.view', 'communication.polls.view']);
  const data = await communicationService.getPolls(
    resolveScopedTenantId(req),
    req.user,
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Polls fetched successfully.');
});

export const createPoll = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.create', 'communication.polls.create']);
  ensureBranchAccess(req.user, req.body.audience?.branch, 'You do not have access to create polls for this branch.');
  const data = await communicationService.createPoll(resolveScopedTenantId(req), req.body, req.user);
  return success(res, data, 'Poll created successfully.', 201);
});

export const closePoll = asyncHandler(async (req, res) => {
  ensureCapability(req, ['communication.modify', 'communication.polls.modify']);
  const data = await communicationService.closePoll(resolveScopedTenantId(req), req.params.pollId);
  return success(res, data, 'Poll closed successfully.');
});

export const voteOnPoll = asyncHandler(async (req, res) => {
  const data = await communicationService.voteOnPoll(
    resolveScopedTenantId(req),
    req.params.pollId,
    req.body.optionId,
    req.user,
  );
  return success(res, data, 'Vote cast successfully.');
});

export const listInbox = asyncHandler(async (req, res) => {
  ensureCapability(req, ['notifications.view', 'communication.inbox.view']);
  const data = await communicationService.getInbox(resolveScopedTenantId(req), req.user.userId, req.query);
  return success(res, data, 'Inbox fetched successfully.');
});

export const getInboxMessage = asyncHandler(async (req, res) => {
  ensureCapability(req, ['notifications.view', 'communication.inbox.view']);
  const data = await communicationService.getInboxMessageById(
    resolveScopedTenantId(req),
    req.user.userId,
    req.params.messageId,
  );
  return success(res, data, 'Inbox message fetched successfully.');
});

export const getPlatformStats = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'super_admin') {
    throw createHttpError(403, 'Super admin access is required.');
  }

  const data = await communicationService.getPlatformCommunicationStats();
  return success(res, data, 'Platform communication stats fetched successfully.');
});
