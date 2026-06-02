import mongoose from 'mongoose';

const messageLogSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    broadcastId: { type: String, trim: true, index: true },
    recipientUserId: { type: String, trim: true, index: true },
    recipientMemberId: { type: String, trim: true, index: true },
    recipientName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    channel: {
      type: String,
      enum: ['sms', 'email', 'whatsapp', 'push', 'in_app'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'skipped'],
      default: 'queued',
      index: true,
    },
    failureReason: { type: String, trim: true },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

messageLogSchema.index({ tenantId: 1, broadcastId: 1, channel: 1, createdAt: -1 });

const MessageLog = mongoose.model('MessageLog', messageLogSchema);

export default MessageLog;
