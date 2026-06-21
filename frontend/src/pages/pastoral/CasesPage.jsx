import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getUsers } from '../../api/endpoints/users';
import { addInteraction, assignCase, getAllCases, updateCaseStatus } from '../../api/endpoints/pastoral';
import CaseStatusBadge from '../../components/pastoral/CaseStatusBadge';
import PastoralPageLayout from '../../components/pastoral/PastoralPageLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import useBranchOptions from '../../hooks/useBranchOptions';
import { usePastoralAccess } from '../../hooks/usePastoralAccess';
import {
  formatPastoralLabel,
  formatRelativeTime,
  formatShortDate,
  getCaseSearchText,
  getDaysOpen,
  getDaysOpenClasses,
  getLastInteraction,
} from '../../utils/pastoral';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'my', label: 'My Cases' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];

const pastoralRoles = ['head_pastor', 'associate_pastor', 'branch_pastor', 'care_leader'];

const interactionDefaults = {
  type: 'call',
  date: new Date().toISOString().slice(0, 10),
  duration: 30,
  location: '',
  summary: '',
  nextSteps: '',
  nextFollowUpDate: '',
};

export default function CasesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canCreatePastoral, canManagePastoral, user } = usePastoralAccess();
  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(tabs.some((item) => item.key === initialTab) ? initialTab : 'all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [reassignTarget, setReassignTarget] = useState({ ids: [], assignee: '' });
  const [quickInteractionCase, setQuickInteractionCase] = useState(null);
  const [interactionForm, setInteractionForm] = useState(interactionDefaults);
  const [filters, setFilters] = useState({
    type: '',
    urgency: searchParams.get('urgency') || '',
    assignedTo: '',
    branch: '',
    fromDate: '',
    toDate: '',
    search: '',
  });

  const usersQuery = useQuery({
    queryKey: ['pastoral-assignees'],
    queryFn: () => getUsers({ limit: 100 }),
  });

  const assignees = useMemo(
    () => (usersQuery.data || []).filter((person) => pastoralRoles.includes(person.role)),
    [usersQuery.data],
  );
  const { branchOptions, filterPlaceholder: branchFilterPlaceholder } = useBranchOptions({ includeCurrent: filters.branch });

  const casesQuery = useQuery({
    queryKey: ['pastoral-cases', activeTab, filters, user?.userId],
    queryFn: () =>
      getAllCases({
        limit: 100,
        type: filters.type || undefined,
        urgency: filters.urgency || undefined,
        assignedTo: activeTab === 'my' ? user?.userId : filters.assignedTo || undefined,
        branch: filters.branch || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        status: ['open', 'in_progress', 'resolved'].includes(activeTab) ? activeTab : undefined,
      }),
  });

  const refreshCases = () => {
    queryClient.invalidateQueries({ queryKey: ['pastoral-cases'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-care-stats'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-urgent-cases'] });
    queryClient.invalidateQueries({ queryKey: ['pastoral-my-cases-widget'] });
  };

  const closeCasesMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((caseId) => updateCaseStatus(caseId, 'closed')));
    },
    onSuccess: () => {
      setSelectedIds([]);
      refreshCases();
    },
  });

  const assignCasesMutation = useMutation({
    mutationFn: async ({ ids, assignee }) => {
      await Promise.all(ids.map((caseId) => assignCase(caseId, assignee)));
    },
    onSuccess: () => {
      setSelectedIds([]);
      setReassignTarget({ ids: [], assignee: '' });
      refreshCases();
    },
  });

  const interactionMutation = useMutation({
    mutationFn: ({ caseId, payload }) => addInteraction(caseId, payload),
    onSuccess: () => {
      setQuickInteractionCase(null);
      setInteractionForm(interactionDefaults);
      refreshCases();
    },
  });

  const cases = useMemo(() => {
    return (casesQuery.data?.items || [])
      .filter((careCase) => {
        if (activeTab === 'urgent') {
          return ['urgent', 'critical'].includes(careCase.urgency);
        }
        return true;
      })
      .filter((careCase) =>
        filters.search.trim()
          ? getCaseSearchText(careCase).includes(filters.search.trim().toLowerCase())
          : true,
      );
  }, [activeTab, casesQuery.data?.items, filters.search]);

  const toggleSelected = (caseId) => {
    setSelectedIds((current) =>
      current.includes(caseId) ? current.filter((value) => value !== caseId) : [...current, caseId],
    );
  };

  const allVisibleSelected = cases.length > 0 && cases.every((careCase) => selectedIds.includes(careCase.caseId));

  return (
    <PastoralPageLayout
      title="Care Cases"
      subtitle="Track pastoral follow-up, triage urgent care, and keep assignments balanced across leaders."
      action={
        canCreatePastoral ? (
          <Button variant="secondary" onClick={() => navigate('/pastoral/cases/new')}>
            + Open Care Case
          </Button>
        ) : null
      }
    >
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setSearchParams((current) => {
                  const next = new URLSearchParams(current);
                  next.set('tab', tab.key);
                  return next;
                });
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key ? 'bg-accent text-primary' : 'bg-white/5 text-white/65 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <select
            value={filters.type}
            onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">All types</option>
            {[
              'counseling',
              'bereavement',
              'hospital_visit',
              'home_visit',
              'welfare_support',
              'discipleship',
              'family_crisis',
              'other',
            ].map((option) => (
              <option key={option} value={option}>
                {formatPastoralLabel(option)}
              </option>
            ))}
          </select>
          <select
            value={filters.urgency}
            onChange={(event) => setFilters((current) => ({ ...current, urgency: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">All urgency</option>
            {['low', 'normal', 'urgent', 'critical'].map((option) => (
              <option key={option} value={option}>
                {formatPastoralLabel(option)}
              </option>
            ))}
          </select>
          <select
            value={filters.assignedTo}
            onChange={(event) => setFilters((current) => ({ ...current, assignedTo: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">Assigned to</option>
            {assignees.map((person) => (
              <option key={person._id} value={person._id}>
                {person.fullName || person.username}
              </option>
            ))}
          </select>
          <select
            value={filters.branch}
            onChange={(event) => setFilters((current) => ({ ...current, branch: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">{branchFilterPlaceholder}</option>
            {branchOptions.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
          <input
            type="date"
            value={filters.toDate}
            onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
        </div>

        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search by member name, case ID, title, or assignee"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(event) =>
                  setSelectedIds(event.target.checked ? cases.map((careCase) => careCase.caseId) : [])
                }
              />
              Select all
            </label>
            <span className="text-sm text-white/45">{cases.length} cases</span>
          </div>

          {selectedIds.length ? (
            <div className="flex flex-wrap gap-2">
              {canManagePastoral ? (
                <Button
                  variant="ghost"
                  onClick={() => setReassignTarget({ ids: selectedIds, assignee: '' })}
                  disabled={assignCasesMutation.isPending}
                >
                  Bulk Reassign
                </Button>
              ) : null}
              <Button
                variant="secondary"
                onClick={() => closeCasesMutation.mutate(selectedIds)}
                disabled={closeCasesMutation.isPending}
              >
                Bulk Close
              </Button>
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-[18px]">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.02]">
              <tr className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                {[
                  '',
                  'Member',
                  'Case ID',
                  'Type',
                  'Urgency / Status',
                  'Assigned To',
                  'Last Interaction',
                  'Days Open',
                  'Actions',
                ].map((header) => (
                  <th key={header} className="px-4 py-3.5 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-white/80">
              {cases.length ? (
                cases.map((careCase) => {
                  const lastInteraction = getLastInteraction(careCase);
                  const daysOpen = getDaysOpen(careCase.createdAt);
                  return (
                    <tr key={careCase.caseId} className="transition hover:bg-white/[0.025]">
                      <td className="px-4 py-3.5 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(careCase.caseId)}
                          onChange={() => toggleSelected(careCase.caseId)}
                        />
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                            {(careCase.memberName || 'M').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{careCase.memberName}</p>
                            <p className="text-xs text-white/45">{careCase.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-white/60">{careCase.caseId}</td>
                      <td className="px-4 py-3.5 align-middle">{formatPastoralLabel(careCase.type)}</td>
                      <td className="px-4 py-3.5 align-middle">
                        <CaseStatusBadge status={careCase.status} urgency={careCase.urgency} />
                      </td>
                      <td className="px-4 py-3.5 align-middle">{careCase.assignedToName || 'Unassigned'}</td>
                      <td className="px-4 py-3.5 align-middle">
                        <div>
                          <p>{lastInteraction ? formatShortDate(lastInteraction.date) : 'No interaction yet'}</p>
                          <p className="mt-1 text-xs text-white/45">
                            {lastInteraction ? formatRelativeTime(lastInteraction.date) : 'Awaiting first follow-up'}
                          </p>
                        </div>
                      </td>
                      <td className={`px-4 py-3.5 align-middle font-semibold ${getDaysOpenClasses(daysOpen)}`}>
                        {daysOpen}
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/pastoral/cases/${careCase.caseId}`}>
                            <Button variant="ghost" className="px-3 py-2 text-xs">
                              View
                            </Button>
                          </Link>
                          {canManagePastoral ? (
                            <Button
                              variant="subtle"
                              className="px-3 py-2 text-xs"
                              onClick={() => setReassignTarget({ ids: [careCase.caseId], assignee: careCase.assignedTo || '' })}
                            >
                              Reassign
                            </Button>
                          ) : null}
                          {['resolved', 'closed'].includes(careCase.status) ? null : (
                            <Button
                              variant="secondary"
                              className="px-3 py-2 text-xs"
                              onClick={() => closeCasesMutation.mutate([careCase.caseId])}
                            >
                              Close
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className="px-3 py-2 text-xs"
                            onClick={() => {
                              setQuickInteractionCase(careCase);
                              setInteractionForm({
                                ...interactionDefaults,
                                location: careCase.branch || '',
                              });
                            }}
                          >
                            Quick Add Interaction
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-white/45">
                    {casesQuery.isLoading ? 'Loading care cases...' : 'No care cases match the current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={Boolean(reassignTarget.ids.length)}
        onClose={() => setReassignTarget({ ids: [], assignee: '' })}
        title="Reassign Care Cases"
        description="Move the selected care cases to another pastoral leader."
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-white/60">
            {reassignTarget.ids.length} case{reassignTarget.ids.length === 1 ? '' : 's'} selected
          </p>
          <select
            value={reassignTarget.assignee}
            onChange={(event) => setReassignTarget((current) => ({ ...current, assignee: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            <option value="">Select pastor or care leader</option>
            {assignees.map((person) => (
              <option key={person._id} value={person._id}>
                {person.fullName || person.username} - {formatPastoralLabel(person.role)}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setReassignTarget({ ids: [], assignee: '' })}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => assignCasesMutation.mutate(reassignTarget)}
              disabled={!reassignTarget.assignee || assignCasesMutation.isPending}
            >
              {assignCasesMutation.isPending ? 'Saving...' : 'Reassign'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(quickInteractionCase)}
        onClose={() => {
          setQuickInteractionCase(null);
          setInteractionForm(interactionDefaults);
        }}
        title="Quick Add Interaction"
        description={quickInteractionCase ? `Add a follow-up note for ${quickInteractionCase.memberName}.` : ''}
        size="lg"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={interactionForm.type}
            onChange={(event) => setInteractionForm((current) => ({ ...current, type: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          >
            {['visit', 'call', 'prayer', 'counseling_session', 'message', 'hospital_visit', 'group_session'].map(
              (option) => (
                <option key={option} value={option}>
                  {formatPastoralLabel(option)}
                </option>
              ),
            )}
          </select>
          <input
            type="date"
            value={interactionForm.date}
            onChange={(event) => setInteractionForm((current) => ({ ...current, date: event.target.value }))}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
          <input
            type="number"
            min="1"
            value={interactionForm.duration}
            onChange={(event) => setInteractionForm((current) => ({ ...current, duration: event.target.value }))}
            placeholder="Duration in minutes"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
          />
          <input
            value={interactionForm.location}
            onChange={(event) => setInteractionForm((current) => ({ ...current, location: event.target.value }))}
            placeholder="Location"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
          />
          <textarea
            rows={4}
            value={interactionForm.summary}
            onChange={(event) => setInteractionForm((current) => ({ ...current, summary: event.target.value }))}
            placeholder="Interaction summary"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 md:col-span-2"
          />
          <textarea
            rows={3}
            value={interactionForm.nextSteps}
            onChange={(event) => setInteractionForm((current) => ({ ...current, nextSteps: event.target.value }))}
            placeholder="Next steps"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 md:col-span-2"
          />
          <input
            type="date"
            value={interactionForm.nextFollowUpDate}
            onChange={(event) =>
              setInteractionForm((current) => ({ ...current, nextFollowUpDate: event.target.value }))
            }
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              setQuickInteractionCase(null);
              setInteractionForm(interactionDefaults);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              interactionMutation.mutate({
                caseId: quickInteractionCase.caseId,
                payload: {
                  ...interactionForm,
                  duration: Number(interactionForm.duration || 0) || undefined,
                  nextFollowUpDate: interactionForm.nextFollowUpDate || undefined,
                },
              })
            }
            disabled={!interactionForm.summary.trim() || interactionMutation.isPending}
          >
            {interactionMutation.isPending ? 'Saving...' : 'Add Interaction'}
          </Button>
        </div>
      </Modal>
    </PastoralPageLayout>
  );
}
