import mongoose from 'mongoose';

const { Schema } = mongoose;

const cbsScheduleSchema = new Schema(
  {
    frequency: { type: String, enum: ['weekly', 'fortnightly', 'monthly'] },
    dayOfWeek: Number,
    time: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const gpsSchema = new Schema(
  {
    lat: Number,
    lng: Number,
  },
  { _id: false },
);

const cbsGroupSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    groupId: { type: String, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    type: {
      type: String,
      enum: [
        'home_bible_study',
        'community_study',
        'workplace_study',
        'campus_study',
        'online_study',
        'other',
      ],
      default: 'home_bible_study',
    },
    leaderId: { type: String, trim: true },
    leaderName: { type: String, trim: true },
    coLeaderId: { type: String, trim: true },
    coLeaderName: { type: String, trim: true },
    supervisorId: { type: String, trim: true },
    location: { type: String, trim: true },
    zone: { type: String, trim: true },
    branch: { type: String, trim: true },
    gpsCoordinates: { type: gpsSchema, default: () => ({}) },
    meetingSchedule: { type: cbsScheduleSchema, default: () => ({}) },
    prospectCount: { type: Number, default: 0 },
    studyCount: { type: Number, default: 0 },
    convertedCount: { type: Number, default: 0 },
    studyMaterial: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    startedDate: Date,
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

cbsGroupSchema.index({ tenantId: 1, leaderId: 1 });
cbsGroupSchema.index({ tenantId: 1, zone: 1 });
cbsGroupSchema.index({ tenantId: 1, branch: 1 });

const CBSGroup = mongoose.model('CBSGroup', cbsGroupSchema);

export default CBSGroup;
