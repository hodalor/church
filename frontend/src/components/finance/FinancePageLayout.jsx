import AppShell from '../layout/AppShell';
import SuperAdminShell from '../layout/SuperAdminShell';
import Card from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';

export default function FinancePageLayout({
  children,
  requireRecord = false,
  requireApprove = false,
  fallbackTitle = 'Finance access limited',
  fallbackMessage = 'Your account does not currently have access to this finance workspace.',
}) {
  const { role } = useAuth();
  const { canViewFinance, canRecordFinance, canApproveFinance } = useFinanceAccess();
  const Shell = role === 'super_admin' ? SuperAdminShell : AppShell;

  const blocked =
    !canViewFinance ||
    (requireRecord && !canRecordFinance) ||
    (requireApprove && !canApproveFinance);

  if (blocked) {
    return (
      <Shell>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Finance</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">{fallbackTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">{fallbackMessage}</p>
        </Card>
      </Shell>
    );
  }

  return <Shell>{children}</Shell>;
}
