import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, Plus, Upload } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import {
  bulkImportMembers,
  exportMembers,
  getMembers,
  getMemberStats,
  getMembersByHealthStatus,
} from '../../api/endpoints/members';
import { getAllTenants } from '../../api/endpoints/tenants';
import { useAuth } from '../../hooks/useAuth';
import { useCapabilities } from '../../hooks/useCapabilities';

const membershipStatuses = [
  { label: 'All', value: '' },
  { label: 'Member', value: 'member' },
  { label: 'Worker', value: 'worker' },
  { label: 'Leader', value: 'leader' },
  { label: 'Visitor', value: 'visitor' },
];

const healthTone = {
  active: 'Active',
  drifting: 'Drifting',
  at_risk: 'At Risk',
  inactive: 'Inactive',
  new: 'New',
};

const healthBarColor = {
  active: 'bg-emerald-400',
  drifting: 'bg-amber-300',
  at_risk: 'bg-rose-400',
  inactive: 'bg-slate-400',
  new: 'bg-sky-400',
};

const csvColumns = [
  'firstName',
  'lastName',
  'otherName',
  'email',
  'phone',
  'altPhone',
  'gender',
  'membershipStatus',
  'membershipDate',
  'branch',
  'department',
  'tags',
  'address',
  'city',
  'country',
  'familyGroupId',
  'notes',
];

const escapeCsvValue = (value) => {
  const normalized = String(value ?? '');
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }
  return normalized;
};

const buildMembersCsv = (members = []) => {
  const header = csvColumns.join(',');
  const rows = members.map((member) =>
    csvColumns
      .map((column) => {
        const rawValue = Array.isArray(member[column]) ? member[column].join('; ') : member[column];
        return escapeCsvValue(rawValue);
      })
      .join(','),
  );
  return [header, ...rows].join('\n');
};

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseMembersCsv = (csvText) => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = headers.reduce((accumulator, header, index) => {
      accumulator[header] = cells[index] ?? '';
      return accumulator;
    }, {});

    return {
      ...row,
      department: row.department
        ? row.department
            .split(';')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      tags: row.tags
        ? row.tags
            .split(';')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    };
  });
};

