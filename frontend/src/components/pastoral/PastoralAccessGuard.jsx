import { Navigate } from 'react-router-dom';
import AppShell from '../layout/AppShell';
import Card from '../ui/Card';
import { usePastoralAccess } from '../../hooks/usePastoralAccess';

export default function PastoralAccessGuard({ children, fallback = 'redirect' }) {
  const { canViewPastoral } = usePastoralAccess();

  if (canViewPastoral) {
    return children;
  }

  if (fallback === 'card') {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Pastoral Care</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Your account does not have permission to view the pastoral care and discipleship workspace.
          </p>
        </Card>
      </AppShell>
    );
  }

  return <Navigate to="/dashboard" replace />;
}
