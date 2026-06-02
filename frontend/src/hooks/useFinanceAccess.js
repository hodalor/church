import { useAuth } from './useAuth';
import { useCapabilities } from './useCapabilities';

const fullAccessRoles = new Set(['super_admin', 'head_pastor', 'treasurer']);
const recordRoles = new Set(['super_admin', 'head_pastor', 'treasurer', 'finance_officer']);
const reportRoles = new Set([
  'super_admin',
  'head_pastor',
  'treasurer',
  'finance_officer',
  'associate_pastor',
  'branch_pastor',
]);

export const useFinanceAccess = () => {
  const { role } = useAuth();
  const { hasCapability } = useCapabilities();

  const canViewFinance = reportRoles.has(role) && hasCapability('finance.view');
  const canRecordFinance = recordRoles.has(role) && hasCapability('finance.create');
  const canApproveFinance = fullAccessRoles.has(role) && hasCapability('finance.modify');
  const canModifyBudgets = fullAccessRoles.has(role) && hasCapability('finance.modify');
  const canSeeSmartInsights = fullAccessRoles.has(role);

  return {
    canViewFinance,
    canRecordFinance,
    canApproveFinance,
    canModifyBudgets,
    canSeeSmartInsights,
  };
};

export default useFinanceAccess;
