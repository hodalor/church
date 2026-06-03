import mongoose from 'mongoose';

const { Schema } = mongoose;

const careCaseTypes = [
  'counseling',
  'bereavement',
  'hospital_visit',
  'home_visit',
  'welfare_support',
  'marriage_counseling',
  'addiction_support',
  'spiritual_guidance',
  'discipleship',
  'deliverance',
  'youth_care',
  'family_crisis',
  'other',
];

const careUrgencyLevels = ['low', 'normal', 'urgent', 'critical'];
const careStatuses = ['open', 'in_progress', 'on_hold', 'resolved', 'closed'];
const interactionTypes = [
  'visit',
  'call',
  'prayer',
  'counseling_session',
  'message',
  'hospital_visit',
  'group_session',
];
const supportTypes = ['food', 'medical', 'financial', 'clothing', 'housing'];
const milestoneTypes = [
  'salvation',
  'baptism',
  'deliverance',
  'restoration',
  'healing',
  'marriage_restored',
  'addiction_free',
  'other',
];

const interactionSchema = new Schema(
  {
    interactionId: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: interactionTypes, required: true },
    summary: { type: String, trim: true },
    confidentialNotes: { type: String, trim: true },
    isConfidential: { type: Boolean, default: false },
    nextSteps: { type: String, trim: true },
    nextFollowUpDate: Date,
    conductedBy: { type: String, trim: true },
    conductedByName: { type: String, trim: true },
    duration: Number,
    location: { type: String, trim: true },
  },
  { _id: false },
);

const welfareSupportSchema = new Schema(
  {
    isReceivingSupport: { type: Boolean, default: false },
    supportType: {
      type: [String],
      enum: supportTypes,
      default: () => [],
    },
    totalSupport: { type: Number, default: 0 },
    currency: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const prayerRequestSchema = new Schema(
  {
    request: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    isAnswered: { type: Boolean, default: false },
    testimonial: { type: String, trim: true },
  },
  { _id: true, versionKey: false },
);

const milestoneSchema = new Schema(
  {
    title: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    type: { type: String, enum: milestoneTypes, default: 'other' },
  },
  { _id: true, versionKey: false },
);

const careCaseSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true, trim: true, lowercase: true },
    caseId: { type: String, trim: true },
    memberId: { type: String, required: true, trim: true },
    memberName: { type: String, trim: true },
    type: { type: String, required: true, enum: careCaseTypes },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    urgency: { type: String, enum: careUrgencyLevels, default: 'normal' },
    status: { type: String, enum: careStatuses, default: 'open' },
    assignedTo: { type: String, trim: true },
    assignedToName: { type: String, trim: true },
    assignedAt: Date,
    interactions: { type: [interactionSchema], default: () => [] },
    welfareSupport: { type: welfareSupportSchema, default: () => ({}) },
    prayerRequests: { type: [prayerRequestSchema], default: () => [] },
    milestones: { type: [milestoneSchema], default: () => [] },
    resolvedAt: Date,
    resolutionNotes: { type: String, trim: true },
    isReferred: { type: Boolean, default: false },
    referredTo: { type: String, trim: true },
    referralNotes: { type: String, trim: true },
    tags: { type: [String], default: () => [] },
    isConfidential: { type: Boolean, default: false },
    createdBy: { type: String, required: true, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

careCaseSchema.index({ tenantId: 1, caseId: 1 }, { unique: true });
careCaseSchema.index({ tenantId: 1, memberId: 1 });
careCaseSchema.index({ tenantId: 1, status: 1 });
careCaseSchema.index({ tenantId: 1, assignedTo: 1 });
careCaseSchema.index({ tenantId: 1, type: 1 });
careCaseSchema.index({ tenantId: 1, urgency: 1 });

careCaseSchema.statics.generateNextCaseId = async function generateNextCaseId(tenantId) {
  const normalizedTenantId = String(tenantId || '').trim().toLowerCase();
  const latestCase = await this.findOne({ tenantId: normalizedTenantId })
    .sort({ createdAt: -1, _id: -1 })
    .select('caseId');

  const currentSequence = latestCase?.caseId ? Number(String(latestCase.caseId).split('-').pop()) || 0 : 0;
  return `CAS-${normalizedTenantId.slice(0, 3).toUpperCase()}-${String(currentSequence + 1).padStart(4, '0')}`;
};

careCaseSchema.pre('save', async function careCasePreSave() {
  if (!this.caseId) {
    this.caseId = await this.constructor.generateNextCaseId(this.tenantId);
  }

  this.updatedAt = new Date();
});

const CareCase = mongoose.model('CareCase', careCaseSchema);

export {
  careCaseTypes,
  careStatuses,
  careUrgencyLevels,
  interactionTypes,
  milestoneTypes,
  supportTypes,
};
export default CareCase;
