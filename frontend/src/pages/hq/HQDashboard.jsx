import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
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
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton, ChartSkeleton, TableRowSkeleton } from '../../components/ui/Skeleton';
import {
  ActionLink,
  AnalyticsPage,
  AnalyticsSection,
  ChartPanel,
  FilterTabs,
  HealthBadge,
  InsightCard,
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
import {
  generateInsights,
  getAllInsights,
  getCriticalInsights,
  markInsightActioned,
  markInsightRead,
} from '../../api/endpoints/insights';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { useTenant } from '../../hooks/useTenant';
import { useBrandingStore } from '../../stores/brandingStore';
import {
  PERIOD_OPTIONS,
  buildKpiChange,
  formatAnalyticsCurrency,
  formatAnalyticsNumber,
  getTrendMeta,
  formatTimeAgo,
} from '../../utils/analytics';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const radarColors = ['#C9A84C', '#60A5FA', '#34D399', '#F97316', '#A78BFA', '#F43F5E'];

export default function HQDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canViewHQ, canViewInsights } = useAnalyticsAccess();
  const { churchName, currencyCode, currencySymbol } = useTenant();
  const tenantBranding = useBrandingStore((state) => state.tenantBranding);
  const [period, setPeriod] = useState('monthly');
  const [branchId, setBranchId] = useState('');
  const [matrixView, setMatrixView] = useState('table');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const branchListQuery = useQuery({
    queryKey: ['hq-branch-list'],
    queryFn: () => getAllBranches(),
    enabled: canViewHQ,
  });
  const overviewQuery = useQuery({
    queryKey: ['hq-overview', period, branchId],
    queryFn: () => getHQOverview({ period, branchId: branchId || undefined }),
    enabled: canViewHQ,
  });
  const comparisonQuery = useQuery({
    queryKey: ['hq-branch-comparison', period, branchId],
    queryFn: () => getBranchComparison({ period, branchId: branchId || undefined }),
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
  const insightsQuery = useQuery({
    queryKey: ['hq-insights-feed', branchId],
    queryFn: () => getAllInsights({ limit: 6, branchId: branchId || undefined }),
    enabled: canViewInsights,
    refetchInterval: 300000,
  });
  const criticalInsightsQuery = useQuery({
    queryKey: ['hq-critical-insights', branchId],
    queryFn: () => getCriticalInsights({ limit: 5, branchId: branchId || undefined }),
    enabled: canViewInsights,
  });

  const readMutation = useMutation({
    mutationFn: (insight) => markInsightRead(insight._id || insight.id),
    onSuccess: () => {
      showSuccessToast('Insight marked as read.');
      queryClient.invalidateQueries({ queryKey: ['hq-insights-feed'] });
      queryClient.invalidateQueries({ queryKey: ['hq-critical-insights'] });
    },
    onError: (error) => showErrorToast(error.message || 'Unable to update insight.'),
  });
  const actionMutation = useMutation({
    mutationFn: (insight) => markInsightActioned(insight._id || insight.id),
    onSuccess: () => {
      showSuccessToast('Insight marked as actioned.');
      queryClient.invalidateQueries({ queryKey: ['hq-insights-feed'] });
      queryClient.invalidateQueries({ queryKey: ['hq-critical-insights'] });
    },
    onError: (error) => showErrorToast(error.message || 'Unable to update insight.'),
  });
  const generateMutation = useMutation({
    mutationFn: () => generateInsights(),
    onSuccess: () => {
      showSuccessToast('Fresh insights generated.');
      queryClient.invalidateQueries({ queryKey: ['hq-insights-feed'] });
      queryClient.invalidateQueries({ queryKey: ['hq-critical-insights'] });
    },
    onError: (error) => showErrorToast(error.message || 'Unable to generate insights.'),
  });

  const overview = overviewQuery.data || {};
  const branchComparison = comparisonQuery.data?.items || [];
  const growthItems = useMemo(() => growthQuery.data?.items || [], [growthQuery.data]);
  const memberIntelligence = membersQuery.data || {};
  const operationalHealth = healthQuery.data || {};
  const insights = insightsQuery.data?.items || [];
  const criticalInsights = criticalInsightsQuery.data?.items || [];
  const branches = branchListQuery.data?.items || [];
  const workspaceName = tenantBranding?.appName || churchName || 'Church';

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
  const radarData = [
    { subject: 'Members', ...Object.fromEntries(branchComparison.map((branch) => [branch.branchName, branch.members?.total || 0])) },
    { subject: 'Attendance', ...Object.fromEntries(branchComparison.map((branch) => [branch.branchName, branch.attendance?.avg || 0])) },
    { subject: 'Finance', ...Object.fromEntries(branchComparison.map((branch) => [branch.branchName, branch.finance?.income || 0])) },
    { subject: 'Visitors', ...Object.fromEntries(branchComparison.map((branch) => [branch.branchName, branch.visitors?.total || 0])) },
    { subject: 'Volunteers', ...Object.fromEntries(branchComparison.map((branch) => [branch.branchName, branch.members?.active || 0])) },
    { subject: 'Pastoral', ...Object.fromEntries(branchComparison.map((branch) => [branch.branchName, 100 - (branch.members?.atRisk || 0)])) },
  ];
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
    const alertItems = (overview.alerts || []).map((item, index) => ({
      id: `alert-${index}`,
      title: item.title || item.message || 'Insight alert',
      type: item.type || 'insight',
      branch: item.branchName || 'All branches',
      time: item.createdAt || new Date().toISOString(),
    }));
    const opItems = (operationalHealth.systemAlerts || []).map((item, index) => ({
      id: `system-${index}`,
      title: item.message,
      type: item.module,
      branch: 'System',
      time: new Date().toISOString(),
    }));
    return [...alertItems, ...opItems].slice(0, 20);
  }, [operationalHealth.systemAlerts, overview.alerts]);

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
        subtitle="Monitor branch performance, growth momentum, finances, member health, and AI-driven ministry signals from one command center."
        action={
          <div className="flex flex-wrap gap-2">
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
            <Button variant="secondary" onClick={() => setIsReportModalOpen(true)}>
              Generate Report
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto]">
          <CardSkeleton className="xl:hidden" />
          <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4 text-white xl:col-span-1">
            <p className="text-sm text-white/60">{workspaceName}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{churchName || workspaceName}</p>
            <p className="mt-2 text-sm text-white/45">Headquarters overview</p>
          </div>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-[22px] border border-white/10 bg-[#0d1320] px-4 py-3 text-white"
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
            className="rounded-[22px] border border-white/10 bg-[#0d1320] px-4 py-3 text-white"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.branchId} value={branch.branchId}>
                {branch.branchName}
              </option>
            ))}
          </select>
        </div>

        {criticalInsights.length ? (
          <AnalyticsSection
            title={`${criticalInsights.length} critical alerts`}
            subtitle="Immediate issues that need leadership attention."
          >
            <div className="space-y-3">
              {criticalInsights.map((insight) => (
                <InsightCard
                  key={insight._id || insight.id}
                  insight={insight}
                  onAction={(item) => actionMutation.mutate(item)}
                />
              ))}
            </div>
          </AnalyticsSection>
        ) : (
          <AnalyticsSection title="System status" subtitle="The intelligence engine is not reporting urgent failures right now.">
            <div className="rounded-[22px] border border-emerald-500/25 bg-emerald-500/10 px-4 py-4 text-emerald-100">
              All systems healthy.
            </div>
          </AnalyticsSection>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <KpiCard key={metric.label} {...metric} />
            ))}
          </div>
        )}

        <AnalyticsSection
          title="Branch Performance Matrix"
          subtitle="Compare branch membership, attendance, finance strength, and health trends."
          action={
            <FilterTabs
              tabs={[
                { label: 'Table View', value: 'table' },
                { label: 'Visual View', value: 'visual' },
              ]}
              value={matrixView}
              onChange={setMatrixView}
            />
          }
        >
          {comparisonQuery.isLoading ? (
            <TableRowSkeleton columns={7} rows={6} />
          ) : matrixView === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-white/75">
                <thead className="text-[11px] uppercase tracking-[0.22em] text-white/40">
                  <tr>
                    <th className="pb-3">Branch</th>
                    <th className="pb-3">Members</th>
                    <th className="pb-3">Attendance</th>
                    <th className="pb-3">Income</th>
                    <th className="pb-3">Health</th>
                    <th className="pb-3">Grade</th>
                    <th className="pb-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {branchComparison.map((branch) => {
                    const trend = getTrendMeta(branch.health?.trend);
                    return (
                      <tr
                        key={branch.branchId}
                        className="cursor-pointer border-t border-white/8 transition hover:bg-white/[0.03]"
                        onClick={() => navigate(`/hq/branches/${branch.branchId}`)}
                      >
                        <td className="py-3 font-medium text-white">{branch.branchName}</td>
                        <td>{formatAnalyticsNumber(branch.members?.total || 0)}</td>
                        <td>{formatAnalyticsNumber(branch.attendance?.avg || 0)}</td>
                        <td>{formatAnalyticsCurrency(branch.finance?.income || 0, currencyCode, currencySymbol)}</td>
                        <td>{formatAnalyticsNumber(branch.health?.score || 0)}</td>
                        <td><HealthBadge grade={branch.health?.grade} /></td>
                        <td className={trend.color}>{trend.icon}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#CBD5E1', fontSize: 12 }} />
                  {branchComparison.map((branch, index) => (
                    <Radar
                      key={branch.branchId}
                      dataKey={branch.branchName}
                      stroke={radarColors[index % radarColors.length]}
                      fill={radarColors[index % radarColors.length]}
                      fillOpacity={0.08}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </AnalyticsSection>

        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_0.9fr]">
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

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <AnalyticsSection
            title="Operational Health"
            subtitle="Volunteer coverage, pastoral load, communication cadence, and event readiness."
          >
            <div className="grid gap-4 md:grid-cols-2">
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

          <AnalyticsSection
            title="AI Insights Feed"
            subtitle="Unread and high-priority intelligence updates."
            action={
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => generateMutation.mutate()}>
                  Generate New Insights
                </Button>
                <Link to="/insights">
                  <Button variant="secondary">View All Insights</Button>
                </Link>
              </div>
            }
          >
            <SummaryList
              items={insights}
              formatter={(insight) => (
                <InsightCard
                  key={insight._id || insight.id}
                  insight={insight}
                  onRead={(item) => readMutation.mutate(item)}
                  onAction={(item) => actionMutation.mutate(item)}
                />
              )}
            />
          </AnalyticsSection>
        </div>

        <AnalyticsSection title="Recent Activity Timeline" subtitle="Latest intelligence and system activity across the workspace.">
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

        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title="Generate Consolidated Report"
          description="Open the reporting workspace with the current dashboard filters."
        >
          <div className="space-y-4 text-white">
            <p className="text-sm text-white/65">
              Period: <span className="text-white">{PERIOD_OPTIONS.find((item) => item.value === period)?.label}</span>
            </p>
            <p className="text-sm text-white/65">
              Branch: <span className="text-white">{branches.find((item) => item.branchId === branchId)?.branchName || 'All Branches'}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate(`/hq/reports?branchId=${branchId}&period=${period}`)}
              >
                Open Report Page
              </Button>
              <ActionLink to="/hq/reports" label="Go to reports" />
            </div>
          </div>
        </Modal>
      </AnalyticsPage>
    </AppShell>
  );
}
