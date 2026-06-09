import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';
import {
  AnalyticsPage,
  HealthBadge,
  KpiCard,
} from '../../components/analytics/AnalyticsWidgets';
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

  const branchCards = useMemo(() => {
    const profiles = branchesQuery.data?.items || [];
    const comparisonById = new Map((comparisonQuery.data?.items || []).map((item) => [item.branchId, item]));
    return profiles.map((branch) => ({ ...branch, analytics: comparisonById.get(branch.branchId) || {} }));
  }, [branchesQuery.data?.items, comparisonQuery.data?.items]);

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : branchCards.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {branchCards.map((branch) => {
              const trend = getTrendMeta(branch.analytics?.health?.trend);
              return (
                <div
                  key={branch.branchId}
                  className="rounded-[24px] border border-white/8 bg-[#0d1320] p-5 text-white shadow-[0_18px_38px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {branch.logoUrl ? (
                        <img src={branch.logoUrl} alt={branch.branchName} className="h-14 w-14 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-xl font-semibold text-accent">
                          {String(branch.branchName || 'B').slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-semibold text-white">{branch.branchName}</h2>
                        <p className="mt-1 text-sm text-white/50">{branch.city || 'City pending'} • {branch.headPastorName || 'Pastor pending'}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <p className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/50">
                        {branch.branchCode || 'N/A'}
                      </p>
                      <HealthBadge grade={branch.analytics?.health?.grade} score={branch.analytics?.health?.score} />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <KpiCard
                      label="Members"
                      value={formatAnalyticsNumber(branch.analytics?.members?.total || 0)}
                      helper={`${trend.icon} ${branch.analytics?.members?.active || 0} active`}
                    />
                    <KpiCard
                      label="Attendance"
                      value={formatAnalyticsNumber(branch.analytics?.attendance?.avg || 0)}
                      helper={`${formatAnalyticsNumber(branch.analytics?.attendance?.lastService || 0)} last service`}
                    />
                    <KpiCard
                      label="Income"
                      value={formatAnalyticsCurrency(branch.analytics?.finance?.income || 0, currencyCode, currencySymbol)}
                      helper={`${formatAnalyticsCurrency(branch.analytics?.finance?.net || 0, currencyCode, currencySymbol)} net`}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <p className={`text-sm font-medium ${trend.color}`}>
                      {trend.icon} {branch.analytics?.health?.trend || 'stable'}
                    </p>
                    <Link to={`/hq/branches/${branch.branchId}`}>
                      <Button variant="secondary">View Details</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
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
