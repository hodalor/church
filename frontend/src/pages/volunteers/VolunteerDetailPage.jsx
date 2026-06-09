import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import AvailabilityDots from '../../components/volunteers/AvailabilityDots';
import BadgeChip from '../../components/volunteers/BadgeChip';
import ReliabilityScore from '../../components/volunteers/ReliabilityScore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { addTraining, getVolunteerById, updateVolunteerStatus } from '../../api/endpoints/volunteers';
import { getAllRosters } from '../../api/endpoints/rosters';
import useVolunteersAccess from '../../hooks/useVolunteersAccess';
import { formatDate } from '../../utils/formatDate';

const tabs = ['history', 'trainings', 'upcoming'];

export default function VolunteerDetailPage() {
  const { volunteerId } = useParams();
  const queryClient = useQueryClient();
  const { canViewVolunteers, canModifyVolunteers, canManageTrainings } = useVolunteersAccess();
  const [activeTab, setActiveTab] = useState('history');
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingDraft, setTrainingDraft] = useState({
    title: '',
    completedAt: '',
    certUrl: '',
    conductedBy: '',
  });

  const volunteerQuery = useQuery({
    queryKey: ['volunteer-detail', volunteerId],
    queryFn: () => getVolunteerById(volunteerId),
    enabled: canViewVolunteers,
  });
  const rostersQuery = useQuery({
    queryKey: ['volunteer-detail-rosters', volunteerId],
    queryFn: () => getAllRosters({ limit: 100 }),
    enabled: canViewVolunteers,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['volunteer-detail', volunteerId] });
    queryClient.invalidateQueries({ queryKey: ['volunteers-list-page'] });
    queryClient.invalidateQueries({ queryKey: ['volunteers-dashboard-stats'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status) => updateVolunteerStatus(volunteerId, status),
    onSuccess: refresh,
  });
  const trainingMutation = useMutation({
    mutationFn: () => addTraining(volunteerId, trainingDraft),
    onSuccess: () => {
      setShowTrainingModal(false);
      setTrainingDraft({ title: '', completedAt: '', certUrl: '', conductedBy: '' });
      refresh();
    },
  });

  if (!canViewVolunteers) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Volunteers</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to volunteer details.
          </p>
        </Card>
      </AppShell>
    );
  }

  const volunteer = volunteerQuery.data || {};
  const rosters = rostersQuery.data?.items || [];
  const rosterHistory = rosters
    .map((roster) => ({
      ...roster,
      assignment: (roster.assignments || []).find(
        (assignment) => String(assignment.volunteerId) === String(volunteer._id || volunteer.id),
      ),
    }))
    .filter((item) => item.assignment);
  const upcomingAssignments = rosterHistory.filter((item) => new Date(item.date) >= new Date());
  const attendanceTrend = rosterHistory.map((roster) => ({
    date: new Date(roster.date).toLocaleDateString(),
    score: roster.assignment.status === 'attended' ? 100 : roster.assignment.status === 'absent' ? 0 : 50,
  }));

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-4">
              {volunteer.memberPhoto ? (
                <img src={volunteer.memberPhoto} alt={volunteer.memberName} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-2xl font-semibold text-accent">
                  {(volunteer.memberName || 'V').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-white">{volunteer.memberName}</h1>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/75">
                    {String(volunteer.status || 'active').replaceAll('_', ' ')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/45">{volunteer.memberPhone || volunteer.memberId}</p>
                {volunteer.memberId ? (
                  <Link to={`/members/${volunteer.memberId}`} className="mt-2 inline-flex text-sm text-accent">
                    Open member profile
                  </Link>
                ) : null}
              </div>
            </div>

            {canModifyVolunteers ? (
              <select
                value={volunteer.status || 'active'}
                onChange={(event) => statusMutation.mutate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
              </select>
            ) : null}

            <div>
              <p className="text-sm text-white/55">Departments</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(volunteer.departments || []).map((department) => (
                  <span key={department} className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
                    {department}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-white/55">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(volunteer.skills || []).map((skill) => (
                  <span key={skill} className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-white/55">Supervisor</p>
                <p className="mt-1 text-white">{volunteer.supervisorId || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm text-white/55">Joined</p>
                <p className="mt-1 text-white">{formatDate(volunteer.joinedAt)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-white/55">Availability</p>
              <AvailabilityDots availability={volunteer.availability} stacked />
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/55">Performance</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Reliability and service record</h2>
              </div>
              <ReliabilityScore score={volunteer.performance?.reliabilityScore || 0} size="lg" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-white/55">Attended</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{volunteer.performance?.attended || 0}</h3>
              </div>
              <div>
                <p className="text-sm text-white/55">Absent</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{volunteer.performance?.absent || 0}</h3>
              </div>
              <div>
                <p className="text-sm text-white/55">Total Assignments</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{volunteer.performance?.totalAssignments || 0}</h3>
              </div>
            </div>
            <div>
              <p className="text-sm text-white/55">Last Served</p>
              <p className="mt-1 text-white">{formatDate(volunteer.performance?.lastServedDate)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(volunteer.performance?.badges || []).map((badge) => (
                <BadgeChip key={badge} badge={badge} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    activeTab === tab ? 'bg-accent text-primary' : 'border border-white/10 bg-white/5 text-white/65'
                  }`}
                >
                  {tab === 'history' ? 'Roster History' : tab === 'trainings' ? 'Training Records' : 'Upcoming Assignments'}
                </button>
              ))}
            </div>

            {activeTab === 'history' ? (
              <div className="space-y-4">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrend}>
                      <XAxis dataKey="date" stroke="#94a3b8" hide />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#C9A84C" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {rosterHistory.map((roster) => (
                    <div key={roster.rosterId || roster._id} className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{roster.title}</p>
                          <p className="text-sm text-white/45">
                            {formatDate(roster.date)} • {roster.assignment.role} • {roster.assignment.department}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/75">
                          {roster.assignment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'trainings' ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  {canManageTrainings ? (
                    <Button variant="secondary" onClick={() => setShowTrainingModal(true)}>
                      Add Training
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-3">
                  {(volunteer.trainings || []).map((training, index) => (
                    <div key={`${training.title}-${index}`} className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-3">
                      <p className="font-semibold text-white">{training.title}</p>
                      <p className="mt-1 text-sm text-white/45">
                        {formatDate(training.completedAt)} • {training.conductedBy || 'Internal'}
                      </p>
                      {training.certUrl ? (
                        <a href={training.certUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm text-accent">
                          Download certificate
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'upcoming' ? (
              <div className="space-y-3">
                {upcomingAssignments.map((roster) => (
                  <div key={roster.rosterId || roster._id} className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-3">
                    <p className="font-semibold text-white">{roster.title}</p>
                    <p className="mt-1 text-sm text-white/45">
                      {formatDate(roster.date)} • {roster.assignment.role} • {roster.assignment.department}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        title="Add Training"
        description="Record completed training and certificate details."
      >
        <div className="space-y-4">
          <input
            value={trainingDraft.title}
            onChange={(event) => setTrainingDraft((current) => ({ ...current, title: event.target.value }))}
            placeholder="Training title"
            className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            type="date"
            value={trainingDraft.completedAt}
            onChange={(event) =>
              setTrainingDraft((current) => ({ ...current, completedAt: event.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            value={trainingDraft.conductedBy}
            onChange={(event) =>
              setTrainingDraft((current) => ({ ...current, conductedBy: event.target.value }))
            }
            placeholder="Conducted by"
            className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
          />
          <input
            value={trainingDraft.certUrl}
            onChange={(event) => setTrainingDraft((current) => ({ ...current, certUrl: event.target.value }))}
            placeholder="Certificate URL"
            className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
          />
          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={() => setShowTrainingModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => trainingMutation.mutate()}>
              Save Training
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
