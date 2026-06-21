import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Bot,
  BookOpen,
  BrainCircuit,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  HandCoins,
  HandHelping,
  HeartHandshake,
  LayoutDashboard,
  LineChart,
  Menu,
  Search,
  Settings,
  Shield,
  Target,
  Users,
  UserRoundPlus,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllTenants } from '../../api/endpoints/tenants';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import { useBrandingStore } from '../../stores/brandingStore';
import NotificationBell from './NotificationBell';
import ErrorBoundary from '../ui/ErrorBoundary';
import PageTransition from '../ui/PageTransition';

const financeSubItems = [
  { label: 'Overview', to: '/finance' },
  { label: 'Transactions', to: '/finance/transactions' },
  { label: 'Pledges', to: '/finance/pledges' },
  { label: 'Expenses', to: '/finance/expenses' },
  { label: 'Budgets', to: '/finance/budgets' },
  { label: 'Reports', to: '/finance/reports' },
  { label: 'Audit Log', to: '/finance/audit' },
];

const communicationSubItems = [
  { label: 'Platform', to: '/superadmin/communication' },
  { label: 'Broadcasts', to: '/communication/broadcasts' },
  { label: 'Templates', to: '/communication/templates' },
  { label: 'Prayer Requests', to: '/communication/prayer-requests' },
  { label: 'Polls', to: '/communication/polls' },
  { label: 'Inbox', to: '/communication/inbox' },
];

const attendanceSubItems = [
  { label: 'Platform', to: '/superadmin/attendance' },
  { label: 'Services', to: '/attendance/services' },
  { label: 'Reports', to: '/attendance/reports' },
  { label: 'Absentees', to: '/attendance/absentees' },
];

const visitorSubItems = [
  { label: 'Platform', to: '/superadmin/visitors' },
  { label: 'Register', to: '/visitors/register' },
  { label: 'List', to: '/visitors' },
  { label: 'Pipeline', to: '/visitors/pipeline' },
  { label: 'Follow-ups', to: '/visitors/follow-ups' },
  { label: 'Workflow', to: '/visitors/workflow' },
  { label: 'Reports', to: '/visitors/reports' },
];

const pastoralSubItems = [
  { label: 'Overview', to: '/pastoral' },
  { label: 'Cases', to: '/pastoral/cases' },
  { label: 'Appointments', to: '/pastoral/appointments' },
  { label: 'Discipleship', to: '/pastoral/discipleship' },
  { label: 'Reports', to: '/pastoral/reports' },
];

const volunteerSubItems = [
  { label: 'Platform', to: '/superadmin/volunteers' },
  { label: 'Overview', to: '/volunteers' },
  { label: 'Registry', to: '/volunteers/list' },
  { label: 'Rosters', to: '/volunteers/rosters' },
];

const eventSubItems = [
  { label: 'Platform', to: '/superadmin/events' },
  { label: 'Overview', to: '/events' },
];

const platformBiSubItems = [
  { label: 'Overview', to: '/superadmin/platform' },
  { label: 'Tenant Comparison', to: '/superadmin/platform/tenants' },
];

