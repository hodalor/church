import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import ConversionModal from '../../components/visitors/ConversionModal';
import FollowUpStatusIndicator from '../../components/visitors/FollowUpStatusIndicator';
import PipelineStageBadge from '../../components/visitors/PipelineStageBadge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import {
  assignVisitorsToCareLeader,
  convertVisitorToMember,
  getVisitorAssignableLeaders,
  getVisitors,
  updateVisitorStage,
} from '../../api/endpoints/visitors';
import { useCommunicationAccess } from '../../hooks/useCommunicationAccess';
import useVisitorsAccess from '../../hooks/useVisitorsAccess';
import { createCsv, VISITOR_STAGE_ORDER } from '../../utils/visitors';
import { formatDate } from '../../utils/formatDate';

export default function VisitorsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    canOpenList,
    canAssignVisitors,
    canMoveVisitors,
    canConvertVisitors,
    canOpenPipeline,
    canOpenRegister,
    canExportVisitors,
  } = useVisitorsAccess();
  const { canCreateBroadcasts } = useCommunicationAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLeaderId, setBulkLeaderId] = useState('');
  const [convertingVisitor, setConvertingVisitor] = useState(null);
  const page = Number(searchParams.get('page') || 1);
  const filters = {
    search: searchParams.get('search') || '',
    stage: searchParams.get('stage') || 'all',
    branch: searchParams.get('branch') || 'all',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
    assignedTo: searchParams.get('assignedTo') || 'all',
    converted: searchParams.get('converted') === 'true' ? true : searchParams.get('converted') === 'false' ? false : '',
  };

  const visitorsQuery = useQuery({
    queryKey: ['visitors-list', page, filters],
    queryFn: () => getVisitors({ page, limit: 10, ...filters }),
  });

  const leadersQuery = useQuery({
    queryKey: ['visitor-care-leaders'],
    queryFn: getVisitorAssignableLeaders,
    enabled: canAssignVisitors,
  });

  const refreshVisitors = () => {
    queryClient.invalidateQueries({ queryKey: ['visitors-list'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-pipeline'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-detail'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-follow-ups'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-reports'] });
  };

  const stageMutation = useMutation({
    mutationFn: ({ visitorId, stage }) => updateVisitorStage(visitorId, stage),
    onSuccess: refreshVisitors,
  });

  const assignMutation = useMutation({
    mutationFn: ({ visitorIds, leaderId }) => assignVisitorsToCareLeader(visitorIds, leaderId),
    onSuccess: () => {
      setSelectedIds([]);
      refreshVisitors();
    },
  });

  const convertMutation = useMutation({
    mutationFn: ({ visitorId, payload }) => convertVisitorToMember(visitorId, payload),
    onSuccess: () => {
      setConvertingVisitor(null);
      refreshVisitors();
    },
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === null || value === undefined || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const items = useMemo(() => visitorsQuery.data?.items || [], [visitorsQuery.data?.items]);
  const allSelectedOnPage = items.length > 0 && items.every((visitor) => selectedIds.includes(visitor.id));
  const canSelectRows = canAssignVisitors || canCreateBroadcasts;

  const exportRows = useMemo(
    () =>
      items.map((visitor) => ({
        visitorId: visitor.visitorId,
        name: visitor.fullName,
        phone: visitor.phone,
        stage: visitor.stage,
        assignedTo: visitor.assignedTo?.name || '',
        firstVisitDate: visitor.firstVisitDate,
        visits: visitor.totalVisits,
      })),
    [items],
  );

  const columns = [
    ...(canSelectRows
      ? [{
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={allSelectedOnPage}
          onChange={(event) =>
            setSelectedIds(
              event.target.checked
                ? [...new Set([...selectedIds, ...items.map((visitor) => visitor.id)])]
                : selectedIds.filter((id) => !items.some((visitor) => visitor.id === id)),
            )
          }
        />
      ),
      render: (visitor) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(visitor.id)}
          onChange={(event) =>
            setSelectedIds((current) =>
              event.target.checked ? [...current, visitor.id] : current.filter((id) => id !== visitor.id),
            )
          }
        />
      ),
    }]
      : []),
    {
      key: 'name',
      header: 'Photo + Name',
      render: (visitor) => (
        <div className="flex items-center gap-3">
          {visitor.photoUrl ? (
            <img src={visitor.photoUrl} alt={visitor.fullName} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
              {(visitor.fullName || 'V').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{visitor.fullName}</p>
            <p className="text-xs text-white/45">{visitor.branch || 'Main Branch'}</p>
          </div>
        </div>
      ),
    },
    { key: 'visitorId', header: 'Visitor ID' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'firstVisitDate',
      header: 'First Visit',
      render: (visitor) => formatDate(visitor.firstVisitDate),
    },
    {
      key: 'visits',
      header: 'Visits',
      render: (visitor) => visitor.totalVisits,
    },
    {
      key: 'stage',
      header: 'Stage Badge',
      render: (visitor) => <PipelineStageBadge stage={visitor.stage} />,
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (visitor) => visitor.assignedTo?.name || 'Unassigned',
    },
    {
      key: 'lastFollowUp',
      header: 'Last Follow-up',
      render: (visitor) => (
        <div className="space-y-1">
          <p>{visitor.lastCompletedFollowUp ? formatDate(visitor.lastCompletedFollowUp.completedAt || visitor.lastCompletedFollowUp.scheduledDate) : '—'}</p>
          <FollowUpStatusIndicator followUps={visitor.followUps} />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (visitor) => (
        <div className="flex flex-wrap gap-2">
          <Link to={`/visitors/${visitor.id}`}>
            <Button variant="subtle">View</Button>
          </Link>
          {canMoveVisitors ? (
            <select
              value={visitor.stage}
              onChange={(event) => stageMutation.mutate({ visitorId: visitor.id, stage: event.target.value })}
              className="rounded-xl border border-white/10 bg-[#101827] px-3 py-2 text-xs text-white outline-none"
            >
              {VISITOR_STAGE_ORDER.map((stage) => (
                <option key={stage} value={stage}>
                  {stage.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          ) : null}
          {canConvertVisitors ? (
            <Button variant="secondary" onClick={() => setConvertingVisitor(visitor)}>
              Convert
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (!canOpenList) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Visitors</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to the visitor list.
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
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Visitors</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Visitors List</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            {canOpenPipeline ? (
              <Link to="/visitors/pipeline">
                <Button variant="ghost">Open Pipeline</Button>
              </Link>
            ) : null}
            {canOpenRegister ? (
              <Link to="/visitors/register">
                <Button variant="secondary">+ Register Visitor</Button>
              </Link>
            ) : null}
          </div>
        </div>

        <Card className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[1.2fr_repeat(5,minmax(0,1fr))]">
            <SearchInput
              value={filters.search}
              onChange={(event) => updateParam('search', event.target.value)}
              placeholder="Search by name, phone, visitor ID"
            />
            <FilterSelect
              label="Stage"
              value={filters.stage}
              onChange={(value) => updateParam('stage', value)}
              options={[{ value: 'all', label: 'All Stages' }, ...VISITOR_STAGE_ORDER.map((stage) => ({ value: stage, label: stage.replaceAll('_', ' ') }))]}
            />
            <FilterSelect
              label="Branch"
              value={filters.branch}
              onChange={(value) => updateParam('branch', value)}
              options={[{ value: 'all', label: 'All Branches' }, ...(visitorsQuery.data?.branches || []).map((branch) => ({ value: branch, label: branch }))]}
            />
            <FilterSelect
              label="Assigned To"
              value={filters.assignedTo}
              onChange={(value) => updateParam('assignedTo', value)}
              options={[{ value: 'all', label: 'All Leaders' }, ...(leadersQuery.data || []).map((leader) => ({ value: leader.id, label: leader.name }))]}
            />
            <InputDate label="From" value={filters.fromDate} onChange={(value) => updateParam('fromDate', value)} />
            <InputDate label="To" value={filters.toDate} onChange={(value) => updateParam('toDate', value)} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={filters.converted === true}
                onChange={(event) => updateParam('converted', event.target.checked ? 'true' : '')}
              />
              Converted Only
            </label>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              {canAssignVisitors ? (
                <>
                  <select
                    value={bulkLeaderId}
                    onChange={(event) => setBulkLeaderId(event.target.value)}
                    className="rounded-xl border border-white/10 bg-[#101827] px-4 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="">Bulk assign to care leader</option>
                    {(leadersQuery.data || []).map((leader) => (
                      <option key={leader.id} value={leader.id}>
                        {leader.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    disabled={!selectedIds.length || !bulkLeaderId || assignMutation.isPending}
                    onClick={() => assignMutation.mutate({ visitorIds: selectedIds, leaderId: bulkLeaderId })}
                  >
                    Bulk Assign
                  </Button>
                </>
              ) : null}
              {canExportVisitors ? (
                <Button
                  variant="ghost"
                  disabled={!items.length}
                  onClick={() => {
                    const csv = createCsv(exportRows);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'visitors-export.csv';
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Bulk Export CSV
                </Button>
              ) : null}
              {canCreateBroadcasts ? (
                <Button
                  variant="ghost"
                  disabled={!selectedIds.length}
                  onClick={() => navigate(`/communication/broadcasts/new?audience=visitors&ids=${selectedIds.join(',')}`)}
                >
                  Bulk Send Message
                </Button>
              ) : null}
            </div>
            <p className="text-sm text-white/45">{selectedIds.length} selected</p>
          </div>

          <DataTable columns={columns} data={items} emptyMessage="No visitors found." />
          <Pagination
            currentPage={visitorsQuery.data?.page || 1}
            totalPages={visitorsQuery.data?.totalPages || 1}
            onPageChange={(nextPage) => updateParam('page', nextPage)}
          />
        </Card>
      </div>

      {canConvertVisitors ? (
        <ConversionModal
          isOpen={Boolean(convertingVisitor)}
          visitor={convertingVisitor}
          onClose={() => setConvertingVisitor(null)}
          isLoading={convertMutation.isPending}
          onConvert={(payload) =>
            convertMutation.mutate({
              visitorId: convertingVisitor.id,
              payload,
            })
          }
        />
      ) : null}
    </AppShell>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-white/75">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputDate({ label, value, onChange }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-white/75">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
      />
    </label>
  );
}
