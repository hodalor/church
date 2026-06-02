import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    tenantId: { type: String, trim: true, index: true },
    type: {
      type: String,
      enum: [
        'birthday',
        'anniversary',
        'health_alert',
        'follow_up',
        'system',
        'broadcast',
        'announcement',
        'reminder',
        'devotional',
        'prayer_request',
      ],
      required: true,
    },
    title: { type: String, trim: true },
    memberId: { type: String, trim: true },
    memberName: { type: String, trim: true },
    targetUserId: { type: String, trim: true, index: true },
    broadcastId: { type: String, trim: true, index: true },
    mediaUrls: { type: [String], default: [] },
    message: { type: String, trim: true, required: true },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

notificationSchema.index({ tenantId: 1, targetUserId: 1, isRead: 1, createdAt: -1 });

const NotificationLog = mongoose.model('NotificationLog', notificationSchema);

export default NotificationLog;
