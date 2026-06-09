import mongoose from 'mongoose';

const { Schema } = mongoose;

const gpsCoordinatesSchema = new Schema(
  {
    lat: Number,
    lng: Number,
  },
  { _id: false },
);

const cachedMetricsSchema = new Schema(
  {
    totalMembers: { type: Number, default: 0 },
    activeMembers: { type: Number, default: 0 },
    avgSundayAttendance: { type: Number, default: 0 },
    monthlyIncome: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    volunteerCount: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
    lastUpdated: Date,
  },
  { _id: false },
);

const branchProfileSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true, trim: true, lowercase: true },
    branchId: { type: String, unique: true, trim: true },
    branchName: { type: String, required: true, trim: true },
    branchCode: { type: String, trim: true },
    headPastorId: { type: String, trim: true },
    headPastorName: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    logoUrl: { type: String, trim: true },
    gpsCoordinates: gpsCoordinatesSchema,
    establishedDate: Date,
    parentBranchId: { type: String, trim: true },
    cachedMetrics: { type: cachedMetricsSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    isHeadquarters: { type: Boolean, default: false },
    createdBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    collection: 'branch_profiles',
  },
);

branchProfileSchema.index({ tenantId: 1 });
branchProfileSchema.index({ tenantId: 1, branchCode: 1 });
branchProfileSchema.index({ tenantId: 1, branchName: 1 }, { unique: true });

branchProfileSchema.statics.generateNextBranchId = async function generateNextBranchId(tenantId) {
  const normalizedTenantId = String(tenantId || '').trim().toLowerCase();
  const latestBranch = await this.findOne({ tenantId: normalizedTenantId })
    .sort({ createdAt: -1, _id: -1 })
    .select('branchId');

  const currentSequence = latestBranch?.branchId
    ? Number(String(latestBranch.branchId).split('-').pop()) || 0
    : 0;

  return `BRN-${normalizedTenantId}-${String(currentSequence + 1).padStart(4, '0')}`;
};

branchProfileSchema.pre('save', async function branchProfilePreSave() {
  if (!this.branchId) {
    this.branchId = await this.constructor.generateNextBranchId(this.tenantId);
  }

  this.updatedAt = new Date();
});

const BranchProfile = mongoose.model('BranchProfile', branchProfileSchema);

export default BranchProfile;