const navigation = [
  {
    title: 'Workspace',
    items: [
      { label: 'Overview', to: '/superadmin/dashboard', icon: LayoutDashboard },
      { label: 'All Churches', to: '/superadmin/tenants', icon: Building2, badge: 'tenants' },
      {
        label: 'Platform BI',
        icon: LineChart,
        children: platformBiSubItems,
        matchPrefixes: ['/superadmin/platform'],
      },
      { label: 'Members', to: '/superadmin/members', icon: Users },
      { label: 'Users', to: '/superadmin/users', icon: Shield },
      { label: 'Manual', to: '/superadmin/manual', icon: BookOpen },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Finance', icon: HandCoins, children: financeSubItems, matchPrefixes: ['/finance'] },
      { label: 'Notifications', to: '/superadmin/notifications', icon: Bell },
      {
        label: 'Communication',
        icon: HandHelping,
        children: communicationSubItems,
        matchPrefixes: ['/superadmin/communication', '/communication'],
      },
      {
        label: 'Attendance',
        icon: BarChart3,
        children: attendanceSubItems,
        matchPrefixes: ['/superadmin/attendance', '/attendance'],
      },
      {
        label: 'Visitors',
        icon: UserRoundPlus,
        children: visitorSubItems,
        matchPrefixes: ['/superadmin/visitors', '/visitors'],
      },
      {
        label: 'Volunteers',
        icon: HandHelping,
        children: volunteerSubItems,
        matchPrefixes: ['/superadmin/volunteers', '/volunteers'],
      },
      {
        label: 'Events',
        icon: CalendarDays,
        children: eventSubItems,
        matchPrefixes: ['/superadmin/events', '/events'],
      },
    ],
  },
  {
    title: 'Church Growth',
    items: [
      { label: 'Ministry', to: '/ministry', icon: HandHelping },
      { label: 'CBS Groups', to: '/cbs', icon: BookOpen },
      { label: 'Leadership', to: '/leadership', icon: Users },
      { label: 'Strategic Plan', to: '/strategic', icon: Target },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Insights', to: '/insights', icon: BrainCircuit },
      { label: 'AI Assistant', to: '/ai', icon: Bot },
      { label: 'Family Ministry', to: '/hq/family-ministry', icon: HeartHandshake },
      { label: 'Audit Trail', to: '/audit', icon: Shield },
    ],
  },
  {
    title: 'Care',
    items: [
      {
        label: 'Pastoral Care',
        icon: HeartHandshake,
        children: pastoralSubItems,
        matchPrefixes: ['/superadmin/pastoral', '/pastoral'],
      },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', to: '/superadmin/settings', icon: Settings }],
  },
];

export default function SuperAdminShell({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState({
    'Platform BI': location.pathname.startsWith('/superadmin/platform'),
    Finance: location.pathname.startsWith('/finance'),
    Communication:
      location.pathname.startsWith('/superadmin/communication') ||
      location.pathname.startsWith('/communication'),
    Attendance:
      location.pathname.startsWith('/superadmin/attendance') ||
      location.pathname.startsWith('/attendance'),
    Visitors:
      location.pathname.startsWith('/superadmin/visitors') ||
      location.pathname.startsWith('/visitors'),
    Volunteers:
      location.pathname.startsWith('/superadmin/volunteers') ||
      location.pathname.startsWith('/volunteers'),
    Events:
      location.pathname.startsWith('/superadmin/events') ||
      location.pathname.startsWith('/events'),
    'Pastoral Care':
      location.pathname.startsWith('/superadmin/pastoral') ||
      location.pathname.startsWith('/pastoral'),
  });
  const globalBranding = useBrandingStore((state) => state.globalBranding);
  const tenantsQuery = useQuery({
    queryKey: ['shell-tenants-count'],
    queryFn: () => getAllTenants({ page: 1, limit: 1 }),
  });

  useEffect(() => {
    setExpanded((current) => ({
      ...current,
      'Platform BI': current['Platform BI'] || location.pathname.startsWith('/superadmin/platform'),
      Finance: current.Finance || location.pathname.startsWith('/finance'),
      Communication:
        current.Communication ||
        location.pathname.startsWith('/superadmin/communication') ||
        location.pathname.startsWith('/communication'),
      Attendance:
        current.Attendance ||
        location.pathname.startsWith('/superadmin/attendance') ||
        location.pathname.startsWith('/attendance'),
      Visitors:
        current.Visitors ||
        location.pathname.startsWith('/superadmin/visitors') ||
        location.pathname.startsWith('/visitors'),
      Volunteers:
        current.Volunteers ||
        location.pathname.startsWith('/superadmin/volunteers') ||
        location.pathname.startsWith('/volunteers'),
      Events:
        current.Events ||
        location.pathname.startsWith('/superadmin/events') ||
        location.pathname.startsWith('/events'),
      'Pastoral Care':
        current['Pastoral Care'] ||
        location.pathname.startsWith('/superadmin/pastoral') ||
        location.pathname.startsWith('/pastoral'),
    }));
  }, [location.pathname]);

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
          onClick={() => {
            if (window.innerWidth < 1024) {
              setIsOpen(false);
            }
          }}
        >
          {subItem.label}
        </NavLink>
      ))}
    </div>
  );

  const renderNavItem = (item) => {
    const { label, to, icon: Icon, children: subItems, matchPrefixes = [], badge } = item;

    if (subItems?.length) {
      const isActive = matchPrefixes.some(
        (prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`),
      );
      const isExpanded = expanded[label];

      return (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() =>
              setExpanded((current) => ({
                ...current,
                [label]: !current[label],
              }))
            }
            className={`flex w-full items-center justify-between rounded-2xl border-l-2 px-3 py-2.5 text-[14px] font-medium ${
              isActive || isExpanded
                ? 'border-accent bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                : 'border-transparent text-white/68 hover:bg-[#122033] hover:text-white'
            }`}
            aria-label={isExpanded ? `Collapse ${label} menu` : `Expand ${label} menu`}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180 text-accent' : ''}`}
            />
          </button>
          {isExpanded ? renderSubMenu(subItems) : null}
        </div>
      );
    }

    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center justify-between rounded-2xl border-l-2 px-3 py-2.5 text-[14px] font-medium ${
            isActive
              ? 'border-accent bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
              : 'border-transparent text-white/68 hover:bg-[#122033] hover:text-white'
          }`
        }
        onClick={() => {
          if (window.innerWidth < 1024) {
            setIsOpen(false);
          }
        }}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        {badge === 'tenants' ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
            {tenantsQuery.data?.total || 0}
          </span>
        ) : null}
      </NavLink>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-[#060b14] text-white">
      <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(201,168,76,0.06),transparent_22%),linear-gradient(180deg,#060b14_0%,#050912_100%)]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-[206px] transform flex-col overflow-hidden border-r border-white/8 bg-[#09101c] px-3 py-4 text-white transition duration-300 lg:static lg:translate-x-0 ${
            isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="mb-5 flex shrink-0 items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/50 bg-accent/10 text-accent">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-serif text-[1.45rem] font-semibold leading-none text-white">
                  {globalBranding.appName || 'Ecclesia'}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-white/40">
                  {globalBranding.tagline || 'Church OS'}
                </p>
              </div>
            </div>
            <Button variant="ghost" className="lg:hidden" onClick={() => setIsOpen(false)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto pr-1">
            {navigation.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <p className="px-2 text-[10px] uppercase tracking-[0.26em] text-white/32">{group.title}</p>
                {group.items.map((item) => (
                  <div key={item.label} className="space-y-1">
                    {renderNavItem(item)}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-white/8 bg-[#09101c]/92 px-4 py-3 backdrop-blur xl:px-6">
            <div className="flex items-center gap-4">
              <Button variant="subtle" className="lg:hidden" onClick={() => setIsOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <div className="hidden items-center gap-3 lg:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent/50 bg-accent/10 text-accent">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{globalBranding.appName || 'Ecclesia'}</p>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                    {globalBranding.tagline || 'Church OS'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="hidden w-[260px] items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 shadow-sm lg:flex">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members, records..."
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
                />
              </label>
              <NotificationBell inboxPath="/communication/inbox" />
              <Button
                variant="subtle"
                onClick={() => logout()}
                className="h-11 w-11 px-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">↗</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 lg:px-5 lg:py-5 xl:px-6">
            <ErrorBoundary>
              <PageTransition>{children}</PageTransition>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-primary/30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}
    </div>
  );
}
