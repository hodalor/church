import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  BookOpen,
  Building,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  HandCoins,
  HandHelping,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  Radio,
  Settings,
  Shield,
  Target,
  Users,
  UserRoundPlus,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { useBrandingStore } from '../../stores/brandingStore';
import { useCapabilities } from '../../hooks/useCapabilities';
import { getAllBranches } from '../../api/endpoints/branches';
import { getBranchComparison, getGrowthTrends, getHQOverview, getMemberIntelligence, getOperationalHealth } from '../../api/endpoints/hq';
import { getMembers, getMemberStats } from '../../api/endpoints/members';

const financeSubItems = [
  { label: 'Overview', to: '/finance', capabilityOptions: ['finance.view', 'finance.overview.view'] },
  { label: 'Transactions', to: '/finance/transactions', capabilityOptions: ['finance.view', 'finance.transactions.view'] },
  { label: 'Pledges', to: '/finance/pledges', capabilityOptions: ['finance.view', 'finance.pledges.view'] },
  { label: 'Expenses', to: '/finance/expenses', capabilityOptions: ['finance.view', 'finance.expenses.view'] },
  { label: 'Budgets', to: '/finance/budgets', capabilityOptions: ['finance.view', 'finance.budgets.view'] },
  { label: 'Reports', to: '/finance/reports', capabilityOptions: ['finance.view', 'finance.reports.view'] },
  { label: 'Audit Log', to: '/finance/audit', capabilityOptions: ['finance.view', 'finance.audit.view'] },
];

const attendanceSubItems = [
  { label: 'Services', to: '/attendance/services', capabilityOptions: ['attendance.view', 'attendance.services.view'] },
  { label: 'Reports', to: '/attendance/reports', capabilityOptions: ['attendance.view', 'attendance.reports.view'] },
  { label: 'Absentees', to: '/attendance/absentees', capabilityOptions: ['attendance.view', 'attendance.absentees.view'] },
];

const communicationSubItems = [
  { label: 'Overview', to: '/communication', capabilityOptions: ['communication.view', 'communication.overview.view'] },
  { label: 'Broadcasts', to: '/communication/broadcasts', capabilityOptions: ['communication.view', 'communication.broadcasts.view'] },
  { label: 'Templates', to: '/communication/templates', capabilityOptions: ['communication.view', 'communication.templates.view'] },
  { label: 'Prayer Requests', to: '/communication/prayer-requests', capabilityOptions: ['communication.view', 'communication.prayer_requests.view'] },
  { label: 'Polls', to: '/communication/polls', capabilityOptions: ['communication.view', 'communication.polls.view'] },
  { label: 'Inbox', to: '/communication/inbox', capabilityOptions: ['notifications.view', 'communication.inbox.view'] },
];

const visitorSubItems = [
  { label: 'Register', to: '/visitors/register', capabilityOptions: ['visitors.view', 'visitors.register.view'] },
  { label: 'List', to: '/visitors', capabilityOptions: ['visitors.view', 'visitors.list.view'] },
  { label: 'Pipeline', to: '/visitors/pipeline', capabilityOptions: ['visitors.view', 'visitors.pipeline.view'] },
  { label: 'Follow-ups', to: '/visitors/follow-ups', capabilityOptions: ['visitors.view', 'visitors.followups.view'] },
  { label: 'Workflow', to: '/visitors/workflow', capabilityOptions: ['visitors.view', 'visitors.workflow.view'] },
  { label: 'Reports', to: '/visitors/reports', capabilityOptions: ['visitors.view', 'visitors.reports.view'] },
];

const pastoralSubItems = [
  { label: 'Overview', to: '/pastoral', capabilityOptions: ['pastoral.view', 'pastoral.overview.view'] },
  { label: 'Cases', to: '/pastoral/cases', capabilityOptions: ['pastoral.view', 'pastoral.cases.view'] },
  { label: 'Appointments', to: '/pastoral/appointments', capabilityOptions: ['pastoral.view', 'pastoral.appointments.view'] },
  { label: 'Discipleship', to: '/pastoral/discipleship', capabilityOptions: ['pastoral.view', 'pastoral.discipleship.view'] },
  { label: 'Reports', to: '/pastoral/reports', capabilityOptions: ['pastoral.view', 'pastoral.reports.view'] },
];

