import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { ChartSkeleton, TableRowSkeleton } from '../../components/ui/Skeleton';
import { AnalyticsPage, FilterTabs, KpiCard, SummaryList } from '../../components/analytics/AnalyticsWidgets';
import {
  getFinancialIntelligence,
  getGrowthTrends,
  getMemberIntelligence,
  getOperationalHealth,
} from '../../api/endpoints/hq';
import { createCase } from '../../api/endpoints/pastoral';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { useTenant } from '../../hooks/useTenant';
import { formatAnalyticsCurrency, formatAnalyticsNumber, formatDateTime, toTitleCase } from '../../utils/analytics';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const tabs = [
  { label: 'Members', value: 'members' },
  { label: 'Finance', value: 'finance' },
  { label: 'Growth', value: 'growth' },
  { label: 'Operations', value: 'operations' },
];

export default function IntelligencePage() {
  const { canViewIntelligence } = useAnalyticsAccess();
  const { currencyCode, currencySymbol } = useTenant();
  const [tab, setTab] = useState('members');

  const membersQuery = useQuery({
    queryKey: ['intelligence-members'],
    queryFn: () => getMemberIntelligence(),
    enabled: canViewIntelligence,
  });
  const financeQuery = useQuery({
    queryKey: ['intelligence-finance'],
    queryFn: () => getFinancialIntelligence(),
    enabled: canViewIntelligence,
  });
  const growthQuery = useQuery({
    queryKey: ['intelligence-growth'],
    queryFn: () => getGrowthTrends({ months: 12 }),
    enabled: canViewIntelligence,
  });
  const operationsQuery = useQuery({
    queryKey: ['intelligence-operations'],
    queryFn: () => getOperationalHealth(),
    enabled: canViewIntelligence,
  });

  const careMutation = useMutation({
    mutationFn: (member) =>
      createCase({
        memberName: member.name,
        memberId: member.memberId,
        category: 'welfare',
        urgency: 'high',
        summary: `AI intelligence flagged ${member.name} for pastoral follow-up.`,
      }),
    onSuccess: () => showSuccessToast('Pastoral case created.'),
    onError: (error) => showErrorToast(error.message || 'Unable to create pastoral case.'),
  });

  const memberData = membersQuery.data || {};
  const financeData = financeQuery.data || {};
  const growthData = growthQuery.data || {};
  const operations = operationsQuery.data || {};

  const memberSegments = Object.entries(memberData.engagementDistribution || {}).map(([name, value], index) => ({
    name,
    value,
    fill: ['#22C55E', '#60A5FA', '#F59E0B', '#EF4444'][index % 4],
  }));
  const demographicAge = Object.entries(memberData.demographics?.ageGroups || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const departmentCoverage = Object.entries(memberData.demographics?.departmentCoverage || {}).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );
  const financeBenchmark =
    financeData.byBranch?.length
      ? financeData.byBranch.reduce((sum, item) => sum + Number(item.incomePerMember || 0), 0) /
        financeData.byBranch.length
      : 0;
  const forecastSeries = useMemo(
    () => [
      ...(growthData.items || []).slice(-6).map((item) => ({
        month: item.month,
        value: item.finance?.income || 0,
        type: 'historical',
      })),
      ...(growthData.projections || []).map((item) => ({
        month: item.month,
        value: item.income || 0,
        type: 'projected',
      })),
    ],
    [growthData.items, growthData.projections],
  );

  const content = useMemo(() => {
    switch (tab) {
      case 'finance':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard label="Total Income" value={formatAnalyticsCurrency(financeData.consolidated?.totalIncome || 0, currencyCode, currencySymbol)} />
              <KpiCard label="Total Expenses" value={formatAnalyticsCurrency(financeData.consolidated?.totalExpenses || 0, currencyCode, currencySymbol)} />
              <KpiCard label="Net Balance" value={formatAnalyticsCurrency(financeData.consolidated?.netBalance || 0, currencyCode, currencySymbol)} />
            </div>
            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
                <h3 className="text-lg font-semibold text-white">Income per member by branch</h3>
                <div className="mt-4 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeData.byBranch || []} layout="vertical">
                      <XAxis type="number" stroke="#94A3B8" />
                      <YAxis type="category" dataKey="branchName" stroke="#94A3B8" width={110} />
                      <Tooltip />
                      <ReferenceLine x={financeBenchmark} stroke="#C9A84C" strokeDasharray="4 4" />
                      <Bar dataKey="incomePerMember" fill="#1E2A4A" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
                  <h3 className="text-lg font-semibold text-white">Forecast</h3>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {formatAnalyticsCurrency(financeData.forecast?.nextMonthIncome || 0, currencyCode, currencySymbol)}
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    Confidence {Number(financeData.forecast?.confidence || 0).toFixed(1)}% • {financeData.forecast?.basis || 'Based on the last 12 months'}
                  </p>
                  <div className="mt-4 h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={financeData.forecast?.series || []}>
                        <XAxis dataKey="month" stroke="#94A3B8" />
                        <YAxis stroke="#94A3B8" />
                        <Tooltip />
                        <Line type="monotone" dataKey="income" stroke="#C9A84C" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
                  <h3 className="text-lg font-semibold text-white">Financial anomalies</h3>
                  <div className="mt-4 space-y-3">
                    <SummaryList
                      items={financeData.anomalies || []}
                      formatter={(item) => (
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                          <p className="font-medium text-white">{item.branchName}</p>
                          <p className="mt-1 text-sm text-white/55">
                            {item.month} • {item.type} • {Number(item.percent || 0).toFixed(1)}%
                          </p>
                          <p className="mt-2 text-sm text-white/72">{item.message}</p>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'growth':
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <KpiCard label="Members" value={`${Number(growthData.memberGrowthRate || 0).toFixed(1)}%`} />
              <KpiCard label="Attendance" value={`${Number(growthData.attendanceGrowthRate || 0).toFixed(1)}%`} />
              <KpiCard label="Income" value={`${Number(growthData.incomeGrowthRate || 0).toFixed(1)}%`} />
              <KpiCard label="Projected 3M" value={formatAnalyticsNumber(growthData.projections?.length || 0)} helper="Forecast periods ready" />
            </div>
            <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
              <h3 className="text-lg font-semibold text-white">Historical and forecast trend</h3>
              <div className="mt-4 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastSeries}>
                    <XAxis dataKey="month" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      case 'operations':
        return (
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
                <h3 className="text-lg font-semibold text-white">Volunteer gaps calendar</h3>
                <div className="mt-4 space-y-3">
                  <SummaryList
                    items={operations.volunteers?.upcomingGaps || []}
                    formatter={(item) => (
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <p className="font-medium text-white">{item.department}</p>
                        <p className="mt-1 text-sm text-white/55">
                          {formatDateTime(item.date, 'PPP')} • {item.available}/{item.needed} available
                        </p>
                      </div>
                    )}
                  />
                </div>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
                <h3 className="text-lg font-semibold text-white">Communication health</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <KpiCard label="Last Broadcast" value={formatAnalyticsNumber(operations.communication?.lastBroadcastDays || 0)} helper="days ago" />
                  <KpiCard label="Delivery Rate" value={`${Number(operations.communication?.avgDeliveryRate || 0).toFixed(1)}%`} />
                  <KpiCard label="Unread Prayers" value={formatAnalyticsNumber(operations.communication?.unreadPrayerRequests || 0)} />
                </div>
              </div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
              <h3 className="text-lg font-semibold text-white">Pastor workload</h3>
              <div className="mt-4 space-y-3">
                <SummaryList
                  items={operations.pastoral?.caseloadPerPastor || []}
                  formatter={(item) => {
                    const total = Number(item.open || 0);
                    const tone = total > 15 ? 'text-rose-300' : total < 8 ? 'text-emerald-300' : 'text-amber-300';
                    return (
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-white">{item.name}</p>
                          <p className={`text-sm font-medium ${tone}`}>{total} open</p>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/8">
                          <div
                            className={`h-2 rounded-full ${total > 15 ? 'bg-rose-400' : total < 8 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                            style={{ width: `${Math.min((total / 20) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <KpiCard label="Total Members" value={formatAnalyticsNumber(memberData.totalMembers || 0)} />
              <KpiCard label="Active" value={formatAnalyticsNumber(memberData.activeCount || 0)} />
              <KpiCard label="At Risk" value={formatAnalyticsNumber(memberData.atRiskCount || 0)} />
              <KpiCard label="Drifting" value={formatAnalyticsNumber(memberData.driftingCount || 0)} />
            </div>
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
                <h3 className="text-lg font-semibold text-white">At-risk members</h3>
                {membersQuery.isLoading ? (
                  <TableRowSkeleton columns={8} rows={6} />
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-white/75">
                      <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                        <tr>
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Branch</th>
                          <th className="pb-3">Health</th>
                          <th className="pb-3">Last Attended</th>
                          <th className="pb-3">Last Gave</th>
                          <th className="pb-3">Missed</th>
                          <th className="pb-3">Risk Factors</th>
                          <th className="pb-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(memberData.atRiskMembers || []).map((member) => (
                          <tr key={member.memberId} className="border-t border-white/8">
                            <td className="py-3 font-medium text-white">{member.name}</td>
                            <td>{member.branch || '-'}</td>
                            <td>{formatAnalyticsNumber(member.healthScore)}</td>
                            <td>{formatDateTime(member.lastAttended, 'PP')}</td>
                            <td>{formatDateTime(member.lastGave, 'PP')}</td>
                            <td>{formatAnalyticsNumber(member.missedServices)}</td>
                            <td>
                              <div className="flex flex-wrap gap-2">
                                {(member.riskFactors || []).map((factor) => (
                                  <span key={factor} className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/55">
                                    {toTitleCase(factor)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <Button variant="secondary" className="text-xs" onClick={() => careMutation.mutate(member)}>
                                Assign to Care
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
                  <h3 className="text-lg font-semibold text-white">Engagement distribution</h3>
                  <div className="mt-4 h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={memberSegments} dataKey="value" nameKey="name" outerRadius={90}>
                          {memberSegments.map((item) => (
                            <Cell key={item.name} fill={item.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4">
                  <h3 className="text-lg font-semibold text-white">Demographic insights</h3>
                  <div className="mt-4 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demographicAge}>
                        <XAxis dataKey="name" stroke="#94A3B8" />
                        <YAxis stroke="#94A3B8" />
                        <Tooltip />
                        <Bar dataKey="value" fill="#60A5FA" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {departmentCoverage.slice(0, 5).map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm text-white/70">
                        <span>{item.name}</span>
                        <span>{formatAnalyticsNumber(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  }, [careMutation, currencyCode, currencySymbol, demographicAge, departmentCoverage, financeBenchmark, financeData.anomalies, financeData.byBranch, financeData.consolidated?.netBalance, financeData.consolidated?.totalExpenses, financeData.consolidated?.totalIncome, financeData.forecast?.basis, financeData.forecast?.confidence, financeData.forecast?.nextMonthIncome, financeData.forecast?.series, forecastSeries, growthData.attendanceGrowthRate, growthData.incomeGrowthRate, growthData.memberGrowthRate, growthData.projections?.length, memberData.activeCount, memberData.atRiskCount, memberData.atRiskMembers, memberData.driftingCount, memberData.totalMembers, memberSegments, membersQuery.isLoading, operations.communication?.avgDeliveryRate, operations.communication?.lastBroadcastDays, operations.communication?.unreadPrayerRequests, operations.pastoral?.caseloadPerPastor, operations.volunteers?.upcomingGaps, tab]);

  const loading =
    (tab === 'members' && membersQuery.isLoading) ||
    (tab === 'finance' && financeQuery.isLoading) ||
    (tab === 'growth' && growthQuery.isLoading) ||
    (tab === 'operations' && operationsQuery.isLoading);

  if (!canViewIntelligence) {
    return (
      <AppShell>
        <EmptyState
          icon="BI"
          title="Intelligence view unavailable"
          message="Your role does not have access to business intelligence analytics."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AnalyticsPage
        title="Business Intelligence"
        subtitle="Deep-dive intelligence for membership engagement, branch finance, growth momentum, and operational health."
      >
        <FilterTabs tabs={tabs} value={tab} onChange={setTab} />
        {loading ? <ChartSkeleton /> : content}
      </AnalyticsPage>
    </AppShell>
  );
}
