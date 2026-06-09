import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  getPlatformGrowthTrends,
  getPlatformHealthScores,
  getPlatformOverview,
  getPlatformRevenue,
  getTenantComparison,
} from '../../api/endpoints/platform';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import { KpiCard } from '../../components/analytics/AnalyticsWidgets';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { formatAnalyticsCurrency, formatAnalyticsNumber } from '../../utils/analytics';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const overviewQuery = useQuery({
    queryKey: ['superadmin-platform-overview'],
    queryFn: getPlatformOverview,
  });
  const growthQuery = useQuery({
    queryKey: ['superadmin-platform-growth'],
    queryFn: getPlatformGrowthTrends,
  });
  const healthQuery = useQuery({
    queryKey: ['superadmin-platform-health'],
    queryFn: getPlatformHealthScores,
  });
  const revenueQuery = useQuery({
    queryKey: ['superadmin-platform-revenue'],
    queryFn: getPlatformRevenue,
  });
  const comparisonQuery = useQuery({
    queryKey: ['superadmin-platform-comparison'],
    queryFn: getTenantComparison,
  });

  const overview = overviewQuery.data || {};
  const summary = overview.summary || {};
  const growthItems = growthQuery.data?.items || [];
  const healthItems = useMemo(() => healthQuery.data?.items || [], [healthQuery.data]);
  const revenueItems = revenueQuery.data?.monthly || [];
  const tenantRows = useMemo(() => comparisonQuery.data?.items || [], [comparisonQuery.data]);

  const healthDistribution = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    healthItems.forEach((item) => {
      const score = Number(item.healthScore || 0);
      if (score >= 85) counts.A += 1;
      else if (score >= 70) counts.B += 1;
      else if (score >= 55) counts.C += 1;
      else if (score >= 40) counts.D += 1;
      else counts.F += 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [healthItems]);

  const fastestGrowing = useMemo(
    () =>
      tenantRows
        .slice()
        .sort((left, right) => Number(right.growth || 0) - Number(left.growth || 0))
        .slice(0, 5),
    [tenantRows],
  );

  const alertTenants = useMemo(
    () =>
      tenantRows
        .filter((tenant) => Number(tenant.healthScore || 0) < 55 || Number(tenant.growth || 0) < 0)
        .slice(0, 5),
    [tenantRows],
  );

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          title="Master Dashboard"
          subtitle="Track platform-wide growth, health, revenue, and tenant risk across all churches."
          action={
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => navigate('/superadmin/platform/tenants')}>
                Tenant Comparison
              </Button>
              <Button variant="secondary" onClick={() => navigate('/superadmin/platform')}>
                Open Platform BI
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard label="Total Tenants" value={formatAnalyticsNumber(summary.totalTenants || 0)} />
          <KpiCard label="Total Members" value={formatAnalyticsNumber(summary.totalMembers || 0)} />
          <KpiCard label="Attendance" value={formatAnalyticsNumber(summary.totalAttendance || 0)} />
          <KpiCard label="Revenue" value={formatAnalyticsCurrency(summary.totalIncome || 0)} />
          <KpiCard label="Branches" value={formatAnalyticsNumber(summary.totalBranches || 0)} />
          <KpiCard label="Critical Insights" value={formatAnalyticsNumber(summary.criticalInsights || 0)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Platform Growth</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Tenant growth momentum</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthItems}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="income" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Platform Health</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Church health distribution</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthDistribution}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="space-y-4 xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/55">Revenue</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Monthly platform revenue</h2>
              </div>
              <Button variant="ghost" onClick={() => navigate('/superadmin/platform')}>
                Open BI
              </Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueItems}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="income" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Fastest Growing Churches</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Leaderboard</h2>
            </div>
            <div className="space-y-3">
              {fastestGrowing.length ? (
                fastestGrowing.map((tenant, index) => (
                  <button
                    key={tenant.tenantId}
                    type="button"
                    onClick={() => navigate(`/superadmin/tenants/${tenant.tenantId}`)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-left"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {index + 1}. {tenant.churchName}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        {tenant.country || 'Unknown'} • {tenant.subscriptionPlan || tenant.plan || '-'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300">
                      {Number(tenant.growth || 0).toFixed(1)}%
                    </span>
                  </button>
                ))
              ) : (
                <EmptyState
                  icon="SA"
                  title="No growth data yet"
                  message="Tenant growth trends will appear here when data is available."
                />
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/55">Tenant Snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Recent comparison table</h2>
              </div>
              <Button variant="ghost" onClick={() => navigate('/superadmin/platform/tenants')}>
                View all
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-white/75">
                <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  <tr>
                    <th className="pb-3">Church</th>
                    <th className="pb-3">Plan</th>
                    <th className="pb-3">Members</th>
                    <th className="pb-3">Attendance</th>
                    <th className="pb-3">Health</th>
                    <th className="pb-3">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantRows.slice(0, 6).map((tenant) => (
                    <tr key={tenant.tenantId} className="border-t border-white/8">
                      <td className="py-3 font-medium text-white">{tenant.churchName}</td>
                      <td>{tenant.subscriptionPlan || tenant.plan || '-'}</td>
                      <td>{formatAnalyticsNumber(tenant.members || 0)}</td>
                      <td>{formatAnalyticsNumber(tenant.attendance || 0)}</td>
                      <td>{Math.round(Number(tenant.healthScore || 0))}%</td>
                      <td className={Number(tenant.growth || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                        {Number(tenant.growth || 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Alert Tenants</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Needs attention now</h2>
            </div>
            <div className="space-y-3">
              {alertTenants.length ? (
                alertTenants.map((tenant) => (
                  <div
                    key={tenant.tenantId}
                    className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3"
                  >
                    <p className="font-medium text-white">{tenant.churchName}</p>
                    <p className="mt-1 text-sm text-white/65">
                      {Number(tenant.healthScore || 0) < 55
                        ? `Health score is ${Math.round(Number(tenant.healthScore || 0))}%.`
                        : `Growth has fallen to ${Number(tenant.growth || 0).toFixed(1)}%.`}
                    </p>
                    <Button
                      variant="ghost"
                      className="mt-3 text-xs"
                      onClick={() => navigate(`/superadmin/tenants/${tenant.tenantId}`)}
                    >
                      Contact Church
                    </Button>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon="OK"
                  title="No tenants in the alert zone"
                  message="Critical platform issues will surface here automatically."
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </SuperAdminShell>
  );
}
