import mongoose from 'mongoose';

const { Schema } = mongoose;

const attendeeSchema = new Schema(
  {
    prospectId: { type: String, trim: true },
    prospectName: { type: String, trim: true },
    isFirstTime: { type: Boolean, default: false },
  },
  { _id: false },
);

const cbsSessionSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    sessionId: { type: String, unique: true, trim: true },
    groupId: { type: String, required: true, trim: true, index: true },
    groupName: { type: String, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, trim: true },
    duration: Number,
    venue: { type: String, trim: true },
    conductedBy: { type: String, trim: true },
    studyTopic: { type: String, trim: true },
    studyReference: { type: String, trim: true },
    curriculum: { type: String, trim: true },
    attendees: { type: [attendeeSchema], default: () => [] },
    attendanceCount: { type: Number, default: 0 },
    guestsCount: { type: Number, default: 0 },
    outcomes: { type: [String], default: () => [] },
    leaderNotes: { type: String, trim: true },
    nextSessionDate: Date,
    createdBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

cbsSessionSchema.index({ tenantId: 1, groupId: 1, date: -1 });

const CBSSession = mongoose.model('CBSSession', cbsSessionSchema);

export default CBSSession;
