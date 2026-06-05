import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import BroadcastStatusBadge from '../../components/communication/BroadcastStatusBadge';
import ChannelIcons from '../../components/communication/ChannelIcons';
import DeliveryRateBar from '../../components/communication/DeliveryRateBar';
import { cancelBroadcast, getBroadcastById, getBroadcastLogs, resendFailedBroadcast } from '../../api/endpoints/communication';
import { useCommunicationAccess } from '../../hooks/useCommunicationAccess';
import { formatDate } from '../../utils/formatDate';

export default function BroadcastDetailPage() {
  const { broadcastId } = useParams();
  const queryClient = useQueryClient();
  const { canViewBroadcasts, canSendBroadcasts } = useCommunicationAccess();
  const detailQuery = useQuery({
    queryKey: ['communication-broadcast', broadcastId],
    queryFn: () => getBroadcastById(broadcastId),
    enabled: Boolean(broadcastId),
  });
  const logsQuery = useQuery({
    queryKey: ['communication-broadcast-logs', broadcastId],
    queryFn: () => getBroadcastLogs(broadcastId, { limit: 20 }),
    enabled: Boolean(broadcastId),
  });

  const resendMutation = useMutation({
    mutationFn: () => resendFailedBroadcast(broadcastId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-broadcast'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBroadcast(broadcastId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-broadcast'] });
    },
  });

  const broadcast = detailQuery.data;
  const logs = logsQuery.data?.items || [];

  if (!canViewBroadcasts) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Communication</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to this broadcast.
          </p>
        </Card>
      </AppShell>
    );
  }

  const logColumns = [
    { key: 'recipientName', header: 'Recipient' },
    { key: 'contact', header: 'Contact', render: (row) => row.phone || row.email || 'N/A' },
    { key: 'channel', header: 'Channel' },
    { key: 'status', header: 'Status' },
    { key: 'sentAt', header: 'Sent At', render: (row) => formatDate(row.sentAt || row.createdAt) },
    { key: 'deliveredAt', header: 'Delivered At', render: (row) => formatDate(row.deliveredAt) },
  ];

  const channelRows = (broadcast?.stats?.channelBreakdown || []).map((item) => ({
    ...item,
    rate: item.sent ? Math.round((Number(item.delivered || 0) / Number(item.sent || 1)) * 100) : 0,
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Broadcast Detail"
          action={
            <div className="flex flex-wrap gap-2">
              {broadcast?.status === 'scheduled' && canSendBroadcasts ? (
                <Button variant="ghost" onClick={() => cancelMutation.mutate()}>
                  Cancel
                </Button>
              ) : null}
              {canSendBroadcasts ? (
                <Button variant="secondary" onClick={() => resendMutation.mutate()}>
                  Resend to Failed
                </Button>
              ) : null}
            </div>
          }
        />

        {broadcast ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold text-white">{broadcast.title}</p>
                    <p className="mt-2 text-sm text-white/60">{String(broadcast.type || 'general').replaceAll('_', ' ')}</p>
                  </div>
                  <BroadcastStatusBadge status={broadcast.status} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/40">Sent / Scheduled</p>
                    <p className="mt-2 text-sm text-white/75">{formatDate(broadcast.sentAt || broadcast.scheduledAt || broadcast.createdAt)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/40">Created By</p>
                    <p className="mt-2 text-sm text-white/75">{broadcast.createdBy?.name || 'System'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Message Preview</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-white/75">{broadcast.message}</p>
                  {broadcast.attachments?.length ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {broadcast.attachments.map((file, index) => (
                        <a
                          key={file.url || index}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white/70"
                        >
                          {file.name || `Attachment ${index + 1}`}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card className="space-y-4">
                <p className="text-sm uppercase tracking-[0.22em] text-white/50">Stats</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ['Total Recipients', broadcast.stats?.totalRecipients || 0],
                    ['Sent', broadcast.stats?.sent || 0],
                    ['Delivered', broadcast.stats?.delivered || 0],
                    ['Failed', broadcast.stats?.failed || 0],
                    ['Read', broadcast.stats?.read || 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
                <DeliveryRateBar
                  sent={broadcast.stats?.sent}
                  delivered={broadcast.stats?.delivered}
                  total={broadcast.stats?.totalRecipients}
                />
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Audience</p>
                  <p className="mt-2 text-sm text-white/75">{String(broadcast.audience?.type || 'all_members').replaceAll('_', ' ')}</p>
                  <p className="mt-2 text-sm text-white/55">{broadcast.audience?.estimatedReach || 0} members</p>
                  <div className="mt-3">
                    <ChannelIcons channels={broadcast.channels} size="md" />
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
              <Card className="space-y-4">
                <p className="text-sm uppercase tracking-[0.22em] text-white/50">Channel Breakdown</p>
                <div className="space-y-3">
                  {channelRows.map((row) => (
                    <div key={row.channel} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{row.channel.replaceAll('_', ' ')}</p>
                        <p className="text-sm text-white/60">{row.rate}%</p>
                      </div>
                      <p className="mt-2 text-sm text-white/55">
                        Sent {row.sent || 0} | Delivered {row.delivered || 0} | Failed {row.failed || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.22em] text-white/50">Message Logs</p>
                  <Button variant="ghost">Export CSV</Button>
                </div>
                <DataTable columns={logColumns} data={logs} emptyMessage="No message logs found." />
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-6 text-sm text-white/60">Loading broadcast...</Card>
        )}
      </div>
    </AppShell>
  );
}
