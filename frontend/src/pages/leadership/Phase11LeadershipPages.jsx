import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Bar, BarChart, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import {
  addAssessment,
  addMilestone,
  addQualification,
  createLeadershipProfile,
  createSuccessionPlan,
  getAllProfiles,
  getAllSuccessionPlans,
  getLeadershipReport,
  getLeadershipStats,
  getProfileById,
  getReadinessReport,
  getSuccessionRiskReport,
  updateDevelopmentStatus,
} from '../../api/endpoints/leadership';
import { getUsers } from '../../api/endpoints/users';
import { downloadJsonFile } from '../../utils/exportData';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const statusMeta = {
  identified: { label: 'Identified', badgeClassName: 'bg-slate-500/15 text-slate-200', column: 'identified' },
  in_training: { label: 'In Development', badgeClassName: 'bg-sky-500/15 text-sky-200', column: 'in_development' },
  ready_now: { label: 'Ready', badgeClassName: 'bg-emerald-500/15 text-emerald-200', column: 'ready' },
  ready_soon: { label: 'Appointed', badgeClassName: 'bg-violet-500/15 text-violet-200', column: 'appointed' },
  not_ready: { label: 'Paused', badgeClassName: 'bg-amber-500/15 text-amber-100', column: 'paused' },
};

const columnToStatus = {
  identified: 'identified',
  in_development: 'in_training',
  ready: 'ready_now',
  appointed: 'ready_soon',
  paused: 'not_ready',
};

const tierOptions = [
  { value: 'tier_1', label: 'Tier 1 (Executive)' },
  { value: 'tier_2', label: 'Tier 2 (Senior)' },
  { value: 'tier_3', label: 'Tier 3 (Middle)' },
  { value: 'tier_4', label: 'Tier 4 (Emerging)' },
];

const profileSchema = z.object({
  memberId: z.string().min(1, 'Member is required.'),
  memberName: z.string().min(1, 'Member name is required.'),
  currentRole: z.string().min(1, 'Current role is required.'),
  targetRole: z.string().optional(),
  mentorId: z.string().optional(),
  mentorName: z.string().optional(),
  successionStatus: z.string().min(1, 'Development status is required.'),
  readinessScore: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  strengths: z.string().optional(),
  growthAreas: z.string().optional(),
  branch: z.string().optional(),
  tier: z.string().optional(),
});

const planSchema = z.object({
  title: z.string().min(2, 'Plan title is required.'),
  roleName: z.string().min(2, 'Role is required.'),
  currentHolderName: z.string().optional(),
  emergencySuccessorName: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  reviewDate: z.string().optional(),
});

const assessmentSchema = z.object({
  type: z.string().min(1, 'Assessment type is required.'),
  date: z.string().optional(),
  notes: z.string().optional(),
  strengths: z.string().optional(),
  growthAreas: z.string().optional(),
});

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleDateString();
};

const formatLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getStatus = (value) =>
  statusMeta[value] || {
    label: formatLabel(value),
    badgeClassName: 'bg-white/10 text-white/75',
    column: 'identified',
  };

function Badge({ children, className = 'bg-white/10 text-white/75' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, helper, action }) {
  const tones = {
    'Total Leaders': 'bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(14,22,36,0.98))]',
    'Ready for Promotion': 'bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(14,22,36,0.98))]',
    'In Development': 'bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(14,22,36,0.98))]',
    'Succession Coverage': 'bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(14,22,36,0.98))]',
    'Roles Covered': 'bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(14,22,36,0.98))]',
    'Roles Uncovered': 'bg-[linear-gradient(135deg,rgba(251,113,133,0.16),rgba(14,22,36,0.98))]',
    'Overall Risk Level': 'bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(14,22,36,0.98))]',
  };
  return (
    <Card className={`min-h-[102px] p-3.5 ${tones[label] || ''}`}>
      <p className="inline-flex rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/75">{label}</p>
      <p className="mt-3 font-serif text-[2rem] font-semibold leading-none text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </Card>
  );
}

function ReadinessRing({ value }) {
  const score = Math.max(0, Math.min(Number(value || 0), 100));
  const color = score >= 80 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative h-32 w-32">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[
              { name: 'score', value: score, fill: color },
              { name: 'remainder', value: 100 - score, fill: 'rgba(255,255,255,0.08)' },
            ]}
            dataKey="value"
            innerRadius={40}
            outerRadius={60}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="rgba(255,255,255,0.08)" />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-semibold text-white">{Math.round(score)}%</p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Readiness</p>
      </div>
    </div>
  );
}

