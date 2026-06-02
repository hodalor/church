import mongoose from 'mongoose';
import Transaction from './models/transaction.model.js';
import Pledge from './models/pledge.model.js';
import Expense from './models/expense.model.js';
import Budget from './models/budget.model.js';
import GivingGoal from './models/givingGoal.model.js';
import AuditLog from './models/auditLog.model.js';
import Member from '../members/member.model.js';
import Tenant from '../tenants/model.js';
import User from '../users/model.js';
import NotificationLog from '../notifications/notification.model.js';
import { createHttpError } from '../../utils/httpError.js';
import { generateReceipt } from '../../utils/receiptGenerator.js';
import { uploadBufferToSupabase } from '../../utils/supabaseStorage.js';
import { logAudit } from '../../utils/auditLogger.js';
import { ensureDocumentBranchAccess } from '../../utils/branchScope.js';

const FULL_FINANCE_ROLES = new Set(['super_admin', 'head_pastor', 'treasurer']);
const FINANCE_RECORD_ROLES = new Set(['super_admin', 'head_pastor', 'treasurer', 'finance_officer']);
const FINANCE_VIEW_ROLES = new Set([
  'super_admin',
  'head_pastor',
  'treasurer',
  'finance_officer',
  'associate_pastor',
  'branch_pastor',
]);

const transactionTypeLabels = {
  tithe: 'Tithes',
  offering: 'Offerings',
  pledge_payment: 'Pledge Payments',
  donation: 'Donations',
  special_seed: 'Special Seeds',
  welfare: 'Welfare',
  building_fund: 'Building Fund',
  mission_fund: 'Mission Fund',
  thanksgiving: 'Thanksgiving',
  other_income: 'Other Income',
};

const normalizeString = (value, { lowercase = false } = {}) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const nextValue = value.trim();
  if (!nextValue) {
    return undefined;
  }

  return lowercase ? nextValue.toLowerCase() : nextValue;
};

const parseNumber = (value) => {
  if (value === '' || value === null || typeof value === 'undefined') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDate = (value) => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const arrayify = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const roundCurrency = (value) => Number((value || 0).toFixed(2));

const sumAmount = (items, selector = (item) => item.amount || 0) =>
  roundCurrency(items.reduce((sum, item) => sum + Number(selector(item) || 0), 0));

const getMonthLabel = (date) =>
  new Date(date).toLocaleString('en-US', { month: 'short', year: 'numeric' });

const buildPagination = (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const buildPeriodRange = (period = 'month', referenceDate = new Date()) => {
  const current = new Date(referenceDate);
  let start;
  let end;
  let previousStart;
  let previousEnd;

  if (period === 'today') {
    start = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    end = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
    previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 1);
    previousEnd = new Date(start);
  } else if (period === 'week') {
    const day = current.getDay();
    start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - day);
    end = new Date(start);
    end.setDate(end.getDate() + 7);
    previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - 7);
    previousEnd = new Date(start);
  } else if (period === 'year') {
    start = new Date(current.getFullYear(), 0, 1);
    end = new Date(current.getFullYear() + 1, 0, 1);
    previousStart = new Date(current.getFullYear() - 1, 0, 1);
    previousEnd = new Date(current.getFullYear(), 0, 1);
  } else {
    start = new Date(current.getFullYear(), current.getMonth(), 1);
    end = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    previousStart = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    previousEnd = new Date(current.getFullYear(), current.getMonth(), 1);
  }

  return { start, end, previousStart, previousEnd };
};

const getActiveBudgetForDate = async (tenantId, date) => {
  const targetDate = new Date(date);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;

  return (
    (await Budget.findOne({ tenantId, year, month, status: 'active' })) ||
    Budget.findOne({ tenantId, year, month: { $exists: false }, status: 'active' })
  );
};

const updateBudgetExpenseLine = async (tenantId, expense) => {
  const budget = expense.budgetId
    ? await Budget.findOne({ tenantId, budgetId: expense.budgetId })
    : await getActiveBudgetForDate(tenantId, expense.expenseDate);

  if (!budget) {
    return null;
  }

  let matched = false;
  budget.lines = budget.lines.map((line) => {
    if (!matched && line.category === expense.category) {
      matched = true;
      const spent = Number(line.spent || 0) + Number(expense.amount || 0);
      return {
        ...line.toObject?.() || line,
        spent,
        remaining: Number(line.allocated || 0) - spent,
      };
    }

    return {
      ...line.toObject?.() || line,
      remaining: Number(line.allocated || 0) - Number(line.spent || 0),
    };
  });

  if (!matched && expense.category) {
    budget.lines.push({
      category: expense.category,
      label: expense.category.replaceAll('_', ' '),
      allocated: 0,
      spent: Number(expense.amount || 0),
      remaining: -Number(expense.amount || 0),
    });
  }

  await budget.save();
  return budget;
};

const buildTransactionFilters = (tenantId, query = {}) => {
  const filters = { tenantId };
  const types = arrayify(query.type);
  const paymentMethods = arrayify(query.paymentMethod);
  const search = normalizeString(query.search);
  const memberId = normalizeString(query.memberId);
  const branches = arrayify(query.branches || query.branch);
  const isVerified = normalizeString(query.isVerified);
  const isReversed = normalizeString(query.isReversed);
  const fromDate = parseDate(query.from || query.serviceDateFrom);
  const toDate = parseDate(query.to || query.serviceDateTo);
  const recordedFrom = parseDate(query.recordedFrom);
  const recordedTo = parseDate(query.recordedTo);
  const minAmount = parseNumber(query.minAmount);
  const maxAmount = parseNumber(query.maxAmount);

  if (types.length) {
    filters.type = { $in: types };
  }

  if (paymentMethods.length) {
    filters.paymentMethod = { $in: paymentMethods };
  }

  if (memberId) {
    filters.memberId = memberId;
  }

  if (branches.length === 1) {
    filters.branch = branches[0];
  } else if (branches.length > 1) {
    filters.branch = { $in: branches };
  }

  if (typeof isVerified !== 'undefined') {
    if (isVerified === 'true') {
      filters.isVerified = true;
    } else if (isVerified === 'false') {
      filters.isVerified = false;
    }
  }

  if (typeof isReversed !== 'undefined') {
    if (isReversed === 'true') {
      filters.isReversed = true;
    } else if (isReversed === 'false') {
      filters.isReversed = false;
    }
  }

  if (fromDate || toDate) {
    filters.serviceDate = {
      ...(fromDate ? { $gte: fromDate } : {}),
      ...(toDate ? { $lte: toDate } : {}),
    };
  }

  if (recordedFrom || recordedTo) {
    filters.recordedDate = {
      ...(recordedFrom ? { $gte: recordedFrom } : {}),
      ...(recordedTo ? { $lte: recordedTo } : {}),
    };
  }

  if (typeof minAmount !== 'undefined' || typeof maxAmount !== 'undefined') {
    filters.amount = {
      ...(typeof minAmount !== 'undefined' ? { $gte: minAmount } : {}),
      ...(typeof maxAmount !== 'undefined' ? { $lte: maxAmount } : {}),
    };
  }

  if (search) {
    filters.$or = [
      { memberName: { $regex: search, $options: 'i' } },
      { memberId: { $regex: search, $options: 'i' } },
      { transactionId: { $regex: search, $options: 'i' } },
      { receiptNumber: { $regex: search, $options: 'i' } },
    ];
  }

  return filters;
};

