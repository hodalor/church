import mongoose from 'mongoose';

const { Schema } = mongoose;

const measurementSchema = new Schema(
  {
    period: { type: String, trim: true },
    value: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const strategicKpiSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    kpiId: { type: String, unique: true, trim: true },
    planId: { type: String, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    ownerId: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    unit: { type: String, trim: true },
    baselineValue: { type: Number, default: 0 },
    targetValue: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    status: { type: String, enum: ['on_track', 'at_risk', 'off_track'], default: 'on_track' },
    measurements: { type: [measurementSchema], default: () => [] },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

strategicKpiSchema.index({ tenantId: 1, planId: 1 });

const StrategicKPI = mongoose.model('StrategicKPI', strategicKpiSchema);

export default StrategicKPI;
