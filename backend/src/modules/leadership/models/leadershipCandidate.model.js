import mongoose from 'mongoose';

const { Schema } = mongoose;

const developmentStepSchema = new Schema(
  {
    title: { type: String, trim: true },
    dueDate: Date,
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false },
);

const leadershipCandidateSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    candidateId: { type: String, unique: true, trim: true },
    memberId: { type: String, trim: true },
    memberName: { type: String, trim: true },
    ministryId: { type: String, trim: true },
    ministryName: { type: String, trim: true },
    branch: { type: String, trim: true },
    currentRole: { type: String, trim: true },
    targetRole: { type: String, trim: true },
    mentorId: { type: String, trim: true },
    mentorName: { type: String, trim: true },
    readinessScore: { type: Number, default: 0 },
    successionStatus: {
      type: String,
      enum: ['identified', 'in_training', 'ready_now', 'ready_soon', 'not_ready'],
      default: 'identified',
    },
    strengths: { type: [String], default: () => [] },
    growthAreas: { type: [String], default: () => [] },
    developmentPlan: { type: [developmentStepSchema], default: () => [] },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

leadershipCandidateSchema.index({ tenantId: 1, memberId: 1 });
leadershipCandidateSchema.index({ tenantId: 1, successionStatus: 1 });

const LeadershipCandidate = mongoose.model('LeadershipCandidate', leadershipCandidateSchema);

export default LeadershipCandidate;
