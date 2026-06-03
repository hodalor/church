import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, Clock3, HeartHandshake, Sparkles, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getAllCases,
  getCareStats,
  getMyCases,
  getTodayAppointments,
  getUrgentCases,
  getWelfareReport,
  updateAppointmentStatus,
} from '../../api/endpoints/pastoral';
import PastoralPageLayout from '../../components/pastoral/PastoralPageLayout';
import AppointmentStatusBadge from '../../components/pastoral/AppointmentStatusBadge';
import UrgencyIndicator from '../../components/pastoral/UrgencyIndicator';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { usePastoralAccess } from '../../hooks/usePastoralAccess';
import {
  formatPastoralLabel,
  formatRelativeTime,
  formatShortDate,
  formatShortDateTime,
  getDaysOpen,
  getDaysOpenClasses,
} from '../../utils/pastoral';

const ACTIVE_CASE_STATUSES = ['open', 'in_progress', 'on_hold'];

const activityIcons = {
  visit: UserRound,
  call: Clock3,
  prayer: HeartHandshake,
  counseling_session: CalendarClock,
  message: Clock3,
  hospital_visit: UserRound,
  group_session: Sparkles,
};

function StatCard({ label, value, helper }) {
  return (
    <Card className="min-h-[112px] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{label}</p>
      <p className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{value}</p>
      <p className="mt-2 text-xs text-white/45">{helper}</p>
    </Card>
  );
}

