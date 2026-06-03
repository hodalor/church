import mongoose from 'mongoose';

const { Schema } = mongoose;

const discipleshipTargetGroups = ['new_convert', 'member', 'worker', 'leader', 'all'];
const discipleshipStepTypes = ['class', 'reading', 'assignment', 'milestone', 'counseling', 'test'];

const discipleshipStepSchema = new Schema(
  {
    stepNumber: { type: Number, required: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: discipleshipStepTypes, default: 'class' },
    durationDays: Number,
    resources: { type: [String], default: () => [] },
    isRequired: { type: Boolean, default: true },
  },
  { _id: false },
);

const discipleshipTrackSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true, trim: true, lowercase: true },
    trackId: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    targetGroup: { type: String, enum: discipleshipTargetGroups, default: 'all' },
    isActive: { type: Boolean, default: true },
    steps: { type: [discipleshipStepSchema], default: () => [] },
    createdBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

discipleshipTrackSchema.index({ tenantId: 1, trackId: 1 }, { unique: true });
discipleshipTrackSchema.index({ tenantId: 1, isActive: 1 });
discipleshipTrackSchema.index({ tenantId: 1, name: 1 });

discipleshipTrackSchema.statics.generateNextTrackId = async function generateNextTrackId(tenantId) {
  const normalizedTenantId = String(tenantId || '').trim().toLowerCase();
  const latestTrack = await this.findOne({ tenantId: normalizedTenantId })
    .sort({ createdAt: -1, _id: -1 })
    .select('trackId');

  const currentSequence = latestTrack?.trackId ? Number(String(latestTrack.trackId).split('-').pop()) || 0 : 0;
  return `TRK-${normalizedTenantId.slice(0, 3).toUpperCase()}-${String(currentSequence + 1).padStart(4, '0')}`;
};

discipleshipTrackSchema.pre('save', async function discipleshipTrackPreSave() {
  if (!this.trackId) {
    this.trackId = await this.constructor.generateNextTrackId(this.tenantId);
  }
});

const DiscipleshipTrack = mongoose.model('DiscipleshipTrack', discipleshipTrackSchema);

export { discipleshipStepTypes, discipleshipTargetGroups };
export default DiscipleshipTrack;
