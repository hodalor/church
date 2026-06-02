import mongoose from 'mongoose';

const channelOptions = ['sms', 'email', 'whatsapp', 'push', 'in_app'];
const broadcastStatuses = ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'];
const audienceTypes = [
  'all_members',
  'branch',
  'department',
  'cell_group',
  'role',
  'specific_members',
  'first_timers',
  'failed_recipients',
  'birthday',
];
const broadcastTypes = ['general', 'announcement', 'reminder', 'birthday', 'follow_up', 'alert'];

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    url: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number, min: 0 },
  },
  { _id: false },
);

const audienceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: audienceTypes,
      required: true,
      default: 'all_members',
    },
    branch: { type: String, trim: true },
    departments: [{ type: String, trim: true }],
    cellGroup: { type: String, trim: true },
    role: { type: String, trim: true },
    memberIds: [{ type: String, trim: true }],
    failedRecipientIds: [{ type: String, trim: true }],
    estimatedReach: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const recurringSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    endDate: { type: Date },
    lastProcessedAt: { type: Date },
  },
  { _id: false },
);

const channelBreakdownSchema = new mongoose.Schema(
  {
    channel: { type: String, enum: channelOptions, required: true },
    sent: { type: Number, default: 0, min: 0 },
    delivered: { type: Number, default: 0, min: 0 },
    failed: { type: Number, default: 0, min: 0 },
    read: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const statsSchema = new mongoose.Schema(
  {
    totalRecipients: { type: Number, default: 0, min: 0 },
    sent: { type: Number, default: 0, min: 0 },
    delivered: { type: Number, default: 0, min: 0 },
    failed: { type: Number, default: 0, min: 0 },
    read: { type: Number, default: 0, min: 0 },
    skippedNoPhone: { type: Number, default: 0, min: 0 },
    skippedNoEmail: { type: Number, default: 0, min: 0 },
    channelBreakdown: { type: [channelBreakdownSchema], default: [] },
  },
  { _id: false },
);

const broadcastSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    type: { type: String, enum: broadcastTypes, default: 'general' },
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    channels: {
      type: [String],
      enum: channelOptions,
      default: ['in_app'],
    },
    audience: { type: audienceSchema, required: true },
    attachments: { type: [attachmentSchema], default: [] },
    status: { type: String, enum: broadcastStatuses, default: 'draft', index: true },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    recurring: { type: recurringSchema, default: () => ({ enabled: false }) },
    stats: { type: statsSchema, default: () => ({}) },
    createdBy: {
      userId: { type: String, trim: true },
      name: { type: String, trim: true },
      role: { type: String, trim: true },
    },
    duplicatedFromBroadcastId: { type: String, trim: true },
    sourceBroadcastId: { type: String, trim: true },
    lastError: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

broadcastSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
broadcastSchema.index({ tenantId: 1, scheduledAt: 1, status: 1 });

broadcastSchema.pre('save', function broadcastPreSave(next) {
  this.updatedAt = new Date();
  next();
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

export { audienceTypes, broadcastStatuses, broadcastTypes, channelOptions };
export default Broadcast;
