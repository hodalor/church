import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUsers } from '../../api/endpoints/users';
import { addPrayerRequest, createCase } from '../../api/endpoints/pastoral';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import RouteModal from '../../components/ui/RouteModal';
import { usePastoralAccess } from '../../hooks/usePastoralAccess';
import {
  CARE_CASE_TYPES,
  CASE_URGENCY_OPTIONS,
  WELFARE_SUPPORT_OPTIONS,
  formatPastoralLabel,
} from '../../utils/pastoral';

const schema = z.object({
  memberId: z.string().min(1, 'Member is required.'),
  type: z.string().min(1, 'Case type is required.'),
  title: z.string().min(3, 'Title must be at least 3 characters.').max(200, 'Title is too long.'),
  description: z.string().optional(),
  urgency: z.string().min(1, 'Urgency is required.'),
  assignedTo: z.string().optional(),
  tags: z.string().optional(),
  isConfidential: z.boolean().optional(),
  isReceivingSupport: z.boolean().optional(),
  supportTypes: z.array(z.string()).optional(),
  supportAmount: z.union([z.string(), z.number()]).optional(),
  supportNotes: z.string().optional(),
  initialPrayerRequest: z.string().optional(),
});

const pastoralRoles = ['head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'];

export default function CreateCasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { canCreatePastoral, canViewConfidential } = usePastoralAccess();
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
      type: '',
      title: '',
      description: '',
      urgency: 'normal',
      assignedTo: '',
      tags: '',
      isConfidential: false,
      isReceivingSupport: false,
      supportTypes: [],
      supportAmount: '',
      supportNotes: '',
      initialPrayerRequest: '',
    },
  });

  const usersQuery = useQuery({
    queryKey: ['pastoral-assignees-create'],
    queryFn: () => getUsers({ limit: 100 }),
  });

  const assignees = useMemo(
    () => (usersQuery.data || []).filter((person) => pastoralRoles.includes(person.role)),
    [usersQuery.data],
  );

  const createCaseMutation = useMutation({
    mutationFn: async (values) => {
      const created = await createCase({
        memberId: values.memberId,
        type: values.type,
        title: values.title,
        description: values.description,
        urgency: values.urgency,
        assignedTo: values.assignedTo || undefined,
        tags: values.tags
          ? values.tags
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        isConfidential: canViewConfidential && values.isConfidential === true,
        welfareSupport: {
          isReceivingSupport: values.isReceivingSupport === true,
          supportTypes: values.supportTypes || [],
          totalSupport: values.supportAmount ? Number(values.supportAmount) : undefined,
          notes: values.supportNotes || undefined,
        },
      });

      if (values.initialPrayerRequest?.trim()) {
        await addPrayerRequest(created.caseId || created._id || created.id, {
          request: values.initialPrayerRequest.trim(),
        });
      }

      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['pastoral-cases'] });
      queryClient.invalidateQueries({ queryKey: ['pastoral-care-stats'] });
      navigate(`/pastoral/cases/${created.caseId || created._id || created.id}`);
    },
  });

  const supportTypes = form.watch('supportTypes') || [];
  const isReceivingSupport = form.watch('isReceivingSupport');
  const isConfidential = form.watch('isConfidential');
  const urgency = form.watch('urgency');

  if (!canCreatePastoral) {
    return (
      <RouteModal
        title="Open Care Case"
        description="Create a pastoral care case for a member."
        fallbackPath="/pastoral/cases"
        size="lg"
      >
        <Card>
          <p className="text-sm text-white/60">
            Your account can view pastoral data but cannot create new care cases.
          </p>
        </Card>
      </RouteModal>
    );
  }

  const onSubmit = (values) => createCaseMutation.mutate(values);

  return (
    <RouteModal
      title="Open Care Case"
      description="Capture the pastoral need, assign follow-up, and lock down sensitive notes when necessary."
      fallbackPath="/pastoral/cases"
      size="xl"
    >
      <form className="grid gap-6 xl:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Case Details</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Member and care need</h2>
          </div>

          <MemberSearchInput
            value={selectedMember || {}}
            onSelect={(member) => {
              setSelectedMember(member);
              form.setValue('memberId', member.memberId, { shouldValidate: true });
            }}
            onClear={() => {
              setSelectedMember(null);
              form.setValue('memberId', '', { shouldValidate: true });
            }}
          />
          {form.formState.errors.memberId ? (
            <p className="text-sm text-rose-300">{form.formState.errors.memberId.message}</p>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Case Type</span>
            <select
              {...form.register('type')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <option value="">Select care type</option>
              {CARE_CASE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatPastoralLabel(type)}
                </option>
              ))}
            </select>
            {form.formState.errors.type ? (
              <p className="text-sm text-rose-300">{form.formState.errors.type.message}</p>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Title</span>
            <input
              {...form.register('title')}
              placeholder="Short summary of the pastoral issue"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
            {form.formState.errors.title ? (
              <p className="text-sm text-rose-300">{form.formState.errors.title.message}</p>
            ) : null}
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Description</span>
            <textarea
              rows={5}
              {...form.register('description')}
              placeholder="Add helpful context for the care team"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
          </label>

          <div className="space-y-3">
            <span className="text-sm font-medium text-white/80">Urgency</span>
            <div className="grid gap-3 md:grid-cols-2">
              {CASE_URGENCY_OPTIONS.map((option) => (
                <label
                  key={option}
                  className={`cursor-pointer rounded-2xl border px-4 py-4 transition ${
                    urgency === option
                      ? option === 'critical'
                        ? 'border-rose-400 bg-rose-500/15 text-rose-100'
                        : 'border-accent bg-accent/10 text-white'
                      : 'border-white/10 bg-white/5 text-white/65'
                  }`}
                >
                  <input type="radio" value={option} {...form.register('urgency')} className="hidden" />
                  <p className="font-semibold">{formatPastoralLabel(option)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em]">
                    {option === 'critical' ? 'Immediate action' : 'Care workflow'}
                  </p>
                </label>
              ))}
            </div>
            {urgency === 'critical' ? (
              <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                This will immediately alert the head pastor.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Assignment and Access</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Protect sensitive follow-up</h2>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Assign To</span>
            <select
              {...form.register('assignedTo')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            >
              <option value="">Auto assign</option>
              {assignees.map((person) => (
                <option key={person._id} value={person._id}>
                  {person.fullName || person.username} - {formatPastoralLabel(person.role)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Tags</span>
            <input
              {...form.register('tags')}
              placeholder="Comma separated tags"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
          </label>

          {canViewConfidential ? (
            <div className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-4">
              <label className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-accent" />
                  <div>
                    <p className="font-semibold text-white">Is Confidential</p>
                    <p className="mt-1 text-sm text-white/60">
                      This case will have restricted access for sensitive pastoral handling.
                    </p>
                  </div>
                </div>
                <input type="checkbox" {...form.register('isConfidential')} className="mt-1 h-4 w-4" />
              </label>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/55">
              Only senior pastors can mark a case as confidential.
            </div>
          )}

          {isConfidential && canViewConfidential ? (
            <p className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-white/75">
              Senior-pastor-only visibility will apply to restricted notes in this case.
            </p>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Welfare Support</p>
                <p className="mt-1 text-sm text-white/55">Track practical assistance alongside the care case.</p>
              </div>
              <input type="checkbox" {...form.register('isReceivingSupport')} className="h-4 w-4" />
            </label>

            {isReceivingSupport ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-2 md:grid-cols-2">
                  {WELFARE_SUPPORT_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm text-white/75"
                    >
                      <input
                        type="checkbox"
                        checked={supportTypes.includes(option)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...supportTypes, option]
                            : supportTypes.filter((item) => item !== option);
                          form.setValue('supportTypes', next, { shouldValidate: true });
                        }}
                        className="h-4 w-4"
                      />
                      {formatPastoralLabel(option)}
                    </label>
                  ))}
                </div>

                {supportTypes.includes('financial') ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">Amount</span>
                    <input
                      type="number"
                      step="0.01"
                      {...form.register('supportAmount')}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                ) : null}

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Support Notes</span>
                  <textarea
                    rows={3}
                    {...form.register('supportNotes')}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </div>
            ) : null}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Initial Prayer Request</span>
            <textarea
              rows={4}
              {...form.register('initialPrayerRequest')}
              placeholder="Optional opening prayer request for this case"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
            />
          </label>
        </Card>

        <div className="xl:col-span-2">
          <Button type="submit" variant="secondary" disabled={createCaseMutation.isPending}>
            {createCaseMutation.isPending ? 'Opening Case...' : 'Open Care Case'}
          </Button>
        </div>
      </form>
    </RouteModal>
  );
}
