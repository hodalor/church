import mongoose from 'mongoose';

const { Schema } = mongoose;

const attendanceRecordSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    serviceId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    serviceTitle: {
      type: String,
      trim: true,
    },
    serviceDate: {
      type: Date,
      required: true,
      index: true,
    },
    memberId: {
      type: String,
      trim: true,
      index: true,
    },
    memberName: {
      type: String,
      trim: true,
    },
    attendeeType: {
      type: String,
      enum: ['member', 'visitor', 'child', 'online'],
      default: 'member',
      index: true,
    },
    checkInMethod: {
      type: String,
      enum: ['qr', 'manual', 'visitor_form', 'child_check_in', 'online'],
      default: 'manual',
      index: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    isChild: {
      type: Boolean,
      default: false,
    },
    visitorName: {
      type: String,
      trim: true,
    },
    pickupCode: {
      type: String,
      trim: true,
    },
    parentMemberId: {
      type: String,
      trim: true,
    },
    parentName: {
      type: String,
      trim: true,
    },
    childName: {
      type: String,
      trim: true,
    },
    childAge: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    firstTimer: {
      type: Boolean,
      default: false,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
      lowercase: true,
    },
    department: {
      type: [String],
      default: () => [],
    },
    checkedBy: {
      userId: { type: String, trim: true },
      role: { type: String, trim: true },
    },
    isRemoved: {
      type: Boolean,
      default: false,
      index: true,
    },
    removedAt: {
      type: Date,
    },
    removedBy: {
      userId: { type: String, trim: true },
      role: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'attendance_records',
  },
);

attendanceRecordSchema.index({ tenantId: 1, serviceId: 1, checkInTime: -1 });
attendanceRecordSchema.index({ tenantId: 1, serviceId: 1, memberId: 1 });
attendanceRecordSchema.index({ tenantId: 1, memberId: 1, serviceDate: -1 });
attendanceRecordSchema.index({ tenantId: 1, attendeeType: 1, checkInTime: -1 });

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

export default AttendanceRecord;
