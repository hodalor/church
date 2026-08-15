import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
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
  AlertTriangle,
  ArrowRight,
  Bell,
  BookTemplate,
  Building2,
  CalendarDays,
  CheckSquare,
  CreditCard,
  HeartHandshake,
  LineChart as LineChartIcon,
  ListChecks,
  ScrollText,
  Sparkles,
  TrendingUp,
  Users,
  UserPlus,
  Wallet,
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
const chartPalette = ['#E1B14C', '#7C6CFF', '#34D399', '#F97316', '#A78BFA', '#F43F5E'];
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

function ModuleCard({
  title,
  metric,
  helper,
  to,
  chart,
  tone = 'line',
  icon: Icon = Users,
  iconTint = { bg: 'rgba(225,177,76,0.16)', text: '#E1B14C' },
  ctaIcon: CtaIcon = UserPlus,
  ctaLabel = 'Add record',
}) {
  return (
    <Link
      to={to}
      className="group block min-h-[210px] rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,20,36,1),rgba(10,16,28,1))] p-4 text-white shadow-[0_22px_44px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-[#E1B14C]/40"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="inline-flex rounded-full border border-[#E1B14C]/20 bg-[#E1B14C]/10 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.22em] text-[#E9D7A7]">
          {title}
        </p>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#E9D7A7]/80 transition group-hover:translate-x-1 group-hover:text-[#E1B14C]" />
      </div>
      <div className="mt-3 flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
          style={{ backgroundColor: iconTint.bg, color: iconTint.text }}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h3 className="text-3xl font-semibold leading-none text-white">{metric}</h3>
          <p className="mt-2 text-xs text-white/55">{helper}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          tabIndex={-1}
          className="pointer-events-none inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#E1B14C] px-2.5 py-1.5 text-[11px] font-semibold text-[#0b1220] shadow-[0_8px_18px_rgba(225,177,76,0.25)]"
        >
          <CtaIcon className="h-3.5 w-3.5" />
          {ctaLabel}
        </button>
        <div className="min-w-0 flex-1">
          {tone === 'bar' ? (
            <MiniBar data={chart} color="#E1B14C" heightClass="h-12" compactEmpty />
          ) : (
            <MiniLine data={chart} stroke="#E1B14C" heightClass="h-12" compactEmpty />
          )}
        </div>
      </div>
    </Link>
  );
}

