import mongoose from 'mongoose';

const messageTemplateSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['welcome', 'birthday', 'follow_up', 'event', 'general', 'alert'],
      default: 'general',
      index: true,
    },
    channels: {
      type: [String],
      enum: ['sms', 'email', 'whatsapp', 'push', 'in_app'],
      default: ['in_app'],
    },
    subject: { type: String, trim: true },
    body: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    createdBy: {
      userId: { type: String, trim: true },
      name: { type: String, trim: true },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

messageTemplateSchema.index({ tenantId: 1, name: 1 }, { unique: true });

messageTemplateSchema.pre('save', function messageTemplatePreSave(next) {
  this.updatedAt = new Date();
  next();
});

const MessageTemplate = mongoose.model('MessageTemplate', messageTemplateSchema);

export default MessageTemplate;
