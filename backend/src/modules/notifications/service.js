import NotificationLog from './notification.model.js';
import { createHttpError } from '../../utils/httpError.js';

export const getUnreadNotifications = async ({ tenantId, targetUserId }) => {
  return NotificationLog.find({
    tenantId,
    isRead: false,
    $or: [{ targetUserId }, { targetUserId: { $exists: false } }, { targetUserId: null }],
  })
    .sort({ createdAt: -1 })
    .limit(100);
};

export const markNotificationRead = async ({ tenantId, targetUserId, notificationId }) => {
  const notification = await NotificationLog.findOneAndUpdate(
    {
      _id: notificationId,
      tenantId,
      $or: [{ targetUserId }, { targetUserId: { $exists: false } }, { targetUserId: null }],
    },
    {
      isRead: true,
      readAt: new Date(),
    },
    { new: true },
  );

  if (!notification) {
    throw createHttpError(404, 'Notification not found');
  }

  return notification;
};

export const markAllNotificationsRead = async ({ tenantId, targetUserId }) => {
  const result = await NotificationLog.updateMany(
    {
      tenantId,
      isRead: false,
      $or: [{ targetUserId }, { targetUserId: { $exists: false } }, { targetUserId: null }],
    },
    {
      isRead: true,
      readAt: new Date(),
    },
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
};