const buildExpenseFilters = (tenantId, query = {}) => {
  const filters = { tenantId };
  const category = arrayify(query.category);
  const approvalStatus = normalizeString(query.status || query.approvalStatus);
  const fromDate = parseDate(query.from || query.expenseDateFrom);
  const toDate = parseDate(query.to || query.expenseDateTo);
  const branches = arrayify(query.branches || query.branch);

  if (category.length) {
    filters.category = { $in: category };
  }

  if (approvalStatus) {
    filters.approvalStatus = approvalStatus;
  }

  if (branches.length === 1) {
    filters.branch = branches[0];
  } else if (branches.length > 1) {
    filters.branch = { $in: branches };
  }

  if (fromDate || toDate) {
    filters.expenseDate = {
      ...(fromDate ? { $gte: fromDate } : {}),
      ...(toDate ? { $lte: toDate } : {}),
    };
  }

  return filters;
};

const buildPledgeFilters = (tenantId, query = {}) => {
  const filters = { tenantId };
  const status = normalizeString(query.status);
  const pledgeType = normalizeString(query.pledgeType);

  if (status) {
    filters.status = status;
  }

  if (pledgeType) {
    filters.pledgeType = pledgeType;
  }

  return filters;
};

const formatMemberName = (member) =>
  member ? [member.firstName, member.lastName].filter(Boolean).join(' ') : undefined;

const createReceiptForTransaction = async (transaction) => {
  const [tenant, member] = await Promise.all([
    Tenant.findOne({ tenantId: transaction.tenantId }),
    transaction.memberId ? Member.findOne({ tenantId: transaction.tenantId, memberId: transaction.memberId }) : null,
  ]);

  const pdfBuffer = await generateReceipt(transaction, tenant, member);
  const receiptPath = `documents/${transaction.tenantId}/receipts/${transaction.receiptNumber}.pdf`;
  const receiptUrl = await uploadBufferToSupabase({
    path: receiptPath,
    buffer: pdfBuffer,
    contentType: 'application/pdf',
  });

  transaction.receiptUrl = receiptUrl;
  await transaction.save();

  return receiptUrl;
};

const findTransactionOrThrow = async (tenantId, identifier, user) => {
  const filters = [{ tenantId, transactionId: identifier }];

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    filters.push({ tenantId, _id: identifier });
  }

  const transaction = await Transaction.findOne({ $or: filters });
  if (!transaction) {
    throw createHttpError(404, 'Transaction not found.');
  }

  ensureDocumentBranchAccess(user, transaction.branch, 'You do not have access to this transaction branch.');

  return transaction;
};

const findExpenseOrThrow = async (tenantId, expenseId, user) => {
  const expense = await Expense.findOne({ tenantId, expenseId });
  if (!expense) {
    throw createHttpError(404, 'Expense not found.');
  }

  ensureDocumentBranchAccess(user, expense.branch, 'You do not have access to this expense branch.');
  return expense;
};


const findPledgeOrThrow = async (tenantId, pledgeId) => {
  const pledge = await Pledge.findOne({ tenantId, pledgeId }).populate('payments');
  if (!pledge) {
    throw createHttpError(404, 'Pledge not found.');
  }
  return pledge;
};

const findBudgetOrThrow = async (tenantId, budgetId) => {
  const budget = await Budget.findOne({ tenantId, budgetId });
  if (!budget) {
    throw createHttpError(404, 'Budget not found.');
  }
  return budget;
};

const hydrateActorNames = async (tenantId, document) => {
  if (!document) {
    return document;
  }

  const plain = document.toObject ? document.toObject() : document;
  const actorIds = [plain.createdBy, plain.updatedBy, plain.recordedBy, plain.approvedBy]
    .filter(Boolean)
    .map((value) => String(value));

  if (!actorIds.length) {
    return plain;
  }

  const actors = await User.find({ tenantId, _id: { $in: actorIds } }).select('fullName username').lean();
  const actorLookup = new Map(
    actors.map((actor) => [String(actor._id), actor.fullName || actor.username || String(actor._id)]),
  );

  return {
    ...plain,
    createdByName: actorLookup.get(String(plain.createdBy || '')) || plain.createdBy,
    updatedByName: actorLookup.get(String(plain.updatedBy || '')) || plain.updatedBy,
    recordedByName: actorLookup.get(String(plain.recordedBy || '')) || plain.recordedBy,
    approvedByName: actorLookup.get(String(plain.approvedBy || '')) || plain.approvedBy,
  };
};

const computeComparison = (currentTotal, previousTotal) => {
  const changePercent =
    previousTotal === 0
      ? currentTotal > 0
        ? 100
        : 0
      : roundCurrency(((currentTotal - previousTotal) / previousTotal) * 100);

  return {
    previousTotal: roundCurrency(previousTotal),
    changePercent,
    trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat',
  };
};

