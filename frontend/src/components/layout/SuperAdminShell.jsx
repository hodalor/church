import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronDown,
  FileText,
  HandHelping,
  HandCoins,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  Plus,
  Radio,
  Search,
  Settings,
  Shield,
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

const navigation = [
  {
    title: 'Workspace',
    items: [
      { label: 'Overview', to: '/superadmin/dashboard', icon: LayoutDashboard },
      { label: 'All Churches', to: '/superadmin/tenants', icon: Building2 },
      { label: 'Members', to: '/superadmin/members', icon: Users },
      { label: 'Users', to: '/superadmin/users', icon: Shield },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Finance',
        icon: HandCoins,
        children: financeSubItems,
        matchPrefixes: ['/finance'],
      },
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
      { label: 'Visitors', to: '/superadmin/visitors', icon: UserRoundPlus },
    ],
  },
  {
    title: 'Care',
    items: [
      {
        label: 'Pastoral Care',
        to: '/superadmin/dashboard',
        icon: HeartHandshake,
        disabled: true,
      },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', to: '/superadmin/settings', icon: Settings },
      { label: 'Branding', to: '/superadmin/settings', icon: FileText },
      { label: 'Communication Center', to: '/superadmin/communication', icon: Radio },
    ],
  },
];

export default function SuperAdminShell({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();
  const [financeOpen, setFinanceOpen] = useState(location.pathname.startsWith('/finance'));
  const [communicationOpen, setCommunicationOpen] = useState(
    location.pathname.startsWith('/superadmin/communication') ||
      location.pathname.startsWith('/communication'),
  );
  const [attendanceOpen, setAttendanceOpen] = useState(
    location.pathname.startsWith('/superadmin/attendance') || location.pathname.startsWith('/attendance'),
  );
  const globalBranding = useBrandingStore((state) => state.globalBranding);
  const tenantsQuery = useQuery({
    queryKey: ['shell-tenants-count'],
    queryFn: () => getAllTenants({ page: 1, limit: 1 }),
  });

  useEffect(() => {
    if (location.pathname.startsWith('/finance')) {
      setFinanceOpen(true);
    }

    if (
      location.pathname.startsWith('/superadmin/communication') ||
      location.pathname.startsWith('/communication')
    ) {
      setCommunicationOpen(true);
    }
    if (
      location.pathname.startsWith('/superadmin/attendance') ||
      location.pathname.startsWith('/attendance')
    ) {
      setAttendanceOpen(true);
    }
  }, [location.pathname]);

  const isExpandableActive = (prefixes = []) =>
    prefixes.some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));

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
                {group.items.map(({ label, to, icon: Icon, disabled }) => (
                  <div key={label} className="space-y-1">
                    {label === 'Finance' ? (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setFinanceOpen((current) => !current)}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium ${
                            isExpandableActive(['/finance']) || financeOpen
                              ? 'bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                              : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
                          }`}
                          aria-label={financeOpen ? 'Collapse finance menu' : 'Expand finance menu'}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            {label}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${financeOpen ? 'rotate-180 text-accent' : ''}`}
                          />
                        </button>
                        {financeOpen ? (
                          <div className="ml-7 mt-1 space-y-1 border-l border-white/8 pl-4">
                            {financeSubItems.map((subItem) => (
                              <NavLink
                                key={subItem.to}
                                to={subItem.to}
                                className={({ isActive }) =>
                                  `block rounded-xl px-3 py-2 text-[12px] uppercase tracking-[0.2em] ${
                                    isActive ? 'bg-white/[0.06] text-accent' : 'text-white/40 hover:text-white/70'
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
                        ) : null}
                      </div>
                    ) : label === 'Communication' ? (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setCommunicationOpen((current) => !current)}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium ${
                            isExpandableActive(['/superadmin/communication', '/communication']) || communicationOpen
                              ? 'bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                              : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
                          }`}
                          aria-label={communicationOpen ? 'Collapse communication menu' : 'Expand communication menu'}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            {label}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${communicationOpen ? 'rotate-180 text-accent' : ''}`}
                          />
                        </button>
                        {communicationOpen ? (
                          <div className="ml-7 mt-1 space-y-1 border-l border-white/8 pl-4">
                            {communicationSubItems.map((subItem) => (
                              <NavLink
                                key={subItem.to}
                                to={subItem.to}
                                className={({ isActive }) =>
                                  `block rounded-xl px-3 py-2 text-[12px] uppercase tracking-[0.2em] ${
                                    isActive ? 'bg-white/[0.06] text-accent' : 'text-white/40 hover:text-white/70'
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
                        ) : null}
                      </div>
                    ) : label === 'Attendance' ? (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setAttendanceOpen((current) => !current)}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium ${
                            isExpandableActive(['/superadmin/attendance', '/attendance']) || attendanceOpen
                              ? 'bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                              : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
                          }`}
                          aria-label={attendanceOpen ? 'Collapse attendance menu' : 'Expand attendance menu'}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            {label}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${attendanceOpen ? 'rotate-180 text-accent' : ''}`}
                          />
                        </button>
                        {attendanceOpen ? (
                          <div className="ml-7 mt-1 space-y-1 border-l border-white/8 pl-4">
                            {attendanceSubItems.map((subItem) => (
                              <NavLink
                                key={subItem.to}
                                to={subItem.to}
                                className={({ isActive }) =>
                                  `block rounded-xl px-3 py-2 text-[12px] uppercase tracking-[0.2em] ${
                                    isActive ? 'bg-white/[0.06] text-accent' : 'text-white/40 hover:text-white/70'
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
                        ) : null}
                      </div>
                    ) : (
                      <>
                        {disabled ? (
                          <div className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium text-white/28">
                            <span className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              {label}
                            </span>
                          </div>
                        ) : (
                          <NavLink
                            to={to}
                            className={({ isActive }) =>
                              `flex items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium ${
                                isActive
                                  ? 'bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                                  : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
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
                            {label === 'All Churches' ? (
                              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">
                                {tenantsQuery.data?.total || 0}
                              </span>
                            ) : null}
                          </NavLink>
                        )}
                        {disabled ? <p className="pl-12 text-[11px] text-white/24">Coming soon</p> : null}
                      </>
                    )}
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
              <label className="hidden w-[260px] items-center gap-3 rounded-2xl border border-white/8 bg-[#101827] px-4 py-2.5 lg:flex">
                <Search className="h-4 w-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Search members, records..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/28"
                />
              </label>
              <NotificationBell inboxPath="/communication/inbox" />
              <Button variant="subtle" className="hidden h-11 w-11 px-0 lg:inline-flex">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="subtle" onClick={() => logout()} className="h-11 w-11 px-0 sm:h-auto sm:w-auto sm:px-4 sm:py-2.5">
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">↗</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 lg:px-5 lg:py-5 xl:px-6">
            {children}
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
