import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import { getPlatformEventsOverview } from '../../api/endpoints/events';
import useCurrency from '../../hooks/useCurrency';

export default function SuperAdminEventsPage() {
  const { formatCurrency } = useCurrency();
  const overviewQuery = useQuery({
    queryKey: ['superadmin-events-platform'],
    queryFn: getPlatformEventsOverview,
  });

  const tenants = overviewQuery.data?.tenants || [];
  const stats = [
    { label: 'Total Events', value: tenants.reduce((sum, item) => sum + Number(item.totalThisMonth || 0), 0) },
    { label: 'Upcoming', value: overviewQuery.data?.totalUpcomingEvents || 0 },
    { label: 'Registrations', value: overviewQuery.data?.totalRegistrations || 0 },
    { label: 'Revenue', value: formatCurrency(overviewQuery.data?.totalRevenue || 0) },
  ];

  const columns = [
    { key: 'churchName', header: 'Church' },
    { key: 'upcomingEvents', header: 'Upcoming Events' },
    { key: 'totalThisMonth', header: 'Total This Month' },
    { key: 'totalRegistrations', header: 'Registrations' },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (row) => formatCurrency(row.revenue || 0),
    },
  ];

  const chartData = tenants.map((tenant) => ({
    name: tenant.churchName,
    revenue: Number(tenant.revenue || 0),
  }));

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          title="Event Oversight"
          subtitle="Track event demand, registration activity, and event revenue across every church."
        />

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{stat.label}</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">{stat.value}</h2>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Per-Tenant Events</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Event activity by church</h2>
            </div>
            <DataTable columns={columns} data={tenants} />
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Revenue Across Tenants</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Event revenue comparison</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" hide />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </SuperAdminShell>
  );
}
