import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import BroadcastStatusBadge from '../../components/communication/BroadcastStatusBadge';
import ChannelIcons from '../../components/communication/ChannelIcons';
import DeliveryRateBar from '../../components/communication/DeliveryRateBar';
import {
  cancelBroadcast,
  deleteBroadcast,
  duplicateBroadcast,
  getBroadcasts,
} from '../../api/endpoints/communication';
import { useCommunicationAccess } from '../../hooks/useCommunicationAccess';
import { formatDate } from '../../utils/formatDate';

const tabs = ['all', 'sent', 'scheduled', 'draft', 'failed'];

export default function BroadcastsPage() {
  const queryClient = useQueryClient();
  const { canViewBroadcasts, canCreateBroadcasts, canSendBroadcasts, canDeleteCommunication } =
    useCommunicationAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search') || '';

  const broadcastsQuery = useQuery({
    queryKey: ['communication-broadcasts', page, status, search],
    queryFn: () => getBroadcasts({ page, limit: 10, status, search }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => duplicateBroadcast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-broadcasts'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => cancelBroadcast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-broadcasts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBroadcast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-broadcasts'] });
    },
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const items = broadcastsQuery.data?.items || [];

  if (!canViewBroadcasts) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Communication</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to broadcasts.
          </p>
        </Card>
      </AppShell>
    );
  }

  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <span className="text-sm text-white/70">{String(row.type || 'general').replaceAll('_', ' ')}</span>,
    },
    {
      key: 'audience',
      header: 'Audience',
      render: (row) => String(row.audience?.type || 'all_members').replaceAll('_', ' '),
    },
    {
      key: 'channels',
      header: 'Channels',
      render: (row) => <ChannelIcons channels={row.channels} />,
    },
    {
      key: 'recipients',
      header: 'Recipients',
      render: (row) => row.stats?.totalRecipients || row.audience?.estimatedReach || 0,
    },
    {
      key: 'deliveryRate',
      header: 'Delivery Rate',
      render: (row) => (
        <div className="min-w-[140px]">
          <DeliveryRateBar sent={row.stats?.sent} delivered={row.stats?.delivered} total={row.stats?.totalRecipients} />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <BroadcastStatusBadge status={row.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDate(row.sentAt || row.scheduledAt || row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link to={`/communication/broadcasts/${row._id}`}>
            <Button variant="subtle">View</Button>
          </Link>
          {row.status === 'draft' && canCreateBroadcasts ? (
            <Link to={`/communication/broadcasts/new?duplicate=${row._id}`}>
              <Button variant="ghost">Edit</Button>
            </Link>
          ) : null}
          {row.status === 'scheduled' && canSendBroadcasts ? (
            <Button variant="ghost" onClick={() => cancelMutation.mutate(row._id)}>
              Cancel
            </Button>
          ) : null}
          {canCreateBroadcasts ? (
            <Button variant="ghost" onClick={() => duplicateMutation.mutate(row._id)}>
              Duplicate
            </Button>
          ) : null}
          {row.status === 'draft' && canDeleteCommunication ? (
            <Button variant="ghost" onClick={() => deleteMutation.mutate(row._id)}>
              Delete
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Broadcasts"
          action={
            canCreateBroadcasts ? (
              <Link to="/communication/broadcasts/new">
                <Button variant="secondary">+ New Broadcast</Button>
              </Link>
            ) : null
          }
        />

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => updateParam('status', tab)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                status === tab ? 'bg-accent text-primary' : 'border border-white/10 bg-white/5 text-white/65'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <Card className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <SearchInput value={search} onChange={(event) => updateParam('search', event.target.value)} placeholder="Search by title" />
          </div>
          <DataTable columns={columns} data={items} emptyMessage="No broadcasts found." />
          <Pagination
            currentPage={broadcastsQuery.data?.page || 1}
            totalPages={broadcastsQuery.data?.totalPages || 1}
            onPageChange={(nextPage) => updateParam('page', String(nextPage))}
          />
        </Card>
      </div>
    </AppShell>
  );
}
