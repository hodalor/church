import mongoose from 'mongoose';

const { Schema } = mongoose;

const membershipStatuses = ['visitor', 'new_convert', 'member', 'worker', 'leader', 'clergy'];
const baptismStatuses = ['not_baptised', 'water', 'holy_spirit', 'both'];
const maritalStatuses = ['single', 'married', 'divorced', 'widowed'];
const healthStatuses = ['active', 'drifting', 'at_risk', 'inactive', 'new'];

const childSchema = new Schema(
  {
    name: { type: String, trim: true },
    dateOfBirth: Date,
  },
  { _id: false },
);

const familyRelationshipSchema = new Schema(
  {
    memberId: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const memberSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true, trim: true, lowercase: true },
    memberId: { type: String, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    otherName: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: Date,
    photoUrl: { type: String, trim: true },
    phone: { type: String, trim: true },
    altPhone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    gpsCoordinates: {
      lat: Number,
      lng: Number,
    },
    membershipStatus: {
      type: String,
      enum: membershipStatuses,
      default: 'member',
    },
    membershipDate: Date,
    baptismStatus: {
      type: String,
      enum: baptismStatuses,
      default: 'not_baptised',
    },
    baptismDate: Date,
    branch: { type: String, trim: true },
    department: [{ type: String, trim: true }],
    ministry: { type: String, trim: true },
    groupingIds: [{ type: String, trim: true }],
    cell_group: { type: String, trim: true },
    salvationDate: Date,
    bibleSchool: { type: Boolean, default: false },
    maritalStatus: { type: String, enum: maritalStatuses },
    spouseMemberId: { type: String, trim: true },
    children: [childSchema],
    familyGroupId: { type: String, trim: true },
    familyRelationships: {
      type: [familyRelationshipSchema],
      default: () => [],
    },
    occupation: { type: String, trim: true },
    employer: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    qrCode: { type: String, trim: true },
    digitalCardUrl: { type: String, trim: true },
    healthScore: {
      overall: { type: Number, default: 0 },
      attendance: { type: Number, default: 0 },
      giving: { type: Number, default: 0 },
      participation: { type: Number, default: 0 },
      involvement: { type: Number, default: 0 },
      lastCalculated: Date,
      status: {
        type: String,
        enum: healthStatuses,
        default: 'new',
      },
    },
    notes: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

memberSchema.index({ tenantId: 1, memberId: 1 }, { unique: true });
memberSchema.index({ tenantId: 1, phone: 1 });
memberSchema.index({ tenantId: 1, email: 1 });
memberSchema.index({ tenantId: 1, lastName: 1, firstName: 1 });
memberSchema.index({ tenantId: 1, 'healthScore.status': 1 });
memberSchema.index({ firstName: 'text', lastName: 'text', phone: 'text', email: 'text', memberId: 'text' });

memberSchema.statics.generateNextMemberId = async function generateNextMemberId(tenantId) {
  const normalizedTenantId = String(tenantId || '').trim().toLowerCase();
  const latestMember = await this.findOne({ tenantId: normalizedTenantId })
    .sort({ createdAt: -1, _id: -1 })
    .select('memberId');

  const currentSequence = latestMember?.memberId
    ? Number(String(latestMember.memberId).split('-').pop()) || 0
    : 0;

  return `${normalizedTenantId}-${String(currentSequence + 1).padStart(6, '0')}`;
};

memberSchema.pre('save', async function memberPreSave() {
  if (!this.memberId) {
    this.memberId = await this.constructor.generateNextMemberId(this.tenantId);
  }

  this.updatedAt = new Date();
});

const Member = mongoose.model('Member', memberSchema);

export { baptismStatuses, healthStatuses, maritalStatuses, membershipStatuses };
export default Member;
