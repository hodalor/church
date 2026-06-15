import mongoose from 'mongoose';

const { Schema } = mongoose;

const ministryTypes = [
  'worship',
  'youth',
  'women',
  'men',
  'children',
  'elders',
  'deacons',
  'evangelism',
  'media',
  'ushers',
  'security',
  'hospitality',
  'prayer',
  'bible_study',
  'community_outreach',
  'missions',
  'family',
  'welfare',
  'drama',
  'sports',
  'other',
];

const meetingScheduleSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ['weekly', 'fortnightly', 'monthly', 'as_needed'],
    },
    dayOfWeek: Number,
    time: { type: String, trim: true },
    venue: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const ministrySchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    ministryId: { type: String, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    type: { type: String, enum: ministryTypes, default: 'other' },
    description: { type: String, trim: true },
    vision: { type: String, trim: true },
    branch: { type: String, trim: true },
    leaderId: { type: String, trim: true },
    leaderName: { type: String, trim: true },
    deputyLeaderId: { type: String, trim: true },
    deputyLeaderName: { type: String, trim: true },
    meetingSchedule: {
      type: meetingScheduleSchema,
      default: () => ({}),
    },
    memberCount: { type: Number, default: 0 },
    maxMembers: Number,
    requiresApproval: { type: Boolean, default: false },
    annualGoals: { type: [String], default: () => [] },
    currentFocus: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    establishedDate: Date,
    logoUrl: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

ministrySchema.index({ tenantId: 1, name: 1 }, { unique: true });
ministrySchema.index({ tenantId: 1, type: 1 });
ministrySchema.index({ tenantId: 1, leaderId: 1 });

const Ministry = mongoose.model('Ministry', ministrySchema);

export { ministryTypes };
export default Ministry;
