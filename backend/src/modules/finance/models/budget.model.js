import mongoose from 'mongoose';
import { expenseCategories } from './expense.model.js';

const budgetLineSchema = new mongoose.Schema(
  {
    category: { type: String, enum: expenseCategories, trim: true },
    label: { type: String, trim: true },
    allocated: { type: Number, default: 0, min: 0 },
    spent: { type: Number, default: 0, min: 0 },
    remaining: { type: Number, default: 0 },
  },
  { _id: false },
);

const budgetSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true, index: true },
    budgetId: { type: String, unique: true, trim: true },
    title: { type: String, trim: true },
    year: { type: Number, required: true },
    month: { type: Number, min: 1, max: 12 },
    lines: { type: [budgetLineSchema], default: [] },
    totalAllocated: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
    createdBy: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
  },
);

budgetSchema.index({ tenantId: 1, year: 1, month: 1 });
budgetSchema.index({ tenantId: 1, status: 1 });

budgetSchema.pre('save', async function handleBudgetBeforeSave(next) {
  this.lines = (this.lines || []).map((line) => {
    const allocated = Number(line.allocated || 0);
    const spent = Number(line.spent || 0);
    return {
      ...line,
      remaining: allocated - spent,
    };
  });

  this.totalAllocated = this.lines.reduce((sum, line) => sum + Number(line.allocated || 0), 0);
  this.totalSpent = this.lines.reduce((sum, line) => sum + Number(line.spent || 0), 0);

  if (!this.budgetId) {
    const sequence =
      (await this.constructor.countDocuments({
        tenantId: this.tenantId,
      })) + 1;
    this.budgetId = `BDG-${this.tenantId.toUpperCase()}-${String(sequence).padStart(5, '0')}`;
  }

  next();
});

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
