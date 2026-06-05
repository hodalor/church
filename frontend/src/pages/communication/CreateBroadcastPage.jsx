import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import RouteModal from '../../components/ui/RouteModal';
import AudienceSelector from '../../components/communication/AudienceSelector';
import ChannelIcons from '../../components/communication/ChannelIcons';
import MessageComposer from '../../components/communication/MessageComposer';
import { createBroadcast, getCommunicationDashboard } from '../../api/endpoints/communication';
import { useCommunicationAccess } from '../../hooks/useCommunicationAccess';

const channelOptions = [
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'push', label: 'Push' },
  { value: 'in_app', label: 'In-App', locked: true },
];

export default function CreateBroadcastPage() {
  const navigate = useNavigate();
  const { canCreateBroadcasts } = useCommunicationAccess();
  const [searchParams] = useSearchParams();
  const [successState, setSuccessState] = useState(null);
  const initialForm = useMemo(() => {
    const audienceType = searchParams.get('audienceType') || 'all_members';
    const memberIds = (searchParams.get('memberIds') || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const template = searchParams.get('template');

    return {
      title: template === 'follow_up' ? 'We Missed You' : '',
      subject: template === 'follow_up' ? 'We missed you at church' : '',
      message:
        template === 'follow_up'
          ? 'Hi {{firstName}}, we missed you at service and would love to see you again this week. Reply if you need prayer or support.'
          : '',
      channels: ['in_app'],
      audience:
        audienceType === 'specific_members'
          ? { type: 'specific_members', memberIds }
          : { type: audienceType },
      sendOption: 'now',
      scheduledAt: '',
      recurringEnabled: false,
      recurring: { frequency: 'daily', dayOfWeek: 1, dayOfMonth: 1, endDate: '' },
    };
  }, [searchParams]);
  const [form, setForm] = useState(initialForm);

  const dashboardQuery = useQuery({
    queryKey: ['communication-dashboard-config'],
    queryFn: () => getCommunicationDashboard(),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => createBroadcast(payload),
    onSuccess: (data) => {
      setSuccessState(data);
    },
  });

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setRecurringField = (key, value) => {
    setForm((current) => ({
      ...current,
      recurring: {
        ...current.recurring,
        [key]: value,
      },
    }));
  };

  const payload = useMemo(() => {
    const status = form.sendOption === 'now' ? 'sent' : 'scheduled';
    const recurring = form.recurringEnabled
      ? {
          enabled: true,
          frequency: form.recurring.frequency,
          dayOfWeek: Number(form.recurring.dayOfWeek),
          dayOfMonth: Number(form.recurring.dayOfMonth),
          endDate: form.recurring.endDate || undefined,
        }
      : { enabled: false };

    return {
      title: form.title,
      subject: form.subject,
      message: form.message,
      channels: form.channels,
      audience: form.audience,
      status,
      scheduledAt: form.sendOption === 'later' ? form.scheduledAt : undefined,
      recurring,
    };
  }, [form]);

  if (successState) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-white">Broadcast sent</h1>
          <p className="mt-3 text-sm text-white/60">
            Broadcast sent to {successState.stats?.totalRecipients || successState.audience?.estimatedReach || 0} members across {successState.channels?.length || 0} channels.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={`/communication/broadcasts/${successState._id}`}>
              <Button variant="secondary">View Broadcast</Button>
            </Link>
            <Button variant="subtle" onClick={() => setSuccessState(null)}>
              New Broadcast
            </Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RouteModal
        title="Create Broadcast"
        description="Compose a church broadcast, choose the audience, and send or schedule it."
        fallbackPath="/communication/broadcasts"
        size="xl"
      >
        {!canCreateBroadcasts ? (
          <Card>
            <p className="text-sm uppercase tracking-[0.22em] text-accent">Communication</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
            <p className="mt-3 text-sm text-white/60">
              Your account does not currently have permission to create broadcasts.
            </p>
          </Card>
        ) : null}
        {canCreateBroadcasts ? <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-6">
            <Card className="space-y-4">
              <p className="text-sm uppercase tracking-[0.22em] text-white/50">Step 1 - Compose</p>
              <Input label="Title" value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Sunday service reminder" />
              <Input label="Subject" value={form.subject} onChange={(event) => setField('subject', event.target.value)} placeholder="Email subject" />
              <MessageComposer value={form.message} onChange={(value) => setField('message', value)} maxLength={1200} channels={form.channels} />
            </Card>

            <Card className="space-y-4">
              <p className="text-sm uppercase tracking-[0.22em] text-white/50">Step 2 - Audience + Channels</p>
              <AudienceSelector value={form.audience} onChange={(value) => setField('audience', value)} title={form.title} message={form.message} channels={form.channels} />

              <div className="space-y-3">
                <p className="text-sm font-medium text-white/75">Channels</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {channelOptions.map((channel) => {
                    const active = form.channels.includes(channel.value);
                    const config = (dashboardQuery.data?.channelStatuses || []).find((item) => item.channel === channel.value);
                    return (
                      <button
                        key={channel.value}
                        type="button"
                        disabled={channel.locked}
                        onClick={() => {
                          if (channel.locked) {
                            return;
                          }
                          setField(
                            'channels',
                            active
                              ? form.channels.filter((item) => item !== channel.value)
                              : [...form.channels, channel.value],
                          );
                        }}
                        className={`rounded-2xl border px-4 py-4 text-left ${
                          active
                            ? 'border-accent/50 bg-accent/10 text-accent'
                            : 'border-white/10 bg-white/5 text-white/70'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{channel.label}</span>
                          <span className={config?.configured || channel.locked ? 'text-emerald-400' : 'text-white/35'}>
                            {config?.configured || channel.locked ? 'Configured' : 'Not configured'}
                          </span>
                        </div>
                        {!config?.configured && !channel.locked && config?.hint ? <p className="mt-2 text-xs text-white/50">{config.hint}</p> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <p className="text-sm uppercase tracking-[0.22em] text-white/50">Step 3 - Schedule + Review</p>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setField('sendOption', 'now')}
                  className={`rounded-2xl border px-4 py-4 text-left ${form.sendOption === 'now' ? 'border-accent/50 bg-accent/10 text-accent' : 'border-white/10 bg-white/5 text-white/70'}`}
                >
                  Send Now
                </button>
                <button
                  type="button"
                  onClick={() => setField('sendOption', 'later')}
                  className={`rounded-2xl border px-4 py-4 text-left ${form.sendOption === 'later' ? 'border-accent/50 bg-accent/10 text-accent' : 'border-white/10 bg-white/5 text-white/70'}`}
                >
                  Schedule for Later
                </button>
              </div>

              {form.sendOption === 'later' ? (
                <Input
                  label="Schedule Time"
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) => setField('scheduledAt', event.target.value)}
                />
              ) : null}

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.recurringEnabled}
                  onChange={(event) => setField('recurringEnabled', event.target.checked)}
                />
                <span className="text-sm font-medium text-white/75">Enable recurring</span>
              </label>

              {form.recurringEnabled ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/75">Frequency</span>
                    <select
                      value={form.recurring.frequency}
                      onChange={(event) => setRecurringField('frequency', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </label>
                  {form.recurring.frequency === 'weekly' ? (
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-white/75">Day of Week</span>
                      <select
                        value={form.recurring.dayOfWeek}
                        onChange={(event) => setRecurringField('dayOfWeek', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
                      >
                        <option value={0}>Sunday</option>
                        <option value={1}>Monday</option>
                        <option value={2}>Tuesday</option>
                        <option value={3}>Wednesday</option>
                        <option value={4}>Thursday</option>
                        <option value={5}>Friday</option>
                        <option value={6}>Saturday</option>
                      </select>
                    </label>
                  ) : null}
                  {form.recurring.frequency === 'monthly' ? (
                    <Input
                      label="Day of Month"
                      type="number"
                      min="1"
                      max="31"
                      value={form.recurring.dayOfMonth}
                      onChange={(event) => setRecurringField('dayOfMonth', event.target.value)}
                    />
                  ) : null}
                  <Input
                    label="End Date"
                    type="date"
                    value={form.recurring.endDate}
                    onChange={(event) => setRecurringField('endDate', event.target.value)}
                  />
                </div>
              ) : null}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="space-y-4">
              <p className="text-sm uppercase tracking-[0.22em] text-white/50">Review</p>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Title</p>
                  <p className="mt-1 text-sm font-semibold text-white">{form.title || 'Untitled broadcast'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Message</p>
                  <p className="mt-1 text-sm text-white/65">{form.message ? `${form.message.slice(0, 160)}${form.message.length > 160 ? '...' : ''}` : 'No message yet'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Channels</p>
                  <div className="mt-2">
                    <ChannelIcons channels={form.channels} size="md" />
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Audience</p>
                  <p className="mt-1 text-sm text-white/65">{String(form.audience.type || 'all_members').replaceAll('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Schedule</p>
                  <p className="mt-1 text-sm text-white/65">{form.sendOption === 'later' ? form.scheduledAt || 'Not set' : 'Send now'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="ghost" className="w-full" onClick={() => createMutation.mutate({ ...payload, status: 'draft' })}>
                  Save as Draft
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={!form.title || !form.message}
                  onClick={() => createMutation.mutate(payload)}
                >
                  {form.sendOption === 'later' ? 'Schedule' : 'Send Now'}
                </Button>
                <Button
                  variant="subtle"
                  className="w-full"
                  onClick={() => navigate('/communication/broadcasts', { replace: true })}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        </div> : null}
      </RouteModal>
    </AppShell>
  );
}
