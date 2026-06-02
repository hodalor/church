import mongoose from 'mongoose';

const { Schema } = mongoose;

export const visitorStages = [
  'new_visitor',
  'contacted',
  'second_visit',
  'connected',
  'assimilated',
  'converted',
  'inactive',
  'lost',
];

const followUpStatuses = ['pending', 'completed', 'cancelled'];
const followUpMethods = ['call', 'sms', 'whatsapp', 'email', 'visit'];
const followUpOutcomes = [
  'no_answer',
  'spoke',
  'positive',
  'negative',
  'will_return',
  'not_interested',
];

const genderOptions = ['male', 'female', 'other'];
const ageGroupOptions = ['child', 'youth', 'adult', 'senior'];
const workflowActionTypes = [
  'send_message',
  'create_follow_up',
  'notify_care_leader',
  'auto_assign_leader',
  'send_survey',
];

const memberReferenceSchema = new Schema(
  {
    memberId: { type: String, trim: true },
    memberName: { type: String, trim: true },
  },
  { _id: false },
);

const careLeaderSchema = new Schema(
  {
    id: { type: String, trim: true },
    name: { type: String, trim: true },
    role: { type: String, trim: true },
    userId: { type: String, trim: true },
    photoUrl: { type: String, trim: true },
  },
  { _id: false },
);

const visitSchema = new Schema(
  {
    date: { type: Date, required: true },
    serviceName: { type: String, trim: true },
    notes: { type: String, trim: true },
    isFirstVisit: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, versionKey: false },
);

const followUpSchema = new Schema(
  {
    method: {
      type: String,
      enum: followUpMethods,
      default: 'call',
    },
    scheduledDate: { type: Date, required: true },
    status: {
      type: String,
      enum: followUpStatuses,
      default: 'pending',
    },
    outcome: {
      type: String,
      enum: followUpOutcomes,
      default: undefined,
    },
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    completedAt: Date,
    completedBy: {
      userId: { type: String, trim: true },
      role: { type: String, trim: true },
      name: { type: String, trim: true },
    },
  },
  { _id: true, versionKey: false },
);

const stageHistorySchema = new Schema(
  {
    stage: {
      type: String,
      enum: visitorStages,
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, trim: true },
    changedByUserId: { type: String, trim: true },
    note: { type: String, trim: true },
  },
  { _id: true, versionKey: false },
);

const workflowProgressSchema = new Schema(
  {
    stepId: { type: String, trim: true },
    day: { type: Number, default: 0 },
    actionType: {
      type: String,
      enum: workflowActionTypes,
      required: true,
    },
    sentAt: Date,
    status: { type: String, trim: true, default: 'pending' },
    summary: { type: String, trim: true },
  },
  { _id: true, versionKey: false },
);

const surveySchema = new Schema(
  {
    experience: Number,
    serviceQuality: Number,
    welcomeFeeling: Number,
    feedback: { type: String, trim: true },
    wouldReturn: Boolean,
    submittedAt: Date,
  },
  { _id: false },
);

const conversionSchema = new Schema(
  {
    memberId: { type: String, trim: true },
    convertedAt: Date,
    convertedBy: { type: String, trim: true },
    membershipStatus: { type: String, trim: true },
    baptismStatus: { type: String, trim: true },
    salvationDate: Date,
  },
  { _id: false },
);

const visitorSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true, trim: true, lowercase: true },
    visitorId: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    gender: { type: String, enum: genderOptions, default: undefined },
    ageGroup: { type: String, enum: ageGroupOptions, default: undefined },
    heardAboutUs: { type: String, trim: true },
    referredByMember: memberReferenceSchema,
    branch: { type: String, trim: true },
    firstVisitDate: { type: Date, required: true },
    interests: { type: [String], default: () => [] },
    prayerRequest: { type: String, trim: true },
    notes: { type: String, trim: true },
    photoUrl: { type: String, trim: true },
    stage: {
      type: String,
      enum: visitorStages,
      default: 'new_visitor',
    },
    stageChangedAt: { type: Date, default: Date.now },
    assignedTo: careLeaderSchema,
    converted: { type: Boolean, default: false },
    convertedAt: Date,
    conversion: conversionSchema,
    visits: { type: [visitSchema], default: () => [] },
    followUps: { type: [followUpSchema], default: () => [] },
    stageHistory: { type: [stageHistorySchema], default: () => [] },
    workflowProgress: { type: [workflowProgressSchema], default: () => [] },
    survey: surveySchema,
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

visitorSchema.index({ tenantId: 1, visitorId: 1 }, { unique: true });
visitorSchema.index({ tenantId: 1, phone: 1 });
visitorSchema.index({ tenantId: 1, email: 1 });
visitorSchema.index({ tenantId: 1, stage: 1, branch: 1 });
visitorSchema.index({ tenantId: 1, 'assignedTo.userId': 1 });
visitorSchema.index({ tenantId: 1, firstVisitDate: -1 });
visitorSchema.index({ tenantId: 1, lastName: 1, firstName: 1 });
visitorSchema.index({
  firstName: 'text',
  lastName: 'text',
  phone: 'text',
  email: 'text',
  visitorId: 'text',
});

visitorSchema.statics.generateNextVisitorId = async function generateNextVisitorId(tenantId) {
  const normalizedTenantId = String(tenantId || '').trim().toLowerCase();
  const latestVisitor = await this.findOne({ tenantId: normalizedTenantId })
    .sort({ createdAt: -1, _id: -1 })
    .select('visitorId');

  const currentSequence = latestVisitor?.visitorId
    ? Number(String(latestVisitor.visitorId).split('-').pop()) || 0
    : 0;

  return `VIS-${normalizedTenantId.slice(0, 3).toUpperCase()}-${String(currentSequence + 1).padStart(4, '0')}`;
};

visitorSchema.pre('save', async function visitorPreSave() {
  if (!this.visitorId) {
    this.visitorId = await this.constructor.generateNextVisitorId(this.tenantId);
  }

  if (!this.stageChangedAt) {
    this.stageChangedAt = new Date();
  }

  this.updatedAt = new Date();
});

const Visitor = mongoose.model('Visitor', visitorSchema);

export {
  ageGroupOptions,
  followUpMethods,
  followUpOutcomes,
  followUpStatuses,
  genderOptions,
  workflowActionTypes,
};
export default Visitor;
