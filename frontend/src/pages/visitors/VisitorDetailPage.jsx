import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import ConversionModal from '../../components/visitors/ConversionModal';
import FollowUpStatusIndicator from '../../components/visitors/FollowUpStatusIndicator';
import PipelineStageBadge from '../../components/visitors/PipelineStageBadge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import {
  assignVisitorsToCareLeader,
  completeVisitorFollowUp,
  convertVisitorToMember,
  createVisitorFollowUp,
  getVisitorAssignableLeaders,
  getVisitorById,
  recordVisitorReturnVisit,
  updateVisitorStage,
} from '../../api/endpoints/visitors';
import {
  FOLLOW_UP_METHOD_OPTIONS,
  FOLLOW_UP_OUTCOME_OPTIONS,
  VISITOR_STAGE_ORDER,
  formatStageLabel,
} from '../../utils/visitors';
import { formatDate } from '../../utils/formatDate';

const tabs = ['overview', 'visit_history', 'follow_ups', 'assimilation', 'survey'];

export default function VisitorDetailPage() {
  const { visitorId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showReturnVisitModal, setShowReturnVisitModal] = useState(false);
  const [showAddFollowUpModal, setShowAddFollowUpModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [reassignLeaderId, setReassignLeaderId] = useState('');
  const [returnVisitForm, setReturnVisitForm] = useState({
    serviceName: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [followUpForm, setFollowUpForm] = useState({
    method: 'call',
    scheduledDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [completeForm, setCompleteForm] = useState({
    outcome: 'spoke',
    notes: '',
    scheduleNextFollowUp: false,
    nextMethod: 'call',
    nextScheduledDate: new Date().toISOString().slice(0, 10),
    nextNotes: '',
  });

  const visitorQuery = useQuery({
    queryKey: ['visitor-detail', visitorId],
    queryFn: () => getVisitorById(visitorId),
  });

  const leadersQuery = useQuery({
    queryKey: ['visitor-detail-leaders'],
    queryFn: getVisitorAssignableLeaders,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['visitor-detail', visitorId] });
    queryClient.invalidateQueries({ queryKey: ['visitors-list'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-pipeline'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-follow-ups'] });
    queryClient.invalidateQueries({ queryKey: ['visitor-reports'] });
  };

  const stageMutation = useMutation({
    mutationFn: (stage) => updateVisitorStage(visitorId, stage),
    onSuccess: refresh,
  });

  const assignMutation = useMutation({
    mutationFn: (leaderId) => assignVisitorsToCareLeader([visitorId], leaderId),
    onSuccess: refresh,
  });

  const returnVisitMutation = useMutation({
    mutationFn: () => recordVisitorReturnVisit(visitorId, returnVisitForm),
    onSuccess: () => {
      setShowReturnVisitModal(false);
      setReturnVisitForm({
        serviceName: '',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
      });
      refresh();
    },
  });

  const addFollowUpMutation = useMutation({
    mutationFn: () => createVisitorFollowUp(visitorId, followUpForm),
    onSuccess: () => {
      setShowAddFollowUpModal(false);
      setFollowUpForm({
        method: 'call',
        scheduledDate: new Date().toISOString().slice(0, 10),
        notes: '',
      });
      refresh();
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => completeVisitorFollowUp(visitorId, selectedFollowUp.id, completeForm),
    onSuccess: () => {
      setShowCompleteModal(false);
      setSelectedFollowUp(null);
      refresh();
    },
  });

  const convertMutation = useMutation({
    mutationFn: (payload) => convertVisitorToMember(visitorId, payload),
    onSuccess: () => {
      setShowConvertModal(false);
      refresh();
    },
  });

  const visitor = visitorQuery.data;
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Visitors</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{visitor?.fullName || 'Visitor Detail'}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => setShowReturnVisitModal(true)}>
              Record Return Visit
            </Button>
            <Button variant="secondary" onClick={() => setShowConvertModal(true)}>
              Convert to Member
            </Button>
            <Link to={`/communication/broadcasts/new?audience=visitors&ids=${visitor?.id || ''}`}>
              <Button variant="ghost">Send Message</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-5">
            <div className="flex items-start gap-4">
              {visitor?.photoUrl ? (
                <img src={visitor.photoUrl} alt={visitor.fullName} className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 text-2xl font-semibold text-accent">
                  {(visitor?.fullName || 'V').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white">{visitor?.fullName}</h2>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/65">
                    {visitor?.visitorId}
                  </span>
                </div>
                <PipelineStageBadge stage={visitor?.stage} large />
                <div className="space-y-2 text-sm text-white/70">
                  <a href={visitor?.phone ? `tel:${visitor.phone}` : '#'} className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-accent" />
                    {visitor?.phone || 'No phone'}
                  </a>
                  <div>
                    <a href={visitor?.email ? `mailto:${visitor.email}` : '#'} className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-accent" />
                      {visitor?.email || 'No email'}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <MiniStat label="Days Since First Visit" value={visitor?.daysSinceFirstVisit || 0} />
              <MiniStat label="Total Visits" value={visitor?.totalVisits || 0} />
            </div>

            <Card className="space-y-3 border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Assigned Care Leader</p>
                  <p className="mt-2 text-sm font-semibold text-white">{visitor?.assignedTo?.name || 'Unassigned'}</p>
                </div>
                <FollowUpStatusIndicator followUps={visitor?.followUps} />
              </div>
              <div className="flex gap-3">
                <select
                  value={reassignLeaderId}
                  onChange={(event) => setReassignLeaderId(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Select care leader</option>
                  {(leadersQuery.data || []).map((leader) => (
                    <option key={leader.id} value={leader.id}>
                      {leader.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  disabled={!reassignLeaderId || assignMutation.isPending}
                  onClick={() => assignMutation.mutate(reassignLeaderId)}
                >
                  Reassign
                </Button>
              </div>
            </Card>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                    activeTab === tab ? 'bg-accent text-primary' : 'border border-white/10 bg-white/5 text-white/65'
                  }`}
                >
                  {tab.replaceAll('_', ' ')}
                </button>
              ))}
            </div>

            {activeTab === 'overview' ? (
              <Card className="space-y-4">
                <DetailGrid label="Gender" value={visitor?.gender} />
                <DetailGrid label="Age Group" value={visitor?.ageGroup} />
                <DetailGrid label="How they heard about us" value={visitor?.heardAboutUs?.replaceAll('_', ' ')} />
                <DetailGrid
                  label="Referred By"
                  value={
                    visitor?.referredByMember
                      ? <Link to={`/members/${visitor.referredByMember.memberId}`} className="text-accent">{visitor.referredByMember.memberName}</Link>
                      : '—'
                  }
                />
                <DetailGrid label="Branch" value={visitor?.branch} />
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Interests</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(visitor?.interests || []).length ? (
                      visitor.interests.map((interest) => (
                        <span key={interest} className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-sm text-accent">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-white/45">No interests recorded.</p>
                    )}
                  </div>
                </div>
                <DetailCard label="Prayer Request" value={visitor?.prayerRequest || 'No prayer request recorded.'} />
                <DetailCard label="Notes" value={visitor?.notes || 'No notes recorded.'} />
              </Card>
            ) : null}

            {activeTab === 'visit_history' ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Visit History</h3>
                  <Button variant="secondary" onClick={() => setShowReturnVisitModal(true)}>
                    Record Return Visit
                  </Button>
                </div>
                <div className="space-y-3">
                  {(visitor?.visits || []).map((visit) => (
                    <div key={visit.id} className={`rounded-2xl border px-4 py-4 ${visit.isFirstVisit ? 'border-accent/20 bg-accent/8' : 'border-white/10 bg-white/5'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{visit.serviceName || 'Service Visit'}</p>
                          <p className="text-sm text-white/55">{formatDate(visit.date)}</p>
                        </div>
                        {visit.isFirstVisit ? (
                          <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                            First Visit
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm text-white/70">{visit.notes || 'No notes.'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {activeTab === 'follow_ups' ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Follow-up Timeline</h3>
                  <Button variant="secondary" onClick={() => setShowAddFollowUpModal(true)}>
                    Add Follow-up
                  </Button>
                </div>
                <div className="space-y-3">
                  {(visitor?.followUps || []).map((followUp) => (
                    <div key={followUp.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{followUp.method?.replaceAll('_', ' ')}</p>
                          <p className="text-sm text-white/55">{formatDate(followUp.scheduledDate)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${followUp.status === 'completed' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
                            {followUp.status}
                          </span>
                          {followUp.status !== 'completed' ? (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setSelectedFollowUp(followUp);
                                setShowCompleteModal(true);
                              }}
                            >
                              Complete Follow-up
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-white/70">{followUp.notes || 'No notes.'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {activeTab === 'assimilation' ? (
              <Card className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Pipeline Stage</h3>
                  <p className="mt-1 text-sm text-white/55">Update assimilation progress with a single click.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {VISITOR_STAGE_ORDER.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => stageMutation.mutate(stage)}
                      className={`rounded-2xl border px-4 py-4 text-left ${
                        visitor?.stage === stage ? 'border-accent/40 bg-accent/12' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <p className="font-semibold text-white">{formatStageLabel(stage)}</p>
                      <p className="mt-1 text-sm text-white/45">Click to move visitor into this stage.</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Stage Change History</h4>
                  {(visitor?.stageHistory || []).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-white">{formatStageLabel(item.stage)}</p>
                        <p className="text-sm text-white/45">{formatDate(item.changedAt)}</p>
                      </div>
                      <p className="mt-2 text-sm text-white/65">{item.note}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-white">Workflow Progress</h4>
                  {(visitor?.workflowProgress || []).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="font-semibold text-white">Day {item.day}</p>
                      <p className="mt-1 text-sm text-white/60">{item.actionType?.replaceAll('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {activeTab === 'survey' ? (
              <Card className="space-y-4">
                {visitor?.survey ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-3">
                      <MiniStat label="Experience" value={`${visitor.survey.experience}/5`} />
                      <MiniStat label="Service Quality" value={`${visitor.survey.serviceQuality}/5`} />
                      <MiniStat label="Welcome Feeling" value={`${visitor.survey.welcomeFeeling}/5`} />
                    </div>
                    <DetailCard label="Feedback" value={visitor.survey.feedback} />
                    <MiniStat label="Would Return" value={visitor.survey.wouldReturn ? 'Yes' : 'No'} />
                  </>
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                    No survey results have been submitted yet.
                  </p>
                )}
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showReturnVisitModal}
        onClose={() => setShowReturnVisitModal(false)}
        title="Record Return Visit"
        description="Capture the next service attendance for this visitor."
      >
        <div className="space-y-4">
          <Input label="Service Name" value={returnVisitForm.serviceName} onChange={(event) => setReturnVisitForm((current) => ({ ...current, serviceName: event.target.value }))} />
          <Input label="Date" type="date" value={returnVisitForm.date} onChange={(event) => setReturnVisitForm((current) => ({ ...current, date: event.target.value }))} />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Notes</span>
            <textarea
              rows={3}
              value={returnVisitForm.notes}
              onChange={(event) => setReturnVisitForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
            />
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowReturnVisitModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => returnVisitMutation.mutate()} disabled={returnVisitMutation.isPending}>
              {returnVisitMutation.isPending ? 'Saving...' : 'Record Return Visit'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddFollowUpModal}
        onClose={() => setShowAddFollowUpModal(false)}
        title="Add Follow-up"
        description="Create a new follow-up activity for this visitor."
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Method</span>
            <select
              value={followUpForm.method}
              onChange={(event) => setFollowUpForm((current) => ({ ...current, method: event.target.value }))}
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
            label="Scheduled Date"
            type="date"
            value={followUpForm.scheduledDate}
            onChange={(event) => setFollowUpForm((current) => ({ ...current, scheduledDate: event.target.value }))}
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white/80">Notes</span>
            <textarea
              rows={3}
              value={followUpForm.notes}
              onChange={(event) => setFollowUpForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none"
            />
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowAddFollowUpModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => addFollowUpMutation.mutate()} disabled={addFollowUpMutation.isPending}>
              {addFollowUpMutation.isPending ? 'Saving...' : 'Add Follow-up'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Follow-up"
        description={`${visitor?.fullName || 'Visitor'} outcome recap`}
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
                <p className="font-semibold">
                  {option.emoji} {option.label}
                </p>
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
                <span className="text-sm font-medium text-white/80">Next Method</span>
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
            <Button variant="secondary" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending || !selectedFollowUp}>
              {completeMutation.isPending ? 'Saving...' : 'Save Outcome'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConversionModal
        isOpen={showConvertModal}
        visitor={visitor}
        onClose={() => setShowConvertModal(false)}
        isLoading={convertMutation.isPending}
        onConvert={(payload) => convertMutation.mutate(payload)}
      />
    </AppShell>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailGrid({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
      <div className="mt-2 text-sm font-medium text-white">{value || '—'}</div>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-2 text-sm text-white/75">{value}</p>
    </div>
  );
}
