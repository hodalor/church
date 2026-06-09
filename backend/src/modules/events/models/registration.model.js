import mongoose from 'mongoose';

const { Schema } = mongoose;

export const registrationStatuses = ['pending', 'confirmed', 'cancelled', 'attended', 'no_show'];
export const approvalStatuses = ['pending', 'approved', 'rejected'];

const buildRegistrationId = async (tenantId, Model) => {
  const count = await Model.countDocuments({ tenantId });
  return `REG-${String(tenantId).toUpperCase()}-${String(count + 1).padStart(6, '0')}`;
};

const registrationSchema = new Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    registrationId: { type: String, unique: true, trim: true },
    eventId: { type: String, required: true, trim: true, index: true },
    eventTitle: { type: String, trim: true },
    memberId: { type: String, trim: true },
    memberName: { type: String, trim: true },
    externalName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    tierId: { type: String, trim: true },
    tierName: { type: String, trim: true },
    quantity: { type: Number, default: 1 },
    totalAmount: { type: Number, default: 0 },
    currency: { type: String, trim: true },
    isPaid: { type: Boolean, default: false },
    paymentRef: { type: String, trim: true },
    transactionId: { type: String, trim: true },
    status: { type: String, enum: registrationStatuses, default: 'pending' },
    qrCode: { type: String, trim: true },
    checkedInAt: Date,
    checkedInBy: { type: String, trim: true },
    approvalStatus: { type: String, enum: approvalStatuses, default: 'approved' },
    approvedBy: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    collection: 'event_registrations',
  },
);

registrationSchema.index({ tenantId: 1, eventId: 1 });
registrationSchema.index({ tenantId: 1, memberId: 1 });
registrationSchema.index({ tenantId: 1, status: 1 });
registrationSchema.index({ eventId: 1, qrCode: 1 });

registrationSchema.pre('save', async function registrationPreSave(next) {
  this.updatedAt = new Date();
  if (!this.registrationId) {
    this.registrationId = await buildRegistrationId(this.tenantId, this.constructor);
  }
  next();
});

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
