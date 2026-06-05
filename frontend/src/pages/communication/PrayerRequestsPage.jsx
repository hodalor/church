import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import PrayerRequestCard from '../../components/communication/PrayerRequestCard';
import {
  getPrayerRequests,
  prayForRequest,
  updatePrayerRequest,
} from '../../api/endpoints/communication';
import { useCommunicationAccess } from '../../hooks/useCommunicationAccess';

export default function PrayerRequestsPage() {
  const queryClient = useQueryClient();
  const { canViewPrayerRequests, canRespondPrayerRequests } = useCommunicationAccess();
  const requestsQuery = useQuery({
    queryKey: ['communication-prayer-requests'],
    queryFn: () => getPrayerRequests(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePrayerRequest(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communication-prayer-requests'] }),
  });

  const prayMutation = useMutation({
    mutationFn: (id) => prayForRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communication-prayer-requests'] }),
  });

  const stats = requestsQuery.data?.stats || {};
  const items = requestsQuery.data?.items || [];

  if (!canViewPrayerRequests) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Communication</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to prayer requests.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Prayer Requests" action={null} />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Open', stats.open || 0],
            ['In Prayer', stats.inPrayer || 0],
            ['Answered', stats.answered || 0],
            ['Total', stats.total || 0],
          ].map(([label, value]) => (
            <Card key={label} className="min-h-[96px] p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((request) => (
            <PrayerRequestCard
              key={request._id}
              request={request}
              canModify={canRespondPrayerRequests}
              canChangeStatus={canRespondPrayerRequests}
              onAssignToMe={() => updateMutation.mutate({ id: request._id, payload: { assignToMe: true } })}
              onStatusChange={(status) =>
                updateMutation.mutate({
                  id: request._id,
                  payload: {
                    status,
                    testimonial: status === 'answered' ? 'Answered with thanksgiving.' : undefined,
                  },
                })
              }
              onPray={() => prayMutation.mutate(request._id)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