const volunteerSubItems = [
  { label: 'Overview', to: '/volunteers', capabilityOptions: ['volunteers.view', 'volunteers.overview.view'] },
  { label: 'Registry', to: '/volunteers/list', capabilityOptions: ['volunteers.view', 'volunteers.overview.view'] },
  { label: 'Rosters', to: '/volunteers/rosters', capabilityOptions: ['volunteers.view', 'volunteers.rosters.view'] },
];

const eventSubItems = [
  { label: 'Overview', to: '/events', capabilityOptions: ['events.view', 'events.overview.view'] },
  { label: 'My Registrations', to: '/events?tab=my-registrations', capabilityOptions: ['events.registrations.view', 'events.view'] },
];

const headquartersSubItems = [
  { label: 'HQ Overview', to: '/hq', capabilityOptions: ['hq.view', 'hq.overview.view'] },
  {
    label: 'Branches',
    to: '/hq/branches',
    capabilityOptions: ['branches.view', 'branches.metrics.view'],
  },
  {
    label: 'Intelligence',
    to: '/hq/intelligence',
    capabilityOptions: ['hq.comparison.view', 'hq.growth.view', 'hq.finance.view', 'hq.members.view', 'hq.operations.view'],
  },
  { label: 'Reports', to: '/hq/reports', capabilityOptions: ['hq.reports.view'] },
];

const ministryWorkspaceSubItems = [
  { label: 'Overview', to: '/ministry', capabilityOptions: ['ministry.view'] },
  { label: 'Ministry List', to: '/ministry/list', capabilityOptions: ['ministry.view'] },
];

const cbsSubItems = [
  { label: 'Overview', to: '/cbs', capabilityOptions: ['cbs.view'] },
  { label: 'Groups', to: '/cbs/groups', capabilityOptions: ['cbs.view'] },
  { label: 'Prospects', to: '/cbs/prospects', capabilityOptions: ['cbs.view', 'cbs.prospects.view'] },
  { label: 'Pipeline', to: '/cbs/prospects/pipeline', capabilityOptions: ['cbs.view', 'cbs.prospects.view'] },
  { label: 'Reports', to: '/cbs/reports', capabilityOptions: ['cbs.view', 'cbs.reports.view'] },
];

const leadershipSubItems = [
  { label: 'Overview', to: '/leadership', capabilityOptions: ['leadership.view'] },
  { label: 'Profiles', to: '/leadership/profiles', capabilityOptions: ['leadership.view', 'leadership.candidates.view'] },
  { label: 'Succession', to: '/leadership/succession', capabilityOptions: ['leadership.view', 'leadership.succession.view'] },
  { label: 'Reports', to: '/leadership/reports', capabilityOptions: ['leadership.view', 'leadership.reports.view'] },
];

const strategicSubItems = [
  { label: 'Overview', to: '/strategic', capabilityOptions: ['strategic.view'] },
  { label: 'Plans', to: '/strategic/plan', capabilityOptions: ['strategic.view', 'strategic.plans.view'] },
  { label: 'KPIs', to: '/strategic/kpis', capabilityOptions: ['strategic.view', 'strategic.kpis.view'] },
  { label: 'Scorecard', to: '/strategic/scorecard', capabilityOptions: ['strategic.view', 'strategic.kpis.view'] },
  { label: 'Reports', to: '/strategic/reports', capabilityOptions: ['strategic.view', 'strategic.reports.view'] },
];

