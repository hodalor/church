import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  Legend,
  Line,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton, ChartSkeleton, TableRowSkeleton } from '../../components/ui/Skeleton';
import {
  AnalyticsPage,
  AnalyticsSection,
  ChartPanel,
  HealthBadge,
  KpiCard,
  RefreshPill,
  SummaryList,
} from '../../components/analytics/AnalyticsWidgets';
import { getAllBranches } from '../../api/endpoints/branches';
import {
  getBranchComparison,
  getGrowthTrends,
  getHQOverview,
  getMemberIntelligence,
  getOperationalHealth,
} from '../../api/endpoints/hq';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { useTenant } from '../../hooks/useTenant';
import {
  buildKpiChange,
  formatAnalyticsCurrency,
  formatAnalyticsNumber,
  getTrendMeta,
  formatTimeAgo,
} from '../../utils/analytics';

const today = new Date();
const currentDateValue = today.toISOString().slice(0, 10);
const currentMonthStartValue = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

export default function HQDashboard() {
  const navigate = useNavigate();
  const { canViewHQ } = useAnalyticsAccess();
  const { currencyCode, currencySymbol } = useTenant();
  const [fromDate, setFromDate] = useState(currentMonthStartValue);
  const [toDate, setToDate] = useState(currentDateValue);
  const [branchId, setBranchId] = useState('');

  const branchListQuery = useQuery({
    queryKey: ['hq-branch-list'],
    queryFn: () => getAllBranches(),
    enabled: canViewHQ,
  });
  const overviewQuery = useQuery({
    queryKey: ['hq-overview', fromDate, toDate, branchId],
    queryFn: () =>
      getHQOverview({
        from: fromDate || undefined,
        to: toDate || undefined,
        branchId: branchId || undefined,
      }),
    enabled: canViewHQ,
  });
  const comparisonQuery = useQuery({
    queryKey: ['hq-branch-comparison', fromDate, toDate, branchId],
    queryFn: () =>
      getBranchComparison({
        from: fromDate || undefined,
        to: toDate || undefined,
        branchId: branchId || undefined,
      }),
    enabled: canViewHQ,
  });
  const growthQuery = useQuery({
    queryKey: ['hq-growth-trends', branchId],
    queryFn: () => getGrowthTrends({ months: 12, branchId: branchId || undefined }),
    enabled: canViewHQ,
  });
  const healthQuery = useQuery({
    queryKey: ['hq-operational-health', branchId],
    queryFn: () => getOperationalHealth({ branchId: branchId || undefined }),
    enabled: canViewHQ,
  });
  const membersQuery = useQuery({
    queryKey: ['hq-member-intelligence-summary', branchId],
    queryFn: () => getMemberIntelligence({ branchId: branchId || undefined }),
    enabled: canViewHQ,
  });
  const overview = overviewQuery.data || {};
  const branchComparison = comparisonQuery.data?.items || [];
  const growthItems = useMemo(() => growthQuery.data?.items || [], [growthQuery.data]);
  const memberIntelligence = membersQuery.data || {};
  const operationalHealth = healthQuery.data || {};
  const branches = branchListQuery.data?.items || [];

  const growthChartData = useMemo(
    () =>
      growthItems.map((item) => ({
        month: item.month,
        members: item.members?.total || 0,
        attendance: item.attendance?.total || 0,
        income: item.finance?.income || 0,
      })),
    [growthItems],
  );
  const sixMonthFinance = growthChartData.slice(-6).map((item) => ({
    ...item,
    expenses: growthItems.find((row) => row.month === item.month)?.finance?.expenses || 0,
    net:
      (growthItems.find((row) => row.month === item.month)?.finance?.income || 0) -
      (growthItems.find((row) => row.month === item.month)?.finance?.expenses || 0),
  }));
  const healthDistribution = [
    { name: 'Active', value: memberIntelligence.activeCount || 0, fill: '#22C55E' },
    { name: 'Drifting', value: memberIntelligence.driftingCount || 0, fill: '#F59E0B' },
    { name: 'At Risk', value: memberIntelligence.atRiskCount || 0, fill: '#F97316' },
    {
      name: 'Inactive',
      value: Math.max((memberIntelligence.totalMembers || 0) - (memberIntelligence.activeCount || 0) - (memberIntelligence.driftingCount || 0) - (memberIntelligence.atRiskCount || 0), 0),
      fill: '#EF4444',
    },
  ];
  const averageAttendance =
    branchComparison.length > 0
      ? branchComparison.reduce((sum, item) => sum + Number(item.attendance?.avg || 0), 0) /
        branchComparison.length
      : overview.thisMonth?.attendance || 0;
  const conversionRate =
    branchComparison.length > 0
      ? branchComparison.reduce((sum, item) => sum + Number(item.visitors?.rate || 0), 0) /
        branchComparison.length
      : 0;
  const metrics = [
    {
      label: 'Total Members',
      value: formatAnalyticsNumber(overview.summary?.totalMembers || 0),
      helper: `${formatAnalyticsNumber(overview.summary?.totalBranches || 0)} branches`,
      change: buildKpiChange(overview.vsLastMonth?.membersGrowth),
      to: '/members',
    },
    {
      label: 'Active Members',
      value: formatAnalyticsNumber(overview.summary?.activeMembers || 0),
      helper: `${formatAnalyticsNumber(memberIntelligence.atRiskCount || 0)} at risk`,
      to: '/hq/intelligence',
    },
    {
      label: 'Avg Sunday Attendance',
      value: formatAnalyticsNumber(averageAttendance),
      helper: 'Across selected branches',
      change: buildKpiChange(overview.vsLastMonth?.attendanceGrowth),
      to: '/attendance/reports',
    },
    {
      label: 'New This Month',
      value: formatAnalyticsNumber(overview.thisMonth?.newMembers || 0),
      helper: `${formatAnalyticsNumber(overview.thisMonth?.newVisitors || 0)} visitors`,
      to: '/members',
    },
    {
      label: 'Total Income',
      value: formatAnalyticsCurrency(overview.thisMonth?.income || 0, currencyCode, currencySymbol),
      helper: 'Selected period income',
      change: buildKpiChange(overview.vsLastMonth?.incomeGrowth),
      to: '/finance',
    },
    {
      label: 'Total Expenses',
      value: formatAnalyticsCurrency(overview.thisMonth?.expenses || 0, currencyCode, currencySymbol),
      helper: 'Selected period expenses',
      to: '/finance/expenses',
    },
    {
      label: 'Net Balance',
      value: formatAnalyticsCurrency(
        Number(overview.thisMonth?.income || 0) - Number(overview.thisMonth?.expenses || 0),
        currencyCode,
        currencySymbol,
      ),
      helper: 'Income minus expenses',
      to: '/finance/reports',
    },
    {
      label: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      helper: 'Visitors to members',
      to: '/visitors/reports',
    },
  ];
  const timelineItems = useMemo(() => {
    const opItems = (operationalHealth.systemAlerts || []).map((item, index) => ({
      id: `system-${index}`,
      title: item.message,
      type: item.module,
      branch: 'System',
      time: new Date().toISOString(),
    }));
    return opItems.slice(0, 20);
  }, [operationalHealth.systemAlerts]);

  if (!canViewHQ) {
    return (
      <AppShell>
        <EmptyState
          icon="HQ"
          title="Headquarters dashboard unavailable"
          message="Your current role does not have access to headquarters business intelligence."
        />
      </AppShell>
    );
  }

  const isLoading =
    overviewQuery.isLoading || comparisonQuery.isLoading || growthQuery.isLoading || membersQuery.isLoading;

  return (
    <AppShell>
      <AnalyticsPage
        title="Headquarters Overview"
        subtitle="Monitor branch performance, growth momentum, finances, and member health from one command center."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              max={toDate || undefined}
              className="rounded-[18px] border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900"
            />
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              min={fromDate || undefined}
              max={currentDateValue}
              className="rounded-[18px] border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900"
            />
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="rounded-[18px] border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </select>
            <RefreshPill
              label={`Updated ${formatTimeAgo(new Date().toISOString())}`}
              onClick={() => {
                overviewQuery.refetch();
                comparisonQuery.refetch();
                growthQuery.refetch();
                membersQuery.refetch();
                healthQuery.refetch();
              }}
            />
            <Button
              variant="secondary"
              onClick={() => {
                const params = new URLSearchParams();
                if (branchId) params.set('branchId', branchId);
                if (fromDate) params.set('from', fromDate);
                if (toDate) params.set('to', toDate);
                navigate(`/hq/reports${params.toString() ? `?${params.toString()}` : ''}`);
              }}
            >
              Generate Report
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <KpiCard key={metric.label} {...metric} />
            ))}
          </div>
        )}

        <AnalyticsSection
          title="Branch Performance Matrix"
          subtitle="Compare branch membership, attendance, finance strength, and health trends in one table."
        >
          {comparisonQuery.isLoading ? (
            <TableRowSkeleton columns={7} rows={6} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm text-slate-700">
                <thead className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                  <tr>
                    <th className="pb-3 pr-4">Branch</th>
                    <th className="pb-3 pr-4">Members</th>
                    <th className="pb-3 pr-4">Attendance</th>
                    <th className="pb-3 pr-4">Income</th>
                    <th className="pb-3 pr-4">Health</th>
                    <th className="pb-3 pr-4">Grade</th>
                    <th className="pb-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {branchComparison.map((branch) => {
                    const trend = getTrendMeta(branch.health?.trend);
                    return (
                      <tr
                        key={branch.branchId}
                        className="cursor-pointer border-t border-slate-200 align-top transition hover:bg-slate-50"
                        onClick={() => navigate(`/hq/branches/${branch.branchId}`)}
                      >
                        <td className="py-3 pr-4 font-medium text-slate-900">{branch.branchName}</td>
                        <td className="py-3 pr-4">{formatAnalyticsNumber(branch.members?.total || 0)}</td>
                        <td className="py-3 pr-4">{formatAnalyticsNumber(branch.attendance?.avg || 0)}</td>
                        <td className="py-3 pr-4">{formatAnalyticsCurrency(branch.finance?.income || 0, currencyCode, currencySymbol)}</td>
                        <td className="py-3 pr-4">{formatAnalyticsNumber(branch.health?.score || 0)}</td>
                        <td className="py-3 pr-4"><HealthBadge grade={branch.health?.grade} /></td>
                        <td className={`py-3 ${trend.color}`}>{trend.icon}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AnalyticsSection>

        <div className="grid items-start gap-4 xl:grid-cols-[1.5fr_1fr_0.9fr]">
          <ChartPanel title="12-Month Growth Trend" subtitle="Members, attendance, and income across the selected scope.">
            {growthQuery.isLoading ? (
              <ChartSkeleton />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={growthChartData}>
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis yAxisId="left" stroke="#94A3B8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine
                      yAxisId="left"
                      y={growthChartData.length ? growthChartData.reduce((sum, item) => sum + item.members, 0) / growthChartData.length : 0}
                      stroke="#475569"
                      strokeDasharray="4 4"
                    />
                    <Bar yAxisId="right" dataKey="income" fill="#445A8B" radius={[8, 8, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="members" stroke="#1E2A4A" strokeWidth={3} />
                    <Line yAxisId="left" type="monotone" dataKey="attendance" stroke="#C9A84C" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartPanel>

          <ChartPanel title="Income vs Expenses" subtitle="Last six months net balance.">
            {growthQuery.isLoading ? (
              <ChartSkeleton />
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sixMonthFinance}>
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="income" stackId="1" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.25} />
                    <Area type="monotone" dataKey="expenses" stackId="2" stroke="#1E2A4A" fill="#1E2A4A" fillOpacity={0.25} />
                    <Line type="monotone" dataKey="net" stroke="#22C55E" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartPanel>

          <ChartPanel title="Member Health Distribution" subtitle="Current engagement status mix.">
            {membersQuery.isLoading ? (
              <ChartSkeleton />
            ) : (
              <div className="space-y-4">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="35%" outerRadius="100%" barSize={18} data={healthDistribution}>
                      <RadialBar dataKey="value" cornerRadius={12} label={false} />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {healthDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm text-white/75">
                      <span>{item.name}</span>
                      <span>{formatAnalyticsNumber(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartPanel>
        </div>

        <AnalyticsSection
          title="Operational Health"
          subtitle="Volunteer coverage, pastoral load, communication cadence, and event readiness."
        >
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Volunteers"
              value={`${Number(operationalHealth.volunteers?.coverageRate || 0).toFixed(1)}%`}
              helper={`${formatAnalyticsNumber(operationalHealth.volunteers?.upcomingGaps?.length || 0)} shortage alerts`}
            />
            <KpiCard
              label="Pastoral"
              value={formatAnalyticsNumber(operationalHealth.pastoral?.overdueFollowUps || 0)}
              helper={`${formatAnalyticsNumber(operationalHealth.pastoral?.criticalUnattended || 0)} critical unattended`}
            />
            <KpiCard
              label="Communication"
              value={formatAnalyticsNumber(operationalHealth.communication?.lastBroadcastDays || 0)}
              helper={`${formatAnalyticsNumber(operationalHealth.communication?.unreadPrayerRequests || 0)} unread prayers`}
            />
            <KpiCard
              label="Events"
              value={formatAnalyticsNumber(operationalHealth.events?.upcomingCount || 0)}
              helper={`${formatAnalyticsNumber(operationalHealth.events?.overduePreparation?.length || 0)} overdue prep items`}
            />
          </div>
        </AnalyticsSection>

        <AnalyticsSection title="Recent Activity Timeline" subtitle="Latest system activity across the workspace.">
          <SummaryList
            items={timelineItems}
            formatter={(item) => (
              <div className="flex items-start justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.02] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                    {item.type} • {item.branch}
                  </p>
                </div>
                <p className="text-xs text-white/45">{formatTimeAgo(item.time)}</p>
              </div>
            )}
          />
        </AnalyticsSection>

      </AnalyticsPage>
    </AppShell>
  );
}
