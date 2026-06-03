import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { completeStep, getAllEnrollments, getAllTracks, updateEnrollmentStatus } from '../../api/endpoints/pastoral';
import DiscipleshipProgressRing from '../../components/pastoral/DiscipleshipProgressRing';
import PastoralPageLayout from '../../components/pastoral/PastoralPageLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { formatPastoralLabel, formatShortDate } from '../../utils/pastoral';

export default function EnrollmentDetailPage() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [stepModal, setStepModal] = useState(null);
  const [stepNotes, setStepNotes] = useState('');

  const enrollmentsQuery = useQuery({
    queryKey: ['pastoral-enrollment-detail-source'],
    queryFn: () => getAllEnrollments({ limit: 100 }),
  });

  const tracksQuery = useQuery({
    queryKey: ['pastoral-enrollment-track-source'],
    queryFn: () => getAllTracks({}),
  });

  const enrollment = (enrollmentsQuery.data?.items || []).find((item) => String(item._id) === String(enrollmentId));
  const track = (tracksQuery.data || []).find((item) => item.trackId === enrollment?.trackId);
  const currentStepNumber = (enrollment?.progress || []).find((step) => !step.isCompleted)?.stepNumber;

  const refreshEnrollment = () => {
    queryClient.invalidateQueries({ queryKey: ['pastoral-enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-enrollment-detail-source'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-case-discipleship'] });
  };

  const completeMutation = useMutation({
    mutationFn: ({ stepNumber, notes }) => completeStep(enrollmentId, stepNumber, { notes }),
    onSuccess: () => {
      setStepModal(null);
      setStepNotes('');
      refreshEnrollment();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateEnrollmentStatus(enrollmentId, status),
    onSuccess: refreshEnrollment,
  });

  const enrichedSteps = useMemo(() => {
    const trackSteps = track?.steps || [];
    const progress = enrollment?.progress || [];
    return trackSteps.map((step) => {
      const progressStep = progress.find((item) => Number(item.stepNumber) === Number(step.stepNumber));
      return {
        ...step,
        ...progressStep,
      };
    });
  }, [enrollment?.progress, track?.steps]);

  return (
    <PastoralPageLayout
      title={enrollment ? `${enrollment.memberName} - ${enrollment.trackName}` : 'Enrollment Detail'}
      subtitle="Walk through each discipleship milestone and capture completion notes."
      action={
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate('/pastoral/discipleship')}>
            Back to Discipleship
          </Button>
          <select
            value={enrollment?.status || 'active'}
            onChange={(event) => statusMutation.mutate(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
          >
            {['active', 'completed', 'paused', 'dropped'].map((option) => (
              <option key={option} value={option}>
                {formatPastoralLabel(option)}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Member</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{enrollment?.memberName || 'Loading...'}</h2>
              <p className="mt-1 text-sm text-white/55">{enrollment?.memberId}</p>
            </div>
            <Link
              to={`/members/${enrollment?.memberId || ''}`}
              className="text-sm font-semibold text-accent"
            >
              Open Member Profile
            </Link>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Track</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{track?.name || enrollment?.trackName}</h2>
            </div>
            <p className="text-sm text-white/60">{track?.description || 'No track description provided.'}</p>
            <p className="text-sm text-white/45">{track?.steps?.length || 0} total steps</p>
          </Card>

          <Card className="flex flex-col items-center gap-4 text-center">
            <DiscipleshipProgressRing percent={enrollment?.completionPercent || 0} status={enrollment?.status} size={132} />
            <p className="text-sm text-white/60">
              {formatPastoralLabel(enrollment?.status || 'active')} - {enrollment?.assignedToName || 'No discipler assigned'}
            </p>
          </Card>
        </div>

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Steps</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Completion roadmap</h2>
          </div>
          <div className="space-y-4">
            {enrichedSteps.map((step) => {
              const isCurrent = Number(step.stepNumber) === Number(currentStepNumber);
              const isLocked = !step.isCompleted && !isCurrent;
              return (
                <div
                  key={step.stepNumber}
                  className={`rounded-2xl border px-4 py-4 ${
                    step.isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/10'
                      : isCurrent
                        ? 'border-accent/30 bg-accent/10'
                        : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">
                        Step {step.stepNumber}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 text-sm text-white/60">{formatPastoralLabel(step.type)}</p>
                    </div>
                    {step.isCompleted ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </span>
                    ) : isLocked ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55">
                        <Lock className="h-4 w-4" />
                        Locked
                      </span>
                    ) : (
                      <Button variant="secondary" onClick={() => setStepModal(step)}>
                        Mark Complete
                      </Button>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-white/60">{step.description || 'No step description provided.'}</p>
                  {step.isCompleted ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70">
                      <p>Completed on {formatShortDate(step.completedAt)}</p>
                      <p className="mt-1">{step.notes || 'No notes added.'}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={Boolean(stepModal)}
        onClose={() => {
          setStepModal(null);
          setStepNotes('');
        }}
        title="Complete Step"
        description={stepModal ? `${stepModal.title} - ${formatPastoralLabel(stepModal.type)}` : ''}
      >
        <div className="space-y-4">
          <p className="text-sm text-white/60">{stepModal?.description || 'Add a short recap note for this step.'}</p>
          <textarea
            rows={5}
            value={stepNotes}
            onChange={(event) => setStepNotes(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              setStepModal(null);
              setStepNotes('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => completeMutation.mutate({ stepNumber: stepModal.stepNumber, notes: stepNotes })}
            disabled={completeMutation.isPending}
          >
            Complete Step
          </Button>
        </div>
      </Modal>
    </PastoralPageLayout>
  );
}
