import { useCapabilities } from './useCapabilities';

export const useFinanceAccess = () => {
  const { hasAnyCapability, hasCapability } = useCapabilities();

  const canViewFinance =
    hasAnyCapability([
      'finance.view',
      'finance.overview.view',
      'finance.transactions.view',
      'finance.pledges.view',
      'finance.expenses.view',
      'finance.budgets.view',
      'finance.reports.view',
      'finance.audit.view',
    ]);
  const canRecordFinance = hasAnyCapability(['finance.create', 'finance.transactions.create']);
  const canApproveFinance = hasAnyCapability([
    'finance.modify',
    'finance.transactions.verify',
    'finance.transactions.reverse',
    'finance.expenses.approve',
    'finance.expenses.reject',
  ]);
  const canModifyBudgets = hasAnyCapability([
    'finance.modify',
    'finance.budgets.modify',
    'finance.budgets.activate',
  ]);
  const canSeeSmartInsights = hasAnyCapability(['finance.view', 'finance.reports.view']);

  const canOpenOverview = hasAnyCapability(['finance.view', 'finance.overview.view']);
  const canOpenTransactions = hasAnyCapability(['finance.view', 'finance.transactions.view']);
  const canOpenPledges = hasAnyCapability(['finance.view', 'finance.pledges.view']);
  const canOpenExpenses = hasAnyCapability(['finance.view', 'finance.expenses.view']);
  const canOpenBudgets = hasAnyCapability(['finance.view', 'finance.budgets.view']);
  const canOpenReports = hasAnyCapability(['finance.view', 'finance.reports.view']);
  const canOpenAudit = hasAnyCapability(['finance.view', 'finance.audit.view']);
  const canRecordPledges = hasAnyCapability(['finance.create', 'finance.pledges.create']);
  const canRecordPledgePayments = hasAnyCapability([
    'finance.create',
    'finance.pledges.record_payment',
  ]);
  const canRecordExpenses = hasAnyCapability(['finance.create', 'finance.expenses.create']);
  const canCreateBudgets = hasAnyCapability(['finance.create', 'finance.budgets.create']);
  const canExportReports = hasAnyCapability([
    'finance.reports.export',
    'finance.transactions.export',
  ]);
  const canManageGivingGoals = hasAnyCapability(['finance.reports.manage_goals']);

  return {
    canViewFinance,
    canRecordFinance,
    canApproveFinance,
    canModifyBudgets,
    canSeeSmartInsights,
    canOpenOverview,
    canOpenTransactions,
    canOpenPledges,
    canOpenExpenses,
    canOpenBudgets,
    canOpenReports,
    canOpenAudit,
    canRecordPledges,
    canRecordPledgePayments,
    canRecordExpenses,
    canCreateBudgets,
    canExportReports,
    canManageGivingGoals,
    hasFinanceCapability: hasCapability,
  };
};

export default useFinanceAccess;
