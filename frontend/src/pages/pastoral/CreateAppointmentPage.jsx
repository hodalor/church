import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import RouteModal from '../../components/ui/RouteModal';
import { getUsers } from '../../api/endpoints/users';
import { createAppointment, getMemberCases } from '../../api/endpoints/pastoral';
import { APPOINTMENT_TYPES, formatPastoralLabel } from '../../utils/pastoral';

const schema = z.object({
  memberId: z.string().min(1, 'Member is required.'),
  caseId: z.string().optional(),
  type: z.string().min(1, 'Appointment type is required.'),
  title: z.string().min(2, 'Title is required.'),
  assignedTo: z.string().min(1, 'Assign the appointment to a pastor or care leader.'),
  date: z.string().min(1, 'Date is required.'),
  time: z.string().min(1, 'Time is required.'),
  duration: z.union([z.string(), z.number()]).optional(),
  location: z.string().optional(),
  isOnline: z.boolean().optional(),
  meetingLink: z.string().optional(),
  notes: z.string().optional(),
});

const pastoralRoles = ['head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'];

const buildTitleFromType = (type) => `${formatPastoralLabel(type || 'pastoral')} Appointment`;

export default function CreateAppointmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedMember, setSelectedMember] = useState(
    searchParams.get('memberId')
      ? {
          memberId: searchParams.get('memberId'),
          memberName: searchParams.get('memberName') || '',
        }
      : null,
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      memberId: searchParams.get('memberId') || '',
      caseId: searchParams.get('caseId') || '',
      type: 'counseling',
      title: buildTitleFromType('counseling'),
      assignedTo: '',
      date: searchParams.get('date') || new Date().toISOString().slice(0, 10),
      time: '09:00',
      duration: 60,
      location: '',
      isOnline: false,
      meetingLink: '',
      notes: '',
    },
  });

  const usersQuery = useQuery({
    queryKey: ['pastoral-assignees-appointments'],
    queryFn: () => getUsers({ limit: 100 }),
  });

  const memberCasesQuery = useQuery({
    queryKey: ['pastoral-member-open-cases', selectedMember?.memberId],
    queryFn: () => getMemberCases(selectedMember?.memberId),
    enabled: Boolean(selectedMember?.memberId),
  });

  const assignees = useMemo(
    () => (usersQuery.data || []).filter((person) => pastoralRoles.includes(person.role)),
    [usersQuery.data],
  );

  const type = form.watch('type');
  const title = form.watch('title');
  const isOnline = form.watch('isOnline');

  useEffect(() => {
    if (!title || title === buildTitleFromType('counseling') || title.endsWith('Appointment')) {
      form.setValue('title', buildTitleFromType(type));
    }
  }, [form, title, type]);

  const createMutation = useMutation({
    mutationFn: (values) =>
      createAppointment({
        memberId: values.memberId,
        caseId: values.caseId || undefined,
        type: values.type,
        title: values.title,
        assignedTo: values.assignedTo,
        scheduledAt: `${values.date}T${values.time}:00`,
        duration: Number(values.duration || 60),
        location: values.location || undefined,
        isOnline: values.isOnline === true,
        meetingLink: values.isOnline ? values.meetingLink || undefined : undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastoral-all-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['pastoral-today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['pastoral-care-stats'] });
      navigate('/pastoral/appointments');
    },
  });

  return (
    <RouteModal
      title="Book Appointment"
      description="Schedule a pastoral meeting, home visit, prayer session, or discipleship follow-up."
      fallbackPath="/pastoral/appointments"
      size="xl"
    >
      <form className="grid gap-6 xl:grid-cols-2" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Appointment</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Member and case context</h2>
          </div>

          <MemberSearchInput
            value={selectedMember || {}}
            onSelect={(member) => {
              setSelectedMember(member);
              form.setValue('memberId', member.memberId, { shouldValidate: true });
              form.setValue('caseId', '');
            }}
            onClear={() => {
              setSelectedMember(null);
              form.setValue('memberId', '', { shouldValidate: true });
              form.setValue('caseId', '');
            }}
          />
          {form.formState.errors.memberId ? (
            <p className="text-sm text-rose-300">{form.formState.errors.memberId.message}</p>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Case Link</span>
            <select
              {...form.register('caseId')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <option value="">No linked case</option>
              {(memberCasesQuery.data || [])
                .filter((careCase) => ['open', 'in_progress', 'on_hold'].includes(careCase.status))
                .map((careCase) => (
                  <option key={careCase.caseId} value={careCase.caseId}>
                    {careCase.caseId} - {careCase.title}
                  </option>
                ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Type</span>
            <select
              {...form.register('type')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              {APPOINTMENT_TYPES.map((option) => (
                <option key={option} value={option}>
                  {formatPastoralLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Title</span>
            <input
              {...form.register('title')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Assigned To</span>
            <select
              {...form.register('assignedTo')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <option value="">Select pastor or care leader</option>
              {assignees.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.fullName || person.username} - {formatPastoralLabel(person.role)}
                </option>
              ))}
            </select>
            {form.formState.errors.assignedTo ? (
              <p className="text-sm text-rose-300">{form.formState.errors.assignedTo.message}</p>
            ) : null}
          </label>
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Schedule</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Time and delivery</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/80">Date</span>
              <input
                type="date"
                {...form.register('date')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/80">Time</span>
              <input
                type="time"
                {...form.register('time')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Duration (minutes)</span>
            <input
              type="number"
              min="15"
              step="15"
              {...form.register('duration')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Location</span>
            <input
              {...form.register('location')}
              placeholder="Office, member home, chapel, or online"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div>
              <p className="font-semibold text-white">Is Online</p>
              <p className="mt-1 text-sm text-white/55">Toggle for virtual appointments.</p>
            </div>
            <input type="checkbox" {...form.register('isOnline')} className="h-4 w-4" />
          </label>

          {isOnline ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/80">Meeting Link</span>
              <input
                {...form.register('meetingLink')}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Notes</span>
            <textarea
              rows={5}
              {...form.register('notes')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
            />
          </label>
        </Card>

        <div className="xl:col-span-2">
          <Button type="submit" variant="secondary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Booking Appointment...' : 'Book Appointment'}
          </Button>
        </div>
      </form>
    </RouteModal>
  );
}
