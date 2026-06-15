import mongoose from 'mongoose';

const { Schema } = mongoose;

const strategicPlanSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    planId: { type: String, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    vision: { type: String, trim: true },
    periodStart: Date,
    periodEnd: Date,
    ownerId: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    status: { type: String, enum: ['draft', 'active', 'archived', 'completed'], default: 'draft' },
    focusAreas: { type: [String], default: () => [] },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

strategicPlanSchema.index({ tenantId: 1, status: 1 });

const StrategicPlan = mongoose.model('StrategicPlan', strategicPlanSchema);

export default StrategicPlan;
