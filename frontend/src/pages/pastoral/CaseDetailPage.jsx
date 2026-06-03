import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { getUsers } from '../../api/endpoints/users';
import {
  addInteraction,
  addMilestone,
  addPrayerRequest,
  assignCase,
  enrollMember,
  getAllAppointments,
  getAllTracks,
  getCaseById,
  getMemberDiscipleship,
  markPrayerAnswered,
  updateCase,
  updateCaseStatus,
  updateInteraction,
} from '../../api/endpoints/pastoral';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import CaseStatusBadge from '../../components/pastoral/CaseStatusBadge';
import InteractionTimelineItem from '../../components/pastoral/InteractionTimelineItem';
import MilestoneCard from '../../components/pastoral/MilestoneCard';
import PastoralPageLayout from '../../components/pastoral/PastoralPageLayout';
import DiscipleshipProgressRing from '../../components/pastoral/DiscipleshipProgressRing';
import AppointmentStatusBadge from '../../components/pastoral/AppointmentStatusBadge';
import { usePastoralAccess } from '../../hooks/usePastoralAccess';
import {
  CASE_STATUS_OPTIONS,
  INTERACTION_TYPES,
  WELFARE_SUPPORT_OPTIONS,
  formatPastoralLabel,
  formatShortDate,
  formatShortDateTime,
  getDaysOpen,
} from '../../utils/pastoral';

const tabs = [
  { key: 'interactions', label: 'Interactions Timeline' },
  { key: 'prayer', label: 'Prayer Requests' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'discipleship', label: 'Discipleship' },
  { key: 'welfare', label: 'Welfare Support' },
];

const pastoralRoles = ['head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'];

const interactionDefaults = {
  type: 'call',
  date: new Date().toISOString().slice(0, 10),
  duration: 30,
  location: '',
  summary: '',
  confidentialNotes: '',
  nextSteps: '',
  nextFollowUpDate: '',
  isConfidential: false,
};