export default function MembersListPage() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { hasCapability } = useCapabilities();
  const isSuperAdmin = role === 'super_admin';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [membershipStatus, setMembershipStatus] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthStatus, setHealthStatus] = useState('at_risk');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importError, setImportError] = useState('');

  const tenantsQuery = useQuery({
    queryKey: ['member-tenants'],
    queryFn: () => getAllTenants({ page: 1, limit: 100 }),
    enabled: isSuperAdmin,
  });

  useEffect(() => {
    if (!isSuperAdmin || selectedTenantId) {
      return;
    }

    const firstTenantId = tenantsQuery.data?.tenants?.[0]?.tenantId;
    if (firstTenantId) {
      setSelectedTenantId(firstTenantId);
    }
  }, [isSuperAdmin, selectedTenantId, tenantsQuery.data]);

  const tenantScopedParams = isSuperAdmin && selectedTenantId ? { tenantId: selectedTenantId } : {};

  const membersQuery = useQuery({
    queryKey: ['members', role, selectedTenantId, page, search, membershipStatus],
    queryFn: () =>
      getMembers({
        page,
        limit: 12,
        ...tenantScopedParams,
        ...(search ? { search } : {}),
        ...(membershipStatus ? { membershipStatus } : {}),
      }),
    enabled: !isSuperAdmin || Boolean(selectedTenantId),
  });

  const statsQuery = useQuery({
    queryKey: ['member-stats', role, selectedTenantId],
    queryFn: () => getMemberStats(tenantScopedParams),
    enabled: !isSuperAdmin || Boolean(selectedTenantId),
  });

  const rows = membersQuery.data?.members || [];
  const summary = membersQuery.data?.stats || {};
  const stats = statsQuery.data || {};
  const healthQuery = useQuery({
    queryKey: ['members-health-status', role, selectedTenantId, healthStatus],
    queryFn: () =>
      getMembersByHealthStatus({
        ...tenantScopedParams,
        status: healthStatus,
        page: 1,
        limit: 12,
      }),
    enabled: showHealthModal && (!isSuperAdmin || Boolean(selectedTenantId)),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportMembers(tenantScopedParams),
  });

  const importMutation = useMutation({
    mutationFn: (payload) => bulkImportMembers(payload, tenantScopedParams),
    onSuccess: () => {
      setShowImportModal(false);
      setImportText('');
      setImportError('');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member-stats'] });
    },
  });

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Member',
        render: (member) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#162033] text-xs font-semibold text-accent">
              {`${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.trim() || 'M'}
            </div>
            <div>
              <p className="font-semibold text-white">
                {[member.firstName, member.lastName].filter(Boolean).join(' ')}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {(Array.isArray(member.department) ? member.department[0] : member.department) || member.memberId}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: 'membershipStatus',
        header: 'Status',
        render: (member) => (
          <div className="space-y-1">
            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold capitalize text-white/80">
              {String(member.membershipStatus || 'member').replace('_', ' ')}
            </span>
            <p className="text-xs text-white/40">{member.isActive ? 'Active account' : 'Inactive account'}</p>
          </div>
        ),
      },
      {
        key: 'branch',
        header: 'Branch',
        render: (member) => member.branch || 'Main branch',
      },
      {
        key: 'department',
        header: 'Department',
        render: (member) =>
          Array.isArray(member.department) && member.department.length
            ? member.department.join(', ')
            : 'Unassigned',
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (member) => member.phone || 'No phone',
      },
      {
        key: 'health',
        header: 'Health',
        render: (member) => (
          <div className="w-28">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${healthBarColor[member.healthScore?.status] || 'bg-sky-400'}`}
                style={{ width: `${Math.min(Number(member.healthScore?.overall ?? 0), 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-white/50">{healthTone[member.healthScore?.status] || 'New'}</span>
              <span className="font-semibold text-white">{member.healthScore?.overall ?? 0}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (member) => (
          <Link
            to={`${isSuperAdmin ? '/superadmin' : ''}/members/${member.memberId}`}
            className="font-semibold text-accent"
          >
            View
          </Link>
        ),
      },
    ],
    [isSuperAdmin],
  );

  const Shell = isSuperAdmin ? SuperAdminShell : AppShell;
  const createPath = isSuperAdmin ? '/superadmin/members/new' : '/members/new';
  const canCreateMembers = isSuperAdmin || hasCapability('members.create');
  const canViewMembers = isSuperAdmin || hasCapability('members.view');
  const canModifyMembers = isSuperAdmin || hasCapability('members.modify');

  if (!canViewMembers) {
    return (
      <Shell>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Members</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Your account does not have permission to open the member directory.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <PageHeader
          title="Member Directory"
          subtitle={
            isSuperAdmin
              ? 'Select a tenant church and manage its members from the master console.'
              : 'Search, review, and manage members from the central church workspace.'
          }
          action={
            <div className="flex flex-wrap gap-3">
              <Button variant="subtle" onClick={() => setShowHealthModal(true)}>
                Member Health
              </Button>
              <Button
                variant="subtle"
                disabled={exportMutation.isPending || (isSuperAdmin && !selectedTenantId)}
                onClick={async () => {
                  const members = await exportMutation.mutateAsync();
                  const blob = new Blob([buildMembersCsv(members)], {
                    type: 'text/csv;charset=utf-8;',
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${selectedTenantId || 'members'}-export.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              {canModifyMembers ? (
                <Button variant="subtle" onClick={() => setShowImportModal(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Import
                </Button>
              ) : null}
              {canCreateMembers ? (
                <Link to={createPath}>
                  <Button variant="secondary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </Link>
              ) : null}
            </div>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total Members',
              value: stats.total ?? rows.length,
              helper: 'Across the selected workspace',
            },
            {
              label: 'Active Members',
              value: stats.active ?? summary.active ?? 0,
              helper: 'Healthy ongoing participation',
            },
            {
              label: 'Inactive Members',
              value: stats.inactive ?? summary.inactive ?? 0,
              helper: 'Requires re-engagement follow-up',
            },
            {
              label: 'New Members',
              value: summary.new ?? stats.byHealthStatus?.new ?? 0,
              helper: 'Recently added profiles',
            },
          ].map((item) => (
            <Card key={item.label} className="min-h-[110px] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{item.label}</p>
              <p className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{item.value}</p>
              <p className="mt-2 text-xs text-white/40">{item.helper}</p>
            </Card>
          ))}
        </div>

        <Card className="space-y-5">
          {isSuperAdmin ? (
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Church Tenant</span>
                <select
                  value={selectedTenantId}
                  onChange={(event) => {
                    setSelectedTenantId(event.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent"
                >
                  <option value="">Select a church</option>
                  {(tenantsQuery.data?.tenants || []).map((tenant) => (
                    <option key={tenant.tenantId} value={tenant.tenantId}>
                      {tenant.churchName} ({tenant.tenantId})
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white/55">
                {selectedTenantId
                  ? `Showing members for tenant "${selectedTenantId}".`
                  : 'Choose a tenant to load member records.'}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="w-full max-w-xl">
              <SearchInput
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Search by member name, phone, email, or member ID"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {membershipStatuses.map((option) => (
                <button
                  key={option.value || 'all'}
                  type="button"
                  onClick={() => {
                    setMembershipStatus(option.value);
                    setPage(1);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    membershipStatus === option.value
                      ? 'bg-accent text-primary'
                      : 'border border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            emptyMessage={
              isSuperAdmin && !selectedTenantId
                ? 'Select a tenant to view members.'
                : membersQuery.isLoading
                  ? 'Loading members...'
                  : 'No members found yet.'
            }
          />

          <Pagination
            currentPage={membersQuery.data?.page || page}
            totalPages={membersQuery.data?.totalPages || 1}
            onPageChange={setPage}
            tone="light"
          />
        </Card>
      </div>

      <Modal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        title="Member Health Scores"
        description="Review members by current engagement risk and follow up quickly."
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['active', 'drifting', 'at_risk', 'inactive', 'new'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setHealthStatus(status)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  healthStatus === status
                    ? 'bg-accent text-primary'
                    : 'border border-white/10 bg-white/5 text-white/70'
                }`}
              >
                {status.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {(healthQuery.data?.members || []).map((member) => (
              <Link
                key={member.memberId}
                to={`${isSuperAdmin ? '/superadmin' : ''}/members/${member.memberId}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition hover:bg-white/10"
                onClick={() => setShowHealthModal(false)}
              >
                <div>
                  <p className="font-semibold text-white">{member.fullName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">
                    {member.memberId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{member.healthScore?.overall ?? 0}/100</p>
                  <p className="mt-1 text-xs text-white/45">
                    {member.healthScore?.status?.replaceAll('_', ' ') || 'new'}
                  </p>
                </div>
              </Link>
            ))}
            {!healthQuery.data?.members?.length ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                {healthQuery.isLoading ? 'Loading health scores...' : 'No members found for this health status.'}
              </p>
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportError('');
        }}
        title="Bulk Import Members"
        description="Upload or paste CSV rows to import multiple member records at once."
        size="lg"
      >
        <div className="space-y-4">
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
            Header format: <code>{csvColumns.join(',')}</code>
          </p>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">CSV File</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                const text = await file.text();
                setImportText(text);
                setImportFileName(file.name);
                setImportError('');
                event.target.value = '';
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            />
          </label>
          {importFileName ? (
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Loaded file: {importFileName}
            </p>
          ) : null}
          <textarea
            rows={12}
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            placeholder="Paste CSV here"
          />
          {importError ? <p className="text-sm text-red-400">{importError}</p> : null}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              disabled={importMutation.isPending || (isSuperAdmin && !selectedTenantId)}
              onClick={() => {
                try {
                  const parsed = parseMembersCsv(importText);
                  if (!parsed.length) {
                    setImportError('No valid CSV rows found. Add a header row and at least one member row.');
                    return;
                  }
                  setImportError('');
                  importMutation.mutate(parsed);
                } catch {
                  setImportError('Invalid CSV format. Please fix the import file and try again.');
                }
              }}
            >
              {importMutation.isPending ? 'Importing...' : 'Import Members'}
            </Button>
          </div>
        </div>
      </Modal>
    </Shell>
  );
}
