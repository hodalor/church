import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { getInbox } from '../../api/endpoints/communication';
import { useCommunicationAccess } from '../../hooks/useCommunicationAccess';
import { markAllNotificationsRead, markNotificationRead } from '../../api/endpoints/notifications';
import { formatDate } from '../../utils/formatDate';

export default function InboxPage() {
  const queryClient = useQueryClient();
  const { canViewInbox } = useCommunicationAccess();
  const inboxQuery = useQuery({
    queryKey: ['communication-inbox'],
    queryFn: () => getInbox({ limit: 30 }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communication-inbox'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communication-inbox'] }),
  });

  const payload = inboxQuery.data || {};
  const items = payload.items || [];

  if (!canViewInbox) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Communication</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to inbox messages.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Inbox"
          action={
            <Button variant="secondary" onClick={() => markAllMutation.mutate()}>
              Mark All Read
            </Button>
          }
        />

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.22em] text-white/50">Unread Count</p>
            <p className="text-2xl font-semibold text-white">{payload.unreadCount || 0}</p>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item._id || item.id}
                type="button"
                onClick={() => markOneMutation.mutate(item._id || item.id)}
                className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{item.title || item.memberName || 'Notification'}</p>
                  <p className="mt-1 text-sm text-white/60">{item.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/35">{formatDate(item.createdAt)}</p>
                </div>
                {!item.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
