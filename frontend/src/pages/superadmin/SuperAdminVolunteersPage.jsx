import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import { getPlatformVolunteerOverview } from '../../api/endpoints/events';

export default function SuperAdminVolunteersPage() {
  const overviewQuery = useQuery({
    queryKey: ['superadmin-volunteer-platform'],
    queryFn: getPlatformVolunteerOverview,
  });

  const tenants = overviewQuery.data?.tenants || [];
  const avgReliability =
    tenants.length > 0
      ? Math.round(tenants.reduce((sum, tenant) => sum + Number(tenant.avgReliability || 0), 0) / tenants.length)
      : 0;

  const stats = [
    { label: 'Total Volunteers', value: overviewQuery.data?.totalVolunteers || 0 },
    { label: 'Avg Reliability', value: `${avgReliability}%` },
    { label: 'Rosters This Month', value: tenants.reduce((sum, tenant) => sum + Number(tenant.onLeave || 0), 0) },
  ];

  const columns = [
    { key: 'churchName', header: 'Church' },
    { key: 'total', header: 'Volunteers' },
    {
      key: 'avgReliability',
      header: 'Avg Reliability',
      render: (row) => `${Math.round(Number(row.avgReliability || 0))}%`,
    },
    { key: 'active', header: 'Active' },
    { key: 'onLeave', header: 'On Leave' },
  ];

  const chartData = [
    { name: 'High', count: tenants.filter((item) => Number(item.avgReliability || 0) >= 80).length },
    {
      name: 'Medium',
      count: tenants.filter((item) => Number(item.avgReliability || 0) >= 60 && Number(item.avgReliability || 0) < 80)
        .length,
    },
    { name: 'Low', count: tenants.filter((item) => Number(item.avgReliability || 0) < 60).length },
  ];

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          title="Volunteer Oversight"
          subtitle="Monitor volunteer reliability, staffing strength, and branch-wide roster health across the platform."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{stat.label}</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">{stat.value}</h2>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Per-Tenant Overview</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Volunteer footprint by church</h2>
            </div>
            <DataTable columns={columns} data={tenants} />
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Reliability Distribution</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Tenant performance spread</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </SuperAdminShell>
  );
}
