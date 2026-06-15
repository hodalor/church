import mongoose from 'mongoose';

const { Schema } = mongoose;

const ministryMemberSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    ministryId: { type: String, required: true, trim: true, index: true },
    ministryName: { type: String, trim: true },
    memberId: { type: String, required: true, trim: true },
    memberName: { type: String, trim: true },
    memberPhoto: { type: String, trim: true },
    role: { type: String, trim: true },
    joinedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'pending_approval'],
      default: 'active',
    },
    approvedBy: { type: String, trim: true },
    approvedAt: Date,
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

ministryMemberSchema.index({ tenantId: 1, ministryId: 1, memberId: 1 }, { unique: true });

const MinistryMember = mongoose.model('MinistryMember', ministryMemberSchema);

export default MinistryMember;
