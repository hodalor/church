import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import {
  completeVisitorFollowUp,
  getVisitorFollowUps,
  rescheduleVisitorFollowUp,
} from '../../api/endpoints/visitors';
import useVisitorsAccess from '../../hooks/useVisitorsAccess';
import { FOLLOW_UP_METHOD_OPTIONS, FOLLOW_UP_OUTCOME_OPTIONS } from '../../utils/visitors';
import { formatDate } from '../../utils/formatDate';

const filterTabs = ['my', 'all', 'overdue', 'today', 'upcoming'];

export default function FollowUpsPage() {
  const queryClient = useQueryClient();
  const { canOpenFollowUps, canCompleteFollowUps, canRescheduleFollowUps } = useVisitorsAccess();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    outcome: 'spoke',
    notes: '',
    scheduleNextFollowUp: false,
    nextMethod: 'call',
    nextScheduledDate: new Date().toISOString().slice(0, 10),
    nextNotes: '',
  });
  const [rescheduleForm, setRescheduleForm] = useState({
    method: 'call',
    scheduledDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const followUpsQuery = useQuery({
    queryKey: ['visitor-follow-ups'],
    queryFn: getVisitorFollowUps,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['visitor-follow-ups'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-detail'] });
    queryClient.invalidateQueries({ queryKey: ['visitors-list'] });
  };

  const completeMutation = useMutation({
    mutationFn: () => completeVisitorFollowUp(selectedItem.visitorId, selectedItem.id, completeForm),
    onSuccess: () => {
      setShowCompleteModal(false);
      setSelectedItem(null);
      refresh();
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => rescheduleVisitorFollowUp(selectedItem.visitorId, selectedItem.id, rescheduleForm),
    onSuccess: () => {
      setShowRescheduleModal(false);
      setSelectedItem(null);
      refresh();
    },
  });

  const grouped = useMemo(() => {
    const data = followUpsQuery.data || { overdue: [], today: [], upcoming: [], items: [] };
    switch (activeTab) {
      case 'overdue':
        return { overdue: data.overdue, today: [], upcoming: [] };
      case 'today':
        return { overdue: [], today: data.today, upcoming: [] };
      case 'upcoming':
        return { overdue: [], today: [], upcoming: data.upcoming };
      case 'my':
      case 'all':
      default:
        return {
          overdue: data.overdue,
          today: data.today,
          upcoming: data.upcoming.filter((item) => item.status !== 'completed'),
        };
    }
  }, [activeTab, followUpsQuery.data]);

  if (!canOpenFollowUps) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Visitors</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to visitor follow-ups.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Visitors</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Follow-ups</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                activeTab === tab ? 'bg-accent text-primary' : 'border border-white/10 bg-white/5 text-white/65'
              }`}
            >
              {tab === 'my' ? 'My Follow-ups' : tab}
            </button>
          ))}
        </div>

        <FollowUpSection
          title="Overdue"
          toneClassName="border-rose-400/20 bg-rose-500/8"
          items={grouped.overdue}
          canComplete={canCompleteFollowUps}
          canReschedule={canRescheduleFollowUps}
          onComplete={(item) => {
            setSelectedItem(item);
            setShowCompleteModal(true);
          }}
          onReschedule={(item) => {
            setSelectedItem(item);
            setRescheduleForm({
              method: item.method,
              scheduledDate: item.scheduledDate,
              notes: item.notes || '',
            });
            setShowRescheduleModal(true);
          }}
        />

        <FollowUpSection
          title="Today"
          toneClassName="border-amber-400/20 bg-amber-500/8"
          items={grouped.today}
          canComplete={canCompleteFollowUps}
          canReschedule={canRescheduleFollowUps}
          onComplete={(item) => {
            setSelectedItem(item);
            setShowCompleteModal(true);
          }}
          onReschedule={(item) => {
            setSelectedItem(item);
            setRescheduleForm({
              method: item.method,
              scheduledDate: item.scheduledDate,
              notes: item.notes || '',
            });
            setShowRescheduleModal(true);
          }}
        />

        <FollowUpSection
          title="Upcoming"
          toneClassName="border-white/10 bg-white/[0.03]"
          items={grouped.upcoming}
          canComplete={canCompleteFollowUps}
          canReschedule={canRescheduleFollowUps}
          onComplete={(item) => {
            setSelectedItem(item);
            setShowCompleteModal(true);
          }}
          onReschedule={(item) => {
            setSelectedItem(item);
            setRescheduleForm({
              method: item.method,
              scheduledDate: item.scheduledDate,
              notes: item.notes || '',
            });
            setShowRescheduleModal(true);
          }}
        />
      </div>

      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Follow-up"
        description={selectedItem ? `${selectedItem.visitorName} recap` : 'Follow-up recap'}
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {FOLLOW_UP_OUTCOME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCompleteForm((current) => ({ ...current, outcome: option.value }))}
                className={`rounded-2xl border px-4 py-4 text-left ${
                  completeForm.outcome === option.value ? 'border-accent/40 bg-accent/12 text-accent' : 'border-white/10 bg-white/5 text-white/70'
                }`}
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Notes</span>
            <textarea
              rows={3}
              value={completeForm.notes}
              onChange={(event) => setCompleteForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={completeForm.scheduleNextFollowUp}
              onChange={(event) => setCompleteForm((current) => ({ ...current, scheduleNextFollowUp: event.target.checked }))}
            />
            Schedule Next Follow-up
          </label>
          {completeForm.scheduleNextFollowUp ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Method</span>
                <select
                  value={completeForm.nextMethod}
                  onChange={(event) => setCompleteForm((current) => ({ ...current, nextMethod: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
                >
                  {FOLLOW_UP_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Next Date"
                type="date"
                value={completeForm.nextScheduledDate}
                onChange={(event) => setCompleteForm((current) => ({ ...current, nextScheduledDate: event.target.value }))}
              />
            </div>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCompleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => completeMutation.mutate()}
              disabled={!selectedItem || completeMutation.isPending || !canCompleteFollowUps}
            >
              {completeMutation.isPending ? 'Saving...' : 'Save Outcome'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Follow-up"
        description={selectedItem ? `Reschedule ${selectedItem.visitorName}` : 'Reschedule follow-up'}
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Method</span>
            <select
              value={rescheduleForm.method}
              onChange={(event) => setRescheduleForm((current) => ({ ...current, method: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
            >
              {FOLLOW_UP_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Due Date"
            type="date"
            value={rescheduleForm.scheduledDate}
            onChange={(event) => setRescheduleForm((current) => ({ ...current, scheduledDate: event.target.value }))}
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Notes</span>
            <textarea
              rows={3}
              value={rescheduleForm.notes}
              onChange={(event) => setRescheduleForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
            />
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowRescheduleModal(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => rescheduleMutation.mutate()}
              disabled={!selectedItem || rescheduleMutation.isPending || !canRescheduleFollowUps}
            >
              {rescheduleMutation.isPending ? 'Saving...' : 'Reschedule'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

function FollowUpSection({ title, toneClassName, items, onComplete, onReschedule, canComplete, canReschedule }) {
  return (
    <Card className={`space-y-4 ${toneClassName}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/65">
          {items.length}
        </span>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0d1320] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-white">
                  {item.visitorName} • {item.visitorPhone}
                </p>
                <p className="text-sm text-white/55">
                  Stage: {item.stage.replaceAll('_', ' ')} • Method: {item.method.replaceAll('_', ' ')}
                </p>
                <p className="text-sm text-white/45">
                  Due {formatDate(item.scheduledDate)}
                  {item.overdueDays ? ` • Overdue by ${item.overdueDays} days` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canComplete ? (
                  <Button variant="secondary" onClick={() => onComplete(item)}>
                    Mark Complete
                  </Button>
                ) : null}
                {canReschedule ? (
                  <Button variant="ghost" onClick={() => onReschedule(item)}>
                    Reschedule
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-[#0d1320] px-4 py-6 text-sm text-white/45">
          No follow-ups in this section.
        </p>
      )}
    </Card>
  );
}