const computeGivingStreak = (transactions) => {
  if (!transactions.length) {
    return 0;
  }

  const weekKeys = new Set(
    transactions.map((transaction) => {
      const date = new Date(transaction.serviceDate);
      const yearStart = new Date(date.getFullYear(), 0, 1);
      const dayIndex = Math.floor((date.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
      return `${date.getFullYear()}-${Math.floor(dayIndex / 7)}`;
    }),
  );

  const ordered = [...weekKeys].sort().reverse();
  let streak = 0;
  let previousYear;
  let previousWeek;

  ordered.forEach((key, index) => {
    const [yearValue, weekValue] = key.split('-').map(Number);
    if (index === 0) {
      streak += 1;
      previousYear = yearValue;
      previousWeek = weekValue;
      return;
    }

    const isConsecutive =
      (yearValue === previousYear && weekValue === previousWeek - 1) ||
      (yearValue === previousYear - 1 && previousWeek === 0);

    if (isConsecutive) {
      streak += 1;
      previousYear = yearValue;
      previousWeek = weekValue;
    }
  });

  return streak;
};

const getMemberWeeksSinceFirstGiving = (transactions) => {
  if (!transactions.length) {
    return 0;
  }

  const first = new Date(transactions[transactions.length - 1].serviceDate);
  const last = new Date();
  return Math.max(Math.ceil((last.getTime() - first.getTime()) / (7 * 24 * 60 * 60 * 1000)), 1);
};

export const recordTransaction = async (tenantId, data, actor, req) => {
  const amount = parseNumber(data.amount);
  if (typeof amount === 'undefined' || amount <= 0) {
    throw createHttpError(400, 'Amount must be greater than zero.');
  }

  const serviceDate = parseDate(data.serviceDate);
  if (!serviceDate) {
    throw createHttpError(400, 'Service date must be valid.');
  }

  let member = null;
  if (data.memberId) {
    member = await Member.findOne({ tenantId, memberId: data.memberId, isDeleted: false });
    if (!member) {
      throw createHttpError(404, 'Member not found for this tenant.');
    }
  }

  let pledge = null;
  if (data.pledgeId) {
    pledge = await Pledge.findOne({ tenantId, pledgeId: data.pledgeId });
    if (!pledge) {
      throw createHttpError(404, 'Pledge not found.');
    }

    if (data.memberId && pledge.memberId !== data.memberId) {
      throw createHttpError(400, 'Pledge does not belong to the selected member.');
    }
  }

  const transaction = await Transaction.create({
    tenantId,
    type: data.type,
    amount,
    currency: normalizeString(data.currency) || 'USD',
    memberId: normalizeString(data.memberId),
    memberName: normalizeString(data.memberName) || formatMemberName(member),
    paymentMethod: normalizeString(data.paymentMethod) || 'cash',
    paymentReference: normalizeString(data.paymentReference),
    serviceDate,
    recordedDate: parseDate(data.recordedDate) || new Date(),
    branch: normalizeString(data.branch),
    department: normalizeString(data.department),
    pledgeId: normalizeString(data.pledgeId),
    notes: normalizeString(data.notes),
    recordedBy: actor.userId,
    updatedBy: actor.userId,
    isVerified: FULL_FINANCE_ROLES.has(actor.role),
    ...(FULL_FINANCE_ROLES.has(actor.role)
      ? { verifiedBy: actor.userId, verifiedAt: new Date() }
      : {}),
  });

  if (pledge) {
    pledge.amountPaid = roundCurrency(Number(pledge.amountPaid || 0) + amount);
    pledge.payments = [...(pledge.payments || []), transaction._id];
    await pledge.save();
  }

  try {
    await createReceiptForTransaction(transaction);
  } catch (error) {
    console.error('Failed to generate transaction receipt:', error.message);
  }

  logAudit(
    tenantId,
    'TRANSACTION_RECORDED',
    'Transaction',
    transaction.transactionId,
    actor.userId,
    { after: transaction.toObject() },
    req,
  );

  return transaction;
};

export const getAllTransactions = async (tenantId, query = {}) => {
  const filters = buildTransactionFilters(tenantId, query);
  const { page, limit, skip } = buildPagination(query);

  const [transactions, total, aggregate, unverifiedCount] = await Promise.all([
    Transaction.find(filters).sort({ serviceDate: -1, createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filters),
    Transaction.aggregate([
      { $match: { ...filters, isReversed: false } },
      {
        $group: {
          _id: null,
          periodTotal: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
        },
      },
    ]),
    Transaction.countDocuments({ ...filters, isVerified: false }),
  ]);

  const totals = aggregate[0] || { periodTotal: 0, averageAmount: 0 };

  return {
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    periodTotal: roundCurrency(totals.periodTotal || 0),
    averageTransaction: roundCurrency(totals.averageAmount || 0),
    unverifiedCount,
  };
};

export const getTransactionSummary = async (tenantId, query = {}) => {
  const period = normalizeString(query.period) || 'month';
  const serviceDate = parseDate(query.serviceDate);
  const branches = arrayify(query.branches || query.branch);
  const branchFilter =
    branches.length === 1 ? { branch: branches[0] } : branches.length > 1 ? { branch: { $in: branches } } : {};
  const { start, end, previousStart, previousEnd } = serviceDate
    ? {
        start: new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()),
        end: new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate() + 1),
        previousStart: new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate() - 1),
        previousEnd: new Date(serviceDate.getFullYear(), serviceDate.getMonth(), serviceDate.getDate()),
      }
    : buildPeriodRange(period);

  const baseFilters = {
    tenantId,
    isReversed: false,
    serviceDate: { $gte: start, $lt: end },
    ...branchFilter,
  };

  const previousFilters = {
    tenantId,
    isReversed: false,
    serviceDate: { $gte: previousStart, $lt: previousEnd },
    ...branchFilter,
  };

  const expenseFilters = {
    tenantId,
    approvalStatus: 'approved',
    expenseDate: { $gte: start, $lt: end },
    ...branchFilter,
  };

  const [transactions, previousTransactions, expenses, pendingExpenseApprovals] = await Promise.all([
    Transaction.find(baseFilters),
    Transaction.find(previousFilters),
    Expense.find(expenseFilters),
    Expense.countDocuments({ tenantId, approvalStatus: 'pending', ...branchFilter }),
  ]);

  const totalIncome = sumAmount(transactions);
  const totalExpenses = sumAmount(expenses);
  const previousTotal = sumAmount(previousTransactions);
  const byType = {};
  const byPaymentMethod = {};
  const branchTotals = {};

  transactions.forEach((transaction) => {
    byType[transaction.type] = roundCurrency((byType[transaction.type] || 0) + Number(transaction.amount || 0));
    byPaymentMethod[transaction.paymentMethod] = roundCurrency(
      (byPaymentMethod[transaction.paymentMethod] || 0) + Number(transaction.amount || 0),
    );
    const branchKey = transaction.branch || 'Main';
    branchTotals[branchKey] = roundCurrency(
      (branchTotals[branchKey] || 0) + Number(transaction.amount || 0),
    );
  });

  return {
    totalIncome,
    totalExpenses,
    netBalance: roundCurrency(totalIncome - totalExpenses),
    byType,
    byPaymentMethod,
    byBranch: Object.entries(branchTotals).map(([branchName, total]) => ({
      branch: branchName,
      total,
    })),
    transactionCount: transactions.length,
    averageGiving: transactions.length ? roundCurrency(totalIncome / transactions.length) : 0,
    pendingExpenseApprovals,
    comparisonToPreviousPeriod: computeComparison(totalIncome, previousTotal),
  };
};

