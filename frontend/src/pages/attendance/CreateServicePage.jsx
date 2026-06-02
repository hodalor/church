import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RouteModal from '../../components/ui/RouteModal';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import {
  createService,
  getServiceById,
  updateService,
} from '../../api/endpoints/attendance';
import { serviceTitleSuggestions, serviceTypeOptions } from '../../utils/attendance';

const createInitialForm = () => ({
  title: '',
  type: 'Sunday Service',
  date: '',
  startTime: '',
  endTime: '',
  branch: '',
  location: '',
  expectedAttendance: '',
  notes: '',
});

export default function CreateServicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('serviceId');
  const [form, setForm] = useState(createInitialForm());

  const serviceQuery = useQuery({
    queryKey: ['attendance-service-edit', serviceId],
    queryFn: () => getServiceById(serviceId),
    enabled: Boolean(serviceId),
  });

  useEffect(() => {
    if (!serviceQuery.data) {
      return;
    }

    const service = serviceQuery.data?.service || serviceQuery.data;
    setForm({
      title: service.title || '',
      type: service.type || 'Sunday Service',
      date: service.date?.slice(0, 10) || '',
      startTime: service.startTime || '',
      endTime: service.endTime || '',
      branch: service.branch || '',
      location: service.location || '',
      expectedAttendance: String(service.expectedAttendance || ''),
      notes: service.notes || '',
    });
  }, [serviceQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      serviceId ? updateService(serviceId, payload) : createService(payload),
  });

  const payload = useMemo(
    () => ({
      ...form,
      expectedAttendance: Number(form.expectedAttendance || 0),
    }),
    [form],
  );

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async (openCheckIn = false) => {
    const result = await saveMutation.mutateAsync(payload);
    const nextId = result?.serviceId || result?._id || serviceId;
    navigate(openCheckIn ? `/attendance/check-in/${nextId}` : `/attendance/services/${nextId || ''}`);
  };

  return (
    <RouteModal
      title={serviceId ? 'Edit Service' : 'Create Service'}
      description="Add a church service schedule and open the check-in flow when you are ready."
      fallbackPath="/attendance/services"
      size="lg"
    >
      <div className="space-y-5">
        <Card className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {serviceTitleSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setField('title', suggestion)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Title"
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder="Sunday Morning Service"
            />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Service Type</span>
              <select
                value={form.type}
                onChange={(event) => setField('type', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              >
                {serviceTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(event) => setField('date', event.target.value)}
            />
            <Input
              label="Branch"
              value={form.branch}
              onChange={(event) => setField('branch', event.target.value)}
              placeholder="Main branch"
            />
            <Input
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(event) => setField('startTime', event.target.value)}
            />
            <Input
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(event) => setField('endTime', event.target.value)}
            />
            <Input
              label="Location"
              value={form.location}
              onChange={(event) => setField('location', event.target.value)}
              placeholder="Main auditorium"
            />
            <Input
              label="Expected Attendance"
              type="number"
              min="0"
              value={form.expectedAttendance}
              onChange={(event) => setField('expectedAttendance', event.target.value)}
              placeholder="300"
            />
          </div>

          <label className="block space-y-1.5">
            <span className="text-[13px] font-medium text-white/75">Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setField('notes', event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none focus:border-accent"
              placeholder="Service notes, emphasis, and check-in reminders"
            />
          </label>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="subtle" onClick={() => navigate('/attendance/services')}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={() => handleSave(false)} disabled={saveMutation.isPending}>
            Save Service
          </Button>
          <Button variant="secondary" onClick={() => handleSave(true)} disabled={saveMutation.isPending}>
            Save &amp; Open Check-in
          </Button>
        </div>
      </div>
    </RouteModal>
  );
}
