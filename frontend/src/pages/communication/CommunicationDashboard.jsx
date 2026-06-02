import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import ChannelIcons from '../../components/communication/ChannelIcons';
import BroadcastStatusBadge from '../../components/communication/BroadcastStatusBadge';
import { getCommunicationDashboard } from '../../api/endpoints/communication';
import { useCommunicationAccess } from '../../hooks/useCommunicationAccess';

export default function CommunicationDashboard() {
  const { canViewCommunication, canCreateCommunication } = useCommunicationAccess();
  const dashboardQuery = useQuery({
    queryKey: ['communication-dashboard'],
    queryFn: () => getCommunicationDashboard(),
    enabled: canViewCommunication,
  });

  if (!canViewCommunication) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Communication</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">Your account does not currently have access to the communication center.</p>
        </Card>
      </AppShell>
    );
  }

  const data = dashboardQuery.data || {};
  const stats = data.stats || {};
  const cards = [
    { label: 'Broadcasts', value: stats.totalBroadcasts || 0 },
    { label: 'Scheduled', value: stats.scheduledBroadcasts || 0 },
    { label: 'Drafts', value: stats.draftBroadcasts || 0 },
    { label: 'Active Polls', value: stats.activePolls || 0 },
    { label: 'Prayer Requests', value: stats.openPrayerRequests || 0 },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Communication"
          action={
            canCreateCommunication ? (
              <div className="flex flex-wrap gap-2">
                <Link to="/communication/broadcasts/new">
                  <Button variant="secondary">+ New Broadcast</Button>
                </Link>
                <Link to="/communication/polls/new">
                  <Button variant="subtle">+ New Poll</Button>
                </Link>
              </div>
            ) : null
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <Card key={card.label} className="min-h-[96px] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/50">Recent Broadcasts</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Latest activity</h2>
              </div>
              <Link to="/communication/broadcasts">
                <Button variant="ghost">View All</Button>
              </Link>
            </div>

            <div className="space-y-3">
              {(data.recentBroadcasts || []).map((broadcast) => (
                <Link
                  key={broadcast._id}
                  to={`/communication/broadcasts/${broadcast._id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{broadcast.title}</p>
                    <p className="mt-1 text-sm text-white/55">{broadcast.message?.slice(0, 120)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ChannelIcons channels={broadcast.channels} />
                    <BroadcastStatusBadge status={broadcast.status} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/50">Channel Setup</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Configuration status</h2>
            </div>
            <div className="space-y-3">
              {(data.channelStatuses || []).map((item) => (
                <div key={item.channel} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{item.channel.replaceAll('_', ' ')}</p>
                    <span className={item.configured ? 'text-emerald-400' : 'text-white/35'}>
                      {item.configured ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                  {!item.configured && item.hint ? <p className="mt-2 text-sm text-white/55">{item.hint}</p> : null}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
