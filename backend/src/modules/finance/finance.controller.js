import asyncHandler from '../../utils/asyncHandler.js';
import { success } from '../../utils/apiResponse.js';
import { createHttpError } from '../../utils/httpError.js';
import * as financeService from './finance.service.js';
import { hasCapability } from '../access/capabilities.js';
import { ensureBranchAccess, scopeBranchQuery } from '../../utils/branchScope.js';

const resolveScopedTenantId = (req) => {
  if (req.user?.role === 'super_admin') {
    const tenantId =
      req.query?.tenantId ||
      req.body?.tenantId ||
      req.headers['x-tenant-id'] ||
      req.params?.tenantId;

    if (!tenantId) {
      throw createHttpError(400, 'Tenant ID is required for super admin finance requests.');
    }

    return String(tenantId).trim().toLowerCase();
  }

  return req.tenantId;
};

const ensureFinanceCapability = (req, capability) => {
  if (req.user?.role === 'super_admin') {
    return;
  }

  if (!hasCapability(req.user?.capabilities || [], capability)) {
    throw createHttpError(403, 'You do not have permission for this finance action.');
  }
};

const ensureApprover = (req) => {
  if (!financeService.financeRoleAccess.canApprove(req.user?.role)) {
    throw createHttpError(403, 'Treasurer, head pastor, or super admin access is required.');
  }
};

const financeActor = (req) => ({
  userId: req.user?.userId,
  role: req.user?.role,
});

export const recordTransaction = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.create');
  ensureBranchAccess(req.user, req.body.branch, 'You do not have access to record transactions in this branch.');
  const transaction = await financeService.recordTransaction(
    resolveScopedTenantId(req),
    req.body,
    financeActor(req),
    req,
  );
  return success(res, transaction, 'Transaction recorded successfully.', 201);
});

export const getAllTransactions = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getAllTransactions(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Transactions fetched successfully.');
});

export const getTransactionSummary = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getTransactionSummary(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Transaction summary fetched successfully.');
});

export const getMemberGivingHistory = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getMemberGivingHistory(
    resolveScopedTenantId(req),
    req.params.memberId,
    req.query,
  );
  return success(res, data, 'Member giving history fetched successfully.');
});

export const getTransactionById = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getTransactionById(
    resolveScopedTenantId(req),
    req.params.id,
    req.user,
  );
  return success(res, data, 'Transaction fetched successfully.');
});

export const verifyTransaction = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  ensureApprover(req);
  const data = await financeService.verifyTransaction(
    resolveScopedTenantId(req),
    req.params.id,
    financeActor(req),
    req,
  );
  return success(res, data, 'Transaction verified successfully.');
});

export const reverseTransaction = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  ensureApprover(req);
  const data = await financeService.reverseTransaction(
    resolveScopedTenantId(req),
    req.params.id,
    req.body.reason,
    financeActor(req),
    req,
  );
  return success(res, data, 'Transaction reversed successfully.');
});

export const getReceipt = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const receiptUrl = await financeService.getReceipt(resolveScopedTenantId(req), req.params.id);
  return res.redirect(receiptUrl);
});

export const createPledge = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.create');
  const data = await financeService.createPledge(resolveScopedTenantId(req), req.body, financeActor(req));
  return success(res, data, 'Pledge created successfully.', 201);
});

export const getAllPledges = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getAllPledges(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Pledges fetched successfully.');
});

export const getPledgeById = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getPledgeById(resolveScopedTenantId(req), req.params.pledgeId);
  return success(res, data, 'Pledge fetched successfully.');
});

export const updatePledge = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  const data = await financeService.updatePledge(
    resolveScopedTenantId(req),
    req.params.pledgeId,
    req.body,
    financeActor(req),
    req,
  );
  return success(res, data, 'Pledge updated successfully.');
});

export const recordPledgePayment = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.create');
  const data = await financeService.recordPledgePayment(
    resolveScopedTenantId(req),
    req.params.pledgeId,
    req.body,
    financeActor(req),
    req,
  );
  return success(res, data, 'Pledge payment recorded successfully.', 201);
});

