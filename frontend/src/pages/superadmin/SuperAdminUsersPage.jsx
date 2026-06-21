import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { getAllTenants } from '../../api/endpoints/tenants';
import { getUsers } from '../../api/endpoints/users';
import { formatDate } from '../../utils/formatDate';
import UserFormModal from '../../components/users/UserFormModal';
import useBranchOptions from '../../hooks/useBranchOptions';

export default function SuperAdminUsersPage() {
  const queryClient = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const tenantsQuery = useQuery({
    queryKey: ['superadmin-users-tenants'],
    queryFn: () => getAllTenants({ page: 1, limit: 100 }),
  });

  const usersQuery = useQuery({
    queryKey: ['superadmin-users', selectedTenantId],
    queryFn: () => getUsers({ tenantId: selectedTenantId }),
    enabled: Boolean(selectedTenantId),
  });
  const selectedTenant = useMemo(
    () => (tenantsQuery.data?.tenants || []).find((tenant) => tenant.tenantId === selectedTenantId),
    [selectedTenantId, tenantsQuery.data?.tenants],
  );
  const { branchOptions } = useBranchOptions({
    tenantId: selectedTenantId,
    enabled: Boolean(selectedTenantId),
  });
  const users = useMemo(() => usersQuery.data || [], [usersQuery.data]);
  const stats = useMemo(
    () => [
      { label: 'Users', value: users.length, helper: 'Current tenant staff accounts' },
      {
        label: 'Linked Profiles',
        value: users.filter((user) => user.memberId).length,
        helper: 'Users tied to members',
      },
      {
        label: 'Roles',
        value: new Set(users.map((user) => user.role).filter(Boolean)).size,
        helper: 'Distinct role assignments',
      },
      {
        label: 'Tenant Access',
        value: selectedTenant?.capabilities?.length || 0,
        helper: 'Enabled tenant capabilities',
      },
    ],
    [selectedTenant?.capabilities?.length, users],
  );

  const columns = useMemo(
    () => [
      {
        key: 'username',
        header: 'User',
        render: (user) => (
          <div>
            <p className="font-semibold text-slate-900">{user.fullName || user.username}</p>
            <p className="mt-1 text-xs text-slate-500">{user.username}</p>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (user) => (
          <Badge tone={user.role === 'super_admin' ? 'accent' : 'primary'}>
            {String(user.role || 'admin').replaceAll('_', ' ')}
          </Badge>
        ),
      },
      {
        key: 'memberId',
        header: 'Linked Member',
        render: (user) => user.memberId || 'Not linked',
      },
      {
        key: 'branches',
        header: 'Branches',
        render: (user) =>
          user.allBranches !== false
            ? 'All branches'
            : user.assignedBranches?.length
              ? user.assignedBranches.join(', ')
              : 'All branches',
      },
      {
        key: 'contact',
        header: 'Contact',
        render: (user) => user.email || user.phone || 'No contact',
      },
      {
        key: 'capabilities',
        header: 'Access',
        render: (user) => `${user.capabilities?.length || 0} permissions`,
      },
      {
        key: 'activity',
        header: 'Last Login',
        render: (user) => formatDate(user.lastLogin),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (user) => (
          <Button variant="ghost" onClick={() => setEditingUser(user)}>
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          title="Master Users"
          subtitle="Provision tenant staff accounts, review linked members, and manage church access from master."
          action={
            <Button
              variant="secondary"
              disabled={!selectedTenantId}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Staff User
            </Button>
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label} className="min-h-[104px] border-slate-200 bg-white p-4 text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
              <p className="mt-3 font-serif text-4xl font-semibold leading-none text-slate-900">{item.value}</p>
              <p className="mt-2 text-xs text-slate-500">{item.helper}</p>
            </Card>
          ))}
        </div>

        <Card className="space-y-5 border-slate-200 bg-white text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Church Tenant</span>
              <select
                value={selectedTenantId}
                onChange={(event) => setSelectedTenantId(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-accent"
              >
                <option value="">Select a church</option>
                {(tenantsQuery.data?.tenants || []).map((tenant) => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.churchName} ({tenant.tenantId})
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {selectedTenantId
                ? `Managing staff accounts for "${selectedTenantId}" with ${selectedTenant?.capabilities?.length || 0} tenant permissions enabled.`
                : 'Choose a church tenant to view and create staff accounts.'}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={users}
            emptyMessage={
              selectedTenantId
                ? usersQuery.isLoading
                  ? 'Loading users...'
                  : 'No users found for this tenant yet.'
                : 'Select a tenant to view users.'
            }
            tone="light"
          />
        </Card>
      </div>

      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        tenantId={selectedTenantId}
        allowedCapabilities={selectedTenant?.capabilities || []}
        availableBranches={branchOptions}
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: ['superadmin-users', selectedTenantId] })
        }
        title="Add Staff User"
        description="Create a tenant user and decide exactly which menus and actions they can access."
      />
      <UserFormModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        tenantId={selectedTenantId}
        allowedCapabilities={selectedTenant?.capabilities || []}
        availableBranches={branchOptions}
        user={editingUser}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: ['superadmin-users', selectedTenantId] })
        }
        title="Edit Staff User"
        description="Update tenant user details and add or remove grants for this church account."
      />
    </SuperAdminShell>
  );
}