export const getMemberGivingHistory = async (tenantId, memberId) => {
  const member = await Member.findOne({ tenantId, memberId });
  if (!member) {
    throw createHttpError(404, 'Member not found.');
  }

  const transactions = await Transaction.find({
    tenantId,
    memberId,
    isReversed: false,
  }).sort({ serviceDate: -1 });

  const totalGiven = sumAmount(transactions);
  const totalTithes = sumAmount(
    transactions.filter((transaction) => transaction.type === 'tithe'),
  );
  const totalOfferings = sumAmount(
    transactions.filter((transaction) => transaction.type === 'offering'),
  );

  const monthlyBreakdown = [];
  for (let index = 11; index >= 0; index -= 1) {
    const start = new Date();
    start.setMonth(start.getMonth() - index, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const monthlyTransactions = transactions.filter((transaction) => {
      const value = new Date(transaction.serviceDate);
      return value >= start && value < end;
    });

    monthlyBreakdown.push({
      month: getMonthLabel(start),
      total: sumAmount(monthlyTransactions),
      count: monthlyTransactions.length,
    });
  }

  const weeksSinceFirstGiving = getMemberWeeksSinceFirstGiving(transactions);
  const weeksWithGiving = new Set(
    transactions.map((transaction) => {
      const date = new Date(transaction.serviceDate);
      const yearStart = new Date(date.getFullYear(), 0, 1);
      const dayIndex = Math.floor((date.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
      return `${date.getFullYear()}-${Math.floor(dayIndex / 7)}`;
    }),
  ).size;

  return {
    member: {
      memberId: member.memberId,
      name: formatMemberName(member),
      address: member.address,
    },
    transactions,
    summary: {
      totalGiven,
      totalTithes,
      totalOfferings,
      firstGivingDate: transactions.length ? transactions[transactions.length - 1].serviceDate : null,
      lastGivingDate: transactions.length ? transactions[0].serviceDate : null,
    },
    givingStreak: computeGivingStreak(transactions),
    consistencyScore: weeksSinceFirstGiving
      ? roundCurrency((weeksWithGiving / weeksSinceFirstGiving) * 100)
      : 0,
    monthlyBreakdown,
  };
};

export const getTransactionById = async (tenantId, identifier, user) => {
  return findTransactionOrThrow(tenantId, identifier, user);
};

export const verifyTransaction = async (tenantId, identifier, actor, req) => {
  const transaction = await findTransactionOrThrow(tenantId, identifier);
  if (transaction.isVerified) {
    return transaction;
  }

  transaction.isVerified = true;
  transaction.verifiedBy = actor.userId;
  transaction.verifiedAt = new Date();
  transaction.updatedBy = actor.userId;
  await transaction.save();

  logAudit(
    tenantId,
    'TRANSACTION_VERIFIED',
    'Transaction',
    transaction.transactionId,
    actor.userId,
    { after: transaction.toObject() },
    req,
  );

  return transaction;
};

export const reverseTransaction = async (tenantId, identifier, reason, actor, req) => {
  const transaction = await findTransactionOrThrow(tenantId, identifier);

  if (transaction.isReversed) {
    throw createHttpError(400, 'Transaction has already been reversed.');
  }

  const before = transaction.toObject();
  transaction.isReversed = true;
  transaction.reversedBy = actor.userId;
  transaction.reversedAt = new Date();
  transaction.reversalReason = normalizeString(reason) || 'No reason provided';
  transaction.updatedBy = actor.userId;
  await transaction.save();

  if (transaction.pledgeId) {
    const pledge = await Pledge.findOne({ tenantId, pledgeId: transaction.pledgeId });
    if (pledge) {
      pledge.amountPaid = Math.max(Number(pledge.amountPaid || 0) - Number(transaction.amount || 0), 0);
      pledge.payments = (pledge.payments || []).filter(
        (paymentId) => String(paymentId) !== String(transaction._id),
      );
      await pledge.save();
    }
  }

  logAudit(
    tenantId,
    'TRANSACTION_REVERSED',
    'Transaction',
    transaction.transactionId,
    actor.userId,
    { before, after: transaction.toObject() },
    req,
    transaction.reversalReason,
  );

  return transaction;
};

export const getReceipt = async (tenantId, identifier) => {
  const transaction = await findTransactionOrThrow(tenantId, identifier);

  if (transaction.receiptUrl) {
    return transaction.receiptUrl;
  }

  return createReceiptForTransaction(transaction);
};

export const createPledge = async (tenantId, data, actor) => {
  const member = await Member.findOne({ tenantId, memberId: data.memberId, isDeleted: false });
  if (!member) {
    throw createHttpError(404, 'Member not found.');
  }

  const pledge = await Pledge.create({
    tenantId,
    memberId: member.memberId,
    memberName: formatMemberName(member),
    pledgeType: data.pledgeType,
    description: normalizeString(data.description),
    totalAmount: Number(data.totalAmount),
    amountPaid: Number(data.amountPaid || 0),
    currency: normalizeString(data.currency) || 'USD',
    startDate: parseDate(data.startDate),
    expectedEndDate: parseDate(data.expectedEndDate),
    installmentPlan: data.installmentPlan || undefined,
    notes: normalizeString(data.notes),
    createdBy: actor.userId,
  });

  return pledge;
};

export const getAllPledges = async (tenantId, query = {}) => {
  const filters = buildPledgeFilters(tenantId, query);
  const { page, limit, skip } = buildPagination(query);
  const [pledges, total] = await Promise.all([
    Pledge.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('payments'),
    Pledge.countDocuments(filters),
  ]);

  const summary = {
    totalPledged: sumAmount(pledges, (pledge) => pledge.totalAmount),
    totalCollected: sumAmount(pledges, (pledge) => pledge.amountPaid),
    outstanding: sumAmount(pledges, (pledge) => pledge.balance),
    completedPledges: pledges.filter((pledge) => pledge.status === 'completed').length,
  };

  return {
    pledges,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    summary,
  };
};

export const getPledgeById = async (tenantId, pledgeId) => {
  return hydrateActorNames(tenantId, await findPledgeOrThrow(tenantId, pledgeId));
};

export const updatePledge = async (tenantId, pledgeId, data, actor, req) => {
  const pledge = await findPledgeOrThrow(tenantId, pledgeId);
  const before = pledge.toObject();

  if (typeof data.totalAmount !== 'undefined') {
    pledge.totalAmount = Number(data.totalAmount);
  }

  if (data.pledgeType) {
    pledge.pledgeType = data.pledgeType;
  }

  if (typeof data.description !== 'undefined') {
    pledge.description = normalizeString(data.description);
  }

  if (typeof data.currency !== 'undefined') {
    pledge.currency = normalizeString(data.currency) || pledge.currency;
  }

  if (typeof data.startDate !== 'undefined') {
    pledge.startDate = parseDate(data.startDate);
  }

  if (typeof data.expectedEndDate !== 'undefined') {
    pledge.expectedEndDate = parseDate(data.expectedEndDate);
  }

  if (typeof data.status !== 'undefined') {
    pledge.status = data.status;
  }

  if (typeof data.installmentPlan !== 'undefined') {
    pledge.installmentPlan = data.installmentPlan;
  }

  if (typeof data.notes !== 'undefined') {
    pledge.notes = normalizeString(data.notes);
  }

  await pledge.save();

  logAudit(
    tenantId,
    'PLEDGE_UPDATED',
    'Pledge',
    pledge.pledgeId,
    actor.userId,
    { before, after: pledge.toObject() },
    req,
  );

  return pledge;
};

export const recordPledgePayment = async (tenantId, pledgeId, data, actor, req) => {
  const pledge = await Pledge.findOne({ tenantId, pledgeId });
  if (!pledge) {
    throw createHttpError(404, 'Pledge not found.');
  }

  const transaction = await recordTransaction(
    tenantId,
    {
      ...data,
      type: 'pledge_payment',
      memberId: pledge.memberId,
      memberName: pledge.memberName,
      pledgeId: pledge.pledgeId,
    },
    actor,
    req,
  );

  logAudit(
    tenantId,
    'PLEDGE_PAYMENT_RECORDED',
    'Pledge',
    pledge.pledgeId,
    actor.userId,
    { transactionId: transaction.transactionId, amount: transaction.amount },
    req,
  );

  return transaction;
};

export const recordExpense = async (tenantId, data, actor, req) => {
  const expense = await Expense.create({
    tenantId,
    category: data.category,
    description: normalizeString(data.description),
    amount: Number(data.amount),
    currency: normalizeString(data.currency) || 'USD',
    expenseDate: parseDate(data.expenseDate),
    paymentMethod: normalizeString(data.paymentMethod) || 'cash',
    paymentReference: normalizeString(data.paymentReference),
    vendor: normalizeString(data.vendor),
    receiptUrl: normalizeString(data.receiptUrl),
    branch: normalizeString(data.branch),
    department: normalizeString(data.department),
    budgetId: normalizeString(data.budgetId),
    notes: normalizeString(data.notes),
    recordedBy: actor.userId,
    approvalStatus: FULL_FINANCE_ROLES.has(actor.role) ? 'approved' : 'pending',
    ...(FULL_FINANCE_ROLES.has(actor.role)
      ? { approvedBy: actor.userId, approvedAt: new Date() }
      : {}),
  });

  let budgetWarning = null;
  const budget = await getActiveBudgetForDate(tenantId, expense.expenseDate);
  const budgetLine = budget?.lines?.find((line) => line.category === expense.category);

  if (budgetLine) {
    const projectedSpent = Number(budgetLine.spent || 0) + Number(expense.amount || 0);
    if (projectedSpent > Number(budgetLine.allocated || 0)) {
      budgetWarning = {
        budgetId: budget.budgetId,
        message: `This expense exceeds the allocated ${expense.category.replaceAll('_', ' ')} budget by ${roundCurrency(projectedSpent - Number(budgetLine.allocated || 0))}.`,
      };
    }
  }

  if (expense.approvalStatus === 'approved') {
    await updateBudgetExpenseLine(tenantId, expense);
  }

  logAudit(
    tenantId,
    'EXPENSE_RECORDED',
    'Expense',
    expense.expenseId,
    actor.userId,
    { after: expense.toObject() },
    req,
  );

  return {
    expense,
    budgetWarning,
  };
};

export const getAllExpenses = async (tenantId, query = {}) => {
  const filters = buildExpenseFilters(tenantId, query);
  const { page, limit, skip } = buildPagination(query);
  const [expenses, total] = await Promise.all([
    Expense.find(filters).sort({ expenseDate: -1, createdAt: -1 }).skip(skip).limit(limit),
    Expense.countDocuments(filters),
  ]);

  return {
    expenses,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    totals: {
      approved: sumAmount(expenses.filter((expense) => expense.approvalStatus === 'approved')),
      pending: sumAmount(expenses.filter((expense) => expense.approvalStatus === 'pending')),
    },
  };
};

export const getExpenseById = async (tenantId, expenseId, user) => {
  return hydrateActorNames(tenantId, await findExpenseOrThrow(tenantId, expenseId, user));
};

export const updateExpense = async (tenantId, expenseId, data) => {
  const expense = await findExpenseOrThrow(tenantId, expenseId);

  Object.assign(expense, {
    ...(data.category ? { category: data.category } : {}),
    ...(typeof data.description !== 'undefined' ? { description: normalizeString(data.description) } : {}),
    ...(typeof data.amount !== 'undefined' ? { amount: Number(data.amount) } : {}),
    ...(typeof data.currency !== 'undefined' ? { currency: normalizeString(data.currency) || expense.currency } : {}),
    ...(typeof data.expenseDate !== 'undefined' ? { expenseDate: parseDate(data.expenseDate) } : {}),
    ...(typeof data.paymentMethod !== 'undefined' ? { paymentMethod: normalizeString(data.paymentMethod) || expense.paymentMethod } : {}),
    ...(typeof data.paymentReference !== 'undefined' ? { paymentReference: normalizeString(data.paymentReference) } : {}),
    ...(typeof data.vendor !== 'undefined' ? { vendor: normalizeString(data.vendor) } : {}),
    ...(typeof data.receiptUrl !== 'undefined' ? { receiptUrl: normalizeString(data.receiptUrl) } : {}),
    ...(typeof data.branch !== 'undefined' ? { branch: normalizeString(data.branch) } : {}),
    ...(typeof data.department !== 'undefined' ? { department: normalizeString(data.department) } : {}),
    ...(typeof data.budgetId !== 'undefined' ? { budgetId: normalizeString(data.budgetId) } : {}),
    ...(typeof data.notes !== 'undefined' ? { notes: normalizeString(data.notes) } : {}),
  });

  await expense.save();
  return expense;
};

export const approveExpense = async (tenantId, expenseId, actor, req) => {
  const expense = await findExpenseOrThrow(tenantId, expenseId);
  const before = expense.toObject();

  expense.approvalStatus = 'approved';
  expense.approvedBy = actor.userId;
  expense.approvedAt = new Date();
  expense.rejectionReason = undefined;
  await expense.save();

  await updateBudgetExpenseLine(tenantId, expense);

  logAudit(
    tenantId,
    'EXPENSE_APPROVED',
    'Expense',
    expense.expenseId,
    actor.userId,
    { before, after: expense.toObject() },
    req,
  );

  return expense;
};

export const rejectExpense = async (tenantId, expenseId, reason, actor, req) => {
  const expense = await findExpenseOrThrow(tenantId, expenseId);
  const before = expense.toObject();

  expense.approvalStatus = 'rejected';
  expense.rejectionReason = normalizeString(reason) || 'No reason provided';
  expense.approvedBy = undefined;
  expense.approvedAt = undefined;
  await expense.save();

  logAudit(
    tenantId,
    'EXPENSE_REJECTED',
    'Expense',
    expense.expenseId,
    actor.userId,
    { before, after: expense.toObject() },
    req,
    expense.rejectionReason,
  );

  return expense;
};

export const createBudget = async (tenantId, data, actor) => {
  const budget = await Budget.create({
    tenantId,
    title: normalizeString(data.title),
    year: Number(data.year),
    ...(data.month ? { month: Number(data.month) } : {}),
    lines: data.lines || [],
    status: data.status || 'draft',
    createdBy: actor.userId,
  });

  return budget;
};

export const getAllBudgets = async (tenantId, query = {}) => {
  const filters = {
    tenantId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.year ? { year: Number(query.year) } : {}),
  };
  return Budget.find(filters).sort({ year: -1, month: -1, createdAt: -1 });
};

export const getBudgetById = async (tenantId, budgetId) => {
  return hydrateActorNames(tenantId, await findBudgetOrThrow(tenantId, budgetId));
};

export const updateBudget = async (tenantId, budgetId, data) => {
  const budget = await findBudgetOrThrow(tenantId, budgetId);

  Object.assign(budget, {
    ...(typeof data.title !== 'undefined' ? { title: normalizeString(data.title) } : {}),
    ...(typeof data.year !== 'undefined' ? { year: Number(data.year) } : {}),
    ...(typeof data.month !== 'undefined' ? { month: data.month ? Number(data.month) : undefined } : {}),
    ...(Array.isArray(data.lines) ? { lines: data.lines } : {}),
    ...(typeof data.status !== 'undefined' ? { status: data.status } : {}),
  });

  await budget.save();
  return budget;
};

export const activateBudget = async (tenantId, budgetId) => {
  const budget = await findBudgetOrThrow(tenantId, budgetId);

  await Budget.updateMany(
    {
      tenantId,
      year: budget.year,
      ...(budget.month ? { month: budget.month } : { month: { $exists: false } }),
      status: 'active',
      budgetId: { $ne: budget.budgetId },
    },
    { status: 'closed' },
  );

  budget.status = 'active';
  await budget.save();
  return budget;
};

export const getFinancialSummary = async (tenantId, year = new Date().getFullYear(), query = {}) => {
  const numericYear = Number(year) || new Date().getFullYear();
  const start = new Date(numericYear, 0, 1);
  const end = new Date(numericYear + 1, 0, 1);
  const branches = arrayify(query.branches || query.branch);
  const branchFilter =
    branches.length === 1 ? { branch: branches[0] } : branches.length > 1 ? { branch: { $in: branches } } : {};

  const [transactions, expenses] = await Promise.all([
    Transaction.find({
      tenantId,
      ...branchFilter,
      isReversed: false,
      serviceDate: { $gte: start, $lt: end },
    }),
    Expense.find({
      tenantId,
      ...branchFilter,
      approvalStatus: 'approved',
      expenseDate: { $gte: start, $lt: end },
      expenseDate: { $gte: start, $lt: end },
    }),
  ]);

  const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
    const income = sumAmount(
      transactions.filter((transaction) => new Date(transaction.serviceDate).getMonth() === index),
    );
    const expenseTotal = sumAmount(
      expenses.filter((expense) => new Date(expense.expenseDate).getMonth() === index),
    );

    return {
      month: index + 1,
      label: new Date(numericYear, index, 1).toLocaleString('en-US', { month: 'short' }),
      income,
      expenses: expenseTotal,
      net: roundCurrency(income - expenseTotal),
    };
  });

  const incomeByType = {};
  transactions.forEach((transaction) => {
    incomeByType[transaction.type] = roundCurrency(
      (incomeByType[transaction.type] || 0) + Number(transaction.amount || 0),
    );
  });

  const expenseByCategory = {};
  expenses.forEach((expense) => {
    expenseByCategory[expense.category] = roundCurrency(
      (expenseByCategory[expense.category] || 0) + Number(expense.amount || 0),
    );
  });

  const sortedByIncome = [...monthlyBreakdown].sort((left, right) => right.income - left.income);

  return {
    year: numericYear,
    totalIncome: sumAmount(transactions),
    totalExpenses: sumAmount(expenses),
    netBalance: roundCurrency(sumAmount(transactions) - sumAmount(expenses)),
    monthlyBreakdown,
    incomeByType,
    expenseByCategory,
    topGivingMonths: sortedByIncome.slice(0, 3),
    lowestGivingMonths: sortedByIncome.slice(-3).reverse(),
  };
};

