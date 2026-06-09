import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { deleteRoster, getAllRosters, publishRoster } from '../../api/endpoints/rosters';
import useVolunteersAccess from '../../hooks/useVolunteersAccess';
import { rosterTabFilters } from '../../utils/volunteers';

const buildRosterQuery = (tab) => {
  const now = new Date();

  if (tab === 'past') {
    return { to: now.toISOString() };
  }
  if (tab === 'draft') {
    return { isPublished: 'false' };
  }
  if (tab === 'published') {
    return { isPublished: 'true' };
  }
  return { from: now.toISOString() };
};

export default function RostersPage() {
  const queryClient = useQueryClient();
  const { canViewRosters, canCreateRosters, canPublishRosters, canModifyRosters } = useVolunteersAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'upcoming';

  const rostersQuery = useQuery({
    queryKey: ['volunteer-rosters-page', activeTab],
    queryFn: () => getAllRosters({ limit: 50, ...buildRosterQuery(activeTab) }),
    enabled: canViewRosters,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['volunteer-rosters-page'] });
    queryClient.invalidateQueries({ queryKey: ['volunteers-dashboard-upcoming-rosters'] });
  };

  const publishMutation = useMutation({
    mutationFn: publishRoster,
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteRoster,
    onSuccess: invalidate,
  });

  const items = rostersQuery.data?.items || [];

  if (!canViewRosters) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Rosters</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have permission to open rosters.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Rosters"
          subtitle="Manage upcoming service and event staffing rosters."
          action={
            canCreateRosters ? (
              <Link to="/volunteers/rosters/new">
                <Button variant="secondary">Create Roster</Button>
              </Link>
            ) : null
          }
        />

        <div className="flex flex-wrap gap-2">
          {rosterTabFilters.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === tab.key
                  ? 'bg-accent text-primary'
                  : 'border border-white/10 bg-white/5 text-white/65'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {items.length ? (
            items.map((roster) => {
              const rosterId = roster.rosterId || roster._id;
              const rosterDate = new Date(roster.date);
              const hasPassed = isBefore(rosterDate, startOfDay(new Date()));
              const isUpcoming = isAfter(rosterDate, new Date()) || format(rosterDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <Card key={rosterId} className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold text-white">{format(rosterDate, 'dd')}</p>
                      <p className="text-sm uppercase tracking-[0.24em] text-white/45">
                        {format(rosterDate, 'MMM yyyy')}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        roster.isPublished
                          ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                          : 'border border-slate-400/30 bg-slate-500/15 text-slate-300'
                      }`}
                    >
                      {roster.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-white">{roster.title}</h2>
                    <p className="mt-2 text-sm text-white/55">
                      {roster.serviceId ? `Service: ${roster.serviceId}` : roster.eventId ? `Event: ${roster.eventId}` : 'General roster'}
                    </p>
                    <p className="mt-1 text-sm text-white/55">
                      {(new Set((roster.assignments || []).map((item) => item.department).filter(Boolean)).size || 0)} departments •{' '}
                      {roster.assignments?.length || 0} volunteers
                    </p>
                    <p className="mt-1 text-sm text-white/45">
                      {hasPassed ? 'Attendance ready' : isUpcoming ? 'Upcoming roster' : 'Active window'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link to={`/volunteers/rosters/${rosterId}`}>
                      <Button variant="subtle">View</Button>
                    </Link>
                    {!roster.isPublished && canModifyRosters ? (
                      <Link to={`/volunteers/rosters/${rosterId}`}>
                        <Button variant="ghost">Edit</Button>
                      </Link>
                    ) : null}
                    {!roster.isPublished && canPublishRosters ? (
                      <Button
                        variant="secondary"
                        disabled={publishMutation.isPending}
                        onClick={() => publishMutation.mutate(rosterId)}
                      >
                        Publish
                      </Button>
                    ) : null}
                    {canModifyRosters ? (
                      <Button
                        variant="subtle"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm('Delete this roster?')) {
                            deleteMutation.mutate(rosterId);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </Card>
              );
            })
          ) : (
            <Card>
              <p className="text-lg font-semibold text-white">No rosters found</p>
              <p className="mt-2 text-sm text-white/55">
                Create a new duty roster to begin assigning volunteers.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
