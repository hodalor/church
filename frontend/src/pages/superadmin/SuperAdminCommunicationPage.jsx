import { useQuery } from '@tanstack/react-query';
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import ChannelIcons from '../../components/communication/ChannelIcons';
import BroadcastStatusBadge from '../../components/communication/BroadcastStatusBadge';
import DeliveryRateBar from '../../components/communication/DeliveryRateBar';
import { getPlatformCommunicationStats } from '../../api/endpoints/communication';
import { formatDate } from '../../utils/formatDate';

const pieColors = ['#C9A84C', '#20304f', '#4b7bec', '#16a34a', '#8b5cf6'];

export default function SuperAdminCommunicationPage() {
  const statsQuery = useQuery({
    queryKey: ['superadmin-communication'],
    queryFn: () => getPlatformCommunicationStats(),
  });

  const data = statsQuery.data || {};
  const cards = [
    ['Total Messages Sent', data.totalMessagesSent || 0],
    ['Total Broadcasts', data.totalBroadcasts || 0],
    ['Active Polls', data.activePolls || 0],
    ['Open Prayer Requests', data.openPrayerRequests || 0],
  ];

  const tenantColumns = [
    { key: 'churchName', header: 'Church Name' },
    { key: 'tenantId', header: 'Tenant ID' },
    { key: 'broadcastsSent', header: 'Broadcasts Sent' },
    { key: 'messagesSent', header: 'Messages Sent' },
    {
      key: 'deliveryRate',
      header: 'Delivery Rate',
      render: (row) => <span className="text-sm text-white/70">{row.deliveryRate}%</span>,
    },
    {
      key: 'lastBroadcastDate',
      header: 'Last Broadcast',
      render: (row) => formatDate(row.lastBroadcastDate),
    },
  ];

  const recentColumns = [
    { key: 'title', header: 'Title' },
    {
      key: 'tenantId',
      header: 'Tenant',
    },
    {
      key: 'channels',
      header: 'Channels',
      render: (row) => <ChannelIcons channels={row.channels} />,
    },
    {
      key: 'recipients',
      header: 'Recipients',
      render: (row) => row.stats?.totalRecipients || 0,
    },
    {
      key: 'deliveryRate',
      header: 'Delivery',
      render: (row) => <DeliveryRateBar sent={row.stats?.sent} delivered={row.stats?.delivered} total={row.stats?.totalRecipients} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <BroadcastStatusBadge status={row.status} />,
    },
  ];

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader title="Communication" />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value]) => (
            <Card key={label} className="min-h-[96px] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="space-y-4">
            <p className="text-sm uppercase tracking-[0.22em] text-white/50">Messages Sent Per Day</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.messagesByDay || []}>
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#C9A84C" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <p className="text-sm uppercase tracking-[0.22em] text-white/50">Messages By Channel</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.messagesByChannel || []} dataKey="count" nameKey="channel" outerRadius={100}>
                    {(data.messagesByChannel || []).map((item, index) => (
                      <Cell key={item.channel} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="space-y-4">
          <p className="text-sm uppercase tracking-[0.22em] text-white/50">Per-Tenant Communication</p>
          <DataTable columns={tenantColumns} data={data.tenantBreakdown || []} emptyMessage="No tenant communication data found." />
        </Card>

        <Card className="space-y-4">
          <p className="text-sm uppercase tracking-[0.22em] text-white/50">Recent Broadcasts</p>
          <DataTable columns={recentColumns} data={data.recentBroadcasts || []} emptyMessage="No recent broadcasts found." />
        </Card>
      </div>
    </SuperAdminShell>
  );
}
