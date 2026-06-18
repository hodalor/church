import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import UserFormModal from '../../components/users/UserFormModal';
import { getUsers } from '../../api/endpoints/users';
import { getCurrentTenant } from '../../api/endpoints/tenants';
import { formatDate } from '../../utils/formatDate';
import { useAuth } from '../../hooks/useAuth';
import { useCapabilities } from '../../hooks/useCapabilities';

const statTones = [
  'border-cyan-400/18 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(13,19,32,0.98))]',
  'border-emerald-400/18 bg-[linear-gradient(135deg,rgba(16,185,129,0.15),rgba(13,19,32,0.98))]',
  'border-violet-400/18 bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(13,19,32,0.98))]',
  'border-amber-300/20 bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(13,19,32,0.98))]',
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();
  const { capabilities, hasCapability } = useCapabilities();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const canViewUsers = hasCapability('users.view');
  const canCreateUsers = hasCapability('users.create');
  const canModifyUsers = hasCapability('users.modify');

  const usersQuery = useQuery({
    queryKey: ['tenant-users'],
    queryFn: () => getUsers({ tenantId }),
    enabled: Boolean(tenantId) && canViewUsers,
  });
  const tenantSettingsQuery = useQuery({
    queryKey: ['tenant-user-settings'],
    queryFn: getCurrentTenant,
    enabled: canViewUsers,
  });
  const users = useMemo(() => usersQuery.data || [], [usersQuery.data]);
  const stats = useMemo(
    () => [
      { label: 'Total Users', value: users.length, helper: 'All tenant staff accounts' },
      {
        label: 'Linked Members',
        value: users.filter((user) => user.memberId).length,
        helper: 'Accounts linked to profiles',
      },
      {
        label: 'Roles',
        value: new Set(users.map((user) => user.role).filter(Boolean)).size,
        helper: 'Distinct role assignments',
      },
      {
        label: 'Permissions',
        value: capabilities.length,
        helper: 'Available within your scope',
      },
    ],
    [capabilities.length, users],
  );

  const columns = useMemo(
    () => [
      {
        key: 'username',
        header: 'User',
        render: (user) => (
          <div>
            <p className="font-semibold text-white">{user.fullName || user.username}</p>
            <p className="mt-1 text-xs text-white/45">{user.username}</p>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (user) => (
          <Badge tone="primary">{String(user.role || 'member').replaceAll('_', ' ')}</Badge>
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
        render: (user) =>
          canModifyUsers ? (
            <Button variant="ghost" onClick={() => setEditingUser(user)}>
              Edit
            </Button>
          ) : (
            <span className="text-white/35">Read only</span>
          ),
      },
    ],
    [canModifyUsers],
  );

  if (!canViewUsers) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Users</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
            Your account does not have permission to open the user management workspace.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          subtitle="Manage church staff accounts and assign only the permissions each person should use."
          action={
            canCreateUsers ? (
              <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff User
              </Button>
            ) : null
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item, index) => (
            <Card key={item.label} className={`min-h-[102px] p-3.5 ${statTones[index] || ''}`}>
              <p className="inline-flex rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/72">
                {item.label}
              </p>
              <p className="mt-3 font-serif text-[2rem] font-semibold leading-none text-white">{item.value}</p>
              <p className="mt-2 text-xs text-white/48">{item.helper}</p>
            </Card>
          ))}
        </div>

        <Card className="space-y-5 border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(8,13,24,0.98))]">
          <div className="rounded-[18px] border border-cyan-400/14 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(16,24,39,0.98))] px-4 py-3 text-sm text-white/60">
            You can assign up to {capabilities.length} permissions based on your current access scope.
          </div>

          <DataTable
            columns={columns}
            data={users}
            emptyMessage={usersQuery.isLoading ? 'Loading users...' : 'No users found for this tenant yet.'}
          />
        </Card>
      </div>

      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        tenantId={tenantId}
        allowedCapabilities={capabilities}
        availableBranches={tenantSettingsQuery.data?.content?.branches || []}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['tenant-users'] })}
        title="Add Staff User"
        description="Create a church user and grant only the menus and actions they should have."
      />
      <UserFormModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        tenantId={tenantId}
        allowedCapabilities={capabilities}
        availableBranches={tenantSettingsQuery.data?.content?.branches || []}
        user={editingUser}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['tenant-users'] })}
        title="Edit Staff User"
        description="Update profile details, branch scope, and grants for this church user."
      />
    </AppShell>
  );
}
