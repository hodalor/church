import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import RouteModal from '../../components/ui/RouteModal';
import { createTrack, getAllTracks, updateTrack } from '../../api/endpoints/pastoral';
import { DISCIPLESHIP_STEP_TYPES, DISCIPLESHIP_TARGET_GROUPS, formatPastoralLabel } from '../../utils/pastoral';

const stepSchema = z.object({
  title: z.string().min(1, 'Step title is required.'),
  type: z.string().min(1, 'Step type is required.'),
  description: z.string().optional(),
  durationDays: z.union([z.string(), z.number()]).optional(),
  resourcesText: z.string().optional(),
  isRequired: z.boolean().optional(),
});

const schema = z.object({
  name: z.string().min(2, 'Track name is required.'),
  targetGroup: z.string().min(1, 'Target group is required.'),
  description: z.string().optional(),
  steps: z.array(stepSchema).min(1, 'Add at least one step.'),
});

const buildDefaultStep = () => ({
  title: '',
  type: 'class',
  description: '',
  durationDays: '',
  resourcesText: '',
  isRequired: true,
});

export default function CreateTrackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get('trackId');

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      targetGroup: 'all',
      description: '',
      steps: [buildDefaultStep()],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  const tracksQuery = useQuery({
    queryKey: ['pastoral-track-edit-options'],
    queryFn: () => getAllTracks({}),
  });

  const existingTrack = (tracksQuery.data || []).find((track) => track.trackId === trackId);

  useEffect(() => {
    if (!existingTrack) {
      return;
    }

    form.reset({
      name: existingTrack.name || '',
      targetGroup: existingTrack.targetGroup || 'all',
      description: existingTrack.description || '',
      steps:
        existingTrack.steps?.map((step) => ({
          title: step.title || '',
          type: step.type || 'class',
          description: step.description || '',
          durationDays: step.durationDays || '',
          resourcesText: (step.resources || []).join(', '),
          isRequired: step.isRequired !== false,
        })) || [buildDefaultStep()],
    });
  }, [existingTrack, form]);

  const mutation = useMutation({
    mutationFn: (values) => {
      const payload = {
        name: values.name,
        targetGroup: values.targetGroup,
        description: values.description || undefined,
        steps: values.steps.map((step, index) => ({
          stepNumber: index + 1,
          title: step.title,
          type: step.type,
          description: step.description || undefined,
          durationDays: step.durationDays ? Number(step.durationDays) : undefined,
          resources: step.resourcesText
            ? step.resourcesText
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          isRequired: step.isRequired !== false,
        })),
      };

      return trackId ? updateTrack(trackId, payload) : createTrack(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastoral-track-library'] });
      queryClient.invalidateQueries({ queryKey: ['pastoral-discipleship-tracks'] });
      navigate('/pastoral/discipleship/tracks');
    },
  });

  return (
    <RouteModal
      title={trackId ? 'Edit Track' : 'Create Track'}
      description="Build a discipleship pathway with required steps, durations, and resources."
      fallbackPath="/pastoral/discipleship/tracks"
      size="xl"
    >
      <form className="space-y-6" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Track Details</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Foundation</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/80">Name</span>
              <input
                {...form.register('name')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/80">Target Group</span>
              <select
                {...form.register('targetGroup')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                {DISCIPLESHIP_TARGET_GROUPS.map((option) => (
                  <option key={option} value={option}>
                    {formatPastoralLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Description</span>
            <textarea
              rows={4}
              {...form.register('description')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            />
          </label>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Steps</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Progression</h2>
            </div>
            <Button variant="ghost" onClick={() => append(buildDefaultStep())}>
              + Add Step
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                    Step {index + 1}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => index > 0 && move(index, index - 1)}>
                      Up
                    </Button>
                    <Button variant="ghost" onClick={() => index < fields.length - 1 && move(index, index + 1)}>
                      Down
                    </Button>
                    {fields.length > 1 ? (
                      <Button variant="subtle" onClick={() => remove(index)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">Title</span>
                    <input
                      {...form.register(`steps.${index}.title`)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">Type</span>
                    <select
                      {...form.register(`steps.${index}.type`)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    >
                      {DISCIPLESHIP_STEP_TYPES.map((option) => (
                        <option key={option} value={option}>
                          {formatPastoralLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-white/80">Description</span>
                    <textarea
                      rows={3}
                      {...form.register(`steps.${index}.description`)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">Duration (days)</span>
                    <input
                      type="number"
                      min="1"
                      {...form.register(`steps.${index}.durationDays`)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">Required</span>
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <input type="checkbox" {...form.register(`steps.${index}.isRequired`)} className="h-4 w-4" />
                    </div>
                  </label>
                  <label className="block space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-white/80">Resources</span>
                    <input
                      {...form.register(`steps.${index}.resourcesText`)}
                      placeholder="Comma separated URLs"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Button type="submit" variant="secondary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save Track'}
        </Button>
      </form>
    </RouteModal>
  );
}