const navigation = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, capabilityOptions: ['dashboard.view'] },
      { label: 'Manual', to: '/manual', icon: BookOpen, capabilityOptions: ['manual.view'] },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      {
        label: 'Headquarters',
        icon: BrainCircuit,
        capabilityOptions: ['hq.view', 'branches.view', 'hq.reports.view'],
        children: headquartersSubItems,
      },
      {
        label: 'Insights',
        to: '/insights',
        icon: BarChart3,
        capabilityOptions: ['insights.view'],
      },
      {
        label: 'Family Ministry',
        to: '/hq/family-ministry',
        icon: HeartHandshake,
        capabilityOptions: ['family.view', 'family.analytics.view'],
      },
      {
        label: 'Audit Trail',
        to: '/audit',
        icon: Shield,
        capabilityOptions: ['audit.view', 'audit.suspicious.view', 'audit.exports.view'],
      },
      {
        label: 'AI Assistant',
        to: '/ai',
        icon: Bot,
        capabilityOptions: ['ai.view', 'ai.create'],
      },
    ],
  },
  {
    title: 'Church Growth',
    items: [
      {
        label: 'Ministry',
        icon: HandHelping,
        capabilityOptions: ['ministry.view', 'ministry.members.view', 'ministry.meetings.view', 'ministry.reports.view'],
        children: ministryWorkspaceSubItems,
      },
      {
        label: 'CBS Groups',
        icon: BookOpen,
        capabilityOptions: ['cbs.view'],
        children: cbsSubItems,
      },
      {
        label: 'Leadership',
        icon: Users,
        capabilityOptions: ['leadership.view', 'leadership.candidates.view', 'leadership.succession.view', 'leadership.reports.view'],
        children: leadershipSubItems,
      },
      {
        label: 'Strategic Plan',
        icon: Target,
        capabilityOptions: ['strategic.view', 'strategic.plans.view', 'strategic.kpis.view', 'strategic.initiatives.view', 'strategic.reports.view'],
        children: strategicSubItems,
      },
    ],
  },
  {
    title: 'Ministry',
    items: [
      { label: 'Members', to: '/members', icon: Users, capabilityOptions: ['members.view'] },
      { label: 'Visitors', icon: UserRoundPlus, capabilityOptions: ['visitors.view', 'visitors.overview.view'], children: visitorSubItems },
      { label: 'Volunteers', icon: HandHelping, capabilityOptions: ['volunteers.view', 'volunteers.overview.view'], children: volunteerSubItems },
      { label: 'Users', to: '/users', icon: Shield, capabilityOptions: ['users.view'] },
      { label: 'Inbox', to: '/communication/inbox', icon: Bell, capabilityOptions: ['notifications.view', 'communication.inbox.view'] },
      { label: 'Pastoral Care', icon: HeartHandshake, capabilityOptions: ['pastoral.view', 'pastoral.overview.view'], children: pastoralSubItems },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Finance', icon: HandCoins, capabilityOptions: ['finance.view', 'finance.overview.view'], children: financeSubItems },
      { label: 'Attendance', icon: BarChart3, capabilityOptions: ['attendance.view', 'attendance.services.view'], children: attendanceSubItems },
      { label: 'Events', icon: CalendarDays, capabilityOptions: ['events.view', 'events.overview.view'], children: eventSubItems },
      { label: 'Communication', icon: HandHelping, capabilityOptions: ['communication.view', 'communication.overview.view'], children: communicationSubItems },
      { label: 'Broadcasts', to: '/communication/broadcasts', icon: Radio, capabilityOptions: ['communication.view', 'communication.broadcasts.view'] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', to: '/settings', icon: Settings, capabilityOptions: ['settings.view', 'settings.branding.view', 'settings.content.view', 'settings.config.view'] },
    ],
  },
];

