import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getUsers } from '../../api/endpoints/users';
import { enrollMember, getAllEnrollments, getAllTracks } from '../../api/endpoints/pastoral';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import DiscipleshipProgressRing from '../../components/pastoral/DiscipleshipProgressRing';
import PastoralPageLayout from '../../components/pastoral/PastoralPageLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { formatPastoralLabel, formatShortDate } from '../../utils/pastoral';

const tabs = [
  { key: 'enrollments', label: 'Enrollments' },
  { key: 'tracks', label: 'Tracks' },
];

const pastoralRoles = ['head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'];

export default function DiscipleshipPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('enrollments');
  const [filters, setFilters] = useState({
    status: '',
    trackId: '',
    assignedTo: '',
    branch: '',
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ trackId: '', assignedTo: '', notes: '' });

  const enrollmentsQuery = useQuery({
    queryKey: ['pastoral-enrollments', filters],
    queryFn: () =>
      getAllEnrollments({
        limit: 100,
        status: filters.status || undefined,
        trackId: filters.trackId || undefined,
        assignedTo: filters.assignedTo || undefined,
        branch: filters.branch || undefined,
      }),
  });

  const tracksQuery = useQuery({
    queryKey: ['pastoral-discipleship-tracks'],
    queryFn: () => getAllTracks({}),
  });

  const usersQuery = useQuery({
    queryKey: ['pastoral-disciplers'],
    queryFn: () => getUsers({ limit: 100 }),
  });

  const disciplers = useMemo(
    () => (usersQuery.data || []).filter((person) => pastoralRoles.includes(person.role)),
    [usersQuery.data],
  );

  const enrollMutation = useMutation({
    mutationFn: (payload) => enrollMember(payload),
    onSuccess: () => {
      setEnrollOpen(false);
      setSelectedMember(null);
      setEnrollForm({ trackId: '', assignedTo: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['pastoral-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['pastoral-case-discipleship'] });
    },
  });

  const enrollments = useMemo(
    () => enrollmentsQuery.data?.items || [],
    [enrollmentsQuery.data?.items],
  );
  const tracks = useMemo(() => tracksQuery.data || [], [tracksQuery.data]);

  const trackStats = useMemo(
    () =>
      tracks.map((track) => {
        const trackEnrollments = enrollments.filter((item) => item.trackId === track.trackId);
        return {
          ...track,
          enrolledCount: trackEnrollments.length,
          completedCount: trackEnrollments.filter((item) => item.status === 'completed').length,
        };
      }),
    [enrollments, tracks],
  );

  return (
    <PastoralPageLayout
      title="Discipleship"
      subtitle="Manage track enrollments, assign disciplers, and keep spiritual growth journeys moving."
      action={
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate('/pastoral/discipleship/tracks')}>
            Open Track Library
          </Button>
          <Button variant="secondary" onClick={() => setEnrollOpen(true)}>
            Enroll Member
          </Button>
        </div>
      }
    >
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key ? 'bg-accent text-primary' : 'bg-white/5 text-white/65 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {activeTab === 'enrollments' ? (
        <>
          <Card className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <option value="">All status</option>
              {['active', 'completed', 'paused', 'dropped'].map((option) => (
                <option key={option} value={option}>
                  {formatPastoralLabel(option)}
                </option>
              ))}
            </select>
            <select
              value={filters.trackId}
              onChange={(event) => setFilters((current) => ({ ...current, trackId: event.target.value }))}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <option value="">All tracks</option>
              {tracks.map((track) => (
                <option key={track.trackId} value={track.trackId}>
                  {track.name}
                </option>
              ))}
            </select>
            <select
              value={filters.assignedTo}
              onChange={(event) => setFilters((current) => ({ ...current, assignedTo: event.target.value }))}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <option value="">Assigned discipler</option>
              {disciplers.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.fullName || person.username}
                </option>
              ))}
            </select>
            <input
              value={filters.branch}
              onChange={(event) => setFilters((current) => ({ ...current, branch: event.target.value }))}
              placeholder="Branch"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((enrollment) => (
              <Card key={enrollment._id} className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{enrollment.memberName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{enrollment.memberId}</p>
                  </div>
                  <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-accent">
                    {enrollment.trackName}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <DiscipleshipProgressRing percent={enrollment.completionPercent} status={enrollment.status} />
                  <div>
                    <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/70">
                      {formatPastoralLabel(enrollment.status)}
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      {enrollment.assignedToName || 'No discipler assigned'}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                      Enrolled {formatShortDate(enrollment.enrolledAt)}
                    </p>
                  </div>
                </div>

                <Button variant="ghost" onClick={() => navigate(`/pastoral/discipleship/${enrollment._id}`)}>
                  View Progress
                </Button>
              </Card>
            ))}
            {!enrollments.length ? (
              <Card>
                <p className="text-sm text-white/55">No enrollments match the current filters.</p>
              </Card>
            ) : null}
          </div>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trackStats.map((track) => (
            <Card key={track.trackId} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{track.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{track.trackId}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  {formatPastoralLabel(track.targetGroup)}
                </span>
              </div>
              <p className="text-sm text-white/60">{track.description || 'No description added yet.'}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  {track.steps?.length || 0} steps
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                  {track.enrolledCount} enrolled
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => navigate(`/pastoral/discipleship/tracks/new?trackId=${track.trackId}`)}>
                  Edit Track
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEnrollOpen(true);
                    setEnrollForm((current) => ({ ...current, trackId: track.trackId }));
                  }}
                >
                  Enroll Members
                </Button>
              </div>
            </Card>
          ))}
          <Card className="flex flex-col items-start justify-between gap-4 border-dashed border-accent/30 bg-accent/5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Track Library</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Create new track</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/pastoral/discipleship/tracks/new')}>
              + Create New Track
            </Button>
          </Card>
        </div>
      )}

      <Modal
        isOpen={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        title="Enroll Member"
        description="Assign a member to a discipleship track and pastor."
      >
        <div className="space-y-4">
          <MemberSearchInput
            value={selectedMember || {}}
            onSelect={(member) => setSelectedMember(member)}
            onClear={() => setSelectedMember(null)}
          />
          <select
            value={enrollForm.trackId}
            onChange={(event) => setEnrollForm((current) => ({ ...current, trackId: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">Select track</option>
            {tracks.map((track) => (
              <option key={track.trackId} value={track.trackId}>
                {track.name}
              </option>
            ))}
          </select>
          <select
            value={enrollForm.assignedTo}
            onChange={(event) => setEnrollForm((current) => ({ ...current, assignedTo: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">Assign discipler</option>
            {disciplers.map((person) => (
              <option key={person._id} value={person._id}>
                {person.fullName || person.username}
              </option>
            ))}
          </select>
          <textarea
            rows={4}
            value={enrollForm.notes}
            onChange={(event) => setEnrollForm((current) => ({ ...current, notes: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setEnrollOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              enrollMutation.mutate({
                memberId: selectedMember?.memberId,
                trackId: enrollForm.trackId,
                assignedTo: enrollForm.assignedTo || undefined,
                notes: enrollForm.notes || undefined,
              })
            }
            disabled={!selectedMember?.memberId || !enrollForm.trackId || enrollMutation.isPending}
          >
            Enroll
          </Button>
        </div>
      </Modal>
    </PastoralPageLayout>
  );
}
