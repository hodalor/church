import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  activateTenant,
  getAllTenants,
  suspendTenant,
} from '../../api/endpoints/tenants';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import StatusBadge from '../../components/ui/StatusBadge';
import TenantFormModal from '../../components/tenants/TenantFormModal';
import useDebounce from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatDate';

const filters = ['all', 'active', 'suspended'];

export default function TenantsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const debouncedSearch = useDebounce(search, 400);
  const showCreateModal = searchParams.get('create') === 'tenant';

  const tenantsQuery = useQuery({
    queryKey: ['admin-tenants', page, debouncedSearch, filter],
    queryFn: () =>
      getAllTenants({
        page,
        limit: 10,
        search: debouncedSearch,
        ...(filter === 'all' ? {} : { isActive: filter === 'active' ? 'true' : 'false' }),
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ tenantId, shouldActivate }) =>
      shouldActivate ? activateTenant(tenantId) : suspendTenant(tenantId, 'Suspended by super admin'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tenants'] }),
  });

  const columns = useMemo(
    () => [
      {
        key: 'logo',
        header: 'Logo',
        render: (tenant) => (
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.churchName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-slate-500">N/A</span>
            )}
          </div>
        ),
      },
      { key: 'churchName', header: 'Church Name' },
      { key: 'tenantId', header: 'Tenant ID' },
      { key: 'country', header: 'Country' },
      { key: 'subscriptionPlan', header: 'Plan' },
      {
        key: 'capabilities',
        header: 'Access',
        render: (tenant) => `${tenant.capabilities?.length || 0} permissions`,
      },
      {
        key: 'status',
        header: 'Status',
        render: (tenant) => <StatusBadge status={tenant.isSuspended ? 'Suspended' : 'Active'} />,
      },
      {
        key: 'created',
        header: 'Created',
        render: (tenant) => formatDate(tenant.createdAt),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (tenant) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="border-slate-300 bg-white text-slate-900 hover:border-accent/40 hover:bg-slate-50 hover:text-slate-900"
              onClick={() => navigate(`/superadmin/tenants/${tenant.tenantId}`)}
            >
              View details
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toggleMutation.mutate({
                  tenantId: tenant.tenantId,
                  shouldActivate: tenant.isSuspended,
                })
              }
            >
              {tenant.isSuspended ? 'Activate' : 'Suspend'}
            </Button>
          </div>
        ),
      },
    ],
    [navigate, toggleMutation],
  );

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          title="All Churches"
          subtitle="Search, filter, and manage every church tenant in the Prynova platform."
          action={
            <Button
              variant="secondary"
              onClick={() => setSearchParams({ create: 'tenant' })}
            >
              Register Church
            </Button>
          }
        />

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[
            {
              label: 'Total Churches',
              value: tenantsQuery.data?.total || tenantsQuery.data?.summary?.total || 0,
              helper: 'All registered tenants',
            },
            {
              label: 'Active Churches',
              value: tenantsQuery.data?.summary?.active || 0,
              helper: 'Live and operating workspaces',
            },
            {
              label: 'Suspended Churches',
              value: tenantsQuery.data?.summary?.suspended || 0,
              helper: 'Paused by platform control',
            },
            {
              label: 'Plans',
              value: `${tenantsQuery.data?.summary?.plans?.small || 0}/${tenantsQuery.data?.summary?.plans?.medium || 0}/${tenantsQuery.data?.summary?.plans?.mega || 0}`,
              helper: 'small / medium / mega',
            },
            {
              label: 'Visible Rows',
              value: tenantsQuery.data?.tenants?.length || 0,
              helper: 'Current page records',
            },
          ].map((item) => (
            <Card key={item.label} className="min-h-[118px] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
              <p className="mt-4 font-serif text-3xl font-semibold leading-none text-slate-900">{item.value}</p>
              <p className="mt-3 text-xs text-slate-500">{item.helper}</p>
            </Card>
          ))}
        </div>

        <Card className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search by church name or tenant ID"
            />
            <div className="flex flex-wrap gap-2">
              {filters.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setFilter(tab);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                    filter === tab
                      ? 'bg-accent text-primary'
                      : 'border border-slate-300 bg-white text-slate-700 hover:border-accent/40 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <DataTable columns={columns} data={tenantsQuery.data?.tenants || []} tone="light" />

          <Pagination
            currentPage={tenantsQuery.data?.page || 1}
            totalPages={tenantsQuery.data?.totalPages || 1}
            onPageChange={setPage}
            tone="light"
          />
        </Card>
      </div>

      <TenantFormModal
        isOpen={showCreateModal}
        onClose={() => setSearchParams({})}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard-tenants'] });
          queryClient.invalidateQueries({ queryKey: ['shell-tenants-count'] });
        }}
      />
    </SuperAdminShell>
  );
}
