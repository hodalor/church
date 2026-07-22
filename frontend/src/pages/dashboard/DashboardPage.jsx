import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  HeartHandshake,
  Sparkles,
  Users,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { MiniBar, MiniLine } from '../../components/analytics/AnalyticsWidgets';
import { getAttendanceSummary, getAttendanceTrends, getServices } from '../../api/endpoints/attendance';
import { getCommunicationDashboard, getPrayerRequests } from '../../api/endpoints/communication';
import { getUpcomingEvents, getEventStats } from '../../api/endpoints/events';
import {
  getAllExpenses,
  getFinancialSummary,
  getTransactionSummary,
} from '../../api/endpoints/finance';
import { getBranchComparison } from '../../api/endpoints/hq';
import { getMemberStats } from '../../api/endpoints/members';
import { getCareStats, getMyCases } from '../../api/endpoints/pastoral';
import { getUpcomingRosters } from '../../api/endpoints/rosters';
import { getVisitorFollowUps, getVisitors } from '../../api/endpoints/visitors';
import { getVolunteerStats } from '../../api/endpoints/volunteers';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../hooks/useTenant';
import { useBrandingStore } from '../../stores/brandingStore';
import { formatAnalyticsCurrency, formatAnalyticsNumber } from '../../utils/analytics';

const pastorRoles = ['head_pastor', 'associate_pastor'];
const branchRoles = ['branch_pastor'];
const careRoles = ['care_leader'];
const volunteerRoles = ['volunteer_leader'];
const financeRoles = ['finance_officer'];
const mediaRoles = ['media_team'];
const chartPalette = ['#D9B55D', '#60A5FA', '#34D399', '#F97316', '#A78BFA', '#F43F5E'];
const axisStyle = {
  fontSize: 12,
  fill: 'rgba(255,255,255,0.58)',
};
const formatChartLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const buildSeries = (items = [], valueKey = 'value', labelKey = 'label') =>
  items.map((item, index) => ({
    label: item?.[labelKey] || item?.month || item?.name || `P${index + 1}`,
    value: Number(item?.[valueKey] || 0),
  }));