export const recordExpense = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.create');
  ensureBranchAccess(req.user, req.body.branch, 'You do not have access to record expenses in this branch.');
  const data = await financeService.recordExpense(
    resolveScopedTenantId(req),
    req.body,
    financeActor(req),
    req,
  );
  return success(res, data, 'Expense recorded successfully.', 201);
});

export const getAllExpenses = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getAllExpenses(
    resolveScopedTenantId(req),
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Expenses fetched successfully.');
});

export const getExpenseById = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getExpenseById(
    resolveScopedTenantId(req),
    req.params.expenseId,
    req.user,
  );
  return success(res, data, 'Expense fetched successfully.');
});

export const updateExpense = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  const data = await financeService.updateExpense(
    resolveScopedTenantId(req),
    req.params.expenseId,
    req.body,
  );
  return success(res, data, 'Expense updated successfully.');
});

export const approveExpense = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  ensureApprover(req);
  const data = await financeService.approveExpense(
    resolveScopedTenantId(req),
    req.params.expenseId,
    financeActor(req),
    req,
  );
  return success(res, data, 'Expense approved successfully.');
});

export const rejectExpense = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  ensureApprover(req);
  const data = await financeService.rejectExpense(
    resolveScopedTenantId(req),
    req.params.expenseId,
    req.body.reason,
    financeActor(req),
    req,
  );
  return success(res, data, 'Expense rejected successfully.');
});

export const createBudget = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  const data = await financeService.createBudget(resolveScopedTenantId(req), req.body, financeActor(req));
  return success(res, data, 'Budget created successfully.', 201);
});

export const getAllBudgets = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getAllBudgets(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Budgets fetched successfully.');
});

export const getBudgetById = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getBudgetById(resolveScopedTenantId(req), req.params.budgetId);
  return success(res, data, 'Budget fetched successfully.');
});

export const updateBudget = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  const data = await financeService.updateBudget(
    resolveScopedTenantId(req),
    req.params.budgetId,
    req.body,
  );
  return success(res, data, 'Budget updated successfully.');
});

export const activateBudget = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  const data = await financeService.activateBudget(resolveScopedTenantId(req), req.params.budgetId);
  return success(res, data, 'Budget activated successfully.');
});

export const getFinancialSummary = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getFinancialSummary(
    resolveScopedTenantId(req),
    req.query.year,
    scopeBranchQuery(req.query, req.user),
  );
  return success(res, data, 'Financial summary fetched successfully.');
});

export const getMonthlyReport = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getMonthlyReport(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Monthly report fetched successfully.');
});

export const getAnnualReport = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getAnnualReport(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Annual report fetched successfully.');
});

export const getGivingTrends = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getGivingTrends(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Giving trends fetched successfully.');
});

export const getTopGivers = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getTopGivers(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Top givers fetched successfully.');
});

export const getMemberAnnualStatement = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getMemberAnnualStatement(
    resolveScopedTenantId(req),
    req.params.memberId,
    req.query.year,
  );
  return success(res, data, 'Member annual statement fetched successfully.');
});

export const getSmartGivingIntelligence = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getSmartGivingIntelligence(resolveScopedTenantId(req));
  return success(res, data, 'Smart giving intelligence fetched successfully.');
});

export const setGivingGoal = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  const data = await financeService.setGivingGoal(resolveScopedTenantId(req), req.body, financeActor(req));
  return success(res, data, 'Giving goal saved successfully.', 201);
});

export const getGivingGoals = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.view');
  const data = await financeService.getGivingGoals(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Giving goals fetched successfully.');
});

export const getAuditLog = asyncHandler(async (req, res) => {
  ensureFinanceCapability(req, 'finance.modify');
  ensureApprover(req);
  const data = await financeService.getAuditLog(resolveScopedTenantId(req), req.query);
  return success(res, data, 'Finance audit log fetched successfully.');
});