function UserSelect({ label, value, onChange, users }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[13px] font-medium text-white/75">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
      >
        <option value="">Select user</option>
        {users.map((user) => (
          <option key={user.userId || user.id || user._id} value={user.userId || user.id || user._id}>
            {user.fullName || user.username}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LeadershipDashboard() {
  const statsQuery = useQuery({
    queryKey: ['leadership-stats'],
    queryFn: getLeadershipStats,
  });
  const riskQuery = useQuery({
    queryKey: ['leadership-risk-report'],
    queryFn: getSuccessionRiskReport,
  });
  const profilesQuery = useQuery({
    queryKey: ['leadership-dashboard-profiles'],
    queryFn: () => getAllProfiles({ limit: 200 }),
  });

  const stats = statsQuery.data || {};
  const risk = riskQuery.data || [];
  const profiles = profilesQuery.data?.candidates || profilesQuery.data?.items || [];
  const uncovered = risk.filter((item) => item.risk === 'critical');
  const highRisk = risk.filter((item) => item.risk === 'high');

  const tierBreakdown = tierOptions.map((tier) => ({
    name: tier.label,
    value: profiles.filter((profile) => profile.tier === tier.value).length,
  }));

  const dueAssessments = profiles.filter((profile) => {
    const lastUpdate = new Date(profile.updatedAt || profile.createdAt || 0);
    return Date.now() - lastUpdate.getTime() > 180 * 24 * 60 * 60 * 1000;
  });

  const pipelinePreview = ['identified', 'in_training', 'ready_now', 'ready_soon', 'not_ready'].map((status) => ({
    status,
    label: getStatus(status).label,
    items: profiles.filter((profile) => profile.successionStatus === status),
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Leadership Development"
          subtitle="Track leadership readiness, development coverage, and succession exposure."
          action={
            <div className="flex gap-3">
              <Link to="/leadership/profiles">
                <Button variant="ghost">Profiles</Button>
              </Link>
              <Link to="/leadership/profiles/new">
                <Button variant="secondary">+ Identify Leader</Button>
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Leaders" value={stats.candidates?.total || 0} />
          <StatCard label="Ready for Promotion" value={stats.candidates?.readyNow || 0} />
          <StatCard label="In Development" value={stats.candidates?.inTraining || 0} />
          <StatCard
            label="Succession Coverage"
            value={`${stats.successionPlans?.total ? ((stats.successionPlans.total - (stats.successionPlans.highRisk || 0)) / stats.successionPlans.total * 100).toFixed(1) : 0}%`}
          />
        </div>

        {uncovered.length ? (
        <div className="rounded-3xl border border-rose-500/25 bg-[linear-gradient(135deg,rgba(251,113,133,0.16),rgba(13,19,32,0.98))] px-4 py-3.5 text-white">
            <p className="font-semibold">{uncovered.length} key roles have no identified successor.</p>
          </div>
        ) : null}
        {!uncovered.length && highRisk.length ? (
          <div className="rounded-3xl border border-amber-500/25 bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(13,19,32,0.98))] px-4 py-3.5 text-white">
            <p className="font-semibold">High risk roles: {highRisk.map((item) => item.roleName).join(', ')}</p>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Pipeline Preview</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Development pipeline</h2>
              </div>
              <Link to="/leadership/profiles?view=pipeline">
                <Button variant="ghost">View Full Pipeline</Button>
              </Link>
            </div>
            <div className="grid gap-4 xl:grid-cols-5">
              {pipelinePreview.map((column) => (
                <div key={column.status} className="rounded-2xl border border-violet-300/15 bg-violet-400/10 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-white">{column.label}</p>
                    <Badge className={getStatus(column.status).badgeClassName}>{column.items.length}</Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    {column.items.slice(0, 3).map((item) => (
                      <p key={item.candidateId} className="text-sm text-white/70">{item.memberName}</p>
                    ))}
                    {!column.items.length ? <p className="text-sm text-white/35">No leaders</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Tier Breakdown</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Leadership tiers</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierBreakdown} dataKey="value" nameKey="name" outerRadius={120}>
                    {tierBreakdown.map((item, index) => (
                      <Cell key={item.name} fill={['#C9A84C', '#60A5FA', '#A78BFA', '#34D399'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Assessments Due</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Leaders needing review</h2>
          </div>
          <div className="space-y-3">
            {dueAssessments.slice(0, 5).map((profile) => (
              <div key={profile.candidateId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{profile.memberName}</p>
                  <p className="text-sm text-white/55">{profile.currentRole || 'Role pending'} • last touched {formatDate(profile.updatedAt || profile.createdAt)}</p>
                </div>
                <Link to={`/leadership/profiles/${profile.candidateId}`}>
                  <Button variant="secondary">Schedule Assessment</Button>
                </Link>
              </div>
            ))}
            {!dueAssessments.length ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                No leaders are overdue for assessment right now.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export function LeadershipProfilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');
  const view = searchParams.get('view') || 'table';

  const profilesQuery = useQuery({
    queryKey: ['leadership-profiles-page'],
    queryFn: () => getAllProfiles({ limit: 200 }),
  });

  const profiles = profilesQuery.data?.candidates || profilesQuery.data?.items || [];

  const filtered = profiles
    .filter((item) => (tier ? item.tier === tier : true))
    .filter((item) => (status ? item.successionStatus === status : true))
    .filter((item) =>
      search
        ? [item.memberName, item.currentRole, item.targetRole, item.mentorName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase())
        : true,
    );

  const board = ['identified', 'in_development', 'ready', 'appointed', 'paused'].map((column) => ({
    key: column,
    label: formatLabel(column),
    items: filtered.filter((item) => getStatus(item.successionStatus).column === column),
  }));

  const statusMutation = useMutation({
    mutationFn: ({ candidateId, nextStatus }) => updateDevelopmentStatus(candidateId, nextStatus),
    onSuccess: () => {
      showSuccessToast('Leadership status updated.');
      queryClient.invalidateQueries({ queryKey: ['leadership-profiles-page'] });
      queryClient.invalidateQueries({ queryKey: ['leadership-dashboard-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['leadership-stats'] });
    },
    onError: (error) => showErrorToast(error.message || 'Unable to update leadership status.'),
  });

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) {
      return;
    }
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    const sourceColumn = board.find((item) => item.key === source.droppableId);
    const moved = sourceColumn?.items?.[source.index];
    if (!moved) {
      return;
    }
    statusMutation.mutate({
      candidateId: moved.candidateId,
      nextStatus: columnToStatus[destination.droppableId] || 'identified',
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Leadership Profiles"
          subtitle="Toggle between tabular review and pipeline movement for candidate development."
          action={
            <Link to="/leadership/profiles/new">
              <Button variant="secondary">+ Identify Leader</Button>
            </Link>
          }
        />

        <Card className="grid gap-4 lg:grid-cols-[1fr_200px_220px_auto]">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search profiles" />
          <select value={tier} onChange={(event) => setTier(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
            <option value="">All tiers</option>
            {tierOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
            <option value="">All status</option>
            {Object.keys(statusMeta).map((option) => (
              <option key={option} value={option}>{getStatus(option).label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button variant={view === 'table' ? 'secondary' : 'ghost'} onClick={() => setSearchParams({ view: 'table' })}>Table</Button>
            <Button variant={view === 'pipeline' ? 'secondary' : 'ghost'} onClick={() => setSearchParams({ view: 'pipeline' })}>Pipeline</Button>
          </div>
        </Card>

        {view === 'table' ? (
          <Card className="space-y-4">
            <DataTable
              columns={[
                {
                  key: 'name',
                  header: 'Leader',
                  render: (row) => (
                    <Link to={`/leadership/profiles/${row.candidateId}`} className="text-accent">
                      {row.memberName}
                    </Link>
                  ),
                },
                { key: 'currentRole', header: 'Current Role' },
                { key: 'tier', header: 'Tier', render: (row) => formatLabel(row.tier) },
                { key: 'status', header: 'Status', render: (row) => <Badge className={getStatus(row.successionStatus).badgeClassName}>{getStatus(row.successionStatus).label}</Badge> },
                { key: 'readiness', header: 'Readiness', render: (row) => `${Number(row.readinessScore || 0).toFixed(0)}%` },
                { key: 'targetRole', header: 'Target Role' },
                { key: 'mentorName', header: 'Mentor' },
                { key: 'updatedAt', header: 'Last Assessment', render: (row) => formatDate(row.updatedAt || row.createdAt) },
              ]}
              data={filtered}
              emptyMessage="No leadership profiles match these filters."
            />
          </Card>
        ) : null}

        {view === 'pipeline' ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {board.map((column) => (
                <Droppable key={column.key} droppableId={column.key}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[560px] w-[310px] shrink-0 rounded-[24px] border border-white/10 bg-[#101827] p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <p className="font-semibold text-white">{column.label}</p>
                        <Badge>{column.items.length}</Badge>
                      </div>
                      <div className="space-y-3">
                        {column.items.map((item, index) => (
                          <Draggable key={item.candidateId} draggableId={item.candidateId} index={index}>
                            {(draggableProvided) => (
                              <div
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                {...draggableProvided.dragHandleProps}
                                className="rounded-3xl border border-white/10 bg-white/5 p-4"
                              >
                                <p className="font-semibold text-white">{item.memberName}</p>
                                <p className="mt-1 text-sm text-white/55">{item.currentRole || 'Role pending'}</p>
                                <div className="mt-3 flex items-center justify-between">
                                  <Badge className={getStatus(item.successionStatus).badgeClassName}>{formatLabel(item.tier) || 'Tier'}</Badge>
                                  <span className="text-sm font-semibold text-white">{Math.round(item.readinessScore || 0)}%</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        ) : null}
      </div>
    </AppShell>
  );
}

export function CreateProfilePage() {
  const navigate = useNavigate();
  const usersQuery = useQuery({
    queryKey: ['leadership-create-users'],
    queryFn: () => getUsers({ limit: 100 }),
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const users = usersQuery.data?.users || usersQuery.data?.items || [];

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      memberId: '',
      memberName: '',
      currentRole: '',
      targetRole: '',
      mentorId: '',
      mentorName: '',
      successionStatus: 'identified',
      readinessScore: 50,
      notes: '',
      strengths: '',
      growthAreas: '',
      branch: '',
      tier: 'tier_4',
    },
  });

  const mutation = useMutation({
    mutationFn: createLeadershipProfile,
    onSuccess: (data) => {
      showSuccessToast('Leadership profile created.');
      navigate(`/leadership/profiles/${data.candidateId}`);
    },
    onError: (error) => showErrorToast(error.message || 'Unable to create leadership profile.'),
  });

  const onSubmit = form.handleSubmit((values) => {
    const mentor = users.find((user) => String(user.userId || user.id || user._id) === values.mentorId);
    mutation.mutate({
      memberId: values.memberId,
      memberName: values.memberName,
      currentRole: values.currentRole,
      targetRole: values.targetRole,
      mentorId: values.mentorId || undefined,
      mentorName: mentor?.fullName || mentor?.username,
      successionStatus: values.successionStatus,
      readinessScore: values.readinessScore,
      notes: values.notes,
      strengths: String(values.strengths || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      growthAreas: String(values.growthAreas || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      branch: values.branch,
      tier: values.tier,
    });
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Identify Leader" subtitle="Create a development profile from an existing member record." />
        <Card>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
            <div className="lg:col-span-2">
              <MemberSearchInput
                value={selectedMember || {}}
                onSelect={(member) => {
                  setSelectedMember(member);
                  form.setValue('memberId', member.memberId);
                  form.setValue('memberName', member.memberName);
                }}
                onClear={() => {
                  setSelectedMember(null);
                  form.setValue('memberId', '');
                  form.setValue('memberName', '');
                }}
              />
            </div>
            <Input label="Current Role" error={form.formState.errors.currentRole?.message} {...form.register('currentRole')} />
            <Input label="Target Role" {...form.register('targetRole')} />
            <Input label="Branch" {...form.register('branch')} />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Tier</span>
              <select {...form.register('tier')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                {tierOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Development Status</span>
              <select {...form.register('successionStatus')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                {Object.keys(statusMeta).map((option) => (
                  <option key={option} value={option}>{getStatus(option).label}</option>
                ))}
              </select>
            </label>
            <UserSelect label="Mentor" value={form.watch('mentorId')} onChange={(value) => form.setValue('mentorId', value)} users={users} />
            <Input label="Readiness Score" type="number" {...form.register('readinessScore')} />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Strengths</span>
              <input {...form.register('strengths')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white" placeholder="Comma separated" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Areas for Growth</span>
              <input {...form.register('growthAreas')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white" placeholder="Comma separated" />
            </label>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-[13px] font-medium text-white/75">Notes</span>
              <textarea rows={4} {...form.register('notes')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
            </label>
            <div className="flex justify-end gap-3 lg:col-span-2">
              <Button variant="ghost" onClick={() => navigate('/leadership/profiles')}>Cancel</Button>
              <Button type="submit" variant="secondary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating...' : 'Create Leadership Profile'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

export function ProfileDetailPage() {
  const { profileId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('assessments');
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['leadership-profile-detail', profileId],
    queryFn: () => getProfileById(profileId),
  });
  const plansQuery = useQuery({
    queryKey: ['leadership-profile-plans', profileId],
    queryFn: () => getAllSuccessionPlans({ limit: 200 }),
  });

  const profile = profileQuery.data || {};
  const plans = (plansQuery.data?.plans || plansQuery.data?.items || []).filter((plan) =>
    (plan.candidates || []).some((candidate) => candidate.candidateId === profile.candidateId),
  );

  const assessmentForm = useForm({
    resolver: zodResolver(assessmentSchema),
    defaultValues: { type: 'Quarterly Review', date: '', notes: '', strengths: '', growthAreas: '' },
  });
  const milestoneForm = useForm({
    resolver: zodResolver(z.object({ title: z.string().min(2), date: z.string().optional(), notes: z.string().optional() })),
    defaultValues: { title: '', date: '', notes: '' },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['leadership-profile-detail', profileId] });
    queryClient.invalidateQueries({ queryKey: ['leadership-profiles-page'] });
    queryClient.invalidateQueries({ queryKey: ['leadership-stats'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status) => updateDevelopmentStatus(profileId, status),
    onSuccess: () => {
      showSuccessToast('Leadership status updated.');
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to update status.'),
  });

  const assessmentMutation = useMutation({
    mutationFn: (payload) => addAssessment(profileId, payload),
    onSuccess: () => {
      showSuccessToast('Assessment saved.');
      setShowAssessmentModal(false);
      assessmentForm.reset();
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to save assessment.'),
  });

  const milestoneMutation = useMutation({
    mutationFn: (payload) => addMilestone(profileId, payload),
    onSuccess: () => {
      showSuccessToast('Milestone added.');
      setShowMilestoneModal(false);
      milestoneForm.reset();
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to add milestone.'),
  });

  const qualificationMutation = useMutation({
    mutationFn: () => addQualification(profileId, { title: 'Qualification', institution: 'Uploaded externally' }),
    onSuccess: () => {
      setShowQualificationModal(false);
      showSuccessToast('Qualification summary saved.');
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to save qualification.'),
  });

  const latestRadar = [
    { subject: 'Spiritual', score: Number(profile.readinessScore || 0) / 10 || 5 },
    { subject: 'Character', score: Number(profile.readinessScore || 0) / 10 || 5 },
    { subject: 'Leadership', score: Number(profile.readinessScore || 0) / 10 || 5 },
    { subject: 'Knowledge', score: Number(profile.readinessScore || 0) / 10 || 5 },
    { subject: 'Servanthood', score: Number(profile.readinessScore || 0) / 10 || 5 },
    { subject: 'Communication', score: Number(profile.readinessScore || 0) / 10 || 5 },
    { subject: 'Teamwork', score: Number(profile.readinessScore || 0) / 10 || 5 },
    { subject: 'Vision', score: Number(profile.readinessScore || 0) / 10 || 5 },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 text-2xl font-semibold text-accent">
                {(profile.memberName || 'L').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-white/45">Leadership Profile</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">{profile.memberName || 'Profile Detail'}</h1>
                <p className="mt-1 text-sm text-white/60">{profile.currentRole || 'Current role pending'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{formatLabel(profile.tier) || 'Tier'}</Badge>
                  <Badge className={getStatus(profile.successionStatus).badgeClassName}>{getStatus(profile.successionStatus).label}</Badge>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <ReadinessRing value={profile.readinessScore || 0} />
            </div>
            <div className="space-y-3 text-sm text-white/75">
              <p>Mentor: {profile.mentorName || 'Unassigned'}</p>
              <p>Target role: {profile.targetRole || 'Not set'}</p>
              <p>Branch: {profile.branch || '—'}</p>
            </div>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Update Status</span>
              <select
                value={profile.successionStatus || 'identified'}
                onChange={(event) => statusMutation.mutate(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              >
                {Object.keys(statusMeta).map((option) => (
                  <option key={option} value={option}>{getStatus(option).label}</option>
                ))}
              </select>
            </label>
            <Button variant="secondary" onClick={() => setShowAssessmentModal(true)}>
              Add Assessment
            </Button>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                ['assessments', 'Assessments'],
                ['milestones', 'Milestones'],
                ['training', 'Training & Qualifications'],
                ['succession', 'Succession'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${activeTab === value ? 'border-accent bg-accent/15 text-accent' : 'border-white/10 bg-white/5 text-white/65'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'assessments' ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Assessment timeline</h2>
                    <p className="mt-1 text-sm text-white/60">The current backend stores assessment summaries inside profile notes and readiness score.</p>
                  </div>
                  <Button variant="secondary" onClick={() => setShowAssessmentModal(true)}>
                    Add Assessment
                  </Button>
                </div>
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Latest assessment summary</p>
                    <p className="mt-2 text-sm text-white/75">{profile.notes || 'No assessment summary stored yet.'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(profile.strengths || []).map((item) => (
                        <Badge key={item} className="bg-emerald-500/15 text-emerald-200">{item}</Badge>
                      ))}
                      {(profile.growthAreas || []).map((item) => (
                        <Badge key={item} className="bg-amber-500/15 text-amber-100">{item}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={latestRadar}>
                          <PolarGrid stroke="rgba(255,255,255,0.08)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                          <Radar dataKey="score" fill="#C9A84C" stroke="#C9A84C" fillOpacity={0.22} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {activeTab === 'milestones' ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">Leadership milestones</h2>
                  <Button variant="secondary" onClick={() => setShowMilestoneModal(true)}>Add Milestone</Button>
                </div>
                <div className="space-y-3">
                  {(profile.developmentPlan || []).map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{item.title}</p>
                        <Badge className={item.isCompleted ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/10 text-white/75'}>
                          {item.isCompleted ? 'Completed' : 'Open'}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-white/55">{formatDate(item.dueDate)}</p>
                    </div>
                  ))}
                  {!profile.developmentPlan?.length ? (
                    <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                      No milestones have been added yet.
                    </p>
                  ) : null}
                </div>
              </Card>
            ) : null}

            {activeTab === 'training' ? (
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">Training & qualifications</h2>
                  <Button variant="secondary" onClick={() => setShowQualificationModal(true)}>Add Qualification</Button>
                </div>
                <p className="text-sm text-white/60">
                  Qualification file storage is not yet modeled separately in the current backend, so this workspace stores a summary note against the profile.
                </p>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/75">{profile.notes || 'No training or qualification summary stored yet.'}</p>
                </div>
              </Card>
            ) : null}

            {activeTab === 'succession' ? (
              <Card className="space-y-4">
                <h2 className="text-2xl font-semibold text-white">Succession references</h2>
                <DataTable
                  columns={[
                    { key: 'roleName', header: 'Role' },
                    { key: 'currentHolderName', header: 'Current Holder' },
                    {
                      key: 'rank',
                      header: 'Rank',
                      render: (row) => {
                        const candidate = (row.candidates || []).find((item) => item.candidateId === profile.candidateId);
                        return candidate?.rank ? `#${candidate.rank}` : '—';
                      },
                    },
                    {
                      key: 'readiness',
                      header: 'Readiness Needed',
                      render: (row) => {
                        const candidate = (row.candidates || []).find((item) => item.candidateId === profile.candidateId);
                        return candidate?.readinessScore ? `${candidate.readinessScore}%` : '—';
                      },
                    },
                  ]}
                  data={plans}
                  emptyMessage="This profile is not listed in any succession plans yet."
                />
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <Modal isOpen={showAssessmentModal} onClose={() => setShowAssessmentModal(false)} title="Add Assessment" description="Save the current evaluation summary for this leader." size="lg">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={assessmentForm.handleSubmit((values) => assessmentMutation.mutate(values))}>
          <Input label="Assessment Type" {...assessmentForm.register('type')} />
          <Input label="Date" type="date" {...assessmentForm.register('date')} />
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">Strengths</span>
            <input {...assessmentForm.register('strengths')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white" placeholder="Comma separated" />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">Areas for Growth</span>
            <input {...assessmentForm.register('growthAreas')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white" placeholder="Comma separated" />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">Confidential Notes</span>
            <textarea rows={4} {...assessmentForm.register('notes')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
          </label>
          <div className="flex justify-end gap-3 md:col-span-2">
            <Button variant="ghost" onClick={() => setShowAssessmentModal(false)}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={assessmentMutation.isPending}>
              {assessmentMutation.isPending ? 'Saving...' : 'Save Assessment'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showMilestoneModal} onClose={() => setShowMilestoneModal(false)} title="Add Milestone" description="Capture a development milestone for this leader.">
        <form className="space-y-4" onSubmit={milestoneForm.handleSubmit((values) => milestoneMutation.mutate(values))}>
          <Input label="Title" {...milestoneForm.register('title')} />
          <Input label="Date" type="date" {...milestoneForm.register('date')} />
          <label className="space-y-1.5">
            <span className="text-[13px] font-medium text-white/75">Notes</span>
            <textarea rows={4} {...milestoneForm.register('notes')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowMilestoneModal(false)}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={milestoneMutation.isPending}>
              {milestoneMutation.isPending ? 'Saving...' : 'Add Milestone'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showQualificationModal} onClose={() => setShowQualificationModal(false)} title="Add Qualification" description="Save a qualification summary note to the profile.">
        <div className="space-y-4">
          <p className="text-sm text-white/65">
            The current backend does not yet persist structured qualification rows or certificate URLs, so this action stores a summary note on the leadership profile.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowQualificationModal(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => qualificationMutation.mutate()} disabled={qualificationMutation.isPending}>
              {qualificationMutation.isPending ? 'Saving...' : 'Save Qualification'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

export function SuccessionPlanningPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const plansQuery = useQuery({
    queryKey: ['succession-plans-page'],
    queryFn: () => getAllSuccessionPlans({ limit: 200 }),
  });
  const riskQuery = useQuery({
    queryKey: ['succession-risk-page'],
    queryFn: getSuccessionRiskReport,
  });
  const profilesQuery = useQuery({
    queryKey: ['succession-profile-options'],
    queryFn: () => getAllProfiles({ limit: 200 }),
  });

  const plans = plansQuery.data?.plans || plansQuery.data?.items || [];
  const riskRows = riskQuery.data || [];
  const profiles = profilesQuery.data?.candidates || profilesQuery.data?.items || [];

  const form = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      title: '',
      roleName: '',
      currentHolderName: '',
      emergencySuccessorName: '',
      status: 'draft',
      notes: '',
      reviewDate: '',
    },
  });

  const mutation = useMutation({
    mutationFn: createSuccessionPlan,
    onSuccess: () => {
      showSuccessToast('Succession plan created.');
      setShowCreateModal(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['succession-plans-page'] });
      queryClient.invalidateQueries({ queryKey: ['succession-risk-page'] });
    },
    onError: (error) => showErrorToast(error.message || 'Unable to create succession plan.'),
  });

  const coverage = plans.length ? ((plans.length - riskRows.filter((item) => item.risk === 'critical').length) / plans.length) * 100 : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Succession Planning"
          subtitle="Map church-critical roles to ready-now, next-up, and emergency successors."
          action={<Button variant="secondary" onClick={() => setShowCreateModal(true)}>+ Create Plan</Button>}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Roles Covered" value={plans.length - riskRows.filter((item) => item.risk === 'critical').length} />
          <StatCard label="Roles Uncovered" value={riskRows.filter((item) => item.risk === 'critical').length} />
          <StatCard label="Overall Risk Level" value={`${coverage.toFixed(1)}%`} helper="coverage index" />
        </div>

        <Card className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Risk Heatmap</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Key church roles</h2>
          </div>
          <DataTable
            columns={[
              { key: 'roleName', header: 'Role' },
              { key: 'currentHolderName', header: 'Current Holder' },
              { key: 'successor1', header: 'Successor 1', render: (row) => row.candidates?.[0]?.candidateName || 'No Successor' },
              { key: 'successor2', header: 'Successor 2', render: (row) => row.candidates?.[1]?.candidateName || '—' },
              {
                key: 'risk',
                header: 'Risk',
                render: (row) => (
                  <Badge
                    className={
                      row.risk === 'critical'
                        ? 'bg-rose-500/15 text-rose-100'
                        : row.risk === 'high'
                          ? 'bg-orange-500/15 text-orange-100'
                          : row.risk === 'medium'
                            ? 'bg-amber-500/15 text-amber-100'
                            : 'bg-emerald-500/15 text-emerald-200'
                    }
                  >
                    {formatLabel(row.risk)}
                  </Badge>
                ),
              },
            ]}
            data={riskRows}
            emptyMessage="No succession plans available yet."
          />
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Risk Report</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Summary</h2>
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Low', value: riskRows.filter((item) => item.risk === 'low').length, fill: '#22C55E' },
                      { name: 'High', value: riskRows.filter((item) => item.risk === 'high').length, fill: '#F59E0B' },
                      { name: 'Critical', value: riskRows.filter((item) => item.risk === 'critical').length, fill: '#EF4444' },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <DataTable
              columns={[
                { key: 'roleName', header: 'Role' },
                { key: 'currentHolderName', header: 'Current Holder' },
                { key: 'successorCount', header: 'Successor Count' },
                { key: 'risk', header: 'Risk', render: (row) => formatLabel(row.risk) },
                { key: 'notes', header: 'Notes' },
              ]}
              data={riskRows}
              emptyMessage="No succession risk summary available."
            />
          </div>
        </Card>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Succession Plan" description="Set up a role, holder, and backup successors." size="lg">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) =>
            mutation.mutate({
              title: values.title,
              roleName: values.roleName,
              currentHolderName: values.currentHolderName,
              emergencySuccessorName: values.emergencySuccessorName,
              status: values.status,
              notes: values.notes,
              candidates: profiles.slice(0, 3).map((profile, index) => ({
                candidateId: profile.candidateId,
                candidateName: profile.memberName,
                readinessScore: profile.readinessScore || 0,
                rank: index + 1,
              })),
            }),
          )}
        >
          <Input label="Title" {...form.register('title')} />
          <Input label="Role" {...form.register('roleName')} />
          <Input label="Current Holder" {...form.register('currentHolderName')} />
          <Input label="Emergency Successor" {...form.register('emergencySuccessorName')} />
          <label className="space-y-1.5">
            <span className="text-[13px] font-medium text-white/75">Status</span>
            <select {...form.register('status')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <Input label="Review Date" type="date" {...form.register('reviewDate')} />
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">Notes</span>
            <textarea rows={4} {...form.register('notes')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
          </label>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 md:col-span-2">
            The top three leadership profiles are preloaded as suggested successors in rank order. You can refine the plan later from the succession workspace.
          </div>
          <div className="flex justify-end gap-3 md:col-span-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

export function LeadershipReportsPage() {
  const overviewQuery = useQuery({
    queryKey: ['leadership-reports-overview'],
    queryFn: getLeadershipReport,
  });
  const readinessQuery = useQuery({
    queryKey: ['leadership-readiness-report'],
    queryFn: getReadinessReport,
  });
  const riskQuery = useQuery({
    queryKey: ['leadership-risk-report-reporting'],
    queryFn: getSuccessionRiskReport,
  });

  const overview = overviewQuery.data || {};
  const topCandidates = overview.topCandidates || [];
  const recentPlans = overview.recentPlans || [];
  const readiness = readinessQuery.data || [];
  const risk = riskQuery.data || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Leadership Reports"
          subtitle="Review readiness distribution, top candidates, and recent succession activity."
          action={
            <Button variant="ghost" onClick={() => downloadJsonFile('leadership-reports.json', { overview, readiness, risk })}>
              Export
            </Button>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Readiness scores</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={readiness}>
                  <XAxis dataKey="memberName" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="readinessScore" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Risk distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Low', value: risk.filter((item) => item.risk === 'low').length, fill: '#22C55E' },
                      { name: 'High', value: risk.filter((item) => item.risk === 'high').length, fill: '#F59E0B' },
                      { name: 'Critical', value: risk.filter((item) => item.risk === 'critical').length, fill: '#EF4444' },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Top candidates</h2>
            <DataTable
              columns={[
                { key: 'memberName', header: 'Leader' },
                { key: 'currentRole', header: 'Current Role' },
                { key: 'targetRole', header: 'Target Role' },
                { key: 'readinessScore', header: 'Readiness' },
              ]}
              data={topCandidates}
              emptyMessage="No candidate report rows available."
            />
          </Card>
          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Recent succession plans</h2>
            <DataTable
              columns={[
                { key: 'title', header: 'Plan' },
                { key: 'roleName', header: 'Role' },
                { key: 'status', header: 'Status', render: (row) => formatLabel(row.status) },
                { key: 'updatedAt', header: 'Updated', render: (row) => formatDate(row.updatedAt) },
              ]}
              data={recentPlans}
              emptyMessage="No succession plans have been created yet."
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