export const getMonthlyReport = async (tenantId, query = {}) => {
  const year = Number(query.year) || new Date().getFullYear();
  const month = Number(query.month) || new Date().getMonth() + 1;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [transactions, expenses] = await Promise.all([
    Transaction.find({ tenantId, isReversed: false, serviceDate: { $gte: start, $lt: end } }),
    Expense.find({ tenantId, approvalStatus: 'approved', expenseDate: { $gte: start, $lt: end } }),
  ]);

  return {
    month,
    year,
    income: sumAmount(transactions),
    expenses: sumAmount(expenses),
    net: roundCurrency(sumAmount(transactions) - sumAmount(expenses)),
    transactions,
    expenseItems: expenses,
  };
};

export const getAnnualReport = async (tenantId, query = {}) => {
  return getFinancialSummary(tenantId, query.year);
};

export const getGivingTrends = async (tenantId, query = {}) => {
  const months = Math.max(Number(query.months) || 12, 1);
  const start = new Date();
  start.setMonth(start.getMonth() - months + 1, 1);
  start.setHours(0, 0, 0, 0);

  const transactions = await Transaction.find({
    tenantId,
    isReversed: false,
    serviceDate: { $gte: start },
  }).sort({ serviceDate: 1 });

  const weeklyMap = new Map();
  const monthlyMap = new Map();
  const yearlyMap = new Map();
  const dayOfWeekMap = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  transactions.forEach((transaction) => {
    const date = new Date(transaction.serviceDate);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const dayIndex = Math.floor((date.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    const weekKey = `${date.getFullYear()}-W${String(Math.floor(dayIndex / 7)).padStart(2, '0')}`;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    weeklyMap.set(weekKey, roundCurrency((weeklyMap.get(weekKey) || 0) + Number(transaction.amount || 0)));
    monthlyMap.set(monthKey, roundCurrency((monthlyMap.get(monthKey) || 0) + Number(transaction.amount || 0)));
    yearlyMap.set(date.getFullYear(), roundCurrency((yearlyMap.get(date.getFullYear()) || 0) + Number(transaction.amount || 0)));
    const weekdayLabel = date.toLocaleString('en-US', { weekday: 'long' });
    dayOfWeekMap[weekdayLabel] = roundCurrency((dayOfWeekMap[weekdayLabel] || 0) + Number(transaction.amount || 0));
  });

  const orderedYears = [...yearlyMap.keys()].sort((left, right) => left - right);
  const currentYear = orderedYears[orderedYears.length - 1];
  const previousYear = orderedYears.length >= 2 ? orderedYears[orderedYears.length - 2] : null;

  return {
    weeklyTotals: [...weeklyMap.entries()].map(([week, total]) => ({ week, total })).slice(-12),
    monthlyTotals: [...monthlyMap.entries()].map(([month, total]) => ({
      month,
      label: getMonthLabel(`${month}-01`),
      total,
    })),
    yoyComparison:
      previousYear && currentYear
        ? {
            currentYear,
            previousYear,
            currentTotal: yearlyMap.get(currentYear),
            previousTotal: yearlyMap.get(previousYear),
          }
        : null,
    heatmap: Object.entries(dayOfWeekMap).map(([day, total]) => ({ day, total })),
  };
};

export const getTopGivers = async (tenantId, query = {}) => {
  const period = normalizeString(query.period) || 'year';
  const limit = Math.max(Number(query.limit) || 10, 1);
  const anonymize = String(query.anonymize).toLowerCase() === 'true';
  let dateFilter = {};

  if (period === 'month') {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    dateFilter = { serviceDate: { $gte: start } };
  } else if (period === 'year') {
    const start = new Date(new Date().getFullYear(), 0, 1);
    dateFilter = { serviceDate: { $gte: start } };
  }

  const grouped = await Transaction.aggregate([
    {
      $match: {
        tenantId,
        isReversed: false,
        memberId: { $exists: true, $ne: null, $ne: '' },
        ...dateFilter,
      },
    },
    {
      $group: {
        _id: '$memberId',
        memberName: { $last: '$memberName' },
        totalGiven: { $sum: '$amount' },
        givingCount: { $sum: 1 },
      },
    },
    { $sort: { totalGiven: -1 } },
    { $limit: limit },
  ]);

  return grouped.map((item, index) => ({
    rank: index + 1,
    memberId: item._id,
    memberName: anonymize ? 'Anonymous' : item.memberName || item._id,
    totalGiven: roundCurrency(item.totalGiven),
    givingCount: item.givingCount,
  }));
};

export const getMemberAnnualStatement = async (tenantId, memberId, year = new Date().getFullYear()) => {
  const member = await Member.findOne({ tenantId, memberId });
  if (!member) {
    throw createHttpError(404, 'Member not found.');
  }

  const start = new Date(Number(year), 0, 1);
  const end = new Date(Number(year) + 1, 0, 1);
  const transactions = await Transaction.find({
    tenantId,
    memberId,
    isReversed: false,
    serviceDate: { $gte: start, $lt: end },
  }).sort({ serviceDate: 1 });

  const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthTransactions = transactions.filter(
      (transaction) => new Date(transaction.serviceDate).getMonth() === monthIndex,
    );
    return {
      month: monthIndex + 1,
      label: new Date(Number(year), monthIndex, 1).toLocaleString('en-US', { month: 'short' }),
      total: sumAmount(monthTransactions),
    };
  });

  const totalTithes = sumAmount(transactions.filter((transaction) => transaction.type === 'tithe'));
  const totalOfferings = sumAmount(transactions.filter((transaction) => transaction.type === 'offering'));
  const totalPledges = sumAmount(
    transactions.filter((transaction) => transaction.type === 'pledge_payment'),
  );

  return {
    member: {
      name: formatMemberName(member),
      memberId: member.memberId,
      address: member.address,
    },
    year: Number(year),
    transactions,
    summary: {
      totalTithes,
      totalOfferings,
      totalPledges,
      grandTotal: roundCurrency(totalTithes + totalOfferings + totalPledges + sumAmount(
        transactions.filter(
          (transaction) => !['tithe', 'offering', 'pledge_payment'].includes(transaction.type),
        ),
      )),
    },
    monthlyBreakdown,
  };
};

