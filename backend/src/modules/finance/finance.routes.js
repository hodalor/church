import { Router } from 'express';
import { body, param } from 'express-validator';
import auth from '../../middleware/auth.js';
import auditMiddleware from '../../middleware/auditMiddleware.js';
import tenantScope from '../../middleware/tenantScope.js';
import validate from '../../middleware/validate.js';
import * as financeController from './finance.controller.js';
import {
  budgetValidation,
  createPledgeValidation,
  goalValidation,
  recordExpenseValidation,
  recordTransactionValidation,
  reportYearValidation,
} from './finance.validation.js';

const router = Router();

router.use(auth, tenantScope);

router.post(
  '/transactions',
  auditMiddleware('finance', 'Transaction'),
  recordTransactionValidation,
  validate,
  financeController.recordTransaction,
);
router.get('/transactions', financeController.getAllTransactions);
router.get('/transactions/summary', financeController.getTransactionSummary);
router.get(
  '/transactions/by-member/:memberId',
  [param('memberId').trim().notEmpty().withMessage('Member ID is required.')],
  validate,
  financeController.getMemberGivingHistory,
);
router.get(
  '/transactions/:id/receipt',
  [param('id').trim().notEmpty().withMessage('Transaction ID is required.')],
  validate,
  financeController.getReceipt,
);
router.patch(
  '/transactions/:id/verify',
  auditMiddleware('finance', 'Transaction', { action: 'APPROVE' }),
  [param('id').trim().notEmpty().withMessage('Transaction ID is required.')],
  validate,
  financeController.verifyTransaction,
);
router.patch(
  '/transactions/:id/reverse',
  auditMiddleware('finance', 'Transaction', { action: 'STATUS_CHANGE' }),
  [
    param('id').trim().notEmpty().withMessage('Transaction ID is required.'),
    body('reason').optional({ values: 'falsy' }).trim().isLength({ min: 3 }),
  ],
  validate,
  financeController.reverseTransaction,
);
router.get(
  '/transactions/:id',
  [param('id').trim().notEmpty().withMessage('Transaction ID is required.')],
  validate,
  financeController.getTransactionById,
);

router.post('/pledges', auditMiddleware('finance', 'Pledge'), createPledgeValidation, validate, financeController.createPledge);
router.get('/pledges', financeController.getAllPledges);
router.get(
  '/pledges/:pledgeId',
  [param('pledgeId').trim().notEmpty().withMessage('Pledge ID is required.')],
  validate,
  financeController.getPledgeById,
);
router.patch(
  '/pledges/:pledgeId',
  auditMiddleware('finance', 'Pledge'),
  [param('pledgeId').trim().notEmpty().withMessage('Pledge ID is required.')],
  validate,
  financeController.updatePledge,
);
router.post(
  '/pledges/:pledgeId/payment',
  auditMiddleware('finance', 'Pledge', { action: 'CREATE' }),
  [param('pledgeId').trim().notEmpty().withMessage('Pledge ID is required.'), ...recordTransactionValidation],
  validate,
  financeController.recordPledgePayment,
);

router.post('/expenses', auditMiddleware('finance', 'Expense'), recordExpenseValidation, validate, financeController.recordExpense);
router.get('/expenses', financeController.getAllExpenses);
router.get(
  '/expenses/:expenseId',
  [param('expenseId').trim().notEmpty().withMessage('Expense ID is required.')],
  validate,
  financeController.getExpenseById,
);
router.patch(
  '/expenses/:expenseId',
  auditMiddleware('finance', 'Expense'),
  [param('expenseId').trim().notEmpty().withMessage('Expense ID is required.')],
  validate,
  financeController.updateExpense,
);
router.patch(
  '/expenses/:expenseId/approve',
  auditMiddleware('finance', 'Expense', { action: 'APPROVE' }),
  [param('expenseId').trim().notEmpty().withMessage('Expense ID is required.')],
  validate,
  financeController.approveExpense,
);
router.patch(
  '/expenses/:expenseId/reject',
  auditMiddleware('finance', 'Expense', { action: 'REJECT' }),
  [
    param('expenseId').trim().notEmpty().withMessage('Expense ID is required.'),
    body('reason').optional({ values: 'falsy' }).trim().isLength({ min: 3 }),
  ],
  validate,
  financeController.rejectExpense,
);

router.post('/budgets', auditMiddleware('finance', 'Budget'), budgetValidation, validate, financeController.createBudget);
router.get('/budgets', financeController.getAllBudgets);
router.get(
  '/budgets/:budgetId',
  [param('budgetId').trim().notEmpty().withMessage('Budget ID is required.')],
  validate,
  financeController.getBudgetById,
);
router.patch(
  '/budgets/:budgetId',
  auditMiddleware('finance', 'Budget'),
  [param('budgetId').trim().notEmpty().withMessage('Budget ID is required.')],
  validate,
  financeController.updateBudget,
);
router.patch(
  '/budgets/:budgetId/activate',
  auditMiddleware('finance', 'Budget', { action: 'STATUS_CHANGE' }),
  [param('budgetId').trim().notEmpty().withMessage('Budget ID is required.')],
  validate,
  financeController.activateBudget,
);

router.get('/reports/summary', reportYearValidation, validate, financeController.getFinancialSummary);
router.get('/reports/monthly', auditMiddleware('finance', 'Report', { action: 'EXPORT' }), financeController.getMonthlyReport);
router.get('/reports/annual', auditMiddleware('finance', 'Report', { action: 'EXPORT' }), reportYearValidation, validate, financeController.getAnnualReport);
router.get('/reports/giving-trends', financeController.getGivingTrends);
router.get('/reports/top-givers', financeController.getTopGivers);
router.get(
  '/reports/member-statement/:memberId',
  auditMiddleware('finance', 'Statement', { action: 'EXPORT' }),
  [param('memberId').trim().notEmpty().withMessage('Member ID is required.'), ...reportYearValidation],
  validate,
  financeController.getMemberAnnualStatement,
);
router.get('/reports/smart-intelligence', financeController.getSmartGivingIntelligence);

router.post('/goals', goalValidation, validate, financeController.setGivingGoal);
router.get('/goals', financeController.getGivingGoals);

router.get('/audit-log', financeController.getAuditLog);

export default router;
