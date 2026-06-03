import { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Building,
  ChevronLeft,
  ChevronDown,
  HeartHandshake,
  HandHelping,
  HandCoins,
  LayoutDashboard,
  Menu,
  Radio,
  Settings,
  Shield,
  Users,
  UserRoundPlus,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { useBrandingStore } from '../../stores/brandingStore';
import { useCapabilities } from '../../hooks/useCapabilities';

const churchNavigation = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, capability: 'dashboard.view' },
    ],
  },
  {
    title: 'Ministry',
    items: [
      { label: 'Members', to: '/members', icon: Users, capability: 'members.view' },
      { label: 'Visitors', to: '/visitors', icon: UserRoundPlus, capability: 'members.view' },
      { label: 'Users', to: '/users', icon: Shield, capability: 'users.view' },
      { label: 'Inbox', to: '/communication/inbox', icon: Bell, capability: 'notifications.view' },
      { label: 'Pastoral Care', to: '/pastoral', icon: HeartHandshake, capability: 'pastoral.view' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Finance', to: '/finance', icon: HandCoins, capability: 'finance.view' },
      { label: 'Attendance', to: '/attendance/services', icon: BarChart3, capability: 'attendance.view' },
      { label: 'Communication', to: '/communication', icon: HandHelping, capability: 'communication.view' },
      { label: 'Broadcasts', to: '/communication/broadcasts', icon: Radio, capability: 'communication.view' },
    ],
  },
  {
    title: 'System',
    items: [{ label: 'Settings', to: '/settings', icon: Settings, capability: 'settings.view' }],
  },
];

const attendanceSubItems = [
  { label: 'Services', to: '/attendance/services' },
  { label: 'Reports', to: '/attendance/reports' },
  { label: 'Absentees', to: '/attendance/absentees' },
];

const communicationSubItems = [
  { label: 'Overview', to: '/communication', capability: 'communication.view' },
  { label: 'Broadcasts', to: '/communication/broadcasts', capability: 'communication.view' },
  { label: 'Templates', to: '/communication/templates', capability: 'communication.view' },
  { label: 'Prayer Requests', to: '/communication/prayer-requests', capability: 'communication.view' },
  { label: 'Polls', to: '/communication/polls', capability: 'communication.view' },
  { label: 'Inbox', to: '/communication/inbox', capability: 'notifications.view' },
];

const visitorSubItems = [
  { label: 'Register', to: '/visitors/register' },
  { label: 'List', to: '/visitors' },
  { label: 'Pipeline', to: '/visitors/pipeline' },
  { label: 'Follow-ups', to: '/visitors/follow-ups' },
  { label: 'Workflow', to: '/visitors/workflow' },
  { label: 'Reports', to: '/visitors/reports' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const globalBranding = useBrandingStore((state) => state.globalBranding);
  const { hasCapability } = useCapabilities();
  const location = useLocation();
  const [financeOpen, setFinanceOpen] = useState(location.pathname.startsWith('/finance'));
  const [attendanceOpen, setAttendanceOpen] = useState(location.pathname.startsWith('/attendance'));
  const [communicationOpen, setCommunicationOpen] = useState(location.pathname.startsWith('/communication'));
  const [visitorsOpen, setVisitorsOpen] = useState(location.pathname.startsWith('/visitors'));
  const productName = globalBranding.appName || 'Ecclesia';
  const productTagline = globalBranding.tagline || 'Church OS';

  useEffect(() => {
    if (location.pathname.startsWith('/finance')) {
      setFinanceOpen(true);
    }
    if (location.pathname.startsWith('/attendance')) {
      setAttendanceOpen(true);
    }
    if (location.pathname.startsWith('/communication')) {
      setCommunicationOpen(true);
    }
    if (location.pathname.startsWith('/visitors')) {
      setVisitorsOpen(true);
    }
  }, [location.pathname]);
  const visibleNavigation = churchNavigation
    .map((group) => ({
      ...group,
      items: group.items.filter(({ capability }) => hasCapability(capability)),
    }))
    .filter((group) => group.items.length);

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
            {group.items.map(({ label, to, icon: Icon, disabled }) => (
              <div key={label} className="space-y-1">
                {label === 'Finance' && !disabled ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setFinanceOpen((current) => !current)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium transition ${
                        location.pathname.startsWith('/finance') || financeOpen
                          ? 'bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                          : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
                      }`}
                      aria-label={financeOpen ? 'Collapse finance menu' : 'Expand finance menu'}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>Finance</span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${financeOpen ? 'rotate-180 text-accent' : ''}`}
                      />
                    </button>
                    {financeOpen ? (
                      <div className="ml-7 mt-1 space-y-1 border-l border-white/8 pl-4">
                        {[
                          { label: 'Overview', to: '/finance' },
                          { label: 'Transactions', to: '/finance/transactions' },
                          { label: 'Pledges', to: '/finance/pledges' },
                          { label: 'Expenses', to: '/finance/expenses' },
                          { label: 'Budgets', to: '/finance/budgets' },
                          { label: 'Reports', to: '/finance/reports' },
                        ].map((subItem) => (
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
                                onToggle();
                              }
                            }}
                          >
                            {subItem.label}
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : label === 'Attendance' && !disabled ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setAttendanceOpen((current) => !current)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium transition ${
                        location.pathname.startsWith('/attendance') || attendanceOpen
                          ? 'bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                          : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
                      }`}
                      aria-label={attendanceOpen ? 'Collapse attendance menu' : 'Expand attendance menu'}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>Attendance</span>
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
                                onToggle();
                              }
                            }}
                          >
                            {subItem.label}
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : label === 'Communication' && !disabled ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setCommunicationOpen((current) => !current)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium transition ${
                        location.pathname.startsWith('/communication') || communicationOpen
                          ? 'bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                          : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
                      }`}
                      aria-label={communicationOpen ? 'Collapse communication menu' : 'Expand communication menu'}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>Communication</span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${communicationOpen ? 'rotate-180 text-accent' : ''}`}
                      />
                    </button>
                    {communicationOpen ? (
                      <div className="ml-7 mt-1 space-y-1 border-l border-white/8 pl-4">
                        {communicationSubItems
                          .filter((subItem) => hasCapability(subItem.capability))
                          .map((subItem) => (
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
                                  onToggle();
                                }
                              }}
                            >
                              {subItem.label}
                            </NavLink>
                          ))}
                      </div>
                    ) : null}
                  </div>
                ) : label === 'Visitors' && !disabled ? (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setVisitorsOpen((current) => !current)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-[14px] font-medium transition ${
                        location.pathname.startsWith('/visitors') || visitorsOpen
                          ? 'bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                          : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
                      }`}
                      aria-label={visitorsOpen ? 'Collapse visitors menu' : 'Expand visitors menu'}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>Visitors</span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${visitorsOpen ? 'rotate-180 text-accent' : ''}`}
                      />
                    </button>
                    {visitorsOpen ? (
                      <div className="ml-7 mt-1 space-y-1 border-l border-white/8 pl-4">
                        {visitorSubItems.map((subItem) => (
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
                                onToggle();
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
                  <NavLink
                    to={disabled ? '#' : to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium transition ${
                        disabled
                          ? 'cursor-not-allowed text-white/28'
                          : isActive
                            ? 'bg-[linear-gradient(90deg,rgba(201,168,76,0.18),rgba(201,168,76,0.08))] text-[#f5deb0]'
                            : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
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
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </NavLink>
                )}
                {disabled ? <p className="pl-12 text-[11px] text-white/24">Coming soon</p> : null}
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
