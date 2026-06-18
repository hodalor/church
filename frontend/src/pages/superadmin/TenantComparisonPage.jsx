import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import { FilterTabs, HealthBadge, KpiCard } from '../../components/analytics/AnalyticsWidgets';
import { getTenantComparison } from '../../api/endpoints/platform';
import { formatAnalyticsCurrency, formatAnalyticsNumber, formatDateTime } from '../../utils/analytics';

const gradeTabs = ['all', 'A', 'B', 'C', 'D', 'F'];
const panelClass =
  'rounded-[18px] border p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]';
const bluePanel =
  `${panelClass} border-sky-400/18 bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(13,19,32,0.98))]`;
const violetPanel =
  `${panelClass} border-violet-400/18 bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(13,19,32,0.98))]`;
const goldPanel =
  `${panelClass} border-amber-400/18 bg-[linear-gradient(135deg,rgba(244,201,93,0.16),rgba(13,19,32,0.98))]`;

const getHealthGrade = (score) => {
  const value = Number(score || 0);
  if (value >= 85) return 'A';
  if (value >= 70) return 'B';
  if (value >= 55) return 'C';
  if (value >= 40) return 'D';
  return 'F';
};

export default function TenantComparisonPage() {
  const navigate = useNavigate();
  const [gradeFilter, setGradeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('all');

  const comparisonQuery = useQuery({
    queryKey: ['platform-tenant-comparison-page'],
    queryFn: () => getTenantComparison(),
  });

  const tenants = useMemo(() => comparisonQuery.data?.items || [], [comparisonQuery.data]);

  const planOptions = useMemo(
    () => ['all', ...new Set(tenants.map((tenant) => tenant.subscriptionPlan || tenant.plan || 'unknown'))],
    [tenants],
  );

  const filteredTenants = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tenants.filter((tenant) => {
      const matchesGrade = gradeFilter === 'all' || getHealthGrade(tenant.healthScore) === gradeFilter;
      const tenantPlan = tenant.subscriptionPlan || tenant.plan || 'unknown';
      const matchesPlan = plan === 'all' || tenantPlan === plan;
      const searchable = [
        tenant.churchName,
        tenant.country,
        tenant.tenantId,
        tenant.topBranch,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesGrade && matchesPlan && (!query || searchable.includes(query));
    });
  }, [gradeFilter, plan, search, tenants]);

  const alertTenants = useMemo(
    () =>
      filteredTenants
        .filter((tenant) => Number(tenant.healthScore || 0) < 55 || Number(tenant.growth || 0) < 0)
        .slice(0, 5),
    [filteredTenants],
  );

  const averageHealthScore = filteredTenants.length
    ? Math.round(
        filteredTenants.reduce((sum, tenant) => sum + Number(tenant.healthScore || 0), 0) /
          filteredTenants.length,
      )
    : 0;
  const totalMembers = filteredTenants.reduce((sum, tenant) => sum + Number(tenant.members || 0), 0);
  const totalAttendance = filteredTenants.reduce(
    (sum, tenant) => sum + Number(tenant.attendance || 0),
    0,
  );
  const totalIncome = filteredTenants.reduce((sum, tenant) => sum + Number(tenant.income || 0), 0);

  return (
    <SuperAdminShell>
      <div className="space-y-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">Platform BI</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Tenant Comparison</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
              Compare tenant health, growth, attendance, and revenue across the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => navigate('/superadmin/platform')}>
              Back to Platform BI
            </Button>
            <Button variant="secondary" onClick={() => navigate('/superadmin/tenants')}>
              Open All Churches
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Filtered Tenants" value={formatAnalyticsNumber(filteredTenants.length)} tone="blue" compact />
          <KpiCard label="Avg Health Score" value={`${averageHealthScore}%`} tone="emerald" compact />
          <KpiCard label="Total Members" value={formatAnalyticsNumber(totalMembers)} tone="violet" compact />
          <KpiCard label="Platform Revenue" value={formatAnalyticsCurrency(totalIncome)} tone="gold" compact />
        </div>

        <div className={`grid gap-4 xl:grid-cols-[1fr_180px_180px] ${bluePanel}`}>
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">Search</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search church, tenant ID, branch, country..."
              className="w-full rounded-2xl border border-sky-300/15 bg-sky-400/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/28"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">Plan</span>
            <select
              value={plan}
              onChange={(event) => setPlan(event.target.value)}
              className="w-full rounded-2xl border border-sky-300/15 bg-sky-400/10 px-4 py-2.5 text-sm text-white outline-none"
            >
              {planOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All Plans' : option}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/45">Health Grade</span>
            <FilterTabs
              tabs={gradeTabs.map((grade) => ({ label: grade, value: grade }))}
              value={gradeFilter}
              onChange={setGradeFilter}
            />
          </div>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-2">
          <div className={goldPanel}>
            <h2 className="text-lg font-semibold text-white">Alert Tenants</h2>
            <div className="mt-4 space-y-3">
              {alertTenants.length ? (
                alertTenants.map((tenant) => {
                  const isDeclining = Number(tenant.growth || 0) < 0;
                  const issue = Number(tenant.healthScore || 0) < 55
                    ? `Health score is ${tenant.healthScore || 0}, which needs attention.`
                    : `Growth has fallen to ${Number(tenant.growth || 0).toFixed(1)}%.`;

                  return (
                    <div
                      key={tenant.tenantId}
                      className={`rounded-2xl border px-4 py-3 ${
                        isDeclining
                          ? 'border-rose-500/25 bg-rose-500/10'
                          : 'border-amber-500/25 bg-amber-500/10'
                      }`}
                    >
                      <p className="font-medium text-white">{tenant.churchName}</p>
                      <p className="mt-1 text-sm text-white/65">{issue}</p>
                      <Button
                        variant="ghost"
                        className="mt-3 text-xs"
                        onClick={() => navigate(`/superadmin/tenants/${tenant.tenantId}`)}
                      >
                        Contact Church
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-6 text-sm text-emerald-200">
                  No filtered tenants are currently in the alert zone.
                </p>
              )}
            </div>
          </div>

          <div className={bluePanel}>
            <h2 className="text-lg font-semibold text-white">Top Performers</h2>
            <div className="mt-4 space-y-3">
              {filteredTenants
                .slice()
                .sort((left, right) => Number(right.growth || 0) - Number(left.growth || 0))
                .slice(0, 5)
                .map((tenant, index) => (
                  <button
                    key={tenant.tenantId}
                    type="button"
                    onClick={() => navigate(`/superadmin/tenants/${tenant.tenantId}`)}
                    className="flex w-full items-center justify-between rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-2.5 text-left"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {index + 1}. {tenant.churchName}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        {tenant.subscriptionPlan || tenant.plan || '-'} • {tenant.country || 'Unknown'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300">
                      {Number(tenant.growth || 0).toFixed(1)}%
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className={violetPanel}>
          <h2 className="text-lg font-semibold text-white">Tenant Comparison Table</h2>
          <p className="mt-1 text-sm text-white/55">
            Members {formatAnalyticsNumber(totalMembers)} • Attendance {formatAnalyticsNumber(totalAttendance)}
          </p>

          {comparisonQuery.isLoading ? (
            <div className="mt-4">
              <TableRowSkeleton columns={8} rows={8} />
            </div>
          ) : filteredTenants.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[980px] w-full text-left text-sm text-white/75">
                <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  <tr>
                    <th className="pb-3 pr-4">Church</th>
                    <th className="pb-3 pr-4">Plan</th>
                    <th className="pb-3 pr-4">Country</th>
                    <th className="pb-3 pr-4">Members</th>
                    <th className="pb-3 pr-4">Attendance</th>
                    <th className="pb-3 pr-4">Health</th>
                    <th className="pb-3 pr-4">Growth</th>
                    <th className="pb-3 pr-4">Last Active</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.tenantId} className="border-t border-white/8 align-top">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-white">{tenant.churchName}</p>
                          <p className="text-xs text-white/45">{tenant.tenantId}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4">{tenant.subscriptionPlan || tenant.plan || '-'}</td>
                      <td className="py-3 pr-4">{tenant.country || '-'}</td>
                      <td className="py-3 pr-4">{formatAnalyticsNumber(tenant.members || 0)}</td>
                      <td className="py-3 pr-4">{formatAnalyticsNumber(tenant.attendance || 0)}</td>
                      <td className="py-3 pr-4">
                        <HealthBadge
                          grade={getHealthGrade(tenant.healthScore)}
                          score={tenant.healthScore}
                        />
                      </td>
                      <td className={`py-3 pr-4 ${Number(tenant.growth || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {Number(tenant.growth || 0).toFixed(1)}%
                      </td>
                      <td className="py-3 pr-4">{formatDateTime(tenant.lastActiveAt || tenant.lastActivityAt, 'PP')}</td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={() => navigate(`/superadmin/tenants/${tenant.tenantId}`)}
                        >
                          View Tenant
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon="BI"
              title="No tenants match these filters"
              message="Try clearing the search, plan, or health grade filters."
            />
          )}
        </div>
      </div>
    </SuperAdminShell>
  );
}