function DashboardChartCard({ eyebrow, title, subtitle, actions, children, className = '' }) {
  return (
    <Card
      className={`space-y-4 border-slate-200 bg-white text-[#1E2A4A] shadow-[0_18px_45px_rgba(15,23,42,0.08)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-[#E1B14C]">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold text-[#0f172a]">{title}</h2>
          {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
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
  const currentYear = new Date().getFullYear();
  const [financeYear, setFinanceYear] = useState(String(currentYear));
  const financeYearOptions = useMemo(
    () =>
      [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((year) => String(year)),
    [currentYear],
  );
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
  const assignedBranches = Array.isArray(user?.assignedBranches) ? user?.assignedBranches : [];

  const membersQuery = useQuery({
    queryKey: ['dashboard-member-stats'],
    queryFn: getMemberStats,
    enabled: isPastorDashboard,
  });
  const financeQuery = useQuery({
    queryKey: ['dashboard-finance-summary', financeYear],
    queryFn: () => getFinancialSummary(Number(financeYear)),
    enabled: (isPastorDashboard || isBranchDashboard || isFinanceDashboard) && Boolean(financeYear),
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
  const prayerRequests =
    prayerRequestsQuery.data?.items || prayerRequestsQuery.data?.requests || [];
  const volunteerStats = volunteerStatsQuery.data || {};
  const rosters = rostersQuery.data?.items || rostersQuery.data || [];
  const eventStats = eventStatsQuery.data || {};
  const upcomingEvents = upcomingEventsQuery.data?.items || upcomingEventsQuery.data || [];
  const communication = communicationQuery.data || {};
  const communicationStats = communication.stats || {};
  const pastorKpis = [
    {
      label: 'Members',
      icon: Users,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber(memberStats.total || 0),
      helper: `${formatAnalyticsNumber(memberStats.active || 0)} active members`,
    },
    {
      label: "Today's Attendance",
      icon: CalendarDays,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber(attendanceSummary.kpis?.totalHeadcount || 0),
      helper: `${formatAnalyticsNumber(attendanceSummary.kpis?.avgPerService || 0)} avg per service`,
    },
    {
      label: 'Income This Month',
      icon: Wallet,
      tint: { bg: 'rgba(52,211,153,0.16)', text: '#10B981' },
      value: formatCurrency(financeRoleSummary.totalIncome || financeSummary.totalIncome || 0),
      helper: `Net ${formatCurrency(financeRoleSummary.netBalance || financeSummary.netBalance || 0)}`,
    },
    {
      label: 'Open Cases',
      icon: AlertTriangle,
      tint: { bg: 'rgba(245,158,11,0.16)', text: '#F59E0B' },
      value: formatAnalyticsNumber(careStats.open || 0),
      helper: `${formatAnalyticsNumber(careStats.openCritical || 0)} critical`,
    },
  ];

  const branchKpis = [
    {
      label: 'Branch Members',
      icon: Building2,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber(
        scopedBranchRows.reduce((sum, branch) => sum + Number(branch.members?.total || 0), 0),
      ),
      helper: scopedBranchName,
    },
    {
      label: 'Branch Attendance',
      icon: CalendarDays,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber(
        scopedBranchRows.reduce((sum, branch) => sum + Number(branch.attendance?.avg || 0), 0),
      ),
      helper: 'Average attendance across assigned branches',
    },
    {
      label: 'Branch Income',
      icon: Wallet,
      tint: { bg: 'rgba(52,211,153,0.16)', text: '#10B981' },
      value: formatCurrency(
        scopedBranchRows.reduce((sum, branch) => sum + Number(branch.finance?.income || 0), 0),
      ),
      helper: 'Current branch scope',
    },
    {
      label: 'My Cases',
      icon: HeartHandshake,
      tint: { bg: 'rgba(245,158,11,0.16)', text: '#F59E0B' },
      value: formatAnalyticsNumber(myCases.length),
      helper: `${formatAnalyticsNumber(careStats.openCritical || 0)} urgent in my queue`,
    },
  ];

  const careKpis = [
    {
      label: 'My Cases',
      icon: HeartHandshake,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber(myCases.length),
      helper: 'Active pastoral assignments',
    },
    {
      label: 'Pending Follow-ups',
      icon: ListChecks,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber((followUps.overdue || []).length),
      helper: `${formatAnalyticsNumber((followUps.today || []).length)} due today`,
    },
    {
      label: 'Prayer Requests',
      icon: Sparkles,
      tint: { bg: 'rgba(52,211,153,0.16)', text: '#10B981' },
      value: formatAnalyticsNumber(prayerRequests.length),
      helper: 'Open requests in communication',
    },
    {
      label: 'Visitors Assigned',
      icon: Users,
      tint: { bg: 'rgba(245,158,11,0.16)', text: '#F59E0B' },
      value: formatAnalyticsNumber(visitors.length),
      helper: 'Visitors in your care lane',
    },
  ];

  const volunteerKpis = [
    {
      label: 'My Volunteers',
      icon: Users,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber(volunteerStats.total || 0),
      helper: `${formatAnalyticsNumber(volunteerStats.active || 0)} active`,
    },
    {
      label: 'Upcoming Roster',
      icon: BookTemplate,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber(rosters.length),
      helper: 'Published and draft rotas',
    },
    {
      label: 'Reliability Score',
      icon: CheckSquare,
      tint: { bg: 'rgba(52,211,153,0.16)', text: '#10B981' },
      value: `${Math.round(volunteerStats.avgReliabilityScore || 0)}%`,
      helper: 'Average team reliability',
    },
    {
      label: 'Events This Month',
      icon: CalendarDays,
      tint: { bg: 'rgba(245,158,11,0.16)', text: '#F59E0B' },
      value: formatAnalyticsNumber(eventStats.upcoming || 0),
      helper: 'Scheduled ministry events',
    },
  ];

  const financeKpis = [
    {
      label: 'Income Today',
      icon: Wallet,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatCurrency(financeRoleSummary.totalIncome || 0),
      helper: `${formatAnalyticsNumber(financeRoleSummary.transactionCount || 0)} transactions`,
    },
    {
      label: 'Unverified Transactions',
      icon: CreditCard,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber(financeRoleSummary.unverifiedCount || 0),
      helper: 'Awaiting review',
    },
    {
      label: 'Pending Approvals',
      icon: ScrollText,
      tint: { bg: 'rgba(52,211,153,0.16)', text: '#10B981' },
      value: formatAnalyticsNumber(pendingExpensesQuery.data?.expenses?.length || 0),
      helper: 'Expenses pending action',
    },
    {
      label: 'Budget Status',
      icon: TrendingUp,
      tint: { bg: 'rgba(245,158,11,0.16)', text: '#F59E0B' },
      value: Number(financeRoleSummary.netBalance || 0) >= 0 ? 'Healthy' : 'Needs Review',
      helper: `Net ${formatCurrency(financeRoleSummary.netBalance || 0)}`,
    },
  ];

  const mediaKpis = [
    {
      label: 'Broadcasts Sent',
      icon: LineChartIcon,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: formatAnalyticsNumber(communicationStats.totalBroadcasts || 0),
      helper: `${formatAnalyticsNumber(communicationStats.scheduledBroadcasts || 0)} scheduled`,
    },
    {
      label: 'Delivery Rate',
      icon: TrendingUp,
      tint: { bg: 'rgba(124,108,255,0.14)', text: '#7C6CFF' },
      value: `${Math.round(communicationStats.deliveryRate || communicationStats.averageDeliveryRate || 0)}%`,
      helper: 'Recent delivery performance',
    },
    {
      label: 'Active Polls',
      icon: CheckSquare,
      tint: { bg: 'rgba(52,211,153,0.16)', text: '#10B981' },
      value: formatAnalyticsNumber(communicationStats.activePolls || 0),
      helper: 'Live congregation polls',
    },
    {
      label: 'Announcements',
      icon: Sparkles,
      tint: { bg: 'rgba(245,158,11,0.16)', text: '#F59E0B' },
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

  const heroBackground = tenantBranding.backgroundImageUrl || '';

  const liveAlerts = useMemo(() => {
    const items = [];
    const liveService = services.find((item) => item.checkInOpen);
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
  const financePerformanceSeries = financeSummary.monthlyBreakdown || [];
  const memberGenderData = Object.entries(memberStats.byGender || {}).map(([name, value]) => ({
    name: formatChartLabel(name),
    value: Number(value || 0),
  }));
  const memberGenderTotal = memberGenderData.reduce((sum, item) => sum + item.value, 0);

  const moduleCards = isCareDashboard
    ? [
        {
          title: 'Pastoral Care',
          metric: formatAnalyticsNumber(myCases.length),
          helper: 'Assigned cases currently open',
          to: '/pastoral/cases',
          chart: followUpSeries,
          icon: HeartHandshake,
          iconTint: { bg: 'rgba(124,108,255,0.2)', text: '#B9AEFF' },
          ctaIcon: HeartHandshake,
          ctaLabel: 'Open care',
        },
        {
          title: 'Follow-ups',
          metric: formatAnalyticsNumber((followUps.overdue || []).length),
          helper: 'Visitors needing immediate action',
          to: '/visitors/follow-ups',
          chart: followUpSeries,
          tone: 'bar',
          icon: ListChecks,
          iconTint: { bg: 'rgba(225,177,76,0.16)', text: '#E1B14C' },
          ctaIcon: CheckSquare,
          ctaLabel: 'Clear queue',
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
          icon: Users,
          iconTint: { bg: 'rgba(52,211,153,0.16)', text: '#6EE7B7' },
          ctaIcon: UserPlus,
          ctaLabel: 'Add visitor',
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
          icon: Sparkles,
          iconTint: { bg: 'rgba(124,108,255,0.2)', text: '#C4B5FD' },
          ctaIcon: Sparkles,
          ctaLabel: 'New prayer',
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
            icon: Users,
            iconTint: { bg: 'rgba(124,108,255,0.2)', text: '#B9AEFF' },
            ctaIcon: UserPlus,
            ctaLabel: 'Add volunteer',
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
            icon: BookTemplate,
            iconTint: { bg: 'rgba(225,177,76,0.16)', text: '#E1B14C' },
            ctaIcon: BookTemplate,
            ctaLabel: 'New rota',
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
            icon: CalendarDays,
            iconTint: { bg: 'rgba(52,211,153,0.16)', text: '#6EE7B7' },
            ctaIcon: CalendarDays,
            ctaLabel: 'Plan event',
          },
          {
            title: 'Reliability',
            metric: `${Math.round(volunteerStats.avgReliabilityScore || 0)}%`,
            helper: 'Average department reliability',
            to: '/volunteers',
            chart: volunteerSeries,
            icon: CheckSquare,
            iconTint: { bg: 'rgba(52,211,153,0.16)', text: '#34D399' },
            ctaIcon: TrendingUp,
            ctaLabel: 'Reliability',
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
              icon: Wallet,
              iconTint: { bg: 'rgba(52,211,153,0.16)', text: '#6EE7B7' },
              ctaIcon: CreditCard,
              ctaLabel: 'New record',
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
              icon: ScrollText,
              iconTint: { bg: 'rgba(225,177,76,0.16)', text: '#E1B14C' },
              ctaIcon: CheckSquare,
              ctaLabel: 'Review',
            },
            {
              title: 'Net Balance',
              metric: formatCurrency(financeRoleSummary.netBalance || 0),
              helper: 'Current finance position',
              to: '/finance',
              chart: financeTrendSeries,
              icon: TrendingUp,
              iconTint: { bg: 'rgba(124,108,255,0.2)', text: '#B9AEFF' },
              ctaIcon: Wallet,
              ctaLabel: 'Overview',
            },
            {
              title: 'Reports',
              metric: formatAnalyticsNumber(financeRoleSummary.transactionCount || 0),
              helper: 'Transactions in focus period',
              to: '/finance/reports',
              chart: financeTrendSeries,
              icon: LineChartIcon,
              iconTint: { bg: 'rgba(245,158,11,0.18)', text: '#F59E0B' },
              ctaIcon: ScrollText,
              ctaLabel: 'Run report',
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
                icon: LineChartIcon,
                iconTint: { bg: 'rgba(124,108,255,0.2)', text: '#B9AEFF' },
                ctaIcon: ScrollText,
                ctaLabel: 'Compose',
              },
              {
                title: 'Delivery',
                metric: `${Math.round(communicationStats.deliveryRate || communicationStats.averageDeliveryRate || 0)}%`,
                helper: 'Recent delivery rate',
                to: '/communication',
                chart: communicationSeries,
                icon: TrendingUp,
                iconTint: { bg: 'rgba(52,211,153,0.16)', text: '#6EE7B7' },
                ctaIcon: CheckSquare,
                ctaLabel: 'Review',
              },
              {
                title: 'Polls',
                metric: formatAnalyticsNumber(communicationStats.activePolls || 0),
                helper: 'Active engagement polls',
                to: '/communication/polls',
                chart: communicationSeries,
                tone: 'bar',
                icon: CheckSquare,
                iconTint: { bg: 'rgba(225,177,76,0.16)', text: '#E1B14C' },
                ctaIcon: CheckSquare,
                ctaLabel: 'New poll',
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
                icon: Sparkles,
                iconTint: { bg: 'rgba(245,158,11,0.18)', text: '#F59E0B' },
                ctaIcon: Sparkles,
                ctaLabel: 'Announce',
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
                icon: Users,
                iconTint: { bg: 'rgba(124,108,255,0.2)', text: '#B9AEFF' },
                ctaIcon: UserPlus,
                ctaLabel: 'Add member',
              },
              {
                title: 'Attendance',
                metric: formatAnalyticsNumber(attendanceSummary.kpis?.totalHeadcount || 0),
                helper: 'This month attendance pulse',
                to: '/attendance/reports',
                chart: attendanceTrendSeries,
                icon: CalendarDays,
                iconTint: { bg: 'rgba(225,177,76,0.16)', text: '#E1B14C' },
                ctaIcon: CalendarDays,
                ctaLabel: 'View services',
              },
              {
                title: 'Finance',
                metric: formatCurrency(financeSummary.totalIncome || 0),
                helper: `Net ${formatCurrency(financeSummary.netBalance || 0)}`,
                to: '/finance',
                chart: financeTrendSeries,
                icon: Wallet,
                iconTint: { bg: 'rgba(52,211,153,0.16)', text: '#6EE7B7' },
                ctaIcon: Wallet,
                ctaLabel: 'Ledger',
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
                icon: HeartHandshake,
                iconTint: { bg: 'rgba(245,158,11,0.18)', text: '#F59E0B' },
                ctaIcon: HeartHandshake,
                ctaLabel: 'Pastoral',
              },
            ];

  const chartAxisStyle = {
    fontSize: 12,
    fill: 'rgba(71,85,105,0.7)',
  };

  return (
    <div className="space-y-6">
      <div className="grid items-stretch gap-4 md:grid-cols-[minmax(0,1.05fr)_repeat(4,minmax(0,1fr))]">
        <Card
          className="relative flex min-h-[168px] overflow-hidden border-amber-100 bg-[linear-gradient(135deg,#fffaf1,#fff8e7,#fff4db)] p-4 shadow-[0_22px_50px_rgba(226,179,91,0.14)]"
          style={
            heroBackground
              ? {
                  backgroundImage: `linear-gradient(135deg, rgba(255,251,235,0.92), rgba(255,248,231,0.82)), url(${heroBackground})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div className="pointer-events-none absolute -right-6 -top-4 h-40 w-40 opacity-60">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M80 8c-3 0-5 2-5 5v23c-11 3-21 10-28 18a40 40 0 0 0-24 37v53c0 6 4 10 10 10h94c6 0 10-4 10-10V91a40 40 0 0 0-24-37c-7-8-17-15-28-18V13c0-3-2-5-5-5Z"
                fill="rgba(225,177,76,0.14)"
              />
              <path
                d="M65 67h30v72H65z M47 67h8v72h-8z M105 67h8v72h-8z"
                fill="rgba(225,177,76,0.22)"
              />
              <circle cx="80" cy="22" r="3" fill="rgba(225,177,76,0.4)" />
            </svg>
          </div>
          <div className="relative flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#B68A2C]">
              {todayLabel}
            </p>
            <h1 className="mt-2 font-serif text-[1.5rem] font-semibold leading-[1.1] text-[#0f172a] sm:text-[1.8rem]">
              {getGreeting()}, {firstName}
            </h1>
          </div>
        </Card>
        {kpis.map((item) => (
          <Card
            key={item.label}
            className="flex min-h-[168px] flex-col justify-between rounded-[24px] border-slate-200 bg-white p-4 text-[#0f172a] shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {item.label}
              </p>
              {item.icon && item.tint ? (
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: item.tint.bg, color: item.tint.text }}
                >
                  <item.icon className="h-5 w-5" strokeWidth={2} />
                </div>
              ) : null}
            </div>
            <div className="mt-4">
              <p className="text-3xl font-semibold leading-none text-[#0f172a]">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">{item.helper}</p>
            </div>
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
              onDismiss={() =>
                setDismissedAlerts((current) => [...current, alert.id])
              }
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

      <div className="grid items-start gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <DashboardChartCard
          eyebrow="Finance Pulse"
          title="Giving and expense movement"
          subtitle="Monthly income and expenses using live finance records."
          actions={
            <label className="block space-y-1">
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Year</span>
              <select
                value={financeYear}
                onChange={(event) => setFinanceYear(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#0f172a] shadow-sm outline-none focus:border-[#E1B14C]"
              >
                {financeYearOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          }
        >
          {financePerformanceSeries.length ? (
            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financePerformanceSeries}>
                  <defs>
                    <linearGradient id="financeIncomeFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0.06} />
                    </linearGradient>
                    <linearGradient id="financeExpenseFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#7C6CFF" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#7C6CFF" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={chartAxisStyle}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0b1220',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                      color: '#f8fafc',
                    }}
                    labelStyle={{ color: '#E1B14C' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income (GHS)"
                    stroke="#10B981"
                    fill="url(#financeIncomeFill)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses (GHS)"
                    stroke="#7C6CFF"
                    fill="url(#financeExpenseFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon="~"
              title="No finance trend yet"
              message="Income and expense charts will appear when finance records are available."
            />
          )}
        </DashboardChartCard>

        <DashboardChartCard
          eyebrow="Member Mix"
          title="Gender distribution"
          subtitle="Live member composition from your current membership records."
        >
          {memberGenderData.some((item) => item.value > 0) ? (
            <div className="grid items-center gap-5 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="relative h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={memberGenderData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={66}
                      outerRadius={102}
                      strokeWidth={0}
                    >
                      {memberGenderData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={chartPalette[index % chartPalette.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatAnalyticsNumber(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Total</p>
                  <p className="mt-1 text-3xl font-semibold text-[#0f172a]">
                    {formatAnalyticsNumber(memberGenderTotal)}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {memberGenderData.map((item, index) => {
                  const percentage = memberGenderTotal
                    ? Math.round((item.value / memberGenderTotal) * 100)
                    : 0;
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3.5 w-3.5 rounded-full"
                          style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                        />
                        <span className="text-sm font-medium text-[#0f172a]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-[#0f172a]">
                          {formatAnalyticsNumber(item.value)}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon="○"
              title="No member mix yet"
              message="Gender distribution appears after members are recorded with profile details."
            />
          )}
        </DashboardChartCard>
      </div>
    </div>
  );
}