export default function Sidebar({ isOpen, onToggle }) {
  const queryClient = useQueryClient();
  const globalBranding = useBrandingStore((state) => state.globalBranding);
  const { hasAnyCapability } = useCapabilities();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({
    Finance: location.pathname.startsWith('/finance'),
    Attendance: location.pathname.startsWith('/attendance'),
    Communication: location.pathname.startsWith('/communication'),
    Headquarters: location.pathname.startsWith('/hq'),
    Visitors: location.pathname.startsWith('/visitors'),
    'Pastoral Care': location.pathname.startsWith('/pastoral'),
    Volunteers: location.pathname.startsWith('/volunteers'),
    Events: location.pathname.startsWith('/events'),
    Ministry: location.pathname.startsWith('/ministry'),
    'CBS Groups': location.pathname.startsWith('/cbs'),
    Leadership: location.pathname.startsWith('/leadership'),
    'Strategic Plan': location.pathname.startsWith('/strategic'),
  });
  const productName = globalBranding.appName || 'Ecclesia';
  const productTagline = globalBranding.tagline || 'Church OS';

  useEffect(() => {
    setOpenSections((current) => ({
      ...current,
      Finance: current.Finance || location.pathname.startsWith('/finance'),
      Attendance: current.Attendance || location.pathname.startsWith('/attendance'),
      Communication: current.Communication || location.pathname.startsWith('/communication'),
      Headquarters: current.Headquarters || location.pathname.startsWith('/hq'),
      Visitors: current.Visitors || location.pathname.startsWith('/visitors'),
      'Pastoral Care': current['Pastoral Care'] || location.pathname.startsWith('/pastoral'),
      Volunteers: current.Volunteers || location.pathname.startsWith('/volunteers'),
      Events: current.Events || location.pathname.startsWith('/events'),
      Ministry: current.Ministry || location.pathname.startsWith('/ministry'),
      'CBS Groups': current['CBS Groups'] || location.pathname.startsWith('/cbs'),
      Leadership: current.Leadership || location.pathname.startsWith('/leadership'),
      'Strategic Plan': current['Strategic Plan'] || location.pathname.startsWith('/strategic'),
    }));
  }, [location.pathname]);

  const canShowItem = (item) => hasAnyCapability(item.capabilityOptions || []);
  const prefetchByRoute = (route) => {
    if (route === '/hq') {
      const today = new Date();
      const currentDateValue = today.toISOString().slice(0, 10);
      const currentMonthStartValue = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      queryClient.prefetchQuery({
        queryKey: ['hq-branch-list'],
        queryFn: () => getAllBranches(),
        staleTime: 1000 * 60 * 5,
      });
      queryClient.prefetchQuery({
        queryKey: ['hq-overview', currentMonthStartValue, currentDateValue, ''],
        queryFn: () =>
          getHQOverview({
            from: currentMonthStartValue,
            to: currentDateValue,
          }),
        staleTime: 1000 * 60 * 3,
      });
      queryClient.prefetchQuery({
        queryKey: ['hq-branch-comparison', currentMonthStartValue, currentDateValue, ''],
        queryFn: () =>
          getBranchComparison({
            from: currentMonthStartValue,
            to: currentDateValue,
          }),
        staleTime: 1000 * 60 * 3,
      });
      queryClient.prefetchQuery({
        queryKey: ['hq-growth-trends', ''],
        queryFn: () => getGrowthTrends({ months: 12 }),
        staleTime: 1000 * 60 * 3,
      });
      queryClient.prefetchQuery({
        queryKey: ['hq-operational-health', ''],
        queryFn: () => getOperationalHealth({}),
        staleTime: 1000 * 60 * 3,
      });
      queryClient.prefetchQuery({
        queryKey: ['hq-member-intelligence-summary', ''],
        queryFn: () => getMemberIntelligence({}),
        staleTime: 1000 * 60 * 3,
      });
    }

    if (route === '/hq/branches') {
      queryClient.prefetchQuery({
        queryKey: ['hq-branches-grid'],
        queryFn: () => getAllBranches(),
        staleTime: 1000 * 60 * 5,
      });
      queryClient.prefetchQuery({
        queryKey: ['hq-branches-comparison-grid'],
        queryFn: () => getBranchComparison(),
        staleTime: 1000 * 60 * 3,
      });
    }

    if (route === '/members') {
      queryClient.prefetchQuery({
        queryKey: ['members', 'default', '', 1, '', ''],
        queryFn: () =>
          getMembers({
            page: 1,
            limit: 12,
          }),
        staleTime: 1000 * 60 * 3,
      });
      queryClient.prefetchQuery({
        queryKey: ['member-stats', 'default', ''],
        queryFn: () => getMemberStats(),
        staleTime: 1000 * 60 * 5,
      });
    }
  };

  const visibleNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => ({
          ...item,
          children: item.children?.filter((subItem) => canShowItem(subItem)) || [],
        }))
        .filter((item) => (item.children ? item.children.length > 0 || canShowItem(item) : canShowItem(item))),
    }))
    .filter((group) => group.items.length);

  const renderSubMenu = (items) => (
    <div className="ml-7 mt-1 space-y-1 border-l border-white/8 pl-4">
      {items.map((subItem) => (
        <NavLink
          key={subItem.to}
          to={subItem.to}
          className={({ isActive }) =>
            `block rounded-xl border-l-2 px-3 py-2 text-[12px] uppercase tracking-[0.2em] transition ${
              isActive
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-transparent text-white/40 hover:bg-[#122033] hover:text-white/70'
            }`
          }
          onMouseEnter={() => prefetchByRoute(subItem.to)}
          onFocus={() => prefetchByRoute(subItem.to)}
          onClick={() => {
            if (window.innerWidth < 1024) {
              onToggle();
            }
          }}
        >
          {subItem.label}
        </NavLink>
      ))}
    </div>
  );

  const renderItem = (item) => {
    const { label, to, icon: Icon, children, disabled } = item;

    if (children?.length) {
      const isOpenSection = openSections[label];
      const isActive = children.some(
        (child) => location.pathname === child.to || location.pathname.startsWith(`${child.to}/`),
      );

      return (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() =>
              setOpenSections((current) => ({
                ...current,
                [label]: !current[label],
              }))
            }
            className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium transition ${
              isActive || isOpenSection
                ? 'border-l-2 border-accent bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                : 'border-l-2 border-transparent text-white/68 hover:bg-[#122033] hover:text-white'
            }`}
            aria-label={isOpenSection ? `Collapse ${label} menu` : `Expand ${label} menu`}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpenSection ? 'rotate-180 text-accent' : ''}`}
            />
          </button>
          {isOpenSection ? renderSubMenu(children) : null}
        </div>
      );
    }

    return (
      <NavLink
        to={disabled ? '#' : to}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-2xl border-l-2 px-3 py-2.5 text-[14px] font-medium transition ${
            disabled
              ? 'cursor-not-allowed border-transparent text-white/28'
              : isActive
                ? 'border-accent bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                : 'border-transparent text-white/68 hover:bg-[#122033] hover:text-white'
          }`
        }
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }

          if (window.innerWidth < 1024) {
            onToggle();
          }
        }}
        onMouseEnter={() => {
          if (!disabled && to) {
            prefetchByRoute(to);
          }
        }}
        onFocus={() => {
          if (!disabled && to) {
            prefetchByRoute(to);
          }
        }}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </NavLink>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[206px] transform flex-col overflow-hidden border-r border-white/8 bg-[#09101c] px-3 py-4 text-white transition duration-300 lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="mb-5 flex shrink-0 items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/50 bg-accent/10 text-accent">
            <Building className="h-4 w-4" />
          </div>
          <div>
            <p className="font-serif text-[1.45rem] font-semibold leading-none text-white">{productName}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-white/40">{productTagline}</p>
          </div>
        </div>
        <Button variant="ghost" className="lg:hidden" onClick={onToggle}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto pr-1">
        {visibleNavigation.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <p className="px-2 text-[10px] uppercase tracking-[0.26em] text-white/32">{group.title}</p>
            {group.items.map((item) => (
              <div key={item.label} className="space-y-1">
                {renderItem(item)}
                {item.disabled ? <p className="pl-12 text-[11px] text-white/24">Coming soon</p> : null}
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-8 lg:hidden">
        <Button variant="ghost" className="w-full" onClick={onToggle}>
          <Menu className="mr-2 h-4 w-4" />
          Close Menu
        </Button>
      </div>
    </aside>
  );
}
