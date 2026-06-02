import mongoose from 'mongoose';

const expenseCategories = [
  'salaries',
  'utilities',
  'rent',
  'maintenance',
  'equipment',
  'events',
  'missions',
  'welfare',
  'stationery',
  'transport',
  'media',
  'outreach',
  'other',
];

const expensePaymentMethods = ['cash', 'mobile_money', 'bank_transfer', 'card', 'cheque', 'other'];
const approvalStatuses = ['pending', 'approved', 'rejected'];

const expenseSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    expenseId: { type: String, unique: true, trim: true },
    category: { type: String, required: true, enum: expenseCategories },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    expenseDate: { type: Date, required: true },
    paymentMethod: { type: String, enum: expensePaymentMethods, default: 'cash' },
    paymentReference: { type: String, trim: true },
    vendor: { type: String, trim: true },
    receiptUrl: { type: String, trim: true },
    branch: { type: String, trim: true },
    department: { type: String, trim: true },
    budgetId: { type: String, trim: true },
    approvalStatus: { type: String, enum: approvalStatuses, default: 'pending' },
    approvedBy: { type: String, trim: true },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    recordedBy: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

expenseSchema.index({ tenantId: 1, expenseDate: -1 });
expenseSchema.index({ tenantId: 1, category: 1 });
expenseSchema.index({ tenantId: 1, approvalStatus: 1 });
expenseSchema.index({ tenantId: 1, branch: 1 });

expenseSchema.pre('save', async function handleExpenseBeforeSave(next) {
  this.updatedAt = new Date();

  if (!this.expenseId) {
    const sequence =
      (await this.constructor.countDocuments({
        tenantId: this.tenantId,
      })) + 1;
    this.expenseId = `EXP-${this.tenantId.toUpperCase()}-${String(sequence).padStart(5, '0')}`;
  }

  next();
});

const Expense = mongoose.model('Expense', expenseSchema);

export { approvalStatuses, expenseCategories, expensePaymentMethods };
export default Expense;
