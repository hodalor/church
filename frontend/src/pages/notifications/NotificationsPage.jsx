import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/endpoints/notifications';
import { useCapabilities } from '../../hooks/useCapabilities';
import { formatDate } from '../../utils/formatDate';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { hasCapability } = useCapabilities();
  const canViewNotifications = hasCapability('notifications.view');

  const notificationsQuery = useQuery({
    queryKey: ['tenant-notifications'],
    queryFn: () => getNotifications(),
    enabled: canViewNotifications,
  });

  const markOneMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] });
    },
  });

  const notificationsPayload = notificationsQuery.data || {};
  const notifications = Array.isArray(notificationsPayload)
    ? notificationsPayload
    : notificationsPayload.items || [];

  if (!canViewNotifications) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Notifications</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Your account does not have permission to open the notifications workspace.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          subtitle="Review unread reminders, health alerts, and church activity notifications."
          action={
            <Button
              variant="secondary"
              disabled={!notifications.length || markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm uppercase tracking-[0.22em] text-white/55">Unread Alerts</p>
            <p className="mt-3 text-4xl font-semibold text-white">{notifications.length}</p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.22em] text-white/55">Birthdays</p>
            <p className="mt-3 text-4xl font-semibold text-white">
              {notifications.filter((item) => item.type === 'birthday').length}
            </p>
          </Card>
          <Card>
            <p className="text-sm uppercase tracking-[0.22em] text-white/55">Health Alerts</p>
            <p className="mt-3 text-4xl font-semibold text-white">
              {notifications.filter((item) => item.type === 'health_alert').length}
            </p>
          </Card>
        </div>

        <Card className="space-y-4">
          {notificationsQuery.isLoading ? (
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
                  onClick={() => markOneMutation.mutate(notification._id || notification.id)}
                >
                  Mark Read
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-white/55">
              No unread notifications right now.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