const milestoneDefaults = {
  title: '',
  type: 'other',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function CaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    canManagePastoral,
    canViewConfidential,
    isSuperAdmin,
  } = usePastoralAccess();
  const [activeTab, setActiveTab] = useState('interactions');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [interactionModal, setInteractionModal] = useState({ open: false, interaction: null });
  const [interactionForm, setInteractionForm] = useState(interactionDefaults);
  const [prayerOpen, setPrayerOpen] = useState(false);
  const [newPrayerRequest, setNewPrayerRequest] = useState('');
  const [answeredPrayer, setAnsweredPrayer] = useState(null);
  const [testimonial, setTestimonial] = useState('');
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState(milestoneDefaults);
  const [discipleshipOpen, setDiscipleshipOpen] = useState(false);
  const [discipleshipForm, setDiscipleshipForm] = useState({ trackId: '', assignedTo: '', notes: '' });
  const [welfareOpen, setWelfareOpen] = useState(false);
  const [welfareForm, setWelfareForm] = useState({
    isReceivingSupport: false,
    supportType: [],
    totalSupport: '',
    notes: '',
  });

  const caseQuery = useQuery({
    queryKey: ['pastoral-case-detail', caseId],
    queryFn: () => getCaseById(caseId),
  });

  const usersQuery = useQuery({
    queryKey: ['pastoral-assignees-case-detail'],
    queryFn: () => getUsers({ limit: 100 }),
  });

  const tracksQuery = useQuery({
    queryKey: ['pastoral-tracks-selector'],
    queryFn: () => getAllTracks({}),
  });

  const appointmentsQuery = useQuery({
    queryKey: ['pastoral-case-appointments', caseQuery.data?.memberId],
    queryFn: () => getAllAppointments({ memberId: caseQuery.data?.memberId, limit: 100 }),
    enabled: Boolean(caseQuery.data?.memberId),
  });

  const discipleshipQuery = useQuery({
    queryKey: ['pastoral-case-discipleship', caseQuery.data?.memberId],
    queryFn: () => getMemberDiscipleship(caseQuery.data?.memberId),
    enabled: Boolean(caseQuery.data?.memberId),
  });

  const refreshCase = () => {
    queryClient.invalidateQueries({ queryKey: ['pastoral-case-detail', caseId] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-cases'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-care-stats'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-case-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-case-discipleship'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status) => updateCaseStatus(caseId, status),
    onSuccess: refreshCase,
  });

  const reassignMutation = useMutation({
    mutationFn: (assignee) => assignCase(caseId, assignee),
    onSuccess: () => {
      setReassignOpen(false);
      refreshCase();
    },
  });

  const interactionMutation = useMutation({
    mutationFn: (payload) =>
      interactionModal.interaction
        ? updateInteraction(caseId, interactionModal.interaction.interactionId, payload)
        : addInteraction(caseId, payload),
    onSuccess: () => {
      setInteractionModal({ open: false, interaction: null });
      setInteractionForm(interactionDefaults);
      refreshCase();
    },
  });

  const prayerMutation = useMutation({
    mutationFn: (payload) => addPrayerRequest(caseId, payload),
    onSuccess: () => {
      setPrayerOpen(false);
      setNewPrayerRequest('');
      refreshCase();
    },
  });

  const answeredMutation = useMutation({
    mutationFn: ({ prayerId, payload }) => markPrayerAnswered(caseId, prayerId, payload),
    onSuccess: () => {
      setAnsweredPrayer(null);
      setTestimonial('');
      refreshCase();
    },
  });

  const milestoneMutation = useMutation({
    mutationFn: (payload) => addMilestone(caseId, payload),
    onSuccess: () => {
      setMilestoneOpen(false);
      setMilestoneForm(milestoneDefaults);
      refreshCase();
    },
  });

  const discipleshipMutation = useMutation({
    mutationFn: (payload) => enrollMember(payload),
    onSuccess: () => {
      setDiscipleshipOpen(false);
      setDiscipleshipForm({ trackId: '', assignedTo: '', notes: '' });
      refreshCase();
    },
  });

  const welfareMutation = useMutation({
    mutationFn: (payload) => updateCase(caseId, payload),
    onSuccess: () => {
      setWelfareOpen(false);
      refreshCase();
    },
  });

  const careCase = caseQuery.data;
  const assignees = useMemo(
    () => (usersQuery.data || []).filter((person) => pastoralRoles.includes(person.role)),
    [usersQuery.data],
  );
  const linkedAppointments = useMemo(
    () => (appointmentsQuery.data?.items || []).filter((appointment) => appointment.caseId === careCase?.caseId),
    [appointmentsQuery.data?.items, careCase?.caseId],
  );
  const memberProfilePath = `${isSuperAdmin ? '/superadmin' : ''}/members/${careCase?.memberId || ''}`;

  const openInteractionModal = (interaction = null) => {
    setInteractionModal({ open: true, interaction });
    if (interaction) {
      setInteractionForm({
        type: interaction.type || 'call',
        date: interaction.date ? new Date(interaction.date).toISOString().slice(0, 10) : interactionDefaults.date,
        duration: interaction.duration || 30,
        location: interaction.location || '',
        summary: interaction.summary || '',
        confidentialNotes: interaction.confidentialNotes || '',
        nextSteps: interaction.nextSteps || '',
        nextFollowUpDate: interaction.nextFollowUpDate
          ? new Date(interaction.nextFollowUpDate).toISOString().slice(0, 10)
          : '',
        isConfidential: interaction.isConfidential === true,
      });
      return;
    }

    setInteractionForm({
      ...interactionDefaults,
      location: linkedAppointments[0]?.location || '',
    });
  };

  const openWelfareModal = () => {
    setWelfareForm({
      isReceivingSupport: careCase?.welfareSupport?.isReceivingSupport === true,
      supportType: careCase?.welfareSupport?.supportType || [],
      totalSupport: careCase?.welfareSupport?.totalSupport || '',
      notes: careCase?.welfareSupport?.notes || '',
    });
    setWelfareOpen(true);
  };

  return (
    <PastoralPageLayout
      title={careCase ? `${careCase.memberName} - ${careCase.caseId}` : 'Case Detail'}
      subtitle="Review the full care journey, protect sensitive interaction notes, and coordinate next steps."
      action={
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate('/pastoral/cases')}>
            Back to Cases
          </Button>
          <Button variant="secondary" onClick={() => openInteractionModal()}>
            Add Interaction
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/15 text-2xl font-semibold text-accent">
                {(careCase?.memberName || 'M').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <Link to={memberProfilePath} className="text-2xl font-semibold text-white hover:text-accent">
                  {careCase?.memberName || 'Loading member'}
                </Link>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">{careCase?.caseId}</p>
                <p className="mt-1 text-sm text-white/60">{formatPastoralLabel(careCase?.type)}</p>
              </div>
            </div>

            <CaseStatusBadge status={careCase?.status} urgency={careCase?.urgency} />

            <div className="space-y-3">
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.18em] text-white/45">Status</span>
                <select
                  value={careCase?.status || 'open'}
                  onChange={(event) => statusMutation.mutate(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                >
                  {CASE_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {formatPastoralLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Assigned To</p>
                <p className="mt-2 font-semibold text-white">{careCase?.assignedToName || 'Unassigned'}</p>
                {canManagePastoral ? (
                  <Button variant="ghost" className="mt-3 px-3 py-2 text-xs" onClick={() => setReassignOpen(true)}>
                    Reassign
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Days Open</p>
                  <p className="mt-2 font-semibold text-white">{getDaysOpen(careCase?.createdAt)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Created</p>
                  <p className="mt-2 font-semibold text-white">{formatShortDate(careCase?.createdAt)}</p>
                  <p className="mt-1 text-sm text-white/45">{careCase?.createdBy || 'System'}</p>
                </div>
              </div>

              {careCase?.isConfidential ? (
                <div className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-4">
                  <p className="flex items-center gap-2 font-semibold text-white">
                    <Lock className="h-4 w-4 text-accent" />
                    Confidential Case
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Quick Actions</p>
              <div className="grid gap-3">
                <Button variant="secondary" onClick={() => openInteractionModal()}>
                  Add Interaction
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    navigate(
                      `/pastoral/appointments/new?memberId=${careCase?.memberId || ''}&memberName=${encodeURIComponent(
                        careCase?.memberName || '',
                      )}&caseId=${careCase?.caseId || ''}`,
                    )
                  }
                >
                  Schedule Appointment
                </Button>
                <Button variant="ghost" onClick={() => setMilestoneOpen(true)}>
                  Add Milestone
                </Button>
                <Button variant="ghost" onClick={() => setDiscipleshipOpen(true)}>
                  Enroll in Discipleship
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.key
                      ? 'bg-accent text-primary'
                      : 'bg-white/5 text-white/65 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>

          {activeTab === 'interactions' ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Interactions Timeline</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Follow-up history</h2>
                </div>
                <Button variant="secondary" onClick={() => openInteractionModal()}>
                  Add Interaction
                </Button>
              </div>
              <div className="space-y-4">
                {[...(careCase?.interactions || [])]
                  .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
                  .map((interaction) => (
                    <InteractionTimelineItem
                      key={interaction.interactionId}
                      interaction={interaction}
                      hasConfidentialAccess={canViewConfidential}
                      onEdit={canManagePastoral ? () => openInteractionModal(interaction) : undefined}
                    />
                  ))}
                {!careCase?.interactions?.length ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
                    No interactions recorded for this case yet.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          {activeTab === 'prayer' ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Prayer Requests</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Faith journey and testimonies</h2>
                </div>
                <Button variant="secondary" onClick={() => setPrayerOpen(true)}>
                  Add Prayer Request
                </Button>
              </div>
              <div className="space-y-3">
                {(careCase?.prayerRequests || []).map((prayer) => (
                  <div
                    key={prayer._id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-white">{prayer.request}</p>
                      <span className={prayer.isAnswered ? 'text-emerald-300' : 'text-accent'}>
                        {prayer.isAnswered ? 'Answered' : 'Awaiting testimony'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                      {formatShortDate(prayer.date)}
                    </p>
                    {prayer.isAnswered ? (
                      <p className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        {prayer.testimonial || 'Prayer answered.'}
                      </p>
                    ) : (
                      <Button
                        variant="ghost"
                        className="mt-3 px-3 py-2 text-xs"
                        onClick={() => setAnsweredPrayer(prayer)}
                      >
                        Mark as Answered
                      </Button>
                    )}
                  </div>
                ))}
                {!careCase?.prayerRequests?.length ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
                    No prayer requests added for this case yet.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          {activeTab === 'milestones' ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Milestones</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Spiritual progress</h2>
                </div>
                <Button variant="secondary" onClick={() => setMilestoneOpen(true)}>
                  Add Milestone
                </Button>
              </div>
              <div className="space-y-4">
                {[...(careCase?.milestones || [])]
                  .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
                  .map((milestone) => (
                    <MilestoneCard key={`${milestone.title}-${milestone.date}`} milestone={milestone} />
                  ))}
                {!careCase?.milestones?.length ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
                    No milestones recorded yet.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          {activeTab === 'appointments' ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Appointments</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Scheduled pastoral touchpoints</h2>
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate(
                      `/pastoral/appointments/new?memberId=${careCase?.memberId || ''}&memberName=${encodeURIComponent(
                        careCase?.memberName || '',
                      )}&caseId=${careCase?.caseId || ''}`,
                    )
                  }
                >
                  Schedule Appointment
                </Button>
              </div>
              <div className="space-y-3">
                {linkedAppointments.map((appointment) => (
                  <div
                    key={appointment._id || appointment.appointmentId}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{appointment.title}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {formatPastoralLabel(appointment.type)} - {formatShortDateTime(appointment.scheduledAt)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                          {appointment.location || 'Location not set'}
                        </p>
                      </div>
                      <AppointmentStatusBadge status={appointment.status} />
                    </div>
                  </div>
                ))}
                {!linkedAppointments.length ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
                    No appointments are linked to this care case yet.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          {activeTab === 'discipleship' ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Discipleship</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Track growth journey</h2>
                </div>
                <Button variant="secondary" onClick={() => setDiscipleshipOpen(true)}>
                  Enroll in Track
                </Button>
              </div>
              <div className="space-y-3">
                {(discipleshipQuery.data || []).map((enrollment) => (
                  <div
                    key={enrollment._id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <DiscipleshipProgressRing percent={enrollment.completionPercent} status={enrollment.status} />
                      <div>
                        <p className="font-semibold text-white">{enrollment.trackName}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {formatPastoralLabel(enrollment.status)} - {enrollment.assignedToName || 'Unassigned discipler'}
                        </p>
                      </div>
                    </div>
                    <Link to={`/pastoral/discipleship/${enrollment._id}`}>
                      <Button variant="ghost">View Progress</Button>
                    </Link>
                  </div>
                ))}
                {!discipleshipQuery.data?.length ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
                    This member has no discipleship enrollments yet.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          {activeTab === 'welfare' ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">Welfare Support</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Practical help on record</h2>
                </div>
                <Button variant="secondary" onClick={openWelfareModal}>
                  Update Welfare Support
                </Button>
              </div>
              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-sm text-white/70">
                  {careCase?.welfareSupport?.isReceivingSupport
                    ? 'This member is currently receiving support.'
                    : 'No active welfare support is recorded.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(careCase?.welfareSupport?.supportType || []).map((type) => (
                    <span key={type} className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-accent">
                      {formatPastoralLabel(type)}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-white/60">
                  Total support value: {careCase?.welfareSupport?.totalSupport || 0}
                </p>
                <p className="text-sm text-white/60">{careCase?.welfareSupport?.notes || 'No welfare notes added.'}</p>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <Modal
        isOpen={reassignOpen}
        onClose={() => setReassignOpen(false)}
        title="Reassign Care Case"
        description="Transfer this case to another pastoral leader."
      >
        <div className="space-y-4">
          <select
            defaultValue={careCase?.assignedTo || ''}
            onChange={(event) => reassignMutation.mutate(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">Select pastor or care leader</option>
            {assignees.map((person) => (
              <option key={person._id} value={person._id}>
                {person.fullName || person.username} - {formatPastoralLabel(person.role)}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <Modal
        isOpen={interactionModal.open}
        onClose={() => {
          setInteractionModal({ open: false, interaction: null });
          setInteractionForm(interactionDefaults);
        }}
        title={interactionModal.interaction ? 'Edit Interaction' : 'Add Interaction'}
        description="Record the pastoral touchpoint and next follow-up steps."
        size="lg"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={interactionForm.type}
            onChange={(event) => setInteractionForm((current) => ({ ...current, type: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            {INTERACTION_TYPES.map((option) => (
              <option key={option} value={option}>
                {formatPastoralLabel(option)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={interactionForm.date}
            onChange={(event) => setInteractionForm((current) => ({ ...current, date: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
          <input
            type="number"
            min="1"
            value={interactionForm.duration}
            onChange={(event) => setInteractionForm((current) => ({ ...current, duration: event.target.value }))}
            placeholder="Duration in minutes"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
          <input
            value={interactionForm.location}
            onChange={(event) => setInteractionForm((current) => ({ ...current, location: event.target.value }))}
            placeholder="Location"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
          <textarea
            rows={4}
            value={interactionForm.summary}
            onChange={(event) => setInteractionForm((current) => ({ ...current, summary: event.target.value }))}
            placeholder="Summary"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white md:col-span-2"
          />

          {canViewConfidential ? (
            <>
              <label className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-4 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-white">
                      <ShieldCheck className="h-4 w-4 text-accent" />
                      Confidential Notes
                    </p>
                    <p className="mt-1 text-sm text-white/60">
                      These notes are only visible to head pastor and above.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={interactionForm.isConfidential}
                    onChange={(event) =>
                      setInteractionForm((current) => ({ ...current, isConfidential: event.target.checked }))
                    }
                    className="h-4 w-4"
                  />
                </div>
                <textarea
                  rows={4}
                  value={interactionForm.confidentialNotes}
                  onChange={(event) =>
                    setInteractionForm((current) => ({ ...current, confidentialNotes: event.target.value }))
                  }
                  className="mt-4 w-full rounded-xl border border-accent/20 bg-black/10 px-4 py-3 text-sm text-white"
                />
              </label>
            </>
          ) : null}

          <textarea
            rows={3}
            value={interactionForm.nextSteps}
            onChange={(event) => setInteractionForm((current) => ({ ...current, nextSteps: event.target.value }))}
            placeholder="Next steps"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white md:col-span-2"
          />
          <input
            type="date"
            value={interactionForm.nextFollowUpDate}
            onChange={(event) =>
              setInteractionForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))
            }
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              setInteractionModal({ open: false, interaction: null });
              setInteractionForm(interactionDefaults);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              interactionMutation.mutate({
                ...interactionForm,
                duration: Number(interactionForm.duration || 0) || undefined,
                nextFollowUpDate: interactionForm.nextFollowUpDate || undefined,
              })
            }
            disabled={!interactionForm.summary.trim() || interactionMutation.isPending}
          >
            {interactionMutation.isPending ? 'Saving...' : interactionModal.interaction ? 'Update' : 'Add Interaction'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={prayerOpen}
        onClose={() => setPrayerOpen(false)}
        title="Add Prayer Request"
        description="Record a prayer point linked to this care case."
      >
        <textarea
          rows={5}
          value={newPrayerRequest}
          onChange={(event) => setNewPrayerRequest(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setPrayerOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => prayerMutation.mutate({ request: newPrayerRequest })}
            disabled={!newPrayerRequest.trim() || prayerMutation.isPending}
          >
            Add Prayer Request
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(answeredPrayer)}
        onClose={() => {
          setAnsweredPrayer(null);
          setTestimonial('');
        }}
        title="Mark Prayer as Answered"
        description="Capture the testimony for this answered prayer."
      >
        <textarea
          rows={5}
          value={testimonial}
          onChange={(event) => setTestimonial(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        />
        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              setAnsweredPrayer(null);
              setTestimonial('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              answeredMutation.mutate({
                prayerId: answeredPrayer._id,
                payload: testimonial,
              })
            }
            disabled={answeredMutation.isPending}
          >
            Save Testimony
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={milestoneOpen}
        onClose={() => {
          setMilestoneOpen(false);
          setMilestoneForm(milestoneDefaults);
        }}
        title="Add Milestone"
        description="Celebrate a spiritual milestone connected to this care case."
      >
        <div className="grid gap-4">
          <input
            value={milestoneForm.title}
            onChange={(event) => setMilestoneForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Milestone title"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
          <select
            value={milestoneForm.type}
            onChange={(event) => setMilestoneForm((current) => ({ ...current, type: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            {['salvation', 'baptism', 'deliverance', 'restoration', 'healing', 'marriage_restored', 'addiction_free', 'other'].map(
              (option) => (
                <option key={option} value={option}>
                  {formatPastoralLabel(option)}
                </option>
              ),
            )}
          </select>
          <input
            type="date"
            value={milestoneForm.date}
            onChange={(event) => setMilestoneForm((current) => ({ ...current, date: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
          <textarea
            rows={4}
            value={milestoneForm.notes}
            onChange={(event) => setMilestoneForm((current) => ({ ...current, notes: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setMilestoneOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => milestoneMutation.mutate(milestoneForm)}
            disabled={!milestoneForm.title.trim() || milestoneMutation.isPending}
          >
            Add Milestone
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={discipleshipOpen}
        onClose={() => setDiscipleshipOpen(false)}
        title="Enroll in Discipleship"
        description="Connect this member to a discipleship track."
      >
        <div className="space-y-4">
          <select
            value={discipleshipForm.trackId}
            onChange={(event) => setDiscipleshipForm((current) => ({ ...current, trackId: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">Select track</option>
            {(tracksQuery.data || []).map((track) => (
              <option key={track.trackId} value={track.trackId}>
                {track.name}
              </option>
            ))}
          </select>
          <select
            value={discipleshipForm.assignedTo}
            onChange={(event) =>
              setDiscipleshipForm((current) => ({ ...current, assignedTo: event.target.value }))
            }
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">Assign discipler</option>
            {assignees.map((person) => (
              <option key={person._id} value={person._id}>
                {person.fullName || person.username}
              </option>
            ))}
          </select>
          <textarea
            rows={4}
            value={discipleshipForm.notes}
            onChange={(event) => setDiscipleshipForm((current) => ({ ...current, notes: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDiscipleshipOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              discipleshipMutation.mutate({
                memberId: careCase?.memberId,
                trackId: discipleshipForm.trackId,
                assignedTo: discipleshipForm.assignedTo || undefined,
                notes: discipleshipForm.notes || undefined,
              })
            }
            disabled={!discipleshipForm.trackId || discipleshipMutation.isPending}
          >
            Enroll Member
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={welfareOpen}
        onClose={() => setWelfareOpen(false)}
        title="Update Welfare Support"
        description="Keep practical support details current."
      >
        <div className="space-y-4">
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div>
              <p className="font-semibold text-white">Receiving Support</p>
              <p className="mt-1 text-sm text-white/55">Toggle active welfare assistance for this member.</p>
            </div>
            <input
              type="checkbox"
              checked={welfareForm.isReceivingSupport}
              onChange={(event) =>
                setWelfareForm((current) => ({ ...current, isReceivingSupport: event.target.checked }))
              }
              className="h-4 w-4"
            />
          </label>

          <div className="grid gap-2 md:grid-cols-2">
            {WELFARE_SUPPORT_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/75"
              >
                <input
                  type="checkbox"
                  checked={welfareForm.supportType.includes(option)}
                  onChange={(event) =>
                    setWelfareForm((current) => ({
                      ...current,
                      supportType: event.target.checked
                        ? [...current.supportType, option]
                        : current.supportType.filter((item) => item !== option),
                    }))
                  }
                  className="h-4 w-4"
                />
                {formatPastoralLabel(option)}
              </label>
            ))}
          </div>

          <input
            type="number"
            step="0.01"
            value={welfareForm.totalSupport}
            onChange={(event) => setWelfareForm((current) => ({ ...current, totalSupport: event.target.value }))}
            placeholder="Total support value"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
          <textarea
            rows={4}
            value={welfareForm.notes}
            onChange={(event) => setWelfareForm((current) => ({ ...current, notes: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setWelfareOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              welfareMutation.mutate({
                welfareSupport: {
                  isReceivingSupport: welfareForm.isReceivingSupport,
                  supportType: welfareForm.supportType,
                  totalSupport: Number(welfareForm.totalSupport || 0),
                  notes: welfareForm.notes || undefined,
                },
              })
            }
            disabled={welfareMutation.isPending}
          >
            Save Welfare Support
          </Button>
        </div>
      </Modal>
    </PastoralPageLayout>
  );
}
