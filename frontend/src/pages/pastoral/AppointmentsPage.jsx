import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cancelAppointment, getAllAppointments, updateAppointment, updateAppointmentStatus } from '../../api/endpoints/pastoral';
import AppointmentStatusBadge from '../../components/pastoral/AppointmentStatusBadge';
import PastoralPageLayout from '../../components/pastoral/PastoralPageLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { getAppointmentTypeColor, formatPastoralLabel, formatShortDateTime } from '../../utils/pastoral';
import { useNavigate } from 'react-router-dom';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const tabs = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('calendar');
  const [activeTab, setActiveTab] = useState('today');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editor, setEditor] = useState({
    date: '',
    time: '',
    duration: 60,
    location: '',
    meetingLink: '',
  });

  const appointmentsQuery = useQuery({
    queryKey: ['pastoral-all-appointments'],
    queryFn: () => getAllAppointments({ limit: 100 }),
  });

  const refreshAppointments = () => {
    queryClient.invalidateQueries({ queryKey: ['pastoral-all-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-today-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-care-stats'] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      status === 'cancelled' ? cancelAppointment(id) : updateAppointmentStatus(id, status),
    onSuccess: refreshAppointments,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAppointment(id, payload),
    onSuccess: () => {
      setSelectedAppointment(null);
      refreshAppointments();
    },
  });

  const appointments = appointmentsQuery.data?.items || [];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const scheduledAt = new Date(appointment.scheduledAt);
      if (activeTab === 'today') {
        return scheduledAt >= todayStart && scheduledAt <= todayEnd;
      }
      if (activeTab === 'upcoming') {
        return scheduledAt > todayEnd && ['scheduled', 'confirmed'].includes(appointment.status);
      }
      if (activeTab === 'completed') {
        return appointment.status === 'completed';
      }
      if (activeTab === 'cancelled') {
        return appointment.status === 'cancelled';
      }
      return true;
    });
  }, [activeTab, appointments, todayEnd, todayStart]);

  const calendarEvents = useMemo(
    () =>
      appointments.map((appointment) => ({
        id: appointment._id || appointment.appointmentId,
        title: `${appointment.memberName} - ${formatPastoralLabel(appointment.type)}`,
        start: new Date(appointment.scheduledAt),
        end: addMinutes(new Date(appointment.scheduledAt), appointment.duration || 60),
        resource: appointment,
      })),
    [appointments],
  );

  const openAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    const date = new Date(appointment.scheduledAt);
    setEditor({
      date: date.toISOString().slice(0, 10),
      time: date.toTimeString().slice(0, 5),
      duration: appointment.duration || 60,
      location: appointment.location || '',
      meetingLink: appointment.meetingLink || '',
    });
  };

  return (
    <PastoralPageLayout
      title="Appointments"
      subtitle="Coordinate pastoral counseling, visits, prayer meetings, and discipleship appointments."
      action={
        <Button variant="secondary" onClick={() => navigate('/pastoral/appointments/new')}>
          + New Appointment
        </Button>
      }
    >
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {['calendar', 'list'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  viewMode === mode ? 'bg-accent text-primary' : 'bg-white/5 text-white/65 hover:bg-white/10'
                }`}
              >
                {mode === 'calendar' ? 'Calendar View' : 'List View'}
              </button>
            ))}
          </div>

          {viewMode === 'list' ? (
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
          ) : null}
        </div>
      </Card>

      {viewMode === 'calendar' ? (
        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Calendar View</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Monthly pastoral schedule</h2>
          </div>
          <div className="pastoral-calendar h-[720px] overflow-hidden rounded-3xl bg-white p-4 text-slate-900">
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              selectable
              onSelectSlot={({ start }) =>
                navigate(`/pastoral/appointments/new?date=${format(start, 'yyyy-MM-dd')}`)
              }
              onSelectEvent={(event) => openAppointment(event.resource)}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: getAppointmentTypeColor(event.resource.type),
                  color: '#ffffff',
                  borderRadius: '10px',
                  border: 'none',
                },
              })}
            />
          </div>
        </Card>
      ) : (
        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">List View</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Scheduled and completed appointments</h2>
          </div>
          <div className="overflow-x-auto rounded-[18px]">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/[0.02]">
                <tr className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                  {['Member', 'Type', 'Date and Time', 'Duration', 'Location', 'Assigned To', 'Status', 'Actions'].map(
                    (header) => (
                      <th key={header} className="px-4 py-3.5 font-medium">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-white/80">
                {filteredAppointments.length ? (
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment._id || appointment.appointmentId} className="transition hover:bg-white/[0.025]">
                      <td className="px-4 py-3.5 align-middle">
                        <p className="font-semibold text-white">{appointment.memberName}</p>
                        <p className="mt-1 text-xs text-white/45">{appointment.appointmentId}</p>
                      </td>
                      <td className="px-4 py-3.5 align-middle">{formatPastoralLabel(appointment.type)}</td>
                      <td className="px-4 py-3.5 align-middle">{formatShortDateTime(appointment.scheduledAt)}</td>
                      <td className="px-4 py-3.5 align-middle">{appointment.duration || 60} mins</td>
                      <td className="px-4 py-3.5 align-middle">{appointment.location || 'TBD'}</td>
                      <td className="px-4 py-3.5 align-middle">{appointment.assignedToName || 'Unassigned'}</td>
                      <td className="px-4 py-3.5 align-middle">
                        <AppointmentStatusBadge status={appointment.status} />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => openAppointment(appointment)}>
                            View
                          </Button>
                          {appointment.status !== 'completed' ? (
                            <Button
                              variant="secondary"
                              className="px-3 py-2 text-xs"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: appointment._id || appointment.id,
                                  status: 'completed',
                                })
                              }
                            >
                              Complete
                            </Button>
                          ) : null}
                          {appointment.status !== 'cancelled' ? (
                            <Button
                              variant="subtle"
                              className="px-3 py-2 text-xs"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: appointment._id || appointment.id,
                                  status: 'cancelled',
                                })
                              }
                            >
                              Cancel
                            </Button>
                          ) : null}
                          <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => openAppointment(appointment)}>
                            Reschedule
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-white/45">
                      {appointmentsQuery.isLoading ? 'Loading appointments...' : 'No appointments match the selected view.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        isOpen={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        title={selectedAppointment?.title || 'Appointment'}
        description={
          selectedAppointment ? `${selectedAppointment.memberName} - ${formatPastoralLabel(selectedAppointment.type)}` : ''
        }
        size="lg"
      >
        {selectedAppointment ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-white">{selectedAppointment.memberName}</p>
                <AppointmentStatusBadge status={selectedAppointment.status} />
              </div>
              <p className="mt-2 text-sm text-white/60">{formatShortDateTime(selectedAppointment.scheduledAt)}</p>
              <p className="mt-1 text-sm text-white/60">{selectedAppointment.location || 'Location not set'}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Date</span>
                <input
                  type="date"
                  value={editor.date}
                  onChange={(event) => setEditor((current) => ({ ...current, date: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Time</span>
                <input
                  type="time"
                  value={editor.time}
                  onChange={(event) => setEditor((current) => ({ ...current, time: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Duration</span>
                <input
                  type="number"
                  value={editor.duration}
                  onChange={(event) => setEditor((current) => ({ ...current, duration: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Location</span>
                <input
                  value={editor.location}
                  onChange={(event) => setEditor((current) => ({ ...current, location: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
              </label>
              {selectedAppointment.isOnline ? (
                <label className="block space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-white/80">Meeting Link</span>
                  <input
                    value={editor.meetingLink}
                    onChange={(event) => setEditor((current) => ({ ...current, meetingLink: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="ghost" onClick={() => setSelectedAppointment(null)}>
                Close
              </Button>
              <Button
                variant="subtle"
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: selectedAppointment._id || selectedAppointment.id,
                    status: 'cancelled',
                  })
                }
              >
                Cancel Appointment
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  updateMutation.mutate({
                    id: selectedAppointment._id || selectedAppointment.id,
                    payload: {
                      scheduledAt: `${editor.date}T${editor.time}:00`,
                      duration: Number(editor.duration || 60),
                      location: editor.location || undefined,
                      meetingLink: selectedAppointment.isOnline ? editor.meetingLink || undefined : undefined,
                    },
                  })
                }
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Reschedule'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </PastoralPageLayout>
  );
}
