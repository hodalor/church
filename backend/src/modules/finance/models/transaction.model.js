import mongoose from 'mongoose';

const transactionTypes = [
  'tithe',
  'offering',
  'pledge_payment',
  'donation',
  'special_seed',
  'welfare',
  'building_fund',
  'mission_fund',
  'thanksgiving',
  'other_income',
];

const paymentMethods = [
  'cash',
  'mobile_money',
  'bank_transfer',
  'card',
  'cheque',
  'online',
  'other',
];

const generateRandomSuffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();

const transactionSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    transactionId: { type: String, unique: true, trim: true },
    type: { type: String, required: true, enum: transactionTypes },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    memberId: { type: String, trim: true },
    memberName: { type: String, trim: true },
    paymentMethod: { type: String, enum: paymentMethods, default: 'cash' },
    paymentReference: { type: String, trim: true },
    serviceDate: { type: Date, required: true },
    recordedDate: { type: Date, default: Date.now },
    branch: { type: String, trim: true },
    department: { type: String, trim: true },
    pledgeId: { type: String, trim: true },
    receiptUrl: { type: String, trim: true },
    receiptNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: String, trim: true },
    verifiedAt: { type: Date },
    isReversed: { type: Boolean, default: false },
    reversedBy: { type: String, trim: true },
    reversedAt: { type: Date },
    reversalReason: { type: String, trim: true },
    recordedBy: { type: String, required: true, trim: true },
    updatedBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

transactionSchema.index({ tenantId: 1, serviceDate: -1 });
transactionSchema.index({ tenantId: 1, memberId: 1 });
transactionSchema.index({ tenantId: 1, type: 1 });
transactionSchema.index({ tenantId: 1, isVerified: 1 });
transactionSchema.index({ tenantId: 1, branch: 1 });

transactionSchema.pre('save', async function handleTransactionBeforeSave(next) {
  this.updatedAt = new Date();

  if (!this.transactionId) {
    this.transactionId = `TXN-${this.tenantId.toUpperCase()}-${Date.now()}-${generateRandomSuffix()}`;
  }

  if (!this.receiptNumber) {
    const currentYear = new Date(this.serviceDate || Date.now()).getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);
    const sequence =
      (await this.constructor.countDocuments({
        tenantId: this.tenantId,
        createdAt: { $gte: yearStart, $lt: yearEnd },
      })) + 1;

    this.receiptNumber = `RCP-${this.tenantId.toUpperCase()}-${currentYear}-${String(sequence).padStart(5, '0')}`;
  }

  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export { transactionTypes, paymentMethods };
export default Transaction;
