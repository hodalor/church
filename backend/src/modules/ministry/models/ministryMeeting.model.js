import mongoose from 'mongoose';

const { Schema } = mongoose;

const actionPointSchema = new Schema(
  {
    task: { type: String, trim: true },
    assignedTo: { type: String, trim: true },
    dueDate: Date,
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false },
);

const ministryMeetingSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    meetingId: { type: String, unique: true, trim: true },
    ministryId: { type: String, trim: true, index: true },
    ministryName: { type: String, trim: true },
    title: { type: String, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    venue: { type: String, trim: true },
    branch: { type: String, trim: true },
    agenda: { type: String, trim: true },
    minutes: { type: String, trim: true },
    actionPoints: { type: [actionPointSchema], default: () => [] },
    serviceId: { type: String, trim: true },
    attendeeIds: { type: [String], default: () => [] },
    attendanceCount: { type: Number, default: 0 },
    absentCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    createdBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

ministryMeetingSchema.index({ tenantId: 1, ministryId: 1 });
ministryMeetingSchema.index({ tenantId: 1, date: 1 });

const MinistryMeeting = mongoose.model('MinistryMeeting', ministryMeetingSchema);

export default MinistryMeeting;
