import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { ChartSkeleton, TableRowSkeleton } from '../../components/ui/Skeleton';
import { AnalyticsPage, FilterTabs, HealthBadge, KpiCard } from '../../components/analytics/AnalyticsWidgets';
import {
  getPlatformGrowthTrends,
  getPlatformHealthScores,
  getPlatformOverview,
  getPlatformRevenue,
  getTenantComparison,
} from '../../api/endpoints/platform';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { formatAnalyticsCurrency, formatAnalyticsNumber } from '../../utils/analytics';

const grades = ['all', 'A', 'B', 'C', 'D', 'F'];
const kpiTones = ['gold', 'blue', 'emerald', 'violet', 'cyan', 'rose'];
const chartPalette = ['#F4C95D', '#38BDF8', '#34D399', '#A78BFA', '#FB7185', '#22D3EE'];
const panelClass =
  'rounded-[20px] border border-white/8 bg-[linear-gradient(135deg,rgba(13,19,32,0.94),rgba(17,24,39,0.98))] p-4 text-white shadow-[0_16px_32px_rgba(0,0,0,0.18)]';

export default function PlatformBIPage() {
  const { canViewPlatformBI } = useAnalyticsAccess();
  const [gradeFilter, setGradeFilter] = useState('all');
  const [showAllKpis, setShowAllKpis] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ['platform-bi-overview'],
    queryFn: () => getPlatformOverview(),
    enabled: canViewPlatformBI,
  });
  const growthQuery = useQuery({
    queryKey: ['platform-bi-growth'],
    queryFn: () => getPlatformGrowthTrends(),
    enabled: canViewPlatformBI,
  });
  const healthQuery = useQuery({
    queryKey: ['platform-bi-health'],
    queryFn: () => getPlatformHealthScores(),
    enabled: canViewPlatformBI,
  });
  const revenueQuery = useQuery({
    queryKey: ['platform-bi-revenue'],
    queryFn: () => getPlatformRevenue(),
    enabled: canViewPlatformBI,
  });
  const tenantsQuery = useQuery({
    queryKey: ['platform-bi-comparison'],
    queryFn: () => getTenantComparison(),
    enabled: canViewPlatformBI,
  });

  const overview = overviewQuery.data || {};
  const growth = growthQuery.data?.items || [];
  const healthRows = useMemo(() => healthQuery.data?.items || [], [healthQuery.data]);
  const revenue = revenueQuery.data || {};
  const tenants = useMemo(() => tenantsQuery.data?.items || [], [tenantsQuery.data]);

  const tenantRows = useMemo(
    () =>
      tenants.filter((tenant) => {
        if (gradeFilter === 'all') return true;
        const score = Number(tenant.healthScore || 0);
        const grade =
          score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
        return grade === gradeFilter;
      }),
    [gradeFilter, tenants],
  );
  const gradeCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    healthRows.forEach((item) => {
      const score = Number(item.healthScore || 0);
      const grade =
        score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F';
      counts[grade] += 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [healthRows]);
  const planData = useMemo(() => {
    const plans = overview.tenants?.reduce((acc, tenant) => {
      const plan = tenant.subscriptionPlan || 'unknown';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(plans || {}).map(([name, value], index) => ({
      name,
      value,
      fill: ['#C9A84C', '#1E2A4A', '#8B5CF6', '#34D399'][index % 4],
    }));
  }, [overview.tenants]);
  const kpiItems = [
    ['Total Tenants', formatAnalyticsNumber(overview.summary?.totalTenants || 0)],
    ['Total Members', formatAnalyticsNumber(overview.summary?.totalMembers || 0)],
    ['Platform Attendance', formatAnalyticsNumber(overview.summary?.totalAttendance || 0)],
    ['Platform Revenue', formatAnalyticsCurrency(overview.summary?.totalIncome || 0)],
    ['Total Branches', formatAnalyticsNumber(overview.summary?.totalBranches || 0)],
    ['Critical Insights', formatAnalyticsNumber(overview.summary?.criticalInsights || 0)],
  ];
  const visibleKpis = showAllKpis ? kpiItems : kpiItems.slice(0, 4);

  if (!canViewPlatformBI) {
    return (
      <SuperAdminShell>
        <EmptyState
          icon="SA"
          title="Platform BI unavailable"
          message="Only super admins can access platform-wide business intelligence."
        />
      </SuperAdminShell>
    );
  }

  return (
    <SuperAdminShell>
      <AnalyticsPage
        title="Platform Business Intelligence"
        subtitle="Monitor tenant growth, health scores, branch expansion, revenue movement, and cross-platform ministry risk."
        action={
          <Button variant="secondary" onClick={() => (window.location.href = '/superadmin/platform/tenants')}>
            Open Tenant Comparison
          </Button>
        }
      >
        {overviewQuery.isLoading ? (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <ChartSkeleton key={index} />
            ))}
          </div>
        ) : (
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
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-accent/30 hover:text-white"
                >
                  {showAllKpis ? 'Show Less' : 'Show More'}
                </button>
              </div>
            ) : null}
          </div>
        )}

        <div className="grid items-start gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <div className={panelClass}>
            <h3 className="text-lg font-semibold text-white">Platform growth chart</h3>
            {growthQuery.isLoading ? (
              <ChartSkeleton />
            ) : (
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growth}>
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip />
                    <Bar dataKey="income" fill="#38BDF8" radius={[8, 8, 0, 0]} />
                    <Line type="monotone" dataKey="members" stroke="#A78BFA" strokeWidth={3} />
                    <Line type="monotone" dataKey="attendance" stroke="#F4C95D" strokeWidth={3} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className={panelClass}>
              <h3 className="text-lg font-semibold text-white">Plan distribution</h3>
              <div className="mt-4 h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planData} dataKey="value" nameKey="name" outerRadius={70}>
                      {planData.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={panelClass}>
              <h3 className="text-lg font-semibold text-white">Revenue by month</h3>
              <div className="mt-4 h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue.monthly || []}>
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip />
                    <Bar dataKey="income" radius={[8, 8, 0, 0]}>
                      {(revenue.monthly || []).map((item, index) => (
                        <Cell key={`${item.month}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Health score distribution</h3>
            <FilterTabs
              tabs={grades.map((grade) => ({ label: grade, value: grade }))}
              value={gradeFilter}
              onChange={setGradeFilter}
            />
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeCounts}>
                <XAxis dataKey="name" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {gradeCounts.map((item, index) => (
                    <Cell key={item.name} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={panelClass}>
          <h3 className="text-lg font-semibold text-white">Tenant comparison</h3>
          {tenantsQuery.isLoading ? (
            <TableRowSkeleton columns={8} rows={6} />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm text-white/75">
                <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  <tr>
                    <th className="pb-3 pr-4">Church</th>
                    <th className="pb-3 pr-4">Members</th>
                    <th className="pb-3 pr-4">Attendance</th>
                    <th className="pb-3 pr-4">Income</th>
                    <th className="pb-3 pr-4">Health</th>
                    <th className="pb-3 pr-4">Branches</th>
                    <th className="pb-3 pr-4">Top Branch</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantRows.map((tenant) => (
                    <tr key={tenant.tenantId} className="border-t border-white/8 align-top">
                      <td className="py-3 pr-4 font-medium text-white">{tenant.churchName}</td>
                      <td className="py-3 pr-4">{formatAnalyticsNumber(tenant.members || 0)}</td>
                      <td className="py-3 pr-4">{formatAnalyticsNumber(tenant.attendance || 0)}</td>
                      <td className="py-3 pr-4">{formatAnalyticsCurrency(tenant.income || 0)}</td>
                      <td className="py-3 pr-4"><HealthBadge grade={tenant.healthScore >= 85 ? 'A' : tenant.healthScore >= 70 ? 'B' : tenant.healthScore >= 55 ? 'C' : tenant.healthScore >= 40 ? 'D' : 'F'} score={tenant.healthScore} /></td>
                      <td className="py-3 pr-4">{formatAnalyticsNumber(tenant.branches || 0)}</td>
                      <td className="py-3 pr-4">{tenant.topBranch || '-'}</td>
                      <td className="py-3">
                        <Button variant="ghost" className="text-xs" onClick={() => (window.location.href = `/superadmin/tenants/${tenant.tenantId}`)}>
                          View Tenant
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AnalyticsPage>
    </SuperAdminShell>
  );
}
