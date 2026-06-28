import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { AnalyticsPage, HealthBadge } from '../../components/analytics/AnalyticsWidgets';
import { getAllBranches } from '../../api/endpoints/branches';
import { getBranchComparison } from '../../api/endpoints/hq';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { useTenant } from '../../hooks/useTenant';
import { formatAnalyticsCurrency, formatAnalyticsNumber, getTrendMeta } from '../../utils/analytics';

export default function BranchesPage() {
  const { canViewBranches, canManageBranches } = useAnalyticsAccess();
  const { currencyCode, currencySymbol } = useTenant();
  const branchesQuery = useQuery({
    queryKey: ['hq-branches-grid'],
    queryFn: () => getAllBranches(),
    enabled: canViewBranches,
  });
  const comparisonQuery = useQuery({
    queryKey: ['hq-branches-comparison-grid'],
    queryFn: () => getBranchComparison(),
    enabled: canViewBranches,
  });

  const branchRows = useMemo(() => {
    const profiles = branchesQuery.data?.items || [];
    const comparisonById = new Map((comparisonQuery.data?.items || []).map((item) => [item.branchId, item]));
    return profiles.map((branch) => {
      const analytics = comparisonById.get(branch.branchId) || {};
      const trend = getTrendMeta(analytics?.health?.trend);
      return {
        ...branch,
        analytics,
        trend,
      };
    });
  }, [branchesQuery.data?.items, comparisonQuery.data?.items]);

  const columns = [
    {
      key: 'branchName',
      header: 'Branch',
      render: (branch) => (
        <div>
          <p className="font-semibold text-slate-900">{branch.branchName}</p>
          <p className="text-xs text-slate-500">{branch.branchCode || 'No code'}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (branch) => branch.city || branch.address || 'Not set',
    },
    {
      key: 'headPastor',
      header: 'Pastor',
      render: (branch) => branch.headPastorName || 'Pending',
    },
    {
      key: 'members',
      header: 'Members',
      render: (branch) => formatAnalyticsNumber(branch.analytics?.members?.total || 0),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (branch) => formatAnalyticsNumber(branch.analytics?.attendance?.avg || 0),
    },
    {
      key: 'income',
      header: 'Income',
      render: (branch) =>
        formatAnalyticsCurrency(branch.analytics?.finance?.income || 0, currencyCode, currencySymbol),
    },
    {
      key: 'health',
      header: 'Health',
      render: (branch) => <HealthBadge grade={branch.analytics?.health?.grade} score={branch.analytics?.health?.score} />,
    },
    {
      key: 'trend',
      header: 'Trend',
      render: (branch) => <span className={branch.trend.color}>{branch.trend.icon}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (branch) => (
        <Link to={`/hq/branches/${branch.branchId}`}>
          <Button variant="ghost">Open</Button>
        </Link>
      ),
    },
  ];

  if (!canViewBranches) {
    return (
      <AppShell>
        <EmptyState
          icon="BR"
          title="Branch view unavailable"
          message="Your role does not currently have access to branch management."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AnalyticsPage
        title="Branches"
        subtitle="Review branch health, attendance, giving, and local leadership performance across the ministry."
        action={
          canManageBranches ? (
            <Link to="/hq/branches/new">
              <Button variant="secondary">Create Branch</Button>
            </Link>
          ) : null
        }
      >
        {branchesQuery.isLoading || comparisonQuery.isLoading ? (
          <TableRowSkeleton columns={9} rows={6} />
        ) : branchRows.length ? (
          <div className="rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm">
            <DataTable columns={columns} data={branchRows} tone="light" emptyMessage="No branch records available." />
          </div>
        ) : (
          <EmptyState
            icon="BR"
            title="No branches yet"
            message="Create the first branch profile to start tracking branch-level intelligence."
            actionLabel={canManageBranches ? 'Create Branch' : undefined}
            onAction={canManageBranches ? () => (window.location.href = '/hq/branches/new') : undefined}
          />
        )}
      </AnalyticsPage>
    </AppShell>
  );
}
