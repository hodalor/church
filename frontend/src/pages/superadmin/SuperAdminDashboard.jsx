import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getPlatformAttendanceOverview } from '../../api/endpoints/attendance';
import { activateTenant, getAllTenants, getPlatformAnalytics, suspendTenant } from '../../api/endpoints/tenants';
import { getPlatformCommunicationStats } from '../../api/endpoints/communication';
import { getPlatformPastoralOverview } from '../../api/endpoints/pastoral';
import { getPlatformVisitorOverview } from '../../api/endpoints/visitors';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatDate';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({
    queryKey: ['admin-dashboard-tenants'],
    queryFn: () => getAllTenants({ page: 1, limit: 5 }),
  });
  const analyticsQuery = useQuery({
    queryKey: ['platform-analytics-overview'],
    queryFn: getPlatformAnalytics,
  });
  const communicationQuery = useQuery({
    queryKey: ['platform-communication-overview'],
    queryFn: getPlatformCommunicationStats,
  });
  const attendanceQuery = useQuery({
    queryKey: ['platform-attendance-overview-card'],
    queryFn: getPlatformAttendanceOverview,
  });
  const visitorsQuery = useQuery({
    queryKey: ['platform-visitors-overview-card'],
    queryFn: getPlatformVisitorOverview,
  });
  const pastoralQuery = useQuery({
    queryKey: ['platform-pastoral-overview-card'],
    queryFn: getPlatformPastoralOverview,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ tenantId, shouldActivate }) =>
      shouldActivate ? activateTenant(tenantId) : suspendTenant(tenantId, 'Suspended by super admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });

  const summary = tenantsQuery.data?.summary ?? {
    total: 0,
    active: 0,
    suspended: 0,
    plans: { small: 0, medium: 0, mega: 0 },
  };
  const analytics = analyticsQuery.data || {};
  const planChartData = [
    { name: 'Small', value: summary.plans.small || 0, fill: '#C9A84C' },
    { name: 'Medium', value: summary.plans.medium || 0, fill: '#1E2A4A' },
    { name: 'Mega', value: summary.plans.mega || 0, fill: '#8B5CF6' },
  ];
  const statusChartData = [
    { name: 'Active Churches', value: analytics.activeTenants ?? summary.active ?? 0 },
    { name: 'Suspended Churches', value: analytics.suspendedTenants ?? summary.suspended ?? 0 },
    { name: 'Users', value: analytics.totalUsers ?? 0 },
  ];

  const stats = [
    { label: 'Total Churches', value: analytics.totalTenants ?? summary.total },
    { label: 'Active Churches', value: analytics.activeTenants ?? summary.active },
    { label: 'Suspended Churches', value: analytics.suspendedTenants ?? summary.suspended },
    { label: 'Total Users', value: analytics.totalUsers ?? 0 },
  ];

  const columns = [
    { key: 'churchName', header: 'Church Name' },
    { key: 'tenantId', header: 'Tenant ID' },
    { key: 'subscriptionPlan', header: 'Plan' },
    {
      key: 'status',
      header: 'Status',
      render: (tenant) => <StatusBadge status={tenant.isSuspended ? 'Suspended' : 'Active'} />,
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (tenant) => formatDate(tenant.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tenant) => (
        <div className="flex gap-2">
          <Button variant="subtle" onClick={() => navigate(`/superadmin/tenants/${tenant.tenantId}`)}>
            View
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toggleMutation.mutate({
                tenantId: tenant.tenantId,
                shouldActivate: tenant.isSuspended,
              })
            }
          >
            {tenant.isSuspended ? 'Activate' : 'Suspend'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          title="Master Dashboard"
          subtitle="Oversee churches, monitor growth, and manage tenant health across the platform."
          action={
            <Button variant="secondary" onClick={() => navigate('/superadmin/tenants?create=tenant')}>
              + Register New Church
            </Button>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="min-h-[110px] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{stat.label}</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{stat.value}</h2>
              {stat.helper ? <p className="mt-2 text-xs text-white/60">{stat.helper}</p> : null}
            </Card>
          ))}
        </div>

        <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Communication Summary</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {communicationQuery.data?.totalBroadcasts || 0} broadcasts sent across all churches
            </h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/superadmin/communication')}>
            Open Communication
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Attendance Summary</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {attendanceQuery.data?.servicesHeldThisWeek || 0} services held across all churches this week
            </h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/superadmin/attendance')}>
            Open Attendance
          </Button>
        </Card>

        <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Visitors Summary</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {visitorsQuery.data?.totalVisitors || 0} visitors tracked across all churches
            </h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/superadmin/visitors')}>
            Open Visitors
          </Button>
        </Card>

        <Card
          className={`flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between ${
            (pastoralQuery.data?.totalCriticalCases || 0) > 0 ? 'border-rose-500/30 bg-rose-500/10' : ''
          }`}
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Pastoral Summary</p>
            <h2 className="mt-2 text-xl font-semibold text-white">
              {pastoralQuery.data?.totalCriticalCases || 0} critical care cases across all churches
            </h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/superadmin/pastoral')}>
            Open Pastoral
          </Button>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Plan Analytics</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Tenant plan distribution</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planChartData} dataKey="value" nameKey="name" outerRadius={110}>
                    {planChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Platform Activity</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Tenant and user footprint</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Recent Churches</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Latest registrations</h2>
            </div>
            <Button variant="subtle" onClick={() => navigate('/superadmin/tenants')}>
              View all
            </Button>
          </div>

          <DataTable columns={columns} data={tenantsQuery.data?.tenants || []} />
        </Card>
      </div>
    </SuperAdminShell>
  );
}