export const getSmartGivingIntelligence = async (tenantId) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const [currentMonthTransactions, lastMonthTransactions, budget, goals] = await Promise.all([
    Transaction.find({
      tenantId,
      isReversed: false,
      serviceDate: { $gte: currentMonthStart, $lt: currentMonthEnd },
    }),
    Transaction.find({
      tenantId,
      isReversed: false,
      serviceDate: { $gte: lastMonthStart, $lt: lastMonthEnd },
    }),
    getActiveBudgetForDate(tenantId, now),
    GivingGoal.find({ tenantId }).sort({ year: -1, month: -1 }).limit(12),
  ]);

  const currentTotal = sumAmount(currentMonthTransactions);
  const lastMonthTotal = sumAmount(lastMonthTransactions);
  const dayOfMonth = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedTotal = dayOfMonth ? roundCurrency((currentTotal / dayOfMonth) * totalDaysInMonth) : currentTotal;
  const comparisonMessage =
    lastMonthTotal > 0
      ? `On track to ${projectedTotal >= lastMonthTotal ? 'exceed' : 'finish below'} last month by ${Math.abs(roundCurrency(((projectedTotal - lastMonthTotal) / lastMonthTotal) * 100))}%.`
      : 'Projection confidence is limited because last month has no giving data.';

  const samePeriodLastMonth = lastMonthTransactions.filter(
    (transaction) => new Date(transaction.serviceDate).getDate() <= dayOfMonth,
  );
  const currentPace = currentTotal;
  const lastMonthPace = sumAmount(samePeriodLastMonth);
  const lowGivingPercent =
    lastMonthPace > 0 ? roundCurrency(((lastMonthPace - currentPace) / lastMonthPace) * 100) : 0;
  const lowGivingTriggered = lastMonthPace > 0 && currentPace < lastMonthPace * 0.8;

  const regularGiverAggregation = await Transaction.aggregate([
    {
      $match: {
        tenantId,
        isReversed: false,
        memberId: { $exists: true, $ne: '' },
        serviceDate: { $gte: new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: '$memberId',
        lastGivingDate: { $max: '$serviceDate' },
        givingCount: { $sum: 1 },
      },
    },
  ]);

  const stoppedGiving = regularGiverAggregation.filter((item) => {
    const weeksSinceLastGiving =
      (Date.now() - new Date(item.lastGivingDate).getTime()) / (7 * 24 * 60 * 60 * 1000);
    return item.givingCount >= 4 && weeksSinceLastGiving >= 4;
  }).length;

  const upcomingHighPeriods = [
    { month: 'April', reason: 'Easter', historicalAverage: roundCurrency(lastMonthTotal * 1.15 || currentTotal) },
    { month: 'December', reason: 'End of year thanksgiving', historicalAverage: roundCurrency(lastMonthTotal * 1.25 || currentTotal) },
  ];

  const monthlyGoal = goals.find(
    (goal) => goal.year === now.getFullYear() && goal.month === now.getMonth() + 1,
  );
  const budgetRiskTriggered = Boolean(monthlyGoal && projectedTotal < Number(monthlyGoal.targetAmount || 0));
  const shortfall = monthlyGoal ? roundCurrency(Number(monthlyGoal.targetAmount || 0) - projectedTotal) : 0;

  const recommendations = [];
  if (lowGivingTriggered) {
    recommendations.push('Consider a giving campaign because current month giving is tracking below last month.');
  }
  if (stoppedGiving > 0) {
    recommendations.push(`${stoppedGiving} regular givers appear to have lapsed and may need pastoral follow-up.`);
  }
  if (budgetRiskTriggered) {
    recommendations.push(`Current month income is projected to fall short of the giving goal by ${shortfall}.`);
  }
  if (!recommendations.length) {
    recommendations.push('Giving is stable. Continue consistent stewardship communication and reporting.');
  }

  return {
    currentMonthProjection: {
      projectedTotal,
      confidence: dayOfMonth >= 20 ? 'high' : dayOfMonth >= 10 ? 'medium' : 'low',
      message: comparisonMessage,
    },
    lowGivingAlert: {
      triggered: lowGivingTriggered,
      message: lowGivingTriggered
        ? `Giving is ${lowGivingPercent}% below average for this time of month.`
        : 'Giving pace is within the normal monthly range.',
    },
    upcomingHighPeriods,
    memberRiskAlerts: {
      stoppedGiving,
      message: stoppedGiving
        ? `${stoppedGiving} regular givers have not given in the past 4 weeks.`
        : 'No regular giver lapse detected this month.',
    },
    budgetRisk: {
      triggered: budgetRiskTriggered,
      message: budgetRiskTriggered
        ? `At the current pace, income will fall short of the monthly goal by ${shortfall}.`
        : 'Giving is on track against the current target.',
    },
    recommendations,
    budget: budget
      ? {
          budgetId: budget.budgetId,
          title: budget.title,
          totalAllocated: budget.totalAllocated,
        }
      : null,
  };
};

