import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import * as notificationService from './service.js';
import { createHttpError } from '../../utils/httpError.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId || req.body?.tenantId || req.headers['x-tenant-id'];

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for super admin notification requests.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getUnreadNotifications({
    tenantId: resolveScopedTenantId(req),
    targetUserId: req.user.userId,
  });

  return success(res, notifications, 'Notifications fetched successfully.');
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead({
    tenantId: resolveScopedTenantId(req),
    targetUserId: req.user.userId,
    notificationId: req.params.id,
  });

  return success(res, notification, 'Notification marked as read.');
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsRead({
    tenantId: resolveScopedTenantId(req),
    targetUserId: req.user.userId,
  });

  return success(res, result, 'All notifications marked as read.');
});
