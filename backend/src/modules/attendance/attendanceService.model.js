import mongoose from 'mongoose';

const { Schema } = mongoose;

const serviceStatsSchema = new Schema(
  {
    total: { type: Number, default: 0 },
    totalCheckedIn: { type: Number, default: 0 },
    members: { type: Number, default: 0 },
    visitors: { type: Number, default: 0 },
    children: { type: Number, default: 0 },
    online: { type: Number, default: 0 },
    firstTimers: { type: Number, default: 0 },
    male: { type: Number, default: 0 },
    female: { type: Number, default: 0 },
  },
  { _id: false },
);

const offlineCountSchema = new Schema(
  {
    adults: { type: Number, default: 0 },
    children: { type: Number, default: 0 },
    visitors: { type: Number, default: 0 },
  },
  { _id: false },
);

const timelinePointSchema = new Schema(
  {
    label: { type: String, trim: true },
    count: { type: Number, default: 0 },
  },
  { _id: false },
);

const attendanceServiceSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      default: 'Sunday Service',
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    expectedAttendance: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    checkInOpen: {
      type: Boolean,
      default: false,
      index: true,
    },
    stats: {
      type: serviceStatsSchema,
      default: () => ({}),
    },
    offlineCount: {
      type: offlineCountSchema,
      default: () => ({}),
    },
    checkInTimeline: {
      type: [timelinePointSchema],
      default: () => [],
    },
    createdBy: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'attendance_services',
  },
);

attendanceServiceSchema.index({ tenantId: 1, date: -1 });
attendanceServiceSchema.index({ tenantId: 1, branch: 1, date: -1 });
attendanceServiceSchema.index({ tenantId: 1, type: 1, date: -1 });

const AttendanceService = mongoose.model('AttendanceService', attendanceServiceSchema);

export default AttendanceService;
