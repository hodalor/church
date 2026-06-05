import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { getAttendanceSummary, getAttendanceTrends } from '../../api/endpoints/attendance';
import { getFinancialSummary } from '../../api/endpoints/finance';
import { getMemberStats } from '../../api/endpoints/members';
import { useTenant } from '../../hooks/useTenant';
import { useBrandingStore } from '../../stores/brandingStore';
import { formatAmount } from '../../utils/currency';

const chartColors = ['#C9A84C', '#60a5fa', '#34d399', '#f97316', '#a78bfa', '#f43f5e'];

export default function DashboardPage() {
  const { churchName, currencyCode, currencySymbol } = useTenant();
  const tenantBranding = useBrandingStore((state) => state.tenantBranding);
  const workspaceName = tenantBranding.appName || churchName || 'Your Church';
  const formatCurrency = (value) =>
    formatAmount(value, { currencyCode, currencySymbol, maximumFractionDigits: 0 });

  const membersQuery = useQuery({
    queryKey: ['dashboard-member-stats'],
    queryFn: getMemberStats,
  });
  const financeQuery = useQuery({
    queryKey: ['dashboard-finance-summary'],
    queryFn: () => getFinancialSummary(new Date().getFullYear()),
  });
  const attendanceSummaryQuery = useQuery({
    queryKey: ['dashboard-attendance-summary'],
    queryFn: () => getAttendanceSummary({ period: 'month' }),
  });
  const attendanceTrendsQuery = useQuery({
    queryKey: ['dashboard-attendance-trends'],
    queryFn: () => getAttendanceTrends({ period: 'year' }),
  });

  const memberStats = membersQuery.data || {};
  const financeSummary = financeQuery.data || {};
  const attendanceSummary = attendanceSummaryQuery.data || {};
  const attendanceTrends = attendanceTrendsQuery.data || {};

  const memberPieData = useMemo(
    () =>
      Object.entries(memberStats.byMembershipStatus || {})
        .map(([name, value]) => ({ name: name.replaceAll('_', ' '), value }))
        .filter((item) => item.value > 0),
    [memberStats.byMembershipStatus],
  );

  const genderBarData = useMemo(
    () =>
      Object.entries(memberStats.byGender || {}).map(([name, value]) => ({
        name,
        value,
      })),
    [memberStats.byGender],
  );

  const attendanceLineData = attendanceTrends.monthly || attendanceSummary.services || [];
  const financeBarData = financeSummary.monthlyBreakdown || [];
  const kpis = [
    {
      label: 'Members',
      value: memberStats.total || 0,
      helper: `${memberStats.active || 0} active members`,
    },
    {
      label: 'Attendance',
      value: attendanceSummary.kpis?.totalHeadcount || 0,
      helper: `${attendanceSummary.kpis?.avgPerService || 0} avg per service`,
    },
    {
      label: 'Income',
      value: formatCurrency(financeSummary.totalIncome || 0),
      helper: `Net ${formatCurrency(financeSummary.netBalance || 0)}`,
    },
    {
      label: 'Growth',
      value: attendanceTrends.growthRate || attendanceSummary.kpis?.growthRate || '0%',
      helper: 'Monthly attendance growth',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-gradient-to-br from-white via-white to-accent/10">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">Church Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-primary">
              Welcome to {workspaceName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary/65">
              Track member growth, attendance trends, and finance activity in one clear
              workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/members">
                <Button variant="secondary">Open Member Directory</Button>
              </Link>
              <Link to="/attendance">
                <Button variant="ghost">Open Attendance</Button>
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

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Attendance</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Monthly trend</h2>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceLineData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="members" stroke="#60a5fa" strokeWidth={3} />
                <Line type="monotone" dataKey="visitors" stroke="#C9A84C" strokeWidth={3} />
                <Line type="monotone" dataKey="total" stroke="#34d399" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Members</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Membership mix</h2>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={memberPieData} dataKey="value" nameKey="name" outerRadius={110}>
                  {memberPieData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Finance</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Monthly income vs expenses</h2>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeBarData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="income" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="#1E2A4A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">People</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Gender overview</h2>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderBarData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          ['Members', `${memberStats.active || 0} active, ${memberStats.new || 0} new`],
          ['Attendance', `${attendanceSummary.kpis?.avgPerService || 0} average per service`],
          ['Finance', `${formatCurrency(financeSummary.totalExpenses || 0)} expenses this year`],
        ].map(([module, helper]) => (
          <Card key={module}>
            <p className="text-sm uppercase tracking-[0.25em] text-primary/40">Module</p>
            <h2 className="mt-2 text-xl font-semibold text-primary">{module}</h2>
            <p className="mt-3 text-sm leading-6 text-primary/60">{helper}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
