import mongoose from 'mongoose';

const { Schema } = mongoose;

const strategicInitiativeSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    initiativeId: { type: String, unique: true, trim: true },
    planId: { type: String, trim: true, index: true },
    kpiId: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    ownerId: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    description: { type: String, trim: true },
    progress: { type: Number, default: 0 },
    status: { type: String, enum: ['planned', 'in_progress', 'blocked', 'completed'], default: 'planned' },
    startDate: Date,
    dueDate: Date,
    notes: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

strategicInitiativeSchema.index({ tenantId: 1, planId: 1, status: 1 });

const StrategicInitiative = mongoose.model('StrategicInitiative', strategicInitiativeSchema);

export default StrategicInitiative;
