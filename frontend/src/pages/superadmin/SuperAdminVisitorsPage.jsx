import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import { getPlatformVisitorOverview } from '../../api/endpoints/visitors';

export default function SuperAdminVisitorsPage() {
  const navigate = useNavigate();
  const overviewQuery = useQuery({
    queryKey: ['superadmin-visitors-overview'],
    queryFn: getPlatformVisitorOverview,
  });

  const overview = overviewQuery.data || {};
  const stats = [
    { label: 'Total Visitors Platform-wide', value: overview.totalVisitors || 0 },
    { label: 'Avg Conversion Rate', value: `${overview.averageConversionRate || 0}%` },
    { label: 'Pending Follow-ups', value: overview.pendingFollowUps || 0 },
    { label: 'Lost Visitors', value: overview.lostVisitors || 0 },
  ];

  const columns = [
    { key: 'churchName', header: 'Church' },
    { key: 'visitorsThisMonth', header: 'Visitors This Month' },
    { key: 'totalVisitors', header: 'Total' },
    { key: 'converted', header: 'Converted' },
    {
      key: 'conversionRate',
      header: 'Rate',
      render: (row) => `${row.conversionRate}%`,
    },
    { key: 'pendingFollowUps', header: 'Pending Follow-ups' },
    {
      key: 'workflowActive',
      header: 'Workflow Active?',
      render: (row) => (row.workflowActive ? 'Active' : 'Inactive'),
    },
  ];

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Super Admin</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Visitors</h1>
          </div>
          <Button variant="secondary" onClick={() => navigate('/superadmin/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="min-h-[110px] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{stat.label}</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{stat.value}</h2>
            </Card>
          ))}
        </div>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Conversion Rates Across Churches</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...(overview.tenants || [])].sort((left, right) => right.conversionRate - left.conversionRate)}>
                <XAxis dataKey="churchName" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="conversionRate" fill="#d1aa47" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Per-Tenant Visitor Performance</h2>
          <DataTable columns={columns} data={overview.tenants || []} emptyMessage="No visitor analytics available." />
        </Card>
      </div>
    </SuperAdminShell>
  );
}
