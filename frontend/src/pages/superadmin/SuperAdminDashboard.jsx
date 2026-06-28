import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

const kpiTones = ['gold', 'blue', 'emerald', 'violet', 'cyan', 'rose'];
const chartPalette = ['#F4C95D', '#38BDF8', '#34D399', '#A78BFA', '#FB7185'];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [showAllKpis, setShowAllKpis] = useState(false);
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
  const kpiItems = [
    ['Total Tenants', formatAnalyticsNumber(summary.totalTenants || 0)],
    ['Total Members', formatAnalyticsNumber(summary.totalMembers || 0)],
    ['Attendance', formatAnalyticsNumber(summary.totalAttendance || 0)],
    ['Revenue', formatAnalyticsCurrency(summary.totalIncome || 0)],
    ['Branches', formatAnalyticsNumber(summary.totalBranches || 0)],
    ['Critical Insights', formatAnalyticsNumber(summary.criticalInsights || 0)],
  ];
  const visibleKpis = showAllKpis ? kpiItems : kpiItems.slice(0, 4);

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

        <div className="space-y-3">
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleKpis.map(([label, value], index) => (
              <KpiCard key={label} label={label} value={value} tone={kpiTones[index]} compact />
            ))}
          </div>
          {kpiItems.length > 4 ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllKpis((current) => !current)}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/40 hover:text-slate-900"
              >
                {showAllKpis ? 'Show Less' : 'Show More'}
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Platform Growth</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Tenant growth momentum</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthItems}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="income" fill="#38BDF8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Platform Health</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Church health distribution</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthDistribution}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {healthDistribution.map((item, index) => (
                      <Cell key={item.name} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-3">
          <Card className="space-y-4 xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Revenue</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Monthly platform revenue</h2>
              </div>
              <Button variant="ghost" onClick={() => navigate('/superadmin/platform')}>
                Open BI
              </Button>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueItems}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="income" fill="#A78BFA" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Fastest Growing Churches</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Leaderboard</h2>
            </div>
            <div className="space-y-3">
              {fastestGrowing.length ? (
                fastestGrowing.map((tenant, index) => (
                  <button
                    key={tenant.tenantId}
                    type="button"
                    onClick={() => navigate(`/superadmin/tenants/${tenant.tenantId}`)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {index + 1}. {tenant.churchName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
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

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Phase 11 Workspaces</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Growth and intelligence modules</h2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/strategic')}>
              Open Strategic Plan
            </Button>
          </div>
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: 'Ministry Management',
                description: 'Track ministry health, meetings, and unassigned members.',
                to: '/ministry',
              },
              {
                title: 'CBS Groups',
                description: 'Manage study groups, prospects, pipeline movement, and conversion.',
                to: '/cbs',
              },
              {
                title: 'Leadership',
                description: 'Review development readiness, succession risk, and leadership profiles.',
                to: '/leadership',
              },
              {
                title: 'Strategic Plan',
                description: 'Monitor balanced scorecards, KPI health, and strategic execution.',
                to: '/strategic',
              },
              {
                title: 'Family Ministry',
                description: 'See family segments, at-risk households, and care insights.',
                to: '/hq/family-ministry',
              },
              {
                title: 'Audit Trail',
                description: 'Inspect suspicious activity, export history, and tenant audit logs.',
                to: '/audit',
              },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.to)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left transition hover:border-accent/30 hover:bg-white"
              >
                <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-accent">Open workspace</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Alert Tenants</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Needs attention now</h2>
            </div>
            <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
              {alertTenants.length ? (
                alertTenants.map((tenant) => (
                  <div
                    key={tenant.tenantId}
                    className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3"
                  >
                    <p className="font-medium text-slate-900">{tenant.churchName}</p>
                    <p className="mt-1 text-sm text-slate-600">
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

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Tenant Snapshot</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recent comparison table</h2>
              </div>
              <Button variant="ghost" onClick={() => navigate('/superadmin/platform/tenants')}>
                View all
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm text-slate-700">
                <thead className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">Church</th>
                    <th className="pb-3 pr-4">Plan</th>
                    <th className="pb-3 pr-4">Members</th>
                    <th className="pb-3 pr-4">Attendance</th>
                    <th className="pb-3 pr-4">Health</th>
                    <th className="pb-3">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantRows.slice(0, 6).map((tenant) => (
                    <tr key={tenant.tenantId} className="border-t border-white/8 align-top">
                      <td className="py-3 pr-4 font-medium text-slate-900">{tenant.churchName}</td>
                      <td className="py-3 pr-4">{tenant.subscriptionPlan || tenant.plan || '-'}</td>
                      <td className="py-3 pr-4">{formatAnalyticsNumber(tenant.members || 0)}</td>
                      <td className="py-3 pr-4">{formatAnalyticsNumber(tenant.attendance || 0)}</td>
                      <td className="py-3 pr-4">{Math.round(Number(tenant.healthScore || 0))}%</td>
                      <td className={`py-3 ${Number(tenant.growth || 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {Number(tenant.growth || 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </SuperAdminShell>
  );
}
