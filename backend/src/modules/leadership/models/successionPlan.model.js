import mongoose from 'mongoose';

const { Schema } = mongoose;

const successionCandidateSchema = new Schema(
  {
    candidateId: { type: String, trim: true },
    candidateName: { type: String, trim: true },
    readinessScore: { type: Number, default: 0 },
    rank: { type: Number, default: 1 },
    notes: { type: String, trim: true },
  },
  { _id: false },
);

const successionPlanSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    planId: { type: String, unique: true, trim: true },
    title: { type: String, trim: true, required: true },
    roleName: { type: String, trim: true, required: true },
    ministryId: { type: String, trim: true },
    ministryName: { type: String, trim: true },
    branch: { type: String, trim: true },
    currentHolderId: { type: String, trim: true },
    currentHolderName: { type: String, trim: true },
    emergencySuccessorId: { type: String, trim: true },
    emergencySuccessorName: { type: String, trim: true },
    targetTransitionDate: Date,
    status: {
      type: String,
      enum: ['draft', 'active', 'ready', 'completed'],
      default: 'draft',
    },
    candidates: { type: [successionCandidateSchema], default: () => [] },
    risks: { type: [String], default: () => [] },
    notes: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

successionPlanSchema.index({ tenantId: 1, status: 1 });
successionPlanSchema.index({ tenantId: 1, roleName: 1 });

const SuccessionPlan = mongoose.model('SuccessionPlan', successionPlanSchema);

export default SuccessionPlan;
