import mongoose from 'mongoose';

const pledgeTypes = ['building_fund', 'missions', 'special_project', 'annual', 'other'];
const installmentFrequencies = ['weekly', 'monthly', 'quarterly', 'once'];
const pledgeStatuses = ['active', 'completed', 'defaulted', 'cancelled'];

const pledgeSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    pledgeId: { type: String, unique: true, trim: true },
    memberId: { type: String, required: true, trim: true },
    memberName: { type: String, trim: true },
    pledgeType: { type: String, enum: pledgeTypes, required: true },
    description: { type: String, trim: true },
    totalAmount: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'USD', trim: true },
    startDate: { type: Date },
    expectedEndDate: { type: Date },
    status: { type: String, enum: pledgeStatuses, default: 'active' },
    installmentPlan: {
      frequency: { type: String, enum: installmentFrequencies },
      installmentAmount: { type: Number, min: 0 },
    },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    notes: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

pledgeSchema.index({ tenantId: 1, memberId: 1 });
pledgeSchema.index({ tenantId: 1, status: 1 });
pledgeSchema.index({ tenantId: 1, pledgeType: 1 });

pledgeSchema.pre('save', async function handlePledgeBeforeSave(next) {
  this.updatedAt = new Date();
  this.balance = Math.max((this.totalAmount || 0) - (this.amountPaid || 0), 0);

  if (this.amountPaid >= this.totalAmount && this.totalAmount > 0) {
    this.status = 'completed';
  }

  if (!this.pledgeId) {
    const sequence =
      (await this.constructor.countDocuments({
        tenantId: this.tenantId,
      })) + 1;
    this.pledgeId = `PLG-${this.tenantId.toUpperCase()}-${String(sequence).padStart(5, '0')}`;
  }

  next();
});

const Pledge = mongoose.model('Pledge', pledgeSchema);

export { installmentFrequencies, pledgeStatuses, pledgeTypes };
export default Pledge;
