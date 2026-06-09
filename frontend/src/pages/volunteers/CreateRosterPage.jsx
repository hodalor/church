import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import RouteModal from '../../components/ui/RouteModal';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { getServices } from '../../api/endpoints/attendance';
import { getAllEvents } from '../../api/endpoints/events';
import { createRoster } from '../../api/endpoints/rosters';
import { getCurrentTenant } from '../../api/endpoints/tenants';
import useVolunteersAccess from '../../hooks/useVolunteersAccess';

const createInitialForm = () => ({
  title: '',
  date: '',
  branch: '',
  serviceId: '',
  eventId: '',
});

export default function CreateRosterPage() {
  const navigate = useNavigate();
  const { canCreateRosters } = useVolunteersAccess();
  const [form, setForm] = useState(createInitialForm());

  const tenantQuery = useQuery({
    queryKey: ['create-roster-tenant'],
    queryFn: getCurrentTenant,
    enabled: canCreateRosters,
  });
  const servicesQuery = useQuery({
    queryKey: ['create-roster-services'],
    queryFn: () => getServices({ limit: 30 }),
    enabled: canCreateRosters,
  });
  const eventsQuery = useQuery({
    queryKey: ['create-roster-events'],
    queryFn: () => getAllEvents({ limit: 30 }),
    enabled: canCreateRosters,
  });

  const createMutation = useMutation({
    mutationFn: createRoster,
    onSuccess: (result) => {
      navigate(`/volunteers/rosters/${result.rosterId || result._id || result.id}`);
    },
  });

  const branches = tenantQuery.data?.content?.branches || [];
  const services = servicesQuery.data?.items || servicesQuery.data?.services || [];
  const events = eventsQuery.data?.items || [];
  const payload = useMemo(
    () => ({
      title: form.title,
      date: form.date,
      branch: form.branch || undefined,
      serviceId: form.serviceId || undefined,
      eventId: form.eventId || undefined,
    }),
    [form],
  );

  return (
    <RouteModal
      title="Create Roster"
      description="Create a draft roster, then open it to assign volunteers and publish."
      fallbackPath="/volunteers/rosters"
      size="lg"
    >
      {!canCreateRosters ? (
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Rosters</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have permission to create rosters.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Roster Title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Sunday Worship Team"
              />
              <Input
                label="Date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
              <label className="space-y-1.5">
                <span className="text-[13px] font-medium text-white/75">Branch</span>
                <select
                  value={form.branch}
                  onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="">All branches / main church</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[13px] font-medium text-white/75">Service</span>
                <select
                  value={form.serviceId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      serviceId: event.target.value,
                      eventId: event.target.value ? '' : current.eventId,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="">No linked service</option>
                  {services.map((service) => (
                    <option key={service.serviceId || service._id} value={service.serviceId || service._id}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-[13px] font-medium text-white/75">Event</span>
                <select
                  value={form.eventId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      eventId: event.target.value,
                      serviceId: event.target.value ? '' : current.serviceId,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="">No linked event</option>
                  {events.map((eventItem) => (
                    <option key={eventItem.eventId || eventItem._id} value={eventItem.eventId || eventItem._id}>
                      {eventItem.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          {createMutation.error ? <p className="text-sm text-rose-300">{createMutation.error.message}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="subtle" onClick={() => navigate('/volunteers/rosters')}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              disabled={!form.title || !form.date || createMutation.isPending}
              onClick={() => createMutation.mutate(payload)}
            >
              Create Draft Roster
            </Button>
          </div>
        </div>
      )}
    </RouteModal>
  );
}
