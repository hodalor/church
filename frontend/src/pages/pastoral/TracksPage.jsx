import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import PastoralPageLayout from '../../components/pastoral/PastoralPageLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { getUsers } from '../../api/endpoints/users';
import { enrollMember, getAllEnrollments, getAllTracks } from '../../api/endpoints/pastoral';
import { formatPastoralLabel } from '../../utils/pastoral';

const pastoralRoles = ['head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'];

export default function TracksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [assignedTo, setAssignedTo] = useState('');

  const tracksQuery = useQuery({
    queryKey: ['pastoral-track-library'],
    queryFn: () => getAllTracks({}),
  });
  const enrollmentsQuery = useQuery({
    queryKey: ['pastoral-track-enrollments-summary'],
    queryFn: () => getAllEnrollments({ limit: 100 }),
  });
  const usersQuery = useQuery({
    queryKey: ['pastoral-track-disciplers'],
    queryFn: () => getUsers({ limit: 100 }),
  });

  const disciplers = useMemo(
    () => (usersQuery.data || []).filter((person) => pastoralRoles.includes(person.role)),
    [usersQuery.data],
  );

  const tracks = useMemo(() => {
    const enrollments = enrollmentsQuery.data?.items || [];
    return (tracksQuery.data || []).map((track) => {
      const trackEnrollments = enrollments.filter((item) => item.trackId === track.trackId);
      return {
        ...track,
        enrolledCount: trackEnrollments.length,
        completedCount: trackEnrollments.filter((item) => item.status === 'completed').length,
      };
    });
  }, [enrollmentsQuery.data?.items, tracksQuery.data]);

  const enrollMutation = useMutation({
    mutationFn: (payload) => enrollMember(payload),
    onSuccess: () => {
      setSelectedTrack(null);
      setSelectedMember(null);
      setAssignedTo('');
      queryClient.invalidateQueries({ queryKey: ['pastoral-track-enrollments-summary'] });
    },
  });

  return (
    <PastoralPageLayout
      title="Discipleship Tracks"
      subtitle="Build structured growth pathways and enroll members into the right journey."
      action={
        <Button variant="secondary" onClick={() => navigate('/pastoral/discipleship/tracks/new')}>
          + Create New Track
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tracks.map((track) => (
          <Card key={track.trackId} className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{track.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{track.trackId}</p>
              </div>
              <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-accent">
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
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 md:col-span-2">
                {track.completedCount} completed
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => navigate(`/pastoral/discipleship/tracks/new?trackId=${track.trackId}`)}>
                Edit Track
              </Button>
              <Button variant="secondary" onClick={() => setSelectedTrack(track)}>
                Enroll Members
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={Boolean(selectedTrack)}
        onClose={() => setSelectedTrack(null)}
        title="Enroll Member"
        description={selectedTrack ? `Add a member to ${selectedTrack.name}.` : ''}
      >
        <div className="space-y-4">
          <MemberSearchInput
            value={selectedMember || {}}
            onSelect={(member) => setSelectedMember(member)}
            onClear={() => setSelectedMember(null)}
          />
          <select
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">Assign discipler</option>
            {disciplers.map((person) => (
              <option key={person._id} value={person._id}>
                {person.fullName || person.username}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setSelectedTrack(null)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              enrollMutation.mutate({
                memberId: selectedMember?.memberId,
                trackId: selectedTrack?.trackId,
                assignedTo: assignedTo || undefined,
              })
            }
            disabled={!selectedMember?.memberId || !selectedTrack?.trackId || enrollMutation.isPending}
          >
            Enroll Member
          </Button>
        </div>
      </Modal>
    </PastoralPageLayout>
  );
}
