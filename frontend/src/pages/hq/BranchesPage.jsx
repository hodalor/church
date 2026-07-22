import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { AnalyticsPage } from '../../components/analytics/AnalyticsWidgets';
import { getAllBranches } from '../../api/endpoints/branches';
import { getBranchComparison } from '../../api/endpoints/hq';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { useTenant } from '../../hooks/useTenant';
import {
  formatAnalyticsCurrency,
  formatAnalyticsNumber,
  formatBranchHealthGrade,
} from '../../utils/analytics';

export default function BranchesPage() {
  const { canViewBranches, canManageBranches } = useAnalyticsAccess();
  const { currencyCode, currencySymbol } = useTenant();
  const branchesQuery = useQuery({
    queryKey: ['hq-branches-grid'],
    queryFn: () => getAllBranches(),
    enabled: canViewBranches,
    staleTime: 1000 * 60 * 5,
  });
  const comparisonQuery = useQuery({
    queryKey: ['hq-branches-comparison-grid'],
    queryFn: () => getBranchComparison(),
    enabled: canViewBranches,
    staleTime: 1000 * 60 * 3,
  });

  const branchRows = useMemo(() => {
    const profiles = branchesQuery.data?.items || [];
    const comparisonById = new Map((comparisonQuery.data?.items || []).map((item) => [item.branchId, item]));
    return profiles.map((branch) => {
      const analytics = comparisonById.get(branch.branchId) || {};
      const trendDirection = String(analytics?.health?.trend || 'stable').toLowerCase();
      const trendIcon =
        trendDirection === 'up' || trendDirection === 'improving'
          ? '↑'
          : trendDirection === 'down' || trendDirection === 'declining'
            ? '↓'
            : '→';
      return {
        ...branch,
        analytics,
        trend: {
          direction: trendDirection,
          icon: trendIcon,
        },
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
      render: (branch) => {
        const grade = formatBranchHealthGrade(branch.analytics?.health?.grade);
        const lightHealthClass =
          grade === 'A'
            ? 'border-emerald-200 bg-emerald-50 text-slate-900'
            : grade === 'B'
              ? 'border-teal-200 bg-teal-50 text-slate-900'
              : grade === 'C'
                ? 'border-amber-200 bg-amber-50 text-slate-900'
                : grade === 'D'
                  ? 'border-orange-200 bg-orange-50 text-slate-900'
                  : 'border-rose-200 bg-rose-50 text-slate-900';
        return (
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${lightHealthClass}`}>
            <span className="text-slate-900">{grade}</span>
            <span className="text-slate-900">{formatAnalyticsNumber(branch.analytics?.health?.score || 0)}</span>
          </span>
        );
      },
    },
    {
      key: 'trend',
      header: 'Trend',
      render: (branch) => {
        const lightTrendClass =
          branch.trend.direction === 'up' || branch.trend.direction === 'improving'
            ? 'text-emerald-700'
            : branch.trend.direction === 'down' || branch.trend.direction === 'declining'
              ? 'text-rose-700'
              : 'text-slate-900';
        return <span className={`inline-flex items-center text-lg font-semibold ${lightTrendClass}`}>{branch.trend.icon}</span>;
      },
    },
    {
      key: 'actions',
      header: 'Action',
      render: (branch) => (
        <Link
          to={`/hq/branches/${branch.branchId}`}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 transition duration-200 hover:border-accent/40 hover:bg-slate-50 hover:text-slate-900"
        >
          Open
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