function AlertBanner({ tone, icon: Icon, children, onDismiss }) {
  const toneClasses = {
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
    danger: 'border-rose-500/25 bg-rose-500/10 text-rose-100',
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-100',
  };

  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${toneClasses[tone]}`}>
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">{children}</p>
      </div>
      <button
        type="button"
        className="text-xs uppercase tracking-[0.2em] text-current/80"
        onClick={onDismiss}
      >
        Dismiss
      </button>
    </div>
  );
}

function ModuleCard({ title, metric, helper, to, chart, tone = 'line' }) {
  const palette = {
    line: {
      shell:
        'border-white/10 bg-[linear-gradient(180deg,rgba(14,20,36,0.98),rgba(8,13,24,0.96))] hover:border-accent/35 hover:bg-[linear-gradient(180deg,rgba(18,26,45,0.98),rgba(10,16,28,0.96))]',
      chart: '#D9B55D',
    },
    bar: {
      shell:
        'border-white/10 bg-[linear-gradient(180deg,rgba(14,20,36,0.98),rgba(8,13,24,0.96))] hover:border-accent/35 hover:bg-[linear-gradient(180deg,rgba(18,26,45,0.98),rgba(10,16,28,0.96))]',
      chart: '#D9B55D',
    },
  };
  const theme = palette[tone] || palette.line;
  return (
    <Link
      to={to}
      className={`block min-h-[178px] rounded-[22px] border p-3.5 text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition ${theme.shell}`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="inline-flex rounded-full border border-[#d9b55d]/20 bg-[#d9b55d]/10 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.22em] text-[#ebd59b]">
            {title}
          </p>
          <h3 className="mt-2 text-[1.3rem] font-semibold leading-tight text-white">{metric}</h3>
          <p className="mt-1 max-h-9 overflow-hidden text-[12px] leading-4 text-white/60">{helper}</p>
        </div>
        <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#ebd59b]" />
      </div>
      <div className="mt-2.5">
        {tone === 'bar' ? (
          <MiniBar data={chart} color={theme.chart} heightClass="h-14" compactEmpty />
        ) : (
          <MiniLine data={chart} stroke={theme.chart} heightClass="h-14" compactEmpty />
        )}
      </div>
    </Link>
  );
}

function DashboardChartCard({ eyebrow, title, subtitle, children, className = '' }) {
  return (
    <Card
      className={`space-y-4 border-white/10 bg-[linear-gradient(180deg,rgba(12,18,34,0.98),rgba(8,13,24,0.96))] text-white shadow-[0_20px_40px_rgba(0,0,0,0.24)] ${className}`}
    >
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-[#ebd59b]">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-white/58">{subtitle}</p> : null}
      </div>
      {children}
    </Card>
  );
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { currencyCode, currencySymbol } = useTenant();
  const tenantBranding = useBrandingStore((state) => state.tenantBranding);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const firstName =
    user?.firstName ||
    user?.name?.split(' ')[0] ||
    user?.username?.split(/[.\s_-]/)[0] ||
    'there';
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
  const formatCurrency = (value) =>
    formatAnalyticsCurrency(value, currencyCode || 'USD', currencySymbol || '$');

  const isPastorDashboard = pastorRoles.includes(role);
  const isBranchDashboard = branchRoles.includes(role);
  const isCareDashboard = careRoles.includes(role);
  const isVolunteerDashboard = volunteerRoles.includes(role);
  const isFinanceDashboard = financeRoles.includes(role);
  const isMediaDashboard = mediaRoles.includes(role);
  const assignedBranches = Array.isArray(user?.assignedBranches) ? user.assignedBranches : [];

  const membersQuery = useQuery({
    queryKey: ['dashboard-member-stats'],
    queryFn: getMemberStats,
    enabled: isPastorDashboard,
  });
  const financeQuery = useQuery({
    queryKey: ['dashboard-finance-summary'],
    queryFn: () => getFinancialSummary(new Date().getFullYear()),
    enabled: isPastorDashboard || isBranchDashboard || isFinanceDashboard,
  });
  const financeSummaryQuery = useQuery({
    queryKey: ['dashboard-finance-summary-role', role],
    queryFn: () => getTransactionSummary({ period: isFinanceDashboard ? 'today' : 'month' }),
    enabled: isPastorDashboard || isFinanceDashboard,
  });
  const pendingExpensesQuery = useQuery({
    queryKey: ['dashboard-pending-expenses'],
    queryFn: () => getAllExpenses({ status: 'pending', limit: 20 }),
    enabled: isFinanceDashboard,
  });
  const attendanceSummaryQuery = useQuery({
    queryKey: ['dashboard-attendance-summary'],
    queryFn: () => getAttendanceSummary({ period: 'month' }),
    enabled: isPastorDashboard || isBranchDashboard,
  });
  const attendanceTrendsQuery = useQuery({
    queryKey: ['dashboard-attendance-trends'],
    queryFn: () => getAttendanceTrends({ period: 'year' }),
    enabled: isPastorDashboard || isBranchDashboard,
  });
  const servicesQuery = useQuery({
    queryKey: ['dashboard-services-live'],
    queryFn: () => getServices({ page: 1, limit: 8, status: 'all' }),
    enabled: isPastorDashboard || isBranchDashboard || isVolunteerDashboard,
  });
  const branchComparisonQuery = useQuery({
    queryKey: ['dashboard-branch-comparison'],
    queryFn: () => getBranchComparison({ period: 'monthly' }),
    enabled: isBranchDashboard,
  });
  const careStatsQuery = useQuery({
    queryKey: ['dashboard-care-stats'],
    queryFn: getCareStats,
    enabled: isPastorDashboard || isCareDashboard,
  });
  const myCasesQuery = useQuery({
    queryKey: ['dashboard-my-cases', role],
    queryFn: () => getMyCases({ limit: 10 }),
    enabled: isBranchDashboard || isCareDashboard,
  });
  const followUpsQuery = useQuery({
    queryKey: ['dashboard-follow-ups'],
    queryFn: getVisitorFollowUps,
    enabled: isCareDashboard,
  });
  const visitorsQuery = useQuery({
    queryKey: ['dashboard-visitors'],
    queryFn: () => getVisitors({ page: 1, limit: 12 }),
    enabled: isCareDashboard,
  });
  const prayerRequestsQuery = useQuery({
    queryKey: ['dashboard-prayer-requests'],
    queryFn: () => getPrayerRequests({ limit: 20 }),
    enabled: isCareDashboard || isMediaDashboard,
  });
  const volunteerStatsQuery = useQuery({
    queryKey: ['dashboard-volunteer-stats'],
    queryFn: getVolunteerStats,
    enabled: isVolunteerDashboard,
  });
  const rostersQuery = useQuery({
    queryKey: ['dashboard-upcoming-rosters'],
    queryFn: () => getUpcomingRosters({ limit: 6 }),
    enabled: isVolunteerDashboard,
  });
  const eventStatsQuery = useQuery({
    queryKey: ['dashboard-event-stats'],
    queryFn: getEventStats,
    enabled: isVolunteerDashboard,
  });
  const upcomingEventsQuery = useQuery({
    queryKey: ['dashboard-upcoming-events'],
    queryFn: () => getUpcomingEvents({ limit: 4 }),
    enabled: isVolunteerDashboard,
  });
  const communicationQuery = useQuery({
    queryKey: ['dashboard-communication'],
    queryFn: getCommunicationDashboard,
    enabled: isMediaDashboard,
  });

  const memberStats = membersQuery.data || {};
  const financeSummary = financeQuery.data || {};
  const financeRoleSummary = financeSummaryQuery.data || {};
  const attendanceSummary = attendanceSummaryQuery.data || {};
  const attendanceTrends = attendanceTrendsQuery.data || {};
  const services = useMemo(
    () => servicesQuery.data?.items || servicesQuery.data?.services || [],
    [servicesQuery.data],
  );
  const branchRows = branchComparisonQuery.data?.items || [];
  const scopedBranchRows =
    isBranchDashboard && assignedBranches.length
      ? branchRows.filter((branch) => assignedBranches.includes(branch.branchId))
      : branchRows;
  const scopedBranchName = assignedBranches.length
    ? assignedBranches.length === 1
      ? scopedBranchRows[0]?.branchName || assignedBranches[0]
      : `${assignedBranches.length} assigned branches`
    : 'All branches';
  const careStats = careStatsQuery.data || {};
  const myCases = myCasesQuery.data?.items || [];
  const followUps = followUpsQuery.data || {};
  const visitors = visitorsQuery.data?.items || [];
  const prayerRequests = prayerRequestsQuery.data?.items || prayerRequestsQuery.data?.requests || [];
  const volunteerStats = volunteerStatsQuery.data || {};
  const rosters = rostersQuery.data?.items || rostersQuery.data || [];
  const eventStats = eventStatsQuery.data || {};
  const upcomingEvents = upcomingEventsQuery.data?.items || upcomingEventsQuery.data || [];
  const communication = communicationQuery.data || {};
  const communicationStats = communication.stats || {};
  const pastorKpis = [
    {
      label: 'Members',
      value: formatAnalyticsNumber(memberStats.total || 0),
      helper: `${formatAnalyticsNumber(memberStats.active || 0)} active members`,
    },
    {
      label: "Today's Attendance",
      value: formatAnalyticsNumber(attendanceSummary.kpis?.totalHeadcount || 0),
      helper: `${formatAnalyticsNumber(attendanceSummary.kpis?.avgPerService || 0)} avg per service`,
    },
    {
      label: 'Income This Month',
      value: formatCurrency(financeRoleSummary.totalIncome || financeSummary.totalIncome || 0),
      helper: `Net ${formatCurrency(financeRoleSummary.netBalance || financeSummary.netBalance || 0)}`,
    },
    {
      label: 'Open Cases',
      value: formatAnalyticsNumber(careStats.open || 0),
      helper: `${formatAnalyticsNumber(careStats.openCritical || 0)} critical`,
    },
  ];

  const branchKpis = [
    {
      label: 'Branch Members',
      value: formatAnalyticsNumber(
        scopedBranchRows.reduce((sum, branch) => sum + Number(branch.members?.total || 0), 0),
      ),
      helper: scopedBranchName,
    },
    {
      label: 'Branch Attendance',
      value: formatAnalyticsNumber(
        scopedBranchRows.reduce((sum, branch) => sum + Number(branch.attendance?.avg || 0), 0),
      ),
      helper: 'Average attendance across assigned branches',
    },
    {
      label: 'Branch Income',
      value: formatCurrency(
        scopedBranchRows.reduce((sum, branch) => sum + Number(branch.finance?.income || 0), 0),
      ),
      helper: 'Current branch scope',
    },
    {
      label: 'My Cases',
      value: formatAnalyticsNumber(myCases.length),
      helper: `${formatAnalyticsNumber(careStats.openCritical || 0)} urgent in my queue`,
    },
  ];

  const careKpis = [
    {
      label: 'My Cases',
      value: formatAnalyticsNumber(myCases.length),
      helper: 'Active pastoral assignments',
    },
    {
      label: 'Pending Follow-ups',
      value: formatAnalyticsNumber((followUps.overdue || []).length),
      helper: `${formatAnalyticsNumber((followUps.today || []).length)} due today`,
    },
    {
      label: 'Prayer Requests',
      value: formatAnalyticsNumber(prayerRequests.length),
      helper: 'Open requests in communication',
    },
    {
      label: 'Visitors Assigned',
      value: formatAnalyticsNumber(visitors.length),
      helper: 'Visitors in your care lane',
    },
  ];

  const volunteerKpis = [
    {
      label: 'My Volunteers',
      value: formatAnalyticsNumber(volunteerStats.total || 0),
      helper: `${formatAnalyticsNumber(volunteerStats.active || 0)} active`,
    },
    {
      label: 'Upcoming Roster',
      value: formatAnalyticsNumber(rosters.length),
      helper: 'Published and draft rotas',
    },
    {
      label: 'Reliability Score',
      value: `${Math.round(volunteerStats.avgReliabilityScore || 0)}%`,
      helper: 'Average team reliability',
    },
    {
      label: 'Events This Month',
      value: formatAnalyticsNumber(eventStats.upcoming || 0),
      helper: 'Scheduled ministry events',
    },
  ];

  const financeKpis = [
    {
      label: 'Income Today',
      value: formatCurrency(financeRoleSummary.totalIncome || 0),
      helper: `${formatAnalyticsNumber(financeRoleSummary.transactionCount || 0)} transactions`,
    },
    {
      label: 'Unverified Transactions',
      value: formatAnalyticsNumber(financeRoleSummary.unverifiedCount || 0),
      helper: 'Awaiting review',
    },
    {
      label: 'Pending Approvals',
      value: formatAnalyticsNumber(pendingExpensesQuery.data?.expenses?.length || 0),
      helper: 'Expenses pending action',
    },
    {
      label: 'Budget Status',
      value: Number(financeRoleSummary.netBalance || 0) >= 0 ? 'Healthy' : 'Needs Review',
      helper: `Net ${formatCurrency(financeRoleSummary.netBalance || 0)}`,
    },
  ];

  const mediaKpis = [
    {
      label: 'Broadcasts Sent',
      value: formatAnalyticsNumber(communicationStats.totalBroadcasts || 0),
      helper: `${formatAnalyticsNumber(communicationStats.scheduledBroadcasts || 0)} scheduled`,
    },
    {
      label: 'Delivery Rate',
      value: `${Math.round(communicationStats.deliveryRate || communicationStats.averageDeliveryRate || 0)}%`,
      helper: 'Recent delivery performance',
    },
    {
      label: 'Active Polls',
      value: formatAnalyticsNumber(communicationStats.activePolls || 0),
      helper: 'Live congregation polls',
    },
    {
      label: 'Announcements',
      value: formatAnalyticsNumber(communication.recentBroadcasts?.length || 0),
      helper: 'Latest communication drafts',
    },
  ];

  const kpis = isBranchDashboard
    ? branchKpis
    : isCareDashboard
      ? careKpis
      : isVolunteerDashboard
        ? volunteerKpis
        : isFinanceDashboard
          ? financeKpis
          : isMediaDashboard
            ? mediaKpis
            : pastorKpis;

  const liveAlerts = useMemo(() => {
    const items = [];
    const liveService = services.find((service) => service.checkInOpen);

    if (liveService) {
      items.push({
        id: `service-${liveService.serviceId || liveService._id}`,
        tone: 'success',
        icon: Bell,
        message: `${liveService.title || 'Service'} check-in is LIVE`,
      });
    }

    if ((followUps.overdue || []).length) {
      items.push({
        id: 'overdue-followups',
        tone: 'warning',
        icon: CalendarDays,
        message: `${formatAnalyticsNumber((followUps.overdue || []).length)} follow-ups overdue`,
      });
    }
    return items.filter((item) => !dismissedAlerts.includes(item.id)).slice(0, 3);
  }, [dismissedAlerts, followUps.overdue, services]);

  const attendanceTrendSeries = buildSeries(
    attendanceTrends.monthly || attendanceSummary.services || [],
    'total',
    'month',
  );
  const financeTrendSeries = buildSeries(financeSummary.monthlyBreakdown || [], 'income', 'month');
  const memberStatusSeries = buildSeries(
    Object.entries(memberStats.byMembershipStatus || {}).map(([label, value]) => ({ label, value })),
  );
  const followUpSeries = buildSeries([
    { label: 'Overdue', value: (followUps.overdue || []).length },
    { label: 'Today', value: (followUps.today || []).length },
    { label: 'Upcoming', value: (followUps.upcoming || []).length },
  ]);
  const volunteerSeries = buildSeries(volunteerStats.byDepartment || [], 'count', 'department');
  const communicationSeries = buildSeries([
    { label: 'Broadcasts', value: communicationStats.totalBroadcasts || 0 },
    { label: 'Polls', value: communicationStats.activePolls || 0 },
    { label: 'Prayer', value: communicationStats.openPrayerRequests || prayerRequests.length || 0 },
  ]);
  const financePerformanceSeries = (financeSummary.monthlyBreakdown || []).slice(-6);
  const givingTypeData = Object.entries(
    (isFinanceDashboard ? financeRoleSummary.byType : financeRoleSummary.byType || financeSummary.incomeByType) || {},
  ).map(([name, value]) => ({
    name: formatChartLabel(name),
    value: Number(value || 0),
  }));
  const paymentMethodData = Object.entries(financeRoleSummary.byPaymentMethod || {}).map(([name, value]) => ({
    name: formatChartLabel(name),
    value: Number(value || 0),
  }));
  const memberGenderData = Object.entries(memberStats.byGender || {}).map(([name, value]) => ({
    name: formatChartLabel(name),
    value: Number(value || 0),
  }));
  const branchPerformanceData = (
    branchRows.length
      ? branchRows.map((branch) => ({
          name: branch.branchName,
          income: Number(branch.finance?.income || 0),
          members: Number(branch.members?.total || 0),
          attendance: Number(branch.attendance?.avg || 0),
        }))
      : (financeRoleSummary.byBranch || []).map((branch) => ({
          name: branch.branch,
          income: Number(branch.total || 0),
          members: 0,
          attendance: 0,
        }))
  )
    .sort((left, right) => right.income - left.income)
    .slice(0, 6);
  const attendanceAudienceSeries = (attendanceTrends.monthly || []).slice(-6).map((item) => ({
    label: item.label,
    members: Number(item.members || 0),
    visitors: Number(item.visitors || 0),
    total: Number(item.total || 0),
  }));
  const givingHealthCards = [
    {
      label: 'Attendance Growth',
      value: attendanceSummary.kpis?.growthRate || '+0%',
      helper: `${attendanceSummary.kpis?.growthRate || '+0%'} turnout movement`,
    },
    {
      label: 'Retention',
      value: attendanceSummary.kpis?.memberRetentionRate || '0%',
      helper: 'Member consistency across recent services',
    },
    {
      label: 'First Timers',
      value: attendanceSummary.kpis?.firstTimerConversionRate || '0%',
      helper: 'Conversion rate within current range',
    },
  ];

  const moduleCards = isCareDashboard
    ? [
        {
          title: 'Pastoral Care',
          metric: formatAnalyticsNumber(myCases.length),
          helper: 'Assigned cases currently open',
          to: '/pastoral/cases',
          chart: followUpSeries,
        },
        {
          title: 'Follow-ups',
          metric: formatAnalyticsNumber((followUps.overdue || []).length),
          helper: 'Visitors needing immediate action',
          to: '/visitors/follow-ups',
          chart: followUpSeries,
          tone: 'bar',
        },
        {
          title: 'Visitors',
          metric: formatAnalyticsNumber(visitors.length),
          helper: 'Assigned visitor records',
          to: '/visitors',
          chart: buildSeries(
            visitors.slice(0, 6).map((visitor, index) => ({
              label: `${index + 1}`,
              value: visitor.totalVisits || 1,
            })),
          ),
        },
        {
          title: 'Prayer',
          metric: formatAnalyticsNumber(prayerRequests.length),
          helper: 'Prayer requests awaiting care',
          to: '/communication/prayer-requests',
          chart: buildSeries(
            prayerRequests.slice(0, 6).map((item, index) => ({
              label: `${index + 1}`,
              value: item.prayerCount || 1,
            })),
          ),
        },
      ]
    : isVolunteerDashboard
      ? [
          {
            title: 'Volunteers',
            metric: formatAnalyticsNumber(volunteerStats.total || 0),
            helper: 'Total team members',
            to: '/volunteers/list',
            chart: volunteerSeries,
            tone: 'bar',
          },
          {
            title: 'Rosters',
            metric: formatAnalyticsNumber(rosters.length),
            helper: 'Upcoming assignments prepared',
            to: '/volunteers/rosters',
            chart: buildSeries(
              rosters.map((roster) => ({
                label: roster.title,
                value: roster.assignments?.length || 0,
              })),
            ),
          },
          {
            title: 'Events',
            metric: formatAnalyticsNumber(eventStats.upcoming || 0),
            helper: 'Events requiring volunteer coverage',
            to: '/events',
            chart: buildSeries(
              upcomingEvents.map((event) => ({
                label: event.title,
                value: event.registrationCount || 0,
              })),
            ),
          },
          {
            title: 'Reliability',
            metric: `${Math.round(volunteerStats.avgReliabilityScore || 0)}%`,
            helper: 'Average department reliability',
            to: '/volunteers',
            chart: volunteerSeries,
          },
        ]
      : isFinanceDashboard
        ? [
            {
              title: 'Transactions',
              metric: formatCurrency(financeRoleSummary.totalIncome || 0),
              helper: 'Income captured in the current period',
              to: '/finance/transactions',
              chart: financeTrendSeries,
            },
            {
              title: 'Approvals',
              metric: formatAnalyticsNumber(pendingExpensesQuery.data?.expenses?.length || 0),
              helper: 'Expenses awaiting approval',
              to: '/finance/expenses',
              chart: buildSeries(
                (pendingExpensesQuery.data?.expenses || []).map((expense, index) => ({
                  label: `${index + 1}`,
                  value: expense.amount || 0,
                })),
              ),
              tone: 'bar',
            },
            {
              title: 'Net Balance',
              metric: formatCurrency(financeRoleSummary.netBalance || 0),
              helper: 'Current finance position',
              to: '/finance',
              chart: financeTrendSeries,
            },
            {
              title: 'Reports',
              metric: formatAnalyticsNumber(financeRoleSummary.transactionCount || 0),
              helper: 'Transactions in focus period',
              to: '/finance/reports',
              chart: financeTrendSeries,
            },
          ]
        : isMediaDashboard
          ? [
              {
                title: 'Broadcasts',
                metric: formatAnalyticsNumber(communicationStats.totalBroadcasts || 0),
                helper: 'Messages sent to the congregation',
                to: '/communication/broadcasts',
                chart: communicationSeries,
              },
              {
                title: 'Delivery',
                metric: `${Math.round(communicationStats.deliveryRate || communicationStats.averageDeliveryRate || 0)}%`,
                helper: 'Recent delivery rate',
                to: '/communication',
                chart: communicationSeries,
              },
              {
                title: 'Polls',
                metric: formatAnalyticsNumber(communicationStats.activePolls || 0),
                helper: 'Active engagement polls',
                to: '/communication/polls',
                chart: communicationSeries,
                tone: 'bar',
              },
              {
                title: 'Announcements',
                metric: formatAnalyticsNumber(communication.recentBroadcasts?.length || 0),
                helper: 'Recent broadcast activity',
                to: '/communication/broadcasts',
                chart: buildSeries(
                  (communication.recentBroadcasts || []).map((broadcast, index) => ({
                    label: `${index + 1}`,
                    value: broadcast.deliveryRate || 1,
                  })),
                ),
              },
            ]
          : [
              {
                title: 'Members',
                metric: formatAnalyticsNumber(memberStats.total || 0),
                helper: `${formatAnalyticsNumber(memberStats.new || 0)} new records`,
                to: '/members',
                chart: memberStatusSeries,
                tone: 'bar',
              },
              {
                title: 'Attendance',
                metric: formatAnalyticsNumber(attendanceSummary.kpis?.totalHeadcount || 0),
                helper: 'This month attendance pulse',
                to: '/attendance/reports',
                chart: attendanceTrendSeries,
              },
              {
                title: 'Finance',
                metric: formatCurrency(financeSummary.totalIncome || 0),
                helper: `Net ${formatCurrency(financeSummary.netBalance || 0)}`,
                to: '/finance',
                chart: financeTrendSeries,
              },
              {
                title: 'Pastoral',
                metric: formatAnalyticsNumber(careStats.open || 0),
                helper: `${formatAnalyticsNumber(careStats.openCritical || 0)} critical cases`,
                to: '/pastoral',
                chart: buildSeries([
                  { label: 'Open', value: careStats.open || 0 },
                  { label: 'Progress', value: careStats.inProgress || 0 },
                  { label: 'Critical', value: careStats.openCritical || 0 },
                ]),
                tone: 'bar',
              },
            ];

  const heroBackground = tenantBranding.backgroundImageUrl || '';
  const recentHighlights = [
    ...(services
      .filter((service) => service.checkInOpen)
      .slice(0, 2)
      .map((service) => ({
        id: `service-${service.serviceId || service._id}`,
        icon: CalendarDays,
        title: service.title || 'Live service',
        helper: 'Check-in is currently open',
        to: `/attendance/services/${service.serviceId || service._id}`,
      }))),
    ...(upcomingEvents.slice(0, 2).map((event) => ({
      id: `event-${event.eventId || event._id}`,
      icon: Sparkles,
      title: event.title,
      helper: 'Upcoming event preparation',
      to: `/events/${event.eventId || event._id}`,
    }))),
    ...(myCases.slice(0, 2).map((careCase) => ({
      id: `case-${careCase.caseId || careCase._id}`,
      icon: HeartHandshake,
      title: careCase.memberName || careCase.title || 'Pastoral case',
      helper: careCase.summary || 'Pastoral follow-up assigned to you',
      to: `/pastoral/cases/${careCase.caseId || careCase._id}`,
    }))),
  ].slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.12fr)_repeat(4,minmax(0,1fr))]">
        <Card
          className="relative flex min-h-[170px] overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(10,16,31,0.98),rgba(6,12,24,0.94))] text-white shadow-[0_24px_50px_rgba(0,0,0,0.3)]"
          style={{
            backgroundImage: heroBackground
              ? `linear-gradient(90deg, rgba(7,12,24,0.92), rgba(7,12,24,0.72)), url(${heroBackground})`
              : undefined,
            backgroundSize: heroBackground ? 'cover' : undefined,
            backgroundPosition: heroBackground ? 'center' : undefined,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,181,93,0.18),transparent_28%)]" />
          <div className="relative flex flex-col justify-center px-2">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#ebd59b]">{todayLabel}</p>
            <h1 className="mt-2 font-serif text-[1.15rem] font-semibold leading-[1.15] text-white sm:text-[1.45rem]">
              {getGreeting()}, {firstName}
            </h1>
          </div>
        </Card>
        {kpis.map((item) => (
          <Card
            key={item.label}
            className="flex min-h-[170px] flex-col rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,20,37,0.98),rgba(8,14,26,0.96))] p-4 text-white shadow-[0_20px_40px_rgba(0,0,0,0.24)]"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-[#ebd59b]/80">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            <p className="mt-auto pt-2 text-sm text-white/58">{item.helper}</p>
          </Card>
        ))}
      </div>

      {liveAlerts.length ? (
        <div className="space-y-3">
          {liveAlerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              tone={alert.tone}
              icon={alert.icon}
              onDismiss={() => setDismissedAlerts((current) => [...current, alert.id])}
            >
              {alert.message}
            </AlertBanner>
          ))}
        </div>
      ) : null}

      <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map((card) => (
          <ModuleCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardChartCard
          eyebrow="Finance Pulse"
          title="Giving and expense movement"
          subtitle="Monthly income and expenses using live finance records."
        >
          {financePerformanceSeries.length ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financePerformanceSeries}>
                  <defs>
                    <linearGradient id="dashboardIncomeFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#D9B55D" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#D9B55D" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#09111f',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="income" stroke="#D9B55D" fill="url(#dashboardIncomeFill)" strokeWidth={3} />
                  <Area type="monotone" dataKey="expenses" stroke="#60A5FA" fill="rgba(96,165,250,0.08)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon="~" title="No finance trend yet" message="Income and expense charts will appear when finance records are available." />
          )}
        </DashboardChartCard>

        <DashboardChartCard
          eyebrow="Member Mix"
          title="Gender distribution"
          subtitle="Live member composition from your current membership records."
        >
          {memberGenderData.some((item) => item.value > 0) ? (
            <div className="grid items-center gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={memberGenderData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={98}>
                      {memberGenderData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatAnalyticsNumber(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {memberGenderData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
                      <span className="text-sm text-white/70">{item.name}</span>
                    </div>
                    <span className="font-semibold text-white">{formatAnalyticsNumber(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon="○" title="No member mix yet" message="Gender distribution appears after members are recorded with profile details." />
          )}
        </DashboardChartCard>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardChartCard
          eyebrow="Attendance"
          title="Members vs visitors"
          subtitle="Six-month attendance trend split by returning members and visitors."
        >
          {attendanceAudienceSeries.length ? (
            <div className="space-y-4">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceAudienceSeries}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
                    <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#09111f',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="members" stackId="attendance" fill="#D9B55D" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="visitors" stackId="attendance" fill="#60A5FA" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {givingHealthCards.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-xs text-white/55">{item.helper}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon="~" title="No attendance trend yet" message="Attendance charts will appear once services and check-ins are available." />
          )}
        </DashboardChartCard>

        <DashboardChartCard
          eyebrow="Giving Channels"
          title="Payments by method"
          subtitle="See how members are giving across cash, mobile money, bank, and other channels."
        >
          {paymentMethodData.length ? (
            <div className="grid items-center gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethodData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={98}>
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {paymentMethodData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
                      <span className="text-sm text-white/70">{item.name}</span>
                    </div>
                    <span className="font-semibold text-white">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon="$" title="No payment mix yet" message="Payment-method charts appear when transaction records include real giving channels." />
          )}
        </DashboardChartCard>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardChartCard
          eyebrow="Branch Performance"
          title="Top performing branches"
          subtitle="Compare branch giving performance and identify stronger ministry locations."
        >
          {branchPerformanceData.length ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchPerformanceData} layout="vertical" margin={{ left: 20, right: 12 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={axisStyle}
                    tickLine={false}
                    axisLine={false}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#09111f',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                    }}
                    formatter={(value, key) =>
                      key === 'income' ? formatCurrency(value) : formatAnalyticsNumber(value)
                    }
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#34D399" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon="↑" title="No branch comparison yet" message="Branch performance charts will appear when branch finance records are available." />
          )}
        </DashboardChartCard>

        <DashboardChartCard
          eyebrow="Giving Mix"
          title="Tithes, offerings, and donations"
          subtitle="Track the contribution mix across the main giving categories."
        >
          {givingTypeData.length ? (
            <div className="space-y-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={givingTypeData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
                    <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#09111f',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {givingTypeData.map((item, index) => (
                        <Cell key={item.name} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {givingTypeData.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
                      <p className="text-sm text-white/70">{item.name}</p>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon="◔" title="No giving mix yet" message="Giving-type charts appear after tithes, offerings, and other transactions are recorded." />
          )}
        </DashboardChartCard>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4 border-white/10 bg-[linear-gradient(180deg,rgba(12,18,34,0.98),rgba(8,13,24,0.96))] text-white shadow-[0_20px_40px_rgba(0,0,0,0.24)]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#ebd59b]">Momentum</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {isCareDashboard
                ? 'Follow-up cadence'
                : isVolunteerDashboard
                  ? 'Volunteer strength'
                  : isFinanceDashboard
                    ? 'Income movement'
                    : isMediaDashboard
                      ? 'Communication activity'
                      : 'Attendance trend'}
            </h2>
          </div>
          <div>
            {isCareDashboard ? (
              <MiniBar data={followUpSeries} color="#C9A84C" />
            ) : isVolunteerDashboard ? (
              <MiniBar data={volunteerSeries} color="#C9A84C" />
            ) : isFinanceDashboard ? (
              <MiniLine data={financeTrendSeries} stroke="#C9A84C" />
            ) : isMediaDashboard ? (
              <MiniBar data={communicationSeries} color="#C9A84C" />
            ) : (
              <MiniLine data={attendanceTrendSeries} stroke="#C9A84C" />
            )}
          </div>
        </Card>

        <Card className="space-y-4 border-white/10 bg-[linear-gradient(180deg,rgba(12,18,34,0.98),rgba(8,13,24,0.96))] text-white shadow-[0_20px_40px_rgba(0,0,0,0.24)]">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[#ebd59b]">Highlights</p>
            <h2 className="mt-2 text-xl font-semibold text-white">What needs your attention</h2>
          </div>
          <div className="space-y-3">
            {recentHighlights.length ? (
              recentHighlights.map((item) => {
                const Icon = item.icon || Users;

                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.06]"
                  >
                    <div className="mt-0.5 rounded-xl bg-[#d9b55d]/10 p-2 text-[#ebd59b]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-white/60">{item.helper}</p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <EmptyState
                icon="DB"
                title="No recent highlights yet"
                message="Your live dashboard widgets will surface the latest ministry activity here."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
