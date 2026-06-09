import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppShell from '../../components/layout/AppShell';
import EmptyState from '../../components/ui/EmptyState';
import { CardSkeleton, ChartSkeleton } from '../../components/ui/Skeleton';
import {
  AnalyticsPage,
  FilterTabs,
  HealthBadge,
  KpiCard,
  SummaryList,
} from '../../components/analytics/AnalyticsWidgets';
import { getBranchById, getBranchMetrics } from '../../api/endpoints/branches';
import { getGrowthTrends, getMemberIntelligence } from '../../api/endpoints/hq';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { useTenant } from '../../hooks/useTenant';
import { formatAnalyticsCurrency, formatAnalyticsNumber } from '../../utils/analytics';

const tabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Members', value: 'members' },
  { label: 'Finance', value: 'finance' },
  { label: 'Attendance', value: 'attendance' },
  { label: 'Visitors', value: 'visitors' },
  { label: 'Volunteers', value: 'volunteers' },
  { label: 'Pastoral', value: 'pastoral' },
];

export default function BranchDetailPage() {
  const { branchId } = useParams();
  const { canViewBranchMetrics } = useAnalyticsAccess();
  const { currencyCode, currencySymbol } = useTenant();
  const [tab, setTab] = useState('overview');

  const detailQuery = useQuery({
    queryKey: ['branch-detail', branchId],
    queryFn: () => getBranchById(branchId),
    enabled: canViewBranchMetrics && Boolean(branchId),
  });
  const metricsQuery = useQuery({
    queryKey: ['branch-metrics', branchId],
    queryFn: () => getBranchMetrics(branchId),
    enabled: canViewBranchMetrics && Boolean(branchId),
  });
  const growthQuery = useQuery({
    queryKey: ['branch-growth', branchId],
    queryFn: () => getGrowthTrends({ branchId, months: 12 }),
    enabled: canViewBranchMetrics && Boolean(branchId),
  });
  const memberQuery = useQuery({
    queryKey: ['branch-member-intelligence', branchId],
    queryFn: () => getMemberIntelligence({ branchId }),
    enabled: canViewBranchMetrics && Boolean(branchId),
  });

  const branch = detailQuery.data || metricsQuery.data?.branch || {};
  const liveMetrics = metricsQuery.data?.liveMetrics || {};
  const growthItems = growthQuery.data?.items || [];
  const memberIntelligence = memberQuery.data || {};
  const attendanceSeries = growthItems.map((item) => ({
    month: item.month,
    attendance: item.attendance?.total || 0,
    members: item.members?.total || 0,
    income: item.finance?.income || 0,
    expenses: item.finance?.expenses || 0,
  }));
  const engagementData = Object.entries(memberIntelligence.engagementDistribution || {}).map(
    ([name, value], index) => ({
      name,
      value,
      fill: ['#22C55E', '#60A5FA', '#F59E0B', '#EF4444'][index % 4],
    }),
  );
  const atRiskMembers = useMemo(
    () => memberIntelligence.atRiskMembers || [],
    [memberIntelligence.atRiskMembers],
  );

  const content = useMemo(() => {
    switch (tab) {
      case 'members':
        return (
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
              <h3 className="text-lg font-semibold text-white">Health distribution</h3>
              <div className="mt-4 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={engagementData} dataKey="value" nameKey="name" outerRadius={100}>
                      {engagementData.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
              <h3 className="text-lg font-semibold text-white">At-risk members</h3>
              <div className="mt-4 space-y-3">
                <SummaryList
                  items={atRiskMembers}
                  formatter={(member) => (
                    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                      <p className="font-medium text-white">{member.name}</p>
                      <p className="mt-1 text-sm text-white/55">
                        Health {formatAnalyticsNumber(member.healthScore)} • Missed {formatAnalyticsNumber(member.missedServices)} services
                      </p>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        );
      case 'finance':
        return (
          <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
            <h3 className="text-lg font-semibold text-white">Income and expenses</h3>
            <div className="mt-4 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceSeries}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="month" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip />
                  <Bar dataKey="income" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#1E2A4A" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'attendance':
        return (
          <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
            <h3 className="text-lg font-semibold text-white">Attendance trend</h3>
            <div className="mt-4 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceSeries}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="month" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="attendance" stroke="#C9A84C" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'visitors':
        return (
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard label="Visitors" value={formatAnalyticsNumber(liveMetrics.visitors?.total || 0)} />
            <KpiCard label="Converted" value={formatAnalyticsNumber(liveMetrics.visitors?.converted || 0)} />
            <KpiCard label="Pipeline Rate" value={`${Number(liveMetrics.visitors?.conversionRate || 0).toFixed(1)}%`} />
          </div>
        );
      case 'volunteers':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <KpiCard label="Active Volunteers" value={formatAnalyticsNumber(liveMetrics.volunteers?.active || 0)} />
            <KpiCard label="Reliability" value={`${Number(liveMetrics.volunteers?.avgReliability || 0).toFixed(1)}%`} />
          </div>
        );
      case 'pastoral':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <KpiCard label="Open Cases" value={formatAnalyticsNumber(liveMetrics.pastoral?.openCases || 0)} />
            <KpiCard label="Resolved" value={formatAnalyticsNumber(liveMetrics.pastoral?.resolvedCases || 0)} />
          </div>
        );
      default:
        return (
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
              <h3 className="text-lg font-semibold text-white">Attendance trend</h3>
              <div className="mt-4 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#C9A84C" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
              <h3 className="text-lg font-semibold text-white">Income trend</h3>
              <div className="mt-4 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip />
                    <Bar dataKey="income" fill="#1E2A4A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
    }
  }, [attendanceSeries, atRiskMembers, engagementData, liveMetrics.pastoral?.openCases, liveMetrics.pastoral?.resolvedCases, liveMetrics.visitors?.conversionRate, liveMetrics.visitors?.converted, liveMetrics.visitors?.total, liveMetrics.volunteers?.active, liveMetrics.volunteers?.avgReliability, tab]);

  if (!canViewBranchMetrics) {
    return (
      <AppShell>
        <EmptyState
          icon="BR"
          title="Branch details unavailable"
          message="Your role does not have access to branch-level analytics."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AnalyticsPage
        title={branch.branchName || 'Branch Detail'}
        subtitle="Branch-scoped intelligence across members, finance, attendance, visitors, volunteers, and pastoral care."
      >
        {detailQuery.isLoading || metricsQuery.isLoading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <ChartSkeleton />
          </div>
        ) : (
          <>
            <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
              <div className="rounded-[24px] border border-white/8 bg-[#0d1320] p-5 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/55">{branch.city || 'Branch city not set'}</p>
                    <h2 className="mt-2 text-3xl font-semibold text-white">{branch.branchName}</h2>
                    <p className="mt-2 text-sm text-white/55">
                      {branch.headPastorName || 'Head pastor pending'} • {branch.branchCode || 'No branch code'}
                    </p>
                  </div>
                  <HealthBadge grade={branch.cachedMetrics?.healthGrade || liveMetrics.healthGrade || 'C'} score={branch.cachedMetrics?.healthScore || 0} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <KpiCard label="Members" value={formatAnalyticsNumber(liveMetrics.members?.total || 0)} />
                <KpiCard label="Income" value={formatAnalyticsCurrency(liveMetrics.finance?.totalIncome || 0, currencyCode, currencySymbol)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Active Members" value={formatAnalyticsNumber(liveMetrics.members?.active || 0)} />
              <KpiCard label="Attendance" value={formatAnalyticsNumber(liveMetrics.attendance?.totalHeadcount || 0)} />
              <KpiCard label="Expenses" value={formatAnalyticsCurrency(liveMetrics.finance?.totalExpenses || 0, currencyCode, currencySymbol)} />
              <KpiCard label="Open Cases" value={formatAnalyticsNumber(liveMetrics.pastoral?.openCases || 0)} />
            </div>

            <FilterTabs tabs={tabs} value={tab} onChange={setTab} />
            {growthQuery.isLoading || memberQuery.isLoading ? <ChartSkeleton /> : content}
          </>
        )}
      </AnalyticsPage>
    </AppShell>
  );
}
