import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import CountdownTimer from '../../components/events/CountdownTimer';
import EventTypeBadge from '../../components/events/EventTypeBadge';
import RegistrationStatusBadge from '../../components/events/RegistrationStatusBadge';
import TicketTierCard from '../../components/events/TicketTierCard';
import VolunteerPickerModal from '../../components/volunteers/VolunteerPickerModal';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import {
  getEventById,
  getEventRegistrations,
  getRegistrationStats,
  publishEvent,
  registerForEvent,
  updateEvent,
  updateEventStatus,
} from '../../api/endpoints/events';
import { getAllVolunteers } from '../../api/endpoints/volunteers';
import useEventsAccess from '../../hooks/useEventsAccess';
import useCurrency from '../../hooks/useCurrency';
import { useAuthStore } from '../../stores/authStore';
import { getEventStatusClasses } from '../../utils/events';

const tabs = ['registrations', 'volunteers', 'budget'];

const createRegistrationForm = () => ({
  memberId: '',
  externalName: '',
  phone: '',
  email: '',
  quantity: 1,
  tierId: '',
});

export default function EventDetailPage() {
  const queryClient = useQueryClient();
  const { eventId } = useParams();
  const { formatCurrency } = useCurrency();
  const authUser = useAuthStore((state) => state.user);
  const {
    canViewEvents,
    canModifyEvents,
    canPublishEvents,
    canViewRegistrations,
    canCreateRegistrations,
  } = useEventsAccess();
  const [activeTab, setActiveTab] = useState('registrations');
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState(createRegistrationForm());

  const eventQuery = useQuery({
    queryKey: ['event-detail', eventId],
    queryFn: () => getEventById(eventId),
    enabled: canViewEvents,
  });
  const statsQuery = useQuery({
    queryKey: ['event-detail-stats', eventId],
    queryFn: () => getRegistrationStats(eventId),
    enabled: canViewEvents,
  });
  const registrationsQuery = useQuery({
    queryKey: ['event-detail-registrations', eventId],
    queryFn: () => getEventRegistrations(eventId, { limit: 5 }),
    enabled: canViewRegistrations,
  });
  const volunteersQuery = useQuery({
    queryKey: ['event-detail-volunteers', eventId],
    queryFn: () => getAllVolunteers({ limit: 100 }),
    enabled: canViewEvents,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event-detail', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-detail-stats', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event-detail-registrations', eventId] });
    queryClient.invalidateQueries({ queryKey: ['events-dashboard-upcoming'] });
    queryClient.invalidateQueries({ queryKey: ['events-dashboard-stats'] });
  };

  const publishMutation = useMutation({
    mutationFn: () => publishEvent(eventId),
    onSuccess: invalidate,
  });
  const updateStatusMutation = useMutation({
    mutationFn: (status) => updateEventStatus(eventId, status),
    onSuccess: invalidate,
  });
  const registerMutation = useMutation({
    mutationFn: (payload) => registerForEvent(eventId, payload),
    onSuccess: () => {
      setShowRegistrationModal(false);
      setRegistrationForm(createRegistrationForm());
      invalidate();
    },
  });
  const assignVolunteersMutation = useMutation({
    mutationFn: (volunteerIds) => {
      const currentIds = event.volunteers || [];
      return updateEvent(eventId, {
        volunteers: [...new Set([...currentIds, ...volunteerIds])],
      });
    },
    onSuccess: () => {
      setShowVolunteerModal(false);
      invalidate();
    },
  });

  const event = eventQuery.data || {};
  const stats = statsQuery.data || {};
  const registrations = registrationsQuery.data?.items || [];
  const allVolunteers = volunteersQuery.data?.items || volunteersQuery.data || [];
  const assignedVolunteers = allVolunteers.filter((volunteer) =>
    (event.volunteers || []).includes(volunteer._id || volunteer.id),
  );
  const volunteersByDepartment = useMemo(() => {
    const map = new Map();
    assignedVolunteers.forEach((volunteer) => {
      const department = volunteer.primaryDepartment || volunteer.departments?.[0] || 'Volunteer';
      map.set(department, [...(map.get(department) || []), volunteer]);
    });
    return [...map.entries()].map(([department, items]) => ({ department, items }));
  }, [assignedVolunteers]);

  if (!canViewEvents) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Event Detail</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have permission to open this event.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div
          className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1320]"
          style={{
            backgroundImage: event.bannerUrl
              ? `linear-gradient(90deg, rgba(8,17,37,0.75), rgba(8,17,37,0.75)), url(${event.bannerUrl})`
              : 'linear-gradient(135deg, rgba(30,42,74,1), rgba(201,168,76,0.35))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="space-y-4 px-6 py-10">
            <div className="flex flex-wrap items-center gap-3">
              <EventTypeBadge type={event.type} />
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getEventStatusClasses(
                  event.status,
                )}`}
              >
                {String(event.status || 'draft').replaceAll('_', ' ')}
              </span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold text-white">{event.title || 'Event'}</h1>
            <CountdownTimer targetDate={event.startDate} className="text-base text-white/80" />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Event Info</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                  <p className="text-sm text-white/45">Date + Time</p>
                  <p className="mt-1 font-semibold text-white">
                    {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'} {event.startTime || ''}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                  <p className="text-sm text-white/45">Venue</p>
                  <p className="mt-1 font-semibold text-white">{event.venue || 'TBD'}</p>
                  <p className="mt-1 text-sm text-white/45">{event.address || 'No address yet'}</p>
                </div>
              </div>

              {event.gpsCoordinates?.lat && event.gpsCoordinates?.lng ? (
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <iframe
                    title="Event location"
                    src={`https://maps.google.com/maps?q=${event.gpsCoordinates.lat},${event.gpsCoordinates.lng}&z=15&output=embed`}
                    className="h-72 w-full"
                  />
                </div>
              ) : null}

              {event.isOnline ? (
                <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                  <p className="text-sm text-white/45">Online stream</p>
                  <a href={event.streamUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-accent">
                    Open Stream
                  </a>
                </div>
              ) : null}

              {event.description ? (
                <div
                  className="prose prose-invert max-w-none rounded-2xl border border-white/10 bg-[#101827] px-4 py-4"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              ) : null}

              {event.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {!event.isFree && event.ticketTiers?.length ? (
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white">Ticket Tiers</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {event.ticketTiers.map((tier) => (
                      <TicketTierCard
                        key={tier.tierId}
                        tier={tier}
                        onRegister={
                          canCreateRegistrations
                            ? () => {
                                setRegistrationForm((current) => ({ ...current, tierId: tier.tierId }));
                                setShowRegistrationModal(true);
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                <p className="text-sm text-white/45">Organizer</p>
                <p className="mt-1 font-semibold text-white">
                  {authUser?.fullName || authUser?.username || event.organizerUserId || 'Organizer'}
                </p>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Stats + Actions</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Registered', stats.registered || 0],
                  ['Confirmed', stats.confirmed || 0],
                  ['Attended', stats.attended || 0],
                  ['No Show', stats.noShow || 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                    <p className="text-sm text-white/45">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                <div className="flex items-center justify-between text-sm text-white/55">
                  <span>Capacity</span>
                  <span>
                    {event.registeredCount || 0}/{event.maxAttendees || 'Unlimited'}
                  </span>
                </div>
                {event.maxAttendees ? (
                  <div className="mt-3 h-3 rounded-full bg-white/10">
                    <div
                      className="h-3 rounded-full bg-accent"
                      style={{
                        width: `${Math.min(
                          ((Number(event.registeredCount || 0) / Number(event.maxAttendees || 1)) * 100) || 0,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                <p className="text-sm text-white/45">Revenue collected</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrency(stats.revenue?.collected || 0)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {canCreateRegistrations ? (
                  <Button variant="secondary" onClick={() => setShowRegistrationModal(true)}>
                    Register Attendee
                  </Button>
                ) : null}
                {canModifyEvents ? (
                  <Link to={`/events/${eventId}/edit`}>
                    <Button variant="subtle">Edit Event</Button>
                  </Link>
                ) : null}
                {canPublishEvents && event.status === 'draft' ? (
                  <Button variant="secondary" onClick={() => publishMutation.mutate()}>
                    Publish
                  </Button>
                ) : null}
                {canPublishEvents ? (
                  <Button variant="ghost" onClick={() => updateStatusMutation.mutate('registration_open')}>
                    Open Registration
                  </Button>
                ) : null}
                {canPublishEvents ? (
                  <Button variant="subtle" onClick={() => updateStatusMutation.mutate('registration_closed')}>
                    Close Registration
                  </Button>
                ) : null}
                {canPublishEvents ? (
                  <Button variant="subtle" onClick={() => updateStatusMutation.mutate('cancelled')}>
                    Cancel Event
                  </Button>
                ) : null}
                <Link to={`/events/${eventId}/checkin`}>
                  <Button variant="ghost">Open Check-in Console</Button>
                </Link>
                <Link to={`/events/${eventId}/registrations`}>
                  <Button variant="ghost">View Registrations</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <Card className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  activeTab === tab
                    ? 'bg-accent text-primary'
                    : 'border border-white/10 bg-white/5 text-white/65'
                }`}
              >
                {tab === 'registrations'
                  ? 'Registrations'
                  : tab === 'volunteers'
                    ? 'Volunteers'
                    : 'Budget'}
              </button>
            ))}
          </div>

          {activeTab === 'registrations' ? (
            <div className="space-y-3">
              {registrations.map((registration) => (
                <div
                  key={registration.registrationId || registration._id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101827] px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {registration.memberName || registration.externalName || 'Registrant'}
                    </p>
                    <p className="text-sm text-white/45">
                      {registration.tierName || 'General'} • {registration.phone || registration.email || 'No contact'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <RegistrationStatusBadge status={registration.approvalStatus} mode="approval" />
                    <RegistrationStatusBadge status={registration.status} />
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <Link to={`/events/${eventId}/registrations`}>
                  <Button variant="subtle">Open Full Registrations</Button>
                </Link>
              </div>
            </div>
          ) : null}

          {activeTab === 'volunteers' ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setShowVolunteerModal(true)} disabled={!canModifyEvents}>
                  Assign Volunteers
                </Button>
              </div>
              {volunteersByDepartment.length ? (
                volunteersByDepartment.map((group) => (
                  <div key={group.department} className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                    <p className="font-semibold text-white">{group.department}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.items.map((volunteer) => (
                        <span
                          key={volunteer._id || volunteer.id}
                          className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent"
                        >
                          {volunteer.memberName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/55">No volunteers assigned to this event yet.</p>
              )}
            </div>
          ) : null}

          {activeTab === 'budget' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                <p className="text-sm text-white/45">Estimated Cost</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrency(event.estimatedBudget || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                <p className="text-sm text-white/45">Actual Cost</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrency(event.actualCost || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                <p className="text-sm text-white/45">Revenue</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrency(stats.revenue?.collected || 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
                <p className="text-sm text-white/45">Profit / Loss</p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrency((stats.revenue?.collected || 0) - (event.actualCost || 0))}
                </p>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <VolunteerPickerModal
        isOpen={showVolunteerModal}
        onClose={() => setShowVolunteerModal(false)}
        title="Assign Event Volunteers"
        date={event.startDate}
        selectedVolunteerIds={event.volunteers || []}
        multiSelect
        onConfirm={(selectedIds) => assignVolunteersMutation.mutate(selectedIds)}
      />

      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title="Register For Event"
        description="Capture a registration for this event."
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Member ID"
              value={registrationForm.memberId}
              onChange={(event) =>
                setRegistrationForm((current) => ({ ...current, memberId: event.target.value }))
              }
              placeholder="Optional member ID"
            />
            <Input
              label="Full Name"
              value={registrationForm.externalName}
              onChange={(event) =>
                setRegistrationForm((current) => ({ ...current, externalName: event.target.value }))
              }
            />
            <Input
              label="Phone"
              value={registrationForm.phone}
              onChange={(event) =>
                setRegistrationForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
            <Input
              label="Email"
              value={registrationForm.email}
              onChange={(event) =>
                setRegistrationForm((current) => ({ ...current, email: event.target.value }))
              }
            />
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={registrationForm.quantity}
              onChange={(event) =>
                setRegistrationForm((current) => ({ ...current, quantity: Number(event.target.value || 1) }))
              }
            />
            {!event.isFree ? (
              <label className="space-y-1.5">
                <span className="text-[13px] font-medium text-white/75">Ticket Tier</span>
                <select
                  value={registrationForm.tierId}
                  onChange={(event) =>
                    setRegistrationForm((current) => ({ ...current, tierId: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="">Select tier</option>
                  {(event.ticketTiers || []).map((tier) => (
                    <option key={tier.tierId} value={tier.tierId}>
                      {tier.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {registerMutation.error ? <p className="text-sm text-rose-300">{registerMutation.error.message}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={() => setShowRegistrationModal(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={
                registerMutation.isPending ||
                (!registrationForm.memberId && !registrationForm.externalName) ||
                !registrationForm.phone ||
                (!event.isFree && !registrationForm.tierId)
              }
              onClick={() =>
                registerMutation.mutate({
                  memberId: registrationForm.memberId || undefined,
                  externalName: registrationForm.externalName || undefined,
                  phone: registrationForm.phone,
                  email: registrationForm.email || undefined,
                  quantity: registrationForm.quantity,
                  tierId: registrationForm.tierId || undefined,
                  memberName: registrationForm.externalName || authUser?.fullName || undefined,
                })
              }
            >
              Register Now
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
