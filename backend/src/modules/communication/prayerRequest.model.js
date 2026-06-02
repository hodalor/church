import mongoose from 'mongoose';

const assignedToSchema = new mongoose.Schema(
  {
    userId: { type: String, trim: true },
    name: { type: String, trim: true },
  },
  { _id: false },
);

const prayerRequestSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    memberId: { type: String, trim: true, index: true },
    createdByUserId: { type: String, trim: true, index: true },
    memberName: { type: String, trim: true },
    isAnonymous: { type: Boolean, default: false },
    title: { type: String, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Healing', 'Family', 'Finances', 'Work', 'Spiritual Growth', 'Relationships', 'Other'],
      default: 'Other',
    },
    urgency: {
      type: String,
      enum: ['normal', 'urgent', 'critical'],
      default: 'normal',
      index: true,
    },
    isPublic: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['open', 'in_prayer', 'answered'],
      default: 'open',
      index: true,
    },
    assignedTo: { type: assignedToSchema, default: undefined },
    prayerCount: { type: Number, default: 0, min: 0 },
    prayedByUserIds: { type: [String], default: [] },
    testimonial: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

prayerRequestSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

prayerRequestSchema.pre('save', function prayerRequestPreSave(next) {
  this.updatedAt = new Date();
  next();
});

const PrayerRequest = mongoose.model('PrayerRequest', prayerRequestSchema);

export default PrayerRequest;
