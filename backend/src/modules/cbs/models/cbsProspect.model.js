import mongoose from 'mongoose';

const { Schema } = mongoose;

const cbsProspectSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    prospectId: { type: String, unique: true, trim: true },
    groupId: { type: String, required: true, trim: true, index: true },
    groupName: { type: String, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    ageGroup: { type: String, enum: ['youth', 'adult', 'senior'] },
    address: { type: String, trim: true },
    occupation: { type: String, trim: true },
    contactMethod: {
      type: String,
      enum: ['door_to_door', 'referral', 'workplace', 'campus', 'community_event', 'online', 'other'],
    },
    referredByMemberId: { type: String, trim: true },
    referredByName: { type: String, trim: true },
    firstContactDate: Date,
    studyStage: {
      type: String,
      enum: [
        'initial_contact',
        'interested',
        'studying',
        'advanced_study',
        'baptism_candidate',
        'baptised',
        'member',
        'inactive',
        'not_interested',
      ],
      default: 'initial_contact',
    },
    studiesAttended: { type: Number, default: 0 },
    studiesTotal: Number,
    lastStudyDate: Date,
    nextStudyDate: Date,
    baptismDate: Date,
    baptismServiceId: { type: String, trim: true },
    convertedToMemberId: { type: String, trim: true },
    convertedAt: Date,
    spiritualInterests: { type: [String], default: () => [] },
    prayerRequests: { type: [String], default: () => [] },
    challenges: { type: [String], default: () => [] },
    leaderNotes: { type: String, trim: true },
    lastContactDate: Date,
    nextFollowUpDate: Date,
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

cbsProspectSchema.index({ tenantId: 1, groupId: 1 });
cbsProspectSchema.index({ tenantId: 1, studyStage: 1 });
cbsProspectSchema.index({ tenantId: 1, phone: 1 });
cbsProspectSchema.index({ tenantId: 1, convertedToMemberId: 1 });

const CBSProspect = mongoose.model('CBSProspect', cbsProspectSchema);

export default CBSProspect;
