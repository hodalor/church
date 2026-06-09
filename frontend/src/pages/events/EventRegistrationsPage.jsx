import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import RegistrationStatusBadge from '../../components/events/RegistrationStatusBadge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import SearchInput from '../../components/ui/SearchInput';
import {
  approveRegistration,
  checkInToEvent,
  getEventById,
  getEventRegistrations,
  getRegistrationStats,
  updateRegistration,
} from '../../api/endpoints/events';
import useEventsAccess from '../../hooks/useEventsAccess';
import useCurrency from '../../hooks/useCurrency';

const tabs = ['all', 'confirmed', 'pending', 'attended', 'cancelled'];

const toCsv = (rows) => {
  const headers = ['Name', 'Phone', 'Tier', 'Quantity', 'Amount', 'Payment', 'Approval', 'Status', 'Registered At'];
  const values = rows.map((row) => [
    row.memberName || row.externalName || '',
    row.phone || '',
    row.tierName || '',
    row.quantity || 1,
    row.totalAmount || 0,
    row.isPaid ? 'Paid' : 'Pending',
    row.approvalStatus || '',
    row.status || '',
    row.createdAt ? new Date(row.createdAt).toISOString() : '',
  ]);
  return [headers, ...values]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');
};

export default function EventRegistrationsPage() {
  const queryClient = useQueryClient();
  const { eventId } = useParams();
  const { formatCurrency } = useCurrency();
  const { canViewRegistrations, canModifyRegistrations, canApproveRegistrations, canCheckInRegistrations } =
    useEventsAccess();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const eventQuery = useQuery({
    queryKey: ['event-registrations-event', eventId],
    queryFn: () => getEventById(eventId),
    enabled: canViewRegistrations,
  });
  const registrationsQuery = useQuery({
    queryKey: ['event-registrations-list', eventId],
    queryFn: () => getEventRegistrations(eventId, { limit: 200 }),
    enabled: canViewRegistrations,
  });
  const statsQuery = useQuery({
    queryKey: ['event-registrations-stats', eventId],
    queryFn: () => getRegistrationStats(eventId),
    enabled: canViewRegistrations,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-registrations-list', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-registrations-stats', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-detail', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-detail-stats', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-detail-registrations', eventId] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ regId, approvalStatus = 'approved' }) => approveRegistration(eventId, regId, approvalStatus),
    onSuccess: invalidate,
  });
  const statusMutation = useMutation({
    mutationFn: ({ regId, payload }) => updateRegistration(eventId, regId, payload),
    onSuccess: invalidate,
  });
  const checkInMutation = useMutation({
    mutationFn: (regId) => checkInToEvent(eventId, regId, { method: 'manual' }),
    onSuccess: invalidate,
  });

  const event = eventQuery.data || {};
  const stats = statsQuery.data || {};
  const registrations = useMemo(() => registrationsQuery.data?.items || [], [registrationsQuery.data]);
  const filteredRows = useMemo(() => {
    const lowered = search.trim().toLowerCase();
    return registrations.filter((row) => {
      const statusMatches = activeTab === 'all' ? true : row.status === activeTab;
      const searchMatches = lowered
        ? [row.memberName, row.externalName, row.phone, row.email]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(lowered))
        : true;
      return statusMatches && searchMatches;
    });
  }, [activeTab, registrations, search]);
  const pendingApprovals = registrations.filter((row) => row.approvalStatus === 'pending');

  const toggleRow = (regId) => {
    setSelectedIds((current) =>
      current.includes(regId) ? current.filter((item) => item !== regId) : [...current, regId],
    );
  };

  const exportCsv = () => {
    const csv = toCsv(filteredRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title || 'event'}-registrations.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'select',
      header: '',
      render: (row) => {
        const regId = row.registrationId || row._id;
        return <input type="checkbox" checked={selectedIds.includes(regId)} onChange={() => toggleRow(regId)} />;
      },
    },
    {
      key: 'name',
      header: 'Photo + Name',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.memberName || row.externalName || 'Registrant'}</p>
          <p className="text-xs text-white/45">{row.email || row.registrationId}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone' },
    { key: 'tierName', header: 'Tier', render: (row) => row.tierName || 'General' },
    { key: 'quantity', header: 'Qty', render: (row) => row.quantity || 1 },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => formatCurrency(row.totalAmount || 0),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.isPaid ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300' : 'border border-amber-400/30 bg-amber-500/15 text-amber-300'}`}>
          {row.isPaid ? 'Paid' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'approval',
      header: 'Approval',
      render: (row) => <RegistrationStatusBadge status={row.approvalStatus} mode="approval" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <RegistrationStatusBadge status={row.status} />,
    },
    {
      key: 'registeredAt',
      header: 'Registered At',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : ''),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const regId = row.registrationId || row._id;
        return (
          <div className="flex flex-wrap gap-2">
            <Link to={`/events/${eventId}`}>
              <Button variant="subtle">View</Button>
            </Link>
            {canCheckInRegistrations ? (
              <Button variant="ghost" onClick={() => checkInMutation.mutate(regId)}>
                Check In
              </Button>
            ) : null}
            {canApproveRegistrations && row.approvalStatus === 'pending' ? (
              <Button variant="ghost" onClick={() => approveMutation.mutate({ regId })}>
                Approve
              </Button>
            ) : null}
            {canModifyRegistrations ? (
              <Button
                variant="subtle"
                onClick={() => statusMutation.mutate({ regId, payload: { status: 'cancelled' } })}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  if (!canViewRegistrations) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Registrations</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have permission to open event registrations.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Registrations</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{event.title || 'Event registrations'}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {canApproveRegistrations ? (
              <Button
                variant="ghost"
                disabled={!selectedIds.length}
                onClick={() => selectedIds.forEach((regId) => approveMutation.mutate({ regId }))}
              >
                Bulk Approve
              </Button>
            ) : null}
            {canCheckInRegistrations ? (
              <Button
                variant="subtle"
                disabled={!selectedIds.length}
                onClick={() => selectedIds.forEach((regId) => checkInMutation.mutate(regId))}
              >
                Bulk Check-In
              </Button>
            ) : null}
            <Button variant="secondary" onClick={exportCsv}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Registered', stats.registered || 0],
            ['Attended', stats.attended || 0],
            ['Pending Approval', pendingApprovals.length],
            ['Revenue', formatCurrency(stats.revenue?.collected || 0)],
          ].map(([label, value]) => (
            <Card key={label}>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </Card>
          ))}
        </div>

        {event.requiresApproval && pendingApprovals.length ? (
          <Card className="space-y-4 border-amber-400/30 bg-amber-500/10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-amber-200">Pending Approval</p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {pendingApprovals.length} registrations need approval
                </h2>
              </div>
              {canApproveRegistrations ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    pendingApprovals.forEach((row) =>
                      approveMutation.mutate({ regId: row.registrationId || row._id }),
                    )
                  }
                >
                  Approve All
                </Button>
              ) : null}
            </div>
          </Card>
        ) : null}

        <Card className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    activeTab === tab
                      ? 'bg-accent text-primary'
                      : 'border border-white/10 bg-white/5 text-white/65'
                  }`}
                >
                  {tab === 'all' ? 'All' : tab.replaceAll('_', ' ')}
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, email" />
          </div>
          <DataTable columns={columns} data={filteredRows} />
        </Card>
      </div>
    </AppShell>
  );
}
