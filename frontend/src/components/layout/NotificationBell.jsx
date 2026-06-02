import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/endpoints/notifications';
import { formatDate } from '../../utils/formatDate';

export default function NotificationBell({ inboxPath = '/communication/inbox', queryParams }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useMemo(() => ({ limit: 10, ...queryParams }), [queryParams]);

  const notificationsQuery = useQuery({
    queryKey: ['notification-bell', params],
    queryFn: () => getNotifications(params),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const markOneMutation = useMutation({
    mutationFn: ({ id }) => markNotificationRead(id, queryParams),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-bell'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(queryParams),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-bell'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] });
    },
  });

  const payload = notificationsQuery.data || {};
  const notifications = payload.items || [];
  const unreadCount = payload.unreadCount || notifications.filter((item) => !item.isRead).length;

  return (
    <div className="relative">
      <Button variant="subtle" className="relative h-11 w-11 px-0" onClick={() => setOpen((value) => !value)}>
        <Bell className="h-4 w-4" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[360px] rounded-3xl border border-white/10 bg-[#0d1320] p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">{unreadCount} unread</p>
            </div>
            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => markAllMutation.mutate()}>
              Mark All Read
            </Button>
          </div>

          <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  key={notification._id || notification.id}
                  type="button"
                  onClick={() => {
                    markOneMutation.mutate({ id: notification._id || notification.id });
                    setOpen(false);
                    navigate(notification.link || inboxPath);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{notification.title || notification.memberName || 'Notification'}</p>
                      <p className="mt-1 text-sm text-white/60">{notification.message}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/35">{formatDate(notification.createdAt)}</p>
                    </div>
                    {!notification.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-white/55">
                No notifications right now.
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Link to={inboxPath} onClick={() => setOpen(false)} className="text-sm font-semibold text-accent">
              View All
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
