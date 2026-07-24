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
import DataTable from '../../components/ui/DataTable';
import { getBranchById, getBranchMetrics } from '../../api/endpoints/branches';
import { getServices } from '../../api/endpoints/attendance';
import { getAllTransactions } from '../../api/endpoints/finance';
import { getGrowthTrends, getMemberIntelligence } from '../../api/endpoints/hq';
import { getMembers } from '../../api/endpoints/members';
import { getVisitors } from '../../api/endpoints/visitors';
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
  const membersDirectoryQuery = useQuery({
    queryKey: ['branch-directory-members', branchId],
    queryFn: () => getMembers({ branch: branchId, page: 1, limit: 8 }),
    enabled: canViewBranchMetrics && Boolean(branchId),
  });
  const servicesQuery = useQuery({
    queryKey: ['branch-services', branchId],
    queryFn: () => getServices({ branch: branchId, page: 1, limit: 6 }),
    enabled: canViewBranchMetrics && Boolean(branchId),
  });
  const transactionsQuery = useQuery({
    queryKey: ['branch-transactions', branchId],
    queryFn: () => getAllTransactions({ branch: branchId, page: 1, limit: 6 }),
    enabled: canViewBranchMetrics && Boolean(branchId),
  });
  const visitorsQuery = useQuery({
    queryKey: ['branch-visitors', branchId],
    queryFn: () => getVisitors({ branch: branchId, page: 1, limit: 6 }),
    enabled: canViewBranchMetrics && Boolean(branchId),
  });

  const branch = detailQuery.data || metricsQuery.data?.branch || {};
  const liveMetrics = metricsQuery.data?.liveMetrics || {};
  const growthItems = growthQuery.data?.items || [];
  const memberIntelligence = memberQuery.data || {};
  const branchMembers = useMemo(
    () => membersDirectoryQuery.data?.members || [],
    [membersDirectoryQuery.data?.members],
  );
  const branchServices = useMemo(
    () => servicesQuery.data?.items || servicesQuery.data?.services || [],
    [servicesQuery.data?.items, servicesQuery.data?.services],
  );
  const branchTransactions = useMemo(
    () => transactionsQuery.data?.transactions || [],
    [transactionsQuery.data?.transactions],
  );
  const branchVisitors = useMemo(
    () => visitorsQuery.data?.items || [],
    [visitorsQuery.data?.items],
  );
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
  const memberColumns = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Member',
        render: (member) => (
          <div>
            <p className="font-semibold text-slate-900">
              {[member.firstName, member.lastName].filter(Boolean).join(' ') || member.memberId}
            </p>
            <p className="mt-1 text-xs text-slate-500">{member.memberId}</p>
          </div>
        ),
      },
      {
        key: 'membershipStatus',
        header: 'Role',
        render: (member) => (
          <span className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700">
            {String(member.membershipStatus || 'member').replaceAll('_', ' ')}
          </span>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (member) => member.phone || 'N/A',
      },
      {
        key: 'department',
        header: 'Department',
        render: (member) =>
          Array.isArray(member.department) && member.department.length ? member.department.join(', ') : 'Unassigned',
      },
    ],
    [],
  );
  const transactionColumns = useMemo(
    () => [
      {
        key: 'memberName',
        header: 'Giver',
        render: (row) => (
          <div>
            <p className="font-semibold text-slate-900">{row.memberName || 'Walk-in giver'}</p>
            <p className="mt-1 text-xs text-slate-500">{row.transactionId}</p>
          </div>
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (row) => String(row.type || 'other').replaceAll('_', ' '),
      },
      {
        key: 'paymentMethod',
        header: 'Channel',
        render: (row) => String(row.paymentMethod || 'cash').replaceAll('_', ' '),
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (row) => formatAnalyticsCurrency(row.amount || 0, currencyCode, currencySymbol),
      },
    ],
    [currencyCode, currencySymbol],
  );
  const serviceColumns = useMemo(
    () => [
      {
        key: 'serviceName',
        header: 'Service',
        render: (row) => (
          <div>
            <p className="font-semibold text-slate-900">{row.serviceName || row.title || 'Service'}</p>
            <p className="mt-1 text-xs text-slate-500">{row.branch || branch.branchName || 'Branch service'}</p>
          </div>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        render: (row) =>
          row.date
            ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(row.date))
            : 'N/A',
      },
      {
        key: 'headcount',
        header: 'Headcount',
        render: (row) => formatAnalyticsNumber(row.totalAttendance || row.headcount || row.stats?.headcount || 0),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (row.checkInOpen ? 'Live' : 'Closed'),
      },
    ],
    [branch.branchName],
  );
  const visitorColumns = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Visitor',
        render: (row) => (
          <div>
            <p className="font-semibold text-slate-900">{row.fullName || row.name || 'Visitor'}</p>
            <p className="mt-1 text-xs text-slate-500">{row.phone || 'No phone'}</p>
          </div>
        ),
      },
      {
        key: 'stage',
        header: 'Stage',
        render: (row) => String(row.stage || 'new').replaceAll('_', ' '),
      },
      {
        key: 'assignedToName',
        header: 'Assigned To',
        render: (row) => row.assignedToName || row.assignedTo || 'Unassigned',
      },
      {
        key: 'converted',
        header: 'Converted',
        render: (row) => (row.converted ? 'Yes' : 'No'),
      },
    ],
    [],
  );
  const lightPanelClass = 'rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm';
  const lightPanelTitleClass = 'text-lg font-semibold text-slate-900';
  const lightPanelSubClass = 'mt-1 text-sm text-slate-500';

  const content = useMemo(() => {
    switch (tab) {
      case 'members':
        return (
          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Health distribution</h3>
              <p className={lightPanelSubClass}>Actual member engagement mix for this branch.</p>
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
            <div className="space-y-4">
              <div className={lightPanelClass}>
                <h3 className={lightPanelTitleClass}>Branch member directory</h3>
                <p className={lightPanelSubClass}>Real member records from this branch workspace.</p>
                <div className="mt-4">
                  <DataTable
                    columns={memberColumns}
                    data={branchMembers}
                    tone="light"
                    emptyMessage={membersDirectoryQuery.isLoading ? 'Loading branch members...' : 'No members found for this branch yet.'}
                  />
                </div>
              </div>
              <div className={lightPanelClass}>
                <h3 className={lightPanelTitleClass}>At-risk members</h3>
                <div className="mt-4 space-y-3">
                  <SummaryList
                    items={atRiskMembers}
                    formatter={(member) => (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Health {formatAnalyticsNumber(member.healthScore)} • Missed {formatAnalyticsNumber(member.missedServices)} services
                        </p>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'finance':
        return (
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Income and expenses</h3>
              <p className={lightPanelSubClass}>Monthly finance flow for this branch.</p>
              <div className="mt-4 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceSeries}>
                    <CartesianGrid stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip />
                    <Bar dataKey="income" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expenses" fill="#334155" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Recent transactions</h3>
              <p className={lightPanelSubClass}>Latest giving records captured in this branch.</p>
              <div className="mt-4">
                <DataTable
                  columns={transactionColumns}
                  data={branchTransactions}
                  tone="light"
                  emptyMessage={transactionsQuery.isLoading ? 'Loading branch transactions...' : 'No branch transactions found yet.'}
                />
              </div>
            </div>
          </div>
        );
      case 'attendance':
        return (
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Attendance trend</h3>
              <p className={lightPanelSubClass}>Recent service participation for this branch.</p>
              <div className="mt-4 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceSeries}>
                    <CartesianGrid stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#C9A84C" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Recent services</h3>
              <p className={lightPanelSubClass}>Actual services and attendance records from the branch.</p>
              <div className="mt-4">
                <DataTable
                  columns={serviceColumns}
                  data={branchServices}
                  tone="light"
                  emptyMessage={servicesQuery.isLoading ? 'Loading branch services...' : 'No services found for this branch yet.'}
                />
              </div>
            </div>
          </div>
        );
      case 'visitors':
        return (
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard label="Visitors" value={formatAnalyticsNumber(liveMetrics.visitors?.total || 0)} />
              <KpiCard label="Converted" value={formatAnalyticsNumber(liveMetrics.visitors?.converted || 0)} />
              <KpiCard label="Pipeline Rate" value={`${Number(liveMetrics.visitors?.conversionRate || 0).toFixed(1)}%`} />
            </div>
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Visitor follow-up list</h3>
              <p className={lightPanelSubClass}>Real visitor records currently tied to this branch.</p>
              <div className="mt-4">
                <DataTable
                  columns={visitorColumns}
                  data={branchVisitors}
                  tone="light"
                  emptyMessage={visitorsQuery.isLoading ? 'Loading branch visitors...' : 'No visitors found for this branch yet.'}
                />
              </div>
            </div>
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
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Attendance trend</h3>
              <p className={lightPanelSubClass}>Recent branch participation pattern.</p>
              <div className="mt-4 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceSeries}>
                    <CartesianGrid stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#C9A84C" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Income trend</h3>
              <p className={lightPanelSubClass}>Recent giving activity for this branch.</p>
              <div className="mt-4 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceSeries}>
                    <CartesianGrid stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" />
                    <YAxis stroke="#64748B" />
                    <Tooltip />
                    <Bar dataKey="income" fill="#1E2A4A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Recent members</h3>
              <p className={lightPanelSubClass}>Latest actual member records from this branch.</p>
              <div className="mt-4">
                <DataTable
                  columns={memberColumns}
                  data={branchMembers}
                  tone="light"
                  emptyMessage={membersDirectoryQuery.isLoading ? 'Loading branch members...' : 'No members found for this branch yet.'}
                />
              </div>
            </div>
            <div className={lightPanelClass}>
              <h3 className={lightPanelTitleClass}>Recent transactions</h3>
              <p className={lightPanelSubClass}>Latest branch finance activity.</p>
              <div className="mt-4">
                <DataTable
                  columns={transactionColumns}
                  data={branchTransactions}
                  tone="light"
                  emptyMessage={transactionsQuery.isLoading ? 'Loading branch transactions...' : 'No branch transactions found yet.'}
                />
              </div>
            </div>
          </div>
        );
    }
  }, [attendanceSeries, atRiskMembers, branchMembers, branchServices, branchTransactions, branchVisitors, engagementData, lightPanelClass, lightPanelSubClass, lightPanelTitleClass, liveMetrics.pastoral?.openCases, liveMetrics.pastoral?.resolvedCases, liveMetrics.visitors?.conversionRate, liveMetrics.visitors?.converted, liveMetrics.visitors?.total, liveMetrics.volunteers?.active, liveMetrics.volunteers?.avgReliability, memberColumns, membersDirectoryQuery.isLoading, serviceColumns, servicesQuery.isLoading, tab, transactionColumns, transactionsQuery.isLoading, visitorColumns, visitorsQuery.isLoading]);

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
