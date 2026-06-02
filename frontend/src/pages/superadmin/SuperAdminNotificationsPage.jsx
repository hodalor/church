import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { getAllTenants } from '../../api/endpoints/tenants';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/endpoints/notifications';
import { formatDate } from '../../utils/formatDate';

export default function SuperAdminNotificationsPage() {
  const queryClient = useQueryClient();
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const tenantsQuery = useQuery({
    queryKey: ['superadmin-notification-tenants'],
    queryFn: () => getAllTenants({ page: 1, limit: 100 }),
  });

  const notificationsQuery = useQuery({
    queryKey: ['superadmin-notifications', selectedTenantId],
    queryFn: () => getNotifications({ tenantId: selectedTenantId }),
    enabled: Boolean(selectedTenantId),
  });

  const markOneMutation = useMutation({
    mutationFn: ({ id }) => markNotificationRead(id, { tenantId: selectedTenantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-notifications', selectedTenantId] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead({ tenantId: selectedTenantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-notifications', selectedTenantId] });
    },
  });

  const notificationsPayload = notificationsQuery.data || {};
  const notifications = Array.isArray(notificationsPayload)
    ? notificationsPayload
    : notificationsPayload.items || [];

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          title="Master Notifications"
          subtitle="Review unread tenant alerts and mark pastoral reminders as processed from the master console."
          action={
            <Button
              variant="secondary"
              disabled={!selectedTenantId || !notifications.length || markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          }
        />

        <Card className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/80">Church Tenant</span>
              <select
                value={selectedTenantId}
                onChange={(event) => setSelectedTenantId(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              >
                <option value="">Select a church</option>
                {(tenantsQuery.data?.tenants || []).map((tenant) => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.churchName} ({tenant.tenantId})
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/65">
              {selectedTenantId
                ? `Unread notifications for "${selectedTenantId}" assigned to the current master user.`
                : 'Choose a church tenant to load unread notifications.'}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-white/55">Unread Alerts</p>
              <p className="mt-3 text-4xl font-semibold text-white">{notifications.length}</p>
            </Card>
            <Card className="rounded-2xl bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-white/55">Birthdays</p>
              <p className="mt-3 text-4xl font-semibold text-white">
                {notifications.filter((item) => item.type === 'birthday').length}
              </p>
            </Card>
            <Card className="rounded-2xl bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-white/55">Health Alerts</p>
              <p className="mt-3 text-4xl font-semibold text-white">
                {notifications.filter((item) => item.type === 'health_alert').length}
              </p>
            </Card>
          </div>

          <div className="space-y-4">
            {!selectedTenantId ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-white/55">
                Select a church tenant to view unread notifications.
              </div>
            ) : notificationsQuery.isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-white/55">
                Loading notifications...
              </div>
            ) : notifications.length ? (
              notifications.map((notification) => (
                <div
                  key={notification._id || notification.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-accent/15 p-3 text-accent">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-semibold text-white">{notification.memberName || 'System alert'}</p>
                        <Badge tone="accent">{String(notification.type || 'system').replaceAll('_', ' ')}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-white/65">{notification.message}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/40">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    disabled={markOneMutation.isPending}
                    onClick={() => markOneMutation.mutate({ id: notification._id || notification.id })}
                  >
                    Mark Read
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-white/55">
                No unread notifications for this tenant.
              </div>
            )}
          </div>
        </Card>
      </div>
    </SuperAdminShell>
  );
}
