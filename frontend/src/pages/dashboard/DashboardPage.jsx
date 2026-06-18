import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  HeartHandshake,
  Sparkles,
  Users,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
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
import { getCriticalInsights } from '../../api/endpoints/insights';
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

function QuickActionCard({ label, description, to }) {
  return (
    <Link
      to={to}
      className="rounded-[18px] border border-cyan-400/18 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(13,19,32,0.98))] p-3.5 transition hover:border-accent/30 hover:bg-[linear-gradient(135deg,rgba(55,215,239,0.18),rgba(17,26,42,0.98))]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{label}</h3>
          <p className="mt-2 text-sm text-white/58">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-accent" />
      </div>
    </Link>
  );
}

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
        'border-violet-400/18 bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(13,19,32,0.98))] hover:bg-[linear-gradient(135deg,rgba(184,163,255,0.18),rgba(17,24,39,0.98))]',
      chart: '#A78BFA',
    },
    bar: {
      shell:
        'border-amber-400/18 bg-[linear-gradient(135deg,rgba(244,201,93,0.16),rgba(13,19,32,0.98))] hover:bg-[linear-gradient(135deg,rgba(248,211,110,0.18),rgba(17,24,39,0.98))]',
      chart: '#F4C95D',
    },
  };
  const theme = palette[tone] || palette.line;
  return (
    <Link
      to={to}
      className={`block rounded-[18px] border p-3.5 transition hover:border-accent/30 ${theme.shell}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
            {title}
          </p>
          <h3 className="mt-3 text-[1.65rem] font-semibold text-white">{metric}</h3>
          <p className="mt-2 text-sm text-white/55">{helper}</p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 text-accent" />
      </div>
      <div className="mt-4">
        {tone === 'bar' ? (
          <MiniBar data={chart} color={theme.chart} />
        ) : (
          <MiniLine data={chart} stroke={theme.chart} />
        )}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { churchName, currencyCode, currencySymbol } = useTenant();
  const tenantBranding = useBrandingStore((state) => state.tenantBranding);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const workspaceName = tenantBranding.appName || churchName || 'Your Church';
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
    enabled: isPastorDashboard || isBranchDashboard,
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
  const criticalInsightsQuery = useQuery({
    queryKey: ['dashboard-critical-insights'],
    queryFn: () => getCriticalInsights({ limit: 3 }),
    enabled: isPastorDashboard,
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
  const criticalInsights = useMemo(
    () => criticalInsightsQuery.data?.items || [],
    [criticalInsightsQuery.data],
  );

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

  const quickActions = isCareDashboard
    ? [
        { label: 'My Follow-ups', description: 'Open overdue and upcoming visitor tasks.', to: '/visitors/follow-ups' },
        { label: 'Open Case', description: 'Create a new pastoral care case.', to: '/pastoral/cases/new' },
        { label: 'Prayer Requests', description: 'Review requests that need response.', to: '/communication/prayer-requests' },
        { label: 'Visit Log', description: 'See assigned visitors and follow-up history.', to: '/visitors' },
      ]
    : isVolunteerDashboard
      ? [
          { label: 'View Roster', description: 'Open current duty rosters.', to: '/volunteers/rosters' },
          { label: 'My Volunteers', description: 'Review team members and reliability.', to: '/volunteers/list' },
          { label: 'Upcoming Events', description: 'Prepare coverage for upcoming events.', to: '/events' },
          { label: 'Mark Attendance', description: 'Jump into the service check-in console.', to: '/attendance/services' },
        ]
      : isFinanceDashboard
        ? [
            { label: 'Record Offering', description: 'Capture a new finance transaction.', to: '/finance/transactions/new' },
            { label: 'Review Transactions', description: 'Verify and audit recent records.', to: '/finance/transactions' },
            { label: 'Pending Expenses', description: 'Open approvals that need action.', to: '/finance/expenses' },
            { label: 'Reports', description: 'View finance reporting and statements.', to: '/finance/reports' },
          ]
        : isMediaDashboard
          ? [
              { label: 'New Broadcast', description: 'Draft a new broadcast message.', to: '/communication/broadcasts/new' },
              { label: 'Prayer Requests', description: 'Respond to communication needs.', to: '/communication/prayer-requests' },
              { label: 'Polls', description: 'Review live engagement polls.', to: '/communication/polls' },
              { label: 'Inbox', description: 'Open the latest inbox activity.', to: '/communication/inbox' },
            ]
          : [
              { label: 'Check-in Console', description: 'Jump into live attendance capture.', to: '/attendance/services' },
              { label: 'Record Offering', description: 'Open the finance recording flow.', to: '/finance/transactions/new' },
              { label: 'View Insights', description: 'Review AI-detected ministry signals.', to: '/insights' },
              { label: 'AI Assistant', description: 'Open the pastor writing workspace.', to: '/ai' },
            ];

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

    if (criticalInsights[0]) {
      items.push({
        id: `insight-${criticalInsights[0]._id || criticalInsights[0].id}`,
        tone: 'danger',
        icon: AlertTriangle,
        message: criticalInsights[0].title || 'Critical insight requires attention',
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
  }, [criticalInsights, dismissedAlerts, followUps.overdue, services]);

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

  const workspaceSubtitle = isBranchDashboard ? `${workspaceName} • ${scopedBranchName}` : workspaceName;
  const primaryContextText = isBranchDashboard
    ? 'Branch-scoped leadership view'
    : isCareDashboard
      ? 'Care leader operations'
      : isVolunteerDashboard
        ? 'Volunteer coordination workspace'
        : isFinanceDashboard
          ? 'Finance control center'
          : isMediaDashboard
            ? 'Communication hub'
            : 'Leadership command center';

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
    ...(criticalInsights.slice(0, 2).map((insight) => ({
      id: `insight-${insight._id || insight.id}`,
      icon: AlertTriangle,
      title: insight.title,
      helper: insight.message,
      to: '/insights',
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
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-accent/10">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">{primaryContextText}</p>
            <h1 className="mt-3 text-3xl font-semibold text-primary">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary/65">{workspaceSubtitle}</p>
            <p className="mt-2 text-sm text-primary/55">{todayLabel}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={isMediaDashboard ? '/communication' : isVolunteerDashboard ? '/volunteers' : '/members'}>
                <Button variant="secondary">
                  {isMediaDashboard ? 'Open Communication' : isVolunteerDashboard ? 'Open Volunteers' : 'Open Members'}
                </Button>
              </Link>
              <Link to={isCareDashboard ? '/pastoral' : isFinanceDashboard ? '/finance' : '/attendance'}>
                <Button variant="ghost">
                  {isCareDashboard ? 'Open Pastoral' : isFinanceDashboard ? 'Open Finance' : 'Open Attendance'}
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {kpis.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-primary/10 bg-white/70 p-4 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-primary/45">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-primary">{item.value}</p>
                <p className="mt-2 text-sm text-primary/55">{item.helper}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <QuickActionCard
            key={action.label}
            label={action.label}
            description={action.description}
            to={action.to}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map((card) => (
          <ModuleCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Momentum</p>
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

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Highlights</p>
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
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 transition hover:bg-[#132038]"
                  >
                    <div className="mt-0.5 rounded-xl bg-accent/10 p-2 text-accent">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-white/55">{item.helper}</p>
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