export const setGivingGoal = async (tenantId, data, actor) => {
  const goal = await GivingGoal.findOneAndUpdate(
    {
      tenantId,
      year: Number(data.year),
      ...(data.month ? { month: Number(data.month) } : { month: { $exists: false } }),
    },
    {
      tenantId,
      year: Number(data.year),
      ...(data.month ? { month: Number(data.month) } : { month: undefined }),
      targetAmount: Number(data.targetAmount),
      currency: normalizeString(data.currency) || 'USD',
      notes: normalizeString(data.notes),
      createdBy: actor.userId,
      createdAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return goal;
};

export const getGivingGoals = async (tenantId, query = {}) => {
  return GivingGoal.find({
    tenantId,
    ...(query.year ? { year: Number(query.year) } : {}),
  }).sort({ year: -1, month: -1, createdAt: -1 });
};

export const getAuditLog = async (tenantId, query = {}) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {
    tenantId,
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.performedBy ? { performedBy: query.performedBy } : {}),
  };

  const fromDate = parseDate(query.from);
  const toDate = parseDate(query.to);
  if (fromDate || toDate) {
    filters.performedAt = {
      ...(fromDate ? { $gte: fromDate } : {}),
      ...(toDate ? { $lte: toDate } : {}),
    };
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filters).sort({ performedAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filters),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const runWeeklyFinanceAlerts = async () => {
  const tenants = await Tenant.find({ isActive: true, isSuspended: false }).select('tenantId');

  for (const tenant of tenants) {
    const intelligence = await getSmartGivingIntelligence(tenant.tenantId);
    const treasurers = await User.find({
      tenantId: tenant.tenantId,
      role: { $in: ['treasurer', 'head_pastor'] },
      isActive: true,
    }).select('_id');

    const notifications = [];

    if (intelligence.memberRiskAlerts.stoppedGiving > 0) {
      treasurers.forEach((user) => {
        notifications.push({
          tenantId: tenant.tenantId,
          type: 'health_alert',
          targetUserId: String(user._id),
          message: `${intelligence.memberRiskAlerts.stoppedGiving} regular givers have lapsed.`,
        });
      });
    }

    if (intelligence.lowGivingAlert.triggered) {
      treasurers.forEach((user) => {
        notifications.push({
          tenantId: tenant.tenantId,
          type: 'system',
          targetUserId: String(user._id),
          message: intelligence.lowGivingAlert.message,
        });
      });
    }

    if (notifications.length) {
      await NotificationLog.insertMany(notifications, { ordered: false });
    }
  }
};

export const financeRoleAccess = {
  canView: (role) => FINANCE_VIEW_ROLES.has(role),
  canRecord: (role) => FINANCE_RECORD_ROLES.has(role),
  canApprove: (role) => FULL_FINANCE_ROLES.has(role),
};
