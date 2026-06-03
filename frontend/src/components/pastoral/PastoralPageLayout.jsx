import AppShell from '../layout/AppShell';
import SuperAdminShell from '../layout/SuperAdminShell';
import Card from '../ui/Card';
import PageHeader from '../ui/PageHeader';
import { usePastoralAccess } from '../../hooks/usePastoralAccess';

export default function PastoralPageLayout({
  title,
  subtitle,
  action,
  children,
  superAdminOnly = false,
}) {
  const { canViewPastoral, isSuperAdmin } = usePastoralAccess();
  const Shell = superAdminOnly ? SuperAdminShell : AppShell;

  if (superAdminOnly && !isSuperAdmin) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Pastoral Care</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Your account does not have permission to open the platform pastoral oversight workspace.
          </p>
        </Card>
      </AppShell>
    );
  }

  if (!superAdminOnly && !canViewPastoral) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Pastoral Care</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Your account does not have permission to view the pastoral care and discipleship workspace.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        {title ? <PageHeader title={title} subtitle={subtitle} action={action} /> : null}
        {children}
      </div>
    </Shell>
  );
}
