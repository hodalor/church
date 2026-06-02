import mongoose from 'mongoose';

const givingGoalSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    year: { type: Number, required: true },
    month: { type: Number, min: 1, max: 12 },
    targetAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

givingGoalSchema.index({ tenantId: 1, year: 1, month: 1 }, { unique: true });

const GivingGoal = mongoose.model('GivingGoal', givingGoalSchema);

export default GivingGoal;