export default function PastoralDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = usePastoralAccess();
  const showMyCases = ['care_leader', 'branch_pastor'].includes(role);

  const statsQuery = useQuery({
    queryKey: ['pastoral-care-stats'],
    queryFn: getCareStats,
  });
  const urgentCasesQuery = useQuery({
    queryKey: ['pastoral-urgent-cases'],
    queryFn: getUrgentCases,
  });
  const todayAppointmentsQuery = useQuery({
    queryKey: ['pastoral-today-appointments'],
    queryFn: getTodayAppointments,
  });
  const myCasesQuery = useQuery({
    queryKey: ['pastoral-my-cases-widget'],
    queryFn: () => getMyCases({ limit: 5 }),
    enabled: showMyCases,
  });
  const casesQuery = useQuery({
    queryKey: ['pastoral-dashboard-cases'],
    queryFn: () => getAllCases({ limit: 100 }),
  });
  const welfareQuery = useQuery({
    queryKey: ['pastoral-welfare-report-card'],
    queryFn: getWelfareReport,
  });

  const completeAppointmentMutation = useMutation({
    mutationFn: (appointmentId) => updateAppointmentStatus(appointmentId, 'completed'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastoral-today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['pastoral-all-appointments'] });
    },
  });

  const criticalCases = useMemo(
    () =>
      (urgentCasesQuery.data?.items || []).filter(
        (item) => item.urgency === 'critical' && ACTIVE_CASE_STATUSES.includes(item.status),
      ),
    [urgentCasesQuery.data?.items],
  );

  const recentActivity = useMemo(() => {
    return (casesQuery.data?.items || [])
      .flatMap((careCase) =>
        (careCase.interactions || []).map((interaction) => ({
          ...interaction,
          caseId: careCase.caseId,
          memberName: careCase.memberName,
          title: careCase.title,
        })),
      )
      .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))
      .slice(0, 10);
  }, [casesQuery.data?.items]);

  const milestonesThisMonth = useMemo(() => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    return (statsQuery.data?.recentMilestones || []).filter((milestone) => {
      const date = new Date(milestone.date || milestone.createdAt || Date.now());
      return date.getMonth() === month && date.getFullYear() === year;
    });
  }, [statsQuery.data?.recentMilestones]);

  const stats = [
    {
      label: 'Open Cases',
      value: statsQuery.data?.open || 0,
      helper: `${statsQuery.data?.inProgress || 0} currently in progress`,
    },
    {
      label: 'Urgent Cases',
      value: (statsQuery.data?.byUrgency?.urgent || 0) + (statsQuery.data?.byUrgency?.critical || 0),
      helper: `${statsQuery.data?.openCritical || 0} marked critical`,
    },
    {
      label: "Today's Appointments",
      value: todayAppointmentsQuery.data?.items?.length || 0,
      helper: `${statsQuery.data?.pendingAppointments || 0} pending overall`,
    },
    {
      label: 'Active Discipleships',
      value: statsQuery.data?.discipleshipActive || 0,
      helper: `${statsQuery.data?.recentMilestones?.length || 0} recent milestones`,
    },
  ];

  return (
    <PastoralPageLayout
      title="Pastoral Care"
      subtitle="Monitor urgent care needs, appointments, follow-up activity, and discipleship momentum."
      action={
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate('/pastoral/appointments/new')}>
            + Schedule Appointment
          </Button>
          <Button variant="secondary" onClick={() => navigate('/pastoral/cases/new')}>
            + Open Care Case
          </Button>
        </div>
      }
    >
      {statsQuery.data?.openCritical ? (
        <Card className="border-rose-500/35 bg-rose-500/10 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-rose-200">
                <AlertTriangle className="h-4 w-4 animate-pulse" />
                {statsQuery.data.openCritical} critical care cases require immediate attention
              </p>
              <div className="mt-4 space-y-2">
                {criticalCases.slice(0, 3).map((careCase) => (
                  <div
                    key={careCase.caseId}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-400/20 bg-black/10 px-4 py-3 text-sm text-white/85"
                  >
                    <span className="font-semibold text-white">{careCase.memberName}</span>
                    <span className="text-white/55">{formatPastoralLabel(careCase.type)}</span>
                    <span className={getDaysOpenClasses(getDaysOpen(careCase.createdAt))}>
                      {getDaysOpen(careCase.createdAt)} days open
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/pastoral/cases?urgency=critical')}>
              View Critical Cases
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {showMyCases ? (
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-accent">My Cases</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Assigned follow-ups</h2>
                </div>
                <Link to="/pastoral/cases?tab=my" className="text-sm font-semibold text-accent">
                  View All My Cases
                </Link>
              </div>
              <div className="space-y-3">
                {(myCasesQuery.data?.items || []).slice(0, 5).map((careCase) => {
                  const lastInteraction =
                    [...(careCase.interactions || [])].sort(
                      (left, right) => new Date(right.date || 0) - new Date(left.date || 0),
                    )[0] || null;

                  return (
                    <button
                      key={careCase.caseId}
                      type="button"
                      onClick={() => navigate(`/pastoral/cases/${careCase.caseId}`)}
                      className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{careCase.memberName}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-white/45">{careCase.caseId}</p>
                        </div>
                        <UrgencyIndicator urgency={careCase.urgency} />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                        <span className={getDaysOpenClasses(getDaysOpen(careCase.createdAt))}>
                          {getDaysOpen(careCase.createdAt)} days open
                        </span>
                        <span>Last interaction {formatRelativeTime(lastInteraction?.date)}</span>
                      </div>
                    </button>
                  );
                })}
                {!myCasesQuery.data?.items?.length ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
                    No cases are assigned to you right now.
                  </p>
                ) : null}
              </div>
            </Card>
          ) : null}

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Recent Activity</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Latest interactions</h2>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const Icon = activityIcons[activity.type] || HeartHandshake;
                return (
                  <button
                    key={`${activity.caseId}-${activity.interactionId}`}
                    type="button"
                    onClick={() => navigate(`/pastoral/cases/${activity.caseId}`)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
                  >
                    <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">
                        Pastor <span className="font-semibold">{activity.conductedByName || 'Care team'}</span>{' '}
                        {formatPastoralLabel(activity.type).toLowerCase()} <span className="font-semibold">{activity.memberName}</span>
                      </p>
                      <p className="mt-1 text-sm text-white/55">{activity.summary || activity.title}</p>
                    </div>
                    <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-white/35">
                      {formatRelativeTime(activity.date)}
                    </span>
                  </button>
                );
              })}
              {!recentActivity.length ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
                  No recent pastoral interactions recorded yet.
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Appointments Today</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Pastoral schedule</h2>
              </div>
              <Button variant="ghost" onClick={() => navigate('/pastoral/appointments')}>
                Open Calendar
              </Button>
            </div>
            <div className="space-y-3">
              {(todayAppointmentsQuery.data?.items || []).map((appointment) => (
                <div
                  key={appointment._id || appointment.appointmentId}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{appointment.memberName}</p>
                      <p className="mt-1 text-sm text-white/55">
                        {formatPastoralLabel(appointment.type)} at {formatShortDateTime(appointment.scheduledAt)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                        {appointment.location || 'Location to be confirmed'}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {['scheduled', 'confirmed'].includes(appointment.status) ? (
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        onClick={() => completeAppointmentMutation.mutate(appointment._id || appointment.id)}
                        disabled={completeAppointmentMutation.isPending}
                      >
                        Mark Complete
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      className="px-3 py-2 text-xs"
                      onClick={() => navigate('/pastoral/appointments')}
                    >
                      View All
                    </Button>
                  </div>
                </div>
              ))}
              {!todayAppointmentsQuery.data?.items?.length ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
                  No appointments today.
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Welfare Summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Support in progress</h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-4xl font-semibold text-white">{welfareQuery.data?.totalSupportedCases || 0}</p>
              <p className="mt-2 text-sm text-white/55">Members currently receiving support</p>
            </div>
            <div className="space-y-3">
              {(welfareQuery.data?.bySupportType || []).map((item) => {
                const total = welfareQuery.data?.totalSupportedCases || 1;
                const width = Math.max(6, Math.round((item.count / total) * 100));
                return (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/75">{formatPastoralLabel(item.type)}</span>
                      <span className="text-white/45">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Milestones This Month</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Celebrations</h2>
            </div>
            <div className="space-y-3">
              {milestonesThisMonth.map((milestone) => (
                <div
                  key={`${milestone.caseId}-${milestone.title}-${milestone.date}`}
                  className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-white">
                    <span className="mr-2 text-accent">🎉</span>
                    {milestone.memberName} - {milestone.title} completed
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                    {formatShortDate(milestone.date)}
                  </p>
                </div>
              ))}
              {!milestonesThisMonth.length ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-sm text-white/55">
                  No milestones recorded this month yet.
                </p>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </PastoralPageLayout>
  );
}
