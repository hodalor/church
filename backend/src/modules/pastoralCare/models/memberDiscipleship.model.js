import mongoose from 'mongoose';

const { Schema } = mongoose;

const discipleshipEnrollmentStatuses = ['active', 'completed', 'paused', 'dropped'];

const progressSchema = new Schema(
  {
    stepNumber: Number,
    stepTitle: { type: String, trim: true },
    completedAt: Date,
    notes: { type: String, trim: true },
    completedBy: { type: String, trim: true },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false },
);

const memberDiscipleshipSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true, trim: true, lowercase: true },
    memberId: { type: String, required: true, trim: true },
    memberName: { type: String, trim: true },
    trackId: { type: String, required: true, trim: true },
    trackName: { type: String, trim: true },
    enrolledAt: { type: Date, default: Date.now },
    assignedTo: { type: String, trim: true },
    assignedToName: { type: String, trim: true },
    status: { type: String, enum: discipleshipEnrollmentStatuses, default: 'active' },
    progress: { type: [progressSchema], default: () => [] },
    completionPercent: { type: Number, default: 0 },
    completedAt: Date,
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

memberDiscipleshipSchema.index({ tenantId: 1, memberId: 1, trackId: 1 }, { unique: true });
memberDiscipleshipSchema.index({ tenantId: 1, assignedTo: 1 });
memberDiscipleshipSchema.index({ tenantId: 1, status: 1 });
memberDiscipleshipSchema.index({ tenantId: 1, memberId: 1 });

memberDiscipleshipSchema.pre('save', async function memberDiscipleshipPreSave() {
  this.updatedAt = new Date();
});

const MemberDiscipleship = mongoose.model('MemberDiscipleship', memberDiscipleshipSchema);

export { discipleshipEnrollmentStatuses };
export default MemberDiscipleship;
