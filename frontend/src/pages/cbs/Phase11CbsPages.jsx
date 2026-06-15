import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import {
  addProspect,
  convertToMember,
  createGroup,
  getAllGroups,
  getAllProspects,
  getCBSConversionReport,
  getCBSOverviewReport,
  getCBSStats,
  getGroupById,
  getGroupProspects,
  getGroupReport,
  getGroupSessions,
  getProspectById,
  getRecentBaptisms,
  getSessionById,
  recordSession,
  updateProspect,
  updateStudyStage,
} from '../../api/endpoints/cbs';
import { getUsers } from '../../api/endpoints/users';
import { downloadCsvFile, downloadJsonFile } from '../../utils/exportData';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../utils/toast';

const stageOrder = [
  'initial_contact',
  'interested',
  'studying',
  'advanced_study',
  'baptism_candidate',
  'baptised',
  'member',
];

const stageMeta = {
  initial_contact: {
    label: 'Initial Contact',
    badgeClassName: 'bg-slate-500/15 text-slate-200',
    columnClassName: 'border-slate-500/20 bg-slate-500/5',
  },
  interested: {
    label: 'Interested',
    badgeClassName: 'bg-sky-500/15 text-sky-200',
    columnClassName: 'border-sky-500/20 bg-sky-500/5',
  },
  studying: {
    label: 'Studying',
    badgeClassName: 'bg-teal-500/15 text-teal-200',
    columnClassName: 'border-teal-500/20 bg-teal-500/5',
  },
  advanced_study: {
    label: 'Advanced Study',
    badgeClassName: 'bg-violet-500/15 text-violet-200',
    columnClassName: 'border-violet-500/20 bg-violet-500/5',
  },
  baptism_candidate: {
    label: 'Baptism Candidate',
    badgeClassName: 'bg-amber-400/20 text-amber-100',
    columnClassName: 'border-amber-400/35 bg-amber-400/10',
  },
  baptised: {
    label: 'Baptised',
    badgeClassName: 'bg-emerald-500/15 text-emerald-200',
    columnClassName: 'border-emerald-500/30 bg-emerald-500/8',
  },
  member: {
    label: 'Member',
    badgeClassName: 'bg-emerald-700/25 text-emerald-100',
    columnClassName: 'border-emerald-700/30 bg-emerald-700/10',
  },
};

const groupSchema = z.object({
  name: z.string().min(2, 'Group name is required.'),
  type: z.string().min(1, 'Group type is required.'),
  zone: z.string().optional(),
  branch: z.string().optional(),
  leaderId: z.string().min(1, 'Leader is required.'),
  supervisorId: z.string().optional(),
  location: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  frequency: z.string().optional(),
  dayOfWeek: z.coerce.number().optional(),
  time: z.string().optional(),
  studyMaterial: z.string().optional(),
});

const sessionSchema = z.object({
  date: z.string().min(1, 'Session date is required.'),
  topic: z.string().min(2, 'Session topic is required.'),
  reference: z.string().optional(),
  curriculum: z.string().optional(),
  duration: z.coerce.number().optional(),
  venue: z.string().optional(),
  notes: z.string().optional(),
  nextSessionDate: z.string().optional(),
  outcomes: z.string().optional(),
});

const prospectSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  phone: z.string().optional(),
  email: z.string().optional(),
  gender: z.string().optional(),
  ageGroup: z.string().optional(),
  contactMethod: z.string().optional(),
  firstContactDate: z.string().optional(),
  spiritualInterests: z.string().optional(),
  notes: z.string().optional(),
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

const getStage = (stage) =>
  stageMeta[stage] || {
    label: formatLabel(stage),
    badgeClassName: 'bg-white/10 text-white/75',
    columnClassName: 'border-white/10 bg-white/5',
  };

function Badge({ children, className = 'bg-white/10 text-white/75' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <Card className="min-h-[110px] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{label}</p>
      <p className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}
    </Card>
  );
}

function ProspectCard({ prospect, onView }) {
  const stage = getStage(prospect.studyStage);
  return (
    <div className="rounded-3xl border border-white/10 bg-[#101827] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-white">
            {[prospect.firstName, prospect.lastName].filter(Boolean).join(' ')}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
            {prospect.prospectId}
          </p>
        </div>
        <Badge className={stage.badgeClassName}>{stage.label}</Badge>
      </div>
      <p className="mt-3 text-sm text-white/60">
        {prospect.studiesAttended || 0} studies • next follow-up {formatDate(prospect.nextFollowUpDate)}
      </p>
      <Button variant="ghost" className="mt-4" onClick={onView}>
        View Prospect
      </Button>
    </div>
  );
}

function UserSelect({ label, value, onChange, users, required = false }) {
  return (
    <label className="space-y-1.5">
      <span className="text-[13px] font-medium text-white/75">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
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

export function CBSDashboard() {
  const statsQuery = useQuery({
    queryKey: ['cbs-stats'],
    queryFn: getCBSStats,
  });
  const overviewQuery = useQuery({
    queryKey: ['cbs-overview-report'],
    queryFn: getCBSOverviewReport,
  });
  const baptismsQuery = useQuery({
    queryKey: ['cbs-recent-baptisms'],
    queryFn: getRecentBaptisms,
  });

  const stats = statsQuery.data || {};
  const groups = overviewQuery.data || [];
  const totalProspects = Number(stats.totalProspects || 0);
  const convertedCount = Number(stats.convertedCount || 0);
  const conversionRate = totalProspects ? (convertedCount / totalProspects) * 100 : 0;
  const pipeline = stats.studyPipeline || {};
  const overdueFollowUps = Number(pipeline.interested || 0) + Number(pipeline.initial_contact || 0);

  const topGroups = groups
    .map((group) => ({
      ...group,
      conversionRate: group.prospectCount ? ((group.convertedCount || 0) / group.prospectCount) * 100 : 0,
    }))
    .sort((left, right) => right.conversionRate - left.conversionRate)
    .slice(0, 5);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="CBS Dashboard"
          subtitle="Monitor group growth, prospect movement, and conversion momentum across all Bible study groups."
          action={
            <div className="flex gap-3">
              <Link to="/cbs/groups">
                <Button variant="ghost">Open Groups</Button>
              </Link>
              <Link to="/cbs/groups/new">
                <Button variant="secondary">+ Create Group</Button>
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active Groups" value={stats.activeGroups || 0} />
          <StatCard label="Total Prospects" value={stats.totalProspects || 0} />
          <StatCard label="Baptisms This Month" value={stats.studyPipeline?.baptised || 0} />
          <StatCard label="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Pipeline Funnel</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Study stages</h2>
            </div>
            <div className="space-y-3">
              {stageOrder.map((stage) => {
                const meta = getStage(stage);
                const count = pipeline[stage] || 0;
                const width = totalProspects ? (count / totalProspects) * 100 : 0;
                return (
                  <Link key={stage} to={`/cbs/prospects/pipeline?stage=${stage}`} className="block">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{meta.label}</p>
                        <Badge className={meta.badgeClassName}>{count}</Badge>
                      </div>
                      <div className="h-3 rounded-full bg-white/10">
                        <div className="h-3 rounded-full bg-accent" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Celebration</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Recent baptisms</h2>
            </div>
            <div className="space-y-3">
              {(baptismsQuery.data || []).map((item) => (
                <div key={item.prospectId} className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-4">
                  <p className="font-semibold text-white">🎉 {item.fullName}</p>
                  <p className="mt-1 text-sm text-white/70">
                    {item.groupName || 'CBS Group'} • {formatDate(item.baptismDate || item.updatedAt)}
                  </p>
                </div>
              ))}
              {!baptismsQuery.data?.length ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                  No recent baptisms recorded.
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Follow-Up Alert</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Needs attention today</h2>
            </div>
            <div className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-5">
              <p className="text-4xl font-semibold text-white">{overdueFollowUps}</p>
              <p className="mt-2 text-sm text-white/70">
                prospects need a call, visit, or next-step follow-up today.
              </p>
              <Link to="/cbs/prospects?needsFollowUp=today">
                <Button variant="secondary" className="mt-4">Open Prospect List</Button>
              </Link>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Group Performance</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Top groups by conversion</h2>
            </div>
            <DataTable
              columns={[
                { key: 'name', header: 'Group' },
                { key: 'leaderName', header: 'Leader', render: (row) => row.leaderName || 'Unassigned' },
                { key: 'prospectCount', header: 'Prospects' },
                { key: 'convertedCount', header: 'Baptised' },
                { key: 'conversionRate', header: 'Rate', render: (row) => `${row.conversionRate.toFixed(1)}%` },
              ]}
              data={topGroups}
              emptyMessage="No group performance data available yet."
            />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export function CBSGroupsPage() {
  const groupsQuery = useQuery({
    queryKey: ['cbs-groups-page'],
    queryFn: () => getAllGroups({ limit: 200 }),
  });
  const groups = groupsQuery.data?.groups || groupsQuery.data?.items || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="CBS Groups"
          subtitle="Browse community Bible study groups by zone, leader, and health."
          action={
            <Link to="/cbs/groups/new">
              <Button variant="secondary">+ Create Group</Button>
            </Link>
          }
        />
        {groups.length ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <Link key={group.groupId} to={`/cbs/groups/${group.groupId}`}>
                <div className="rounded-3xl border border-white/10 bg-[#101827] p-5 transition hover:border-accent/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{group.zone || 'Zone TBD'}</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{group.name}</h2>
                    </div>
                    <Badge>{formatLabel(group.type)}</Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-white/70">
                    <p>Prospects: {group.prospectCount || 0}</p>
                    <p>Converted: {group.convertedCount || 0}</p>
                    <p>Leader: {group.leaderName || 'Unassigned'}</p>
                    <p>Next session: {formatDate(group.nextSessionDate)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="CBS" title="No CBS groups yet" message="Create the first Bible study group to begin tracking prospects and sessions." />
        )}
      </div>
    </AppShell>
  );
}

export function CreateCBSGroupPage() {
  const navigate = useNavigate();
  const usersQuery = useQuery({
    queryKey: ['cbs-create-users'],
    queryFn: () => getUsers({ limit: 100 }),
  });

  const form = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      type: 'home_bible_study',
      zone: '',
      branch: '',
      leaderId: '',
      supervisorId: '',
      location: '',
      latitude: '',
      longitude: '',
      frequency: 'weekly',
      dayOfWeek: 0,
      time: '',
      studyMaterial: '',
    },
  });

  const users = usersQuery.data?.users || usersQuery.data?.items || [];

  const mutation = useMutation({
    mutationFn: createGroup,
    onSuccess: (data) => {
      showSuccessToast('CBS group created successfully.');
      navigate(`/cbs/groups/${data.groupId}`);
    },
    onError: (error) => showErrorToast(error.message || 'Unable to create CBS group.'),
  });

  const onSubmit = form.handleSubmit((values) => {
    const leader = users.find((item) => String(item.userId || item.id || item._id) === values.leaderId);
    const supervisor = users.find((item) => String(item.userId || item.id || item._id) === values.supervisorId);
    mutation.mutate({
      name: values.name,
      type: values.type,
      zone: values.zone,
      branch: values.branch,
      leaderId: values.leaderId,
      leaderName: leader?.fullName || leader?.username,
      supervisorId: values.supervisorId || undefined,
      coLeaderId: '',
      coLeaderName: '',
      supervisorName: supervisor?.fullName || supervisor?.username,
      location: values.location,
      gpsCoordinates:
        values.latitude || values.longitude
          ? { lat: Number(values.latitude || 0), lng: Number(values.longitude || 0) }
          : undefined,
      meetingSchedule: {
        frequency: values.frequency,
        dayOfWeek: Number(values.dayOfWeek || 0),
        time: values.time,
      },
      studyMaterial: values.studyMaterial,
    });
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Create CBS Group" subtitle="Set up the group identity, leadership, location, and study rhythm." />
        <Card>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
            <Input label="Name" error={form.formState.errors.name?.message} {...form.register('name')} />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Type</span>
              <select {...form.register('type')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                <option value="home_bible_study">Home Bible Study</option>
                <option value="community_study">Community Study</option>
                <option value="workplace_study">Workplace Study</option>
                <option value="campus_study">Campus Study</option>
                <option value="online_study">Online Study</option>
                <option value="other">Other</option>
              </select>
            </label>
            <Input label="Zone" {...form.register('zone')} />
            <Input label="Branch" {...form.register('branch')} />
            <UserSelect label="Leader" required value={form.watch('leaderId')} onChange={(value) => form.setValue('leaderId', value)} users={users} />
            <UserSelect label="Supervisor" value={form.watch('supervisorId')} onChange={(value) => form.setValue('supervisorId', value)} users={users} />
            <Input label="Location" {...form.register('location')} />
            <Input label="GPS Latitude" {...form.register('latitude')} />
            <Input label="GPS Longitude" {...form.register('longitude')} />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Frequency</span>
              <select {...form.register('frequency')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Day</span>
              <select {...form.register('dayOfWeek')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
            </label>
            <Input label="Time" type="time" {...form.register('time')} />
            <Input label="Study Material" {...form.register('studyMaterial')} />
            <div className="flex justify-end gap-3 lg:col-span-2">
              <Button variant="ghost" onClick={() => navigate('/cbs/groups')}>Cancel</Button>
              <Button type="submit" variant="secondary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

export function CBSGroupDetailPage() {
  const { groupId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('prospects');
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [guestNames, setGuestNames] = useState('');
  const [attendeeIds, setAttendeeIds] = useState([]);
  const [referredByMember, setReferredByMember] = useState(null);

  const groupQuery = useQuery({
    queryKey: ['cbs-group-detail', groupId],
    queryFn: () => getGroupById(groupId),
  });
  const prospectsQuery = useQuery({
    queryKey: ['cbs-group-prospects', groupId],
    queryFn: () => getGroupProspects(groupId, { limit: 500 }),
  });
  const sessionsQuery = useQuery({
    queryKey: ['cbs-group-sessions', groupId],
    queryFn: () => getGroupSessions(groupId, { limit: 200 }),
  });
  const reportQuery = useQuery({
    queryKey: ['cbs-group-report', groupId],
    queryFn: () => getGroupReport(groupId),
  });
  const sessionDetailQuery = useQuery({
    queryKey: ['cbs-session-detail', selectedSessionId, groupId],
    queryFn: () => getSessionById(selectedSessionId, groupId),
    enabled: Boolean(selectedSessionId),
  });

  const group = groupQuery.data || {};
  const prospects = prospectsQuery.data?.prospects || prospectsQuery.data?.items || [];
  const sessions = sessionsQuery.data?.sessions || sessionsQuery.data?.items || [];
  const report = reportQuery.data || {};

  const prospectForm = useForm({
    resolver: zodResolver(prospectSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      gender: '',
      ageGroup: '',
      contactMethod: 'referral',
      firstContactDate: '',
      spiritualInterests: '',
      notes: '',
    },
  });

  const sessionForm = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      date: '',
      topic: '',
      reference: '',
      curriculum: '',
      duration: '',
      venue: '',
      notes: '',
      nextSessionDate: '',
      outcomes: '',
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['cbs-stats'] });
    queryClient.invalidateQueries({ queryKey: ['cbs-overview-report'] });
    queryClient.invalidateQueries({ queryKey: ['cbs-group-detail', groupId] });
    queryClient.invalidateQueries({ queryKey: ['cbs-group-prospects', groupId] });
    queryClient.invalidateQueries({ queryKey: ['cbs-group-sessions', groupId] });
    queryClient.invalidateQueries({ queryKey: ['cbs-group-report', groupId] });
  };

  const stageMutation = useMutation({
    mutationFn: ({ prospectId, stage }) => updateStudyStage(prospectId, stage),
    onSuccess: refresh,
    onError: (error) => showErrorToast(error.message || 'Unable to update study stage.'),
  });

  const prospectMutation = useMutation({
    mutationFn: (payload) => addProspect(groupId, payload),
    onSuccess: () => {
      showSuccessToast('Prospect added successfully.');
      setShowProspectModal(false);
      setReferredByMember(null);
      prospectForm.reset();
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to add prospect.'),
  });

  const sessionMutation = useMutation({
    mutationFn: (payload) => recordSession(groupId, payload),
    onSuccess: () => {
      showSuccessToast('Session recorded successfully.');
      setShowSessionModal(false);
      setGuestNames('');
      setAttendeeIds([]);
      sessionForm.reset();
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to save session.'),
  });

  const onSubmitProspect = prospectForm.handleSubmit((values) => {
    prospectMutation.mutate({
      ...values,
      referredByMemberId: referredByMember?.memberId,
      referredByName: referredByMember?.memberName,
      leaderNotes: values.notes,
      spiritualInterests: String(values.spiritualInterests || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });
  });

  const onSubmitSession = sessionForm.handleSubmit((values) => {
    const attendees = prospects
      .filter((prospect) => attendeeIds.includes(prospect.prospectId))
      .map((prospect) => ({
        prospectId: prospect.prospectId,
        prospectName: [prospect.firstName, prospect.lastName].filter(Boolean).join(' '),
      }));
    const guestAttendees = String(guestNames || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({
        prospectName: item,
        isFirstTime: true,
      }));
    sessionMutation.mutate({
      date: values.date,
      studyTopic: values.topic,
      studyReference: values.reference,
      curriculum: values.curriculum,
      duration: values.duration || undefined,
      venue: values.venue,
      leaderNotes: values.notes,
      nextSessionDate: values.nextSessionDate || undefined,
      attendees: [...attendees, ...guestAttendees],
      outcomes: String(values.outcomes || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    });
  });

  const stageCounts = report.prospects?.byStage || {};
  const conversionRate = group.prospectCount
    ? ((group.convertedCount || 0) / group.prospectCount) * 100
    : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-accent">CBS Group</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{group.name || 'CBS Group Detail'}</h1>
            <p className="mt-2 text-sm text-white/60">
              {group.zone || 'Zone TBD'} • Leader: {group.leaderName || 'Unassigned'}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => downloadJsonFile(`cbs-group-${groupId}.json`, { group, prospects, sessions, report })}>
              Export Group Data
            </Button>
            <Button variant="secondary" onClick={() => setShowProspectModal(true)}>
              + Add Prospect
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Prospects" value={group.prospectCount || prospects.length || 0} />
          <StatCard label="Studying" value={stageCounts.studying || 0} />
          <StatCard label="Baptised" value={stageCounts.baptised || 0} />
          <StatCard label="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['prospects', 'Prospects'],
            ['sessions', 'Sessions'],
            ['reports', 'Reports'],
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

        {activeTab === 'prospects' ? (
          <Card className="space-y-5">
            <DataTable
              columns={[
                {
                  key: 'name',
                  header: 'Prospect',
                  render: (row) => (
                    <button type="button" onClick={() => navigate(`/cbs/prospects/${row.prospectId}`)} className="text-left">
                      <p className="font-medium text-white">{[row.firstName, row.lastName].filter(Boolean).join(' ')}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{row.prospectId}</p>
                    </button>
                  ),
                },
                {
                  key: 'stage',
                  header: 'Stage',
                  render: (row) => {
                    const stage = getStage(row.studyStage);
                    return (
                      <select
                        value={row.studyStage || 'initial_contact'}
                        onChange={(event) => stageMutation.mutate({ prospectId: row.prospectId, stage: event.target.value })}
                        className={`rounded-lg border border-white/10 px-2.5 py-2 text-sm ${stage.badgeClassName} bg-[#101827]`}
                      >
                        {Object.keys(stageMeta).map((option) => (
                          <option key={option} value={option}>{getStage(option).label}</option>
                        ))}
                      </select>
                    );
                  },
                },
                { key: 'studiesAttended', header: 'Studies Attended' },
                { key: 'lastStudyDate', header: 'Last Study', render: (row) => formatDate(row.lastStudyDate) },
                { key: 'nextFollowUpDate', header: 'Next Follow-Up', render: (row) => formatDate(row.nextFollowUpDate) },
              ]}
              data={prospects}
              emptyMessage="No prospects have been added to this group yet."
            />
          </Card>
        ) : null}

        {activeTab === 'sessions' ? (
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Sessions</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Study sessions</h2>
              </div>
              <Button variant="secondary" onClick={() => setShowSessionModal(true)}>
                + Record Session
              </Button>
            </div>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.sessionId} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{session.studyTopic}</p>
                      <p className="mt-1 text-sm text-white/55">
                        {formatDate(session.date)} • {session.attendanceCount || 0} attendees
                      </p>
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedSessionId(session.sessionId)}>
                      View
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(session.outcomes || []).map((outcome) => (
                      <Badge key={outcome} className="bg-accent/15 text-accent">
                        {outcome}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {!sessions.length ? (
                <EmptyState icon="SE" title="No sessions yet" message="Record the first CBS session to start tracking attendance and decisions." />
              ) : null}
            </div>
          </Card>
        ) : null}

        {activeTab === 'reports' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Attendance Trend</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Sessions over time</h2>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(report.sessions?.trend || []).map((item, index) => ({ label: `S${index + 1}`, attendanceCount: item.attendanceCount || 0 }))}>
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendanceCount" stroke="#C9A84C" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Stage Distribution</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Current prospect mix</h2>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    downloadCsvFile(
                      `cbs-${groupId}-prospects.csv`,
                      [
                        { key: 'name', label: 'Prospect' },
                        { key: 'stage', label: 'Stage' },
                        { key: 'studies', label: 'Studies Attended' },
                      ],
                      prospects.map((item) => ({
                        name: [item.firstName, item.lastName].filter(Boolean).join(' '),
                        stage: formatLabel(item.studyStage),
                        studies: item.studiesAttended || 0,
                      })),
                    )
                  }
                >
                  Export
                </Button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(stageCounts).map(([name, value]) => ({ name: getStage(name).label, value }))}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={120}
                    >
                      {Object.keys(stageCounts).map((key, index) => (
                        <Cell key={key} fill={['#94a3b8', '#60a5fa', '#14b8a6', '#a78bfa', '#facc15', '#22c55e', '#166534'][index % 7]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={showProspectModal}
        onClose={() => setShowProspectModal(false)}
        title="Add Prospect"
        description="Capture the person profile and first contact details."
        size="lg"
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmitProspect}>
          <Input label="First Name" error={prospectForm.formState.errors.firstName?.message} {...prospectForm.register('firstName')} />
          <Input label="Last Name" error={prospectForm.formState.errors.lastName?.message} {...prospectForm.register('lastName')} />
          <Input label="Phone" {...prospectForm.register('phone')} />
          <Input label="Email" {...prospectForm.register('email')} />
          <Input label="Gender" {...prospectForm.register('gender')} />
          <Input label="Age Group" {...prospectForm.register('ageGroup')} />
          <Input label="Contact Method" {...prospectForm.register('contactMethod')} />
          <Input label="First Contact Date" type="date" {...prospectForm.register('firstContactDate')} />
          <div className="md:col-span-2">
            <MemberSearchInput
              value={referredByMember || {}}
              onSelect={setReferredByMember}
              onClear={() => setReferredByMember(null)}
              placeholder="Search member who referred this prospect"
            />
          </div>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">Spiritual Interests</span>
            <input {...prospectForm.register('spiritualInterests')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white" placeholder="Comma separated" />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">Notes</span>
            <textarea rows={4} {...prospectForm.register('notes')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
          </label>
          <div className="flex justify-end gap-3 md:col-span-2">
            <Button variant="ghost" onClick={() => setShowProspectModal(false)}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={prospectMutation.isPending}>
              {prospectMutation.isPending ? 'Saving...' : 'Save Prospect'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        title="Record Session"
        description="Capture the study session, attendees, guests, and decisions."
        size="xl"
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmitSession}>
          <Input label="Date" type="date" error={sessionForm.formState.errors.date?.message} {...sessionForm.register('date')} />
          <Input label="Topic" error={sessionForm.formState.errors.topic?.message} {...sessionForm.register('topic')} />
          <Input label="Scripture Reference" {...sessionForm.register('reference')} />
          <Input label="Curriculum" {...sessionForm.register('curriculum')} />
          <Input label="Duration" type="number" {...sessionForm.register('duration')} />
          <Input label="Venue" {...sessionForm.register('venue')} />
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">Attendees</span>
            <div className="grid gap-2 md:grid-cols-2">
              {prospects.map((prospect) => (
                <label key={prospect.prospectId} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/75">
                  <input
                    type="checkbox"
                    checked={attendeeIds.includes(prospect.prospectId)}
                    onChange={(event) =>
                      setAttendeeIds((current) =>
                        event.target.checked
                          ? [...current, prospect.prospectId]
                          : current.filter((item) => item !== prospect.prospectId),
                      )
                    }
                  />
                  <span>{[prospect.firstName, prospect.lastName].filter(Boolean).join(' ')}</span>
                </label>
              ))}
            </div>
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">+ Add Guest</span>
            <textarea rows={3} value={guestNames} onChange={(event) => setGuestNames(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" placeholder="One guest name per line" />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">Decisions / Outcomes</span>
            <textarea rows={3} {...sessionForm.register('outcomes')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" placeholder="One outcome per line, e.g. Baptism Request" />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-[13px] font-medium text-white/75">Leader Observations</span>
            <textarea rows={4} {...sessionForm.register('notes')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
          </label>
          <Input label="Next Session Date" type="date" {...sessionForm.register('nextSessionDate')} />
          <div className="md:col-span-2 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowSessionModal(false)}>Cancel</Button>
            <Button type="submit" variant="secondary" disabled={sessionMutation.isPending}>
              {sessionMutation.isPending ? 'Saving...' : 'Save Session'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(selectedSessionId)}
        onClose={() => setSelectedSessionId(null)}
        title={sessionDetailQuery.data?.studyTopic || 'Session Detail'}
        description={formatDate(sessionDetailQuery.data?.date)}
        size="lg"
      >
        {sessionDetailQuery.data ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Observations</p>
              <p className="mt-2 text-sm text-white/75">{sessionDetailQuery.data.leaderNotes || 'No observations recorded.'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Attendees</p>
              <div className="mt-2 space-y-2">
                {(sessionDetailQuery.data.attendees || []).map((attendee, index) => (
                  <p key={`${attendee.prospectName}-${index}`} className="text-sm text-white/75">{attendee.prospectName}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}

export function AllProspectsPage() {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const prospectsQuery = useQuery({
    queryKey: ['cbs-all-prospects'],
    queryFn: getAllProspects,
  });
  const prospects = (prospectsQuery.data?.prospects || [])
    .filter((item) => (stage ? item.studyStage === stage : true))
    .filter((item) =>
      search
        ? [item.firstName, item.lastName, item.phone, item.email]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase())
        : true,
    );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="All Prospects" subtitle="Search across all CBS groups and follow up on stage progression." />
        <Card className="grid gap-4 lg:grid-cols-[1fr_220px_auto]">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search prospect" />
          <select value={stage} onChange={(event) => setStage(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
            <option value="">All stages</option>
            {stageOrder.map((item) => (
              <option key={item} value={item}>{getStage(item).label}</option>
            ))}
          </select>
          <Button
            variant="ghost"
            onClick={() =>
              downloadCsvFile(
                'cbs-prospects.csv',
                [
                  { key: 'name', label: 'Prospect' },
                  { key: 'group', label: 'Group' },
                  { key: 'stage', label: 'Stage' },
                ],
                prospects.map((item) => ({
                  name: [item.firstName, item.lastName].filter(Boolean).join(' '),
                  group: item.groupName,
                  stage: getStage(item.studyStage).label,
                })),
              )
            }
          >
            Export
          </Button>
        </Card>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Prospect',
              render: (row) => (
                <Link to={`/cbs/prospects/${row.prospectId}`} className="text-accent">
                  {[row.firstName, row.lastName].filter(Boolean).join(' ')}
                </Link>
              ),
            },
            { key: 'groupName', header: 'Group' },
            { key: 'studyStage', header: 'Stage', render: (row) => getStage(row.studyStage).label },
            { key: 'studiesAttended', header: 'Studies' },
            { key: 'nextFollowUpDate', header: 'Next Follow-Up', render: (row) => formatDate(row.nextFollowUpDate) },
          ]}
          data={prospects}
          emptyMessage="No prospects found."
        />
      </div>
    </AppShell>
  );
}

export function ProspectDetailPage() {
  const { prospectId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const prospectQuery = useQuery({
    queryKey: ['cbs-prospect-detail', prospectId],
    queryFn: () => getProspectById(prospectId),
  });
  const prospect = prospectQuery.data;
  const stage = getStage(prospect?.studyStage);

  if (!prospect) {
    return (
      <AppShell>
        <EmptyState icon="PR" title="Prospect not found" message="This prospect could not be resolved from the CBS workspace." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/15 text-2xl font-semibold text-accent">
                {[prospect.firstName, prospect.lastName].filter(Boolean).join(' ').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">{[prospect.firstName, prospect.lastName].filter(Boolean).join(' ')}</h1>
                <p className="mt-1 text-sm text-white/60">{prospect.phone || prospect.email || 'No contact info'}</p>
                <div className="mt-3">
                  <Badge className={stage.badgeClassName}>{stage.label}</Badge>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <StatCard label="Studies Attended" value={prospect.studiesAttended || 0} />
              <StatCard label="Studies Needed" value={Math.max((prospect.studiesTotal || 12) - (prospect.studiesAttended || 0), 0)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-white/70">Progress to conversion</p>
              <div className="h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-accent" style={{ width: `${Math.min(((prospect.studiesAttended || 0) / (prospect.studiesTotal || 12)) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {prospect.studyStage === 'baptised' ? (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await convertToMember(prospect.prospectId, {});
                      showSuccessToast('Prospect converted to member.');
                    } catch (error) {
                      showErrorToast(error.message || 'Unable to convert prospect.');
                    }
                  }}
                >
                  Convert to Member
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => showInfoToast('Edit flow can be completed from the group detail workspace.')}>
                Edit Prospect
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                ['overview', 'Overview'],
                ['study_history', 'Study History'],
                ['decisions', 'Decisions'],
                ['follow_up', 'Follow-Up'],
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

            {activeTab === 'overview' ? (
              <Card className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Contact Method</p>
                    <p className="mt-2 text-sm text-white/75">{formatLabel(prospect.contactMethod)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Group</p>
                    <p className="mt-2 text-sm text-white/75">{prospect.groupName || '—'}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Interests</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(prospect.spiritualInterests || []).map((item) => (
                      <Badge key={item} className="bg-accent/15 text-accent">{item}</Badge>
                    ))}
                    {!prospect.spiritualInterests?.length ? <p className="text-sm text-white/45">No interests recorded.</p> : null}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Notes</p>
                  <p className="mt-2 text-sm text-white/75">{prospect.leaderNotes || 'No notes recorded.'}</p>
                </div>
              </Card>
            ) : null}

            {activeTab === 'study_history' ? (
              <Card className="space-y-4">
                <p className="text-sm text-white/60">Study session history is reflected via studies attended, last study, and next study dates from the current CBS feed.</p>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">Last Study</p>
                    <p className="mt-1 text-sm text-white/60">{formatDate(prospect.lastStudyDate)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-medium text-white">Next Study</p>
                    <p className="mt-1 text-sm text-white/60">{formatDate(prospect.nextStudyDate)}</p>
                  </div>
                </div>
              </Card>
            ) : null}

            {activeTab === 'decisions' ? (
              <Card className="space-y-4">
                {(prospect.prayerRequests || []).length ? (
                  prospect.prayerRequests.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-white/75">{item}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                    No decisions recorded across sessions yet.
                  </p>
                )}
              </Card>
            ) : null}

            {activeTab === 'follow_up' ? (
              <Card className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Last Contact</p>
                    <p className="mt-2 text-sm text-white/75">{formatDate(prospect.lastContactDate)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Next Follow-Up</p>
                    <p className="mt-2 text-sm text-white/75">{formatDate(prospect.nextFollowUpDate)}</p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await updateProspect(prospect.prospectId, {
                        nextFollowUpDate: new Date().toISOString(),
                      });
                      showSuccessToast('Follow-up updated.');
                    } catch (error) {
                      showErrorToast(error.message || 'Unable to update follow-up.');
                    }
                  }}
                >
                  Update Follow-Up
                </Button>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function CBSPipelinePage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [board, setBoard] = useState([]);
  const [search, setSearch] = useState('');
  const highlightedStage = searchParams.get('stage') || '';
  const prospectsQuery = useQuery({
    queryKey: ['cbs-pipeline-prospects'],
    queryFn: getAllProspects,
  });

  useEffect(() => {
    const prospects = prospectsQuery.data?.prospects || [];
    const grouped = stageOrder.map((stage) => ({
      stage,
      label: getStage(stage).label,
      items: prospects.filter((item) => item.studyStage === stage),
    }));
    setBoard(grouped);
  }, [prospectsQuery.data]);

  const mutation = useMutation({
    mutationFn: ({ prospectId, stage }) => updateStudyStage(prospectId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbs-pipeline-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['cbs-all-prospects'] });
      queryClient.invalidateQueries({ queryKey: ['cbs-stats'] });
    },
    onError: (error) => showErrorToast(error.message || 'Unable to move card.'),
  });

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) {
      return;
    }
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const next = [...board];
    const sourceColumn = next.find((item) => item.stage === source.droppableId);
    const targetColumn = next.find((item) => item.stage === destination.droppableId);
    if (!sourceColumn || !targetColumn) {
      return;
    }
    const [moved] = sourceColumn.items.splice(source.index, 1);
    targetColumn.items.splice(destination.index, 0, {
      ...moved,
      studyStage: destination.droppableId,
    });
    setBoard(next.map((item) => ({ ...item })));
    mutation.mutate({ prospectId: moved.prospectId, stage: destination.droppableId });
  };

  const visibleBoard = board.map((column) => ({
    ...column,
    items: column.items.filter((item) =>
      search
        ? [item.firstName, item.lastName, item.groupName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase())
        : true,
    ),
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="CBS Pipeline" subtitle="Drag prospects across study stages as they move through discipleship." />
        <Card>
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pipeline cards" />
        </Card>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {visibleBoard.map((column) => {
              const meta = getStage(column.stage);
              return (
                <Droppable key={column.stage} droppableId={column.stage}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[560px] w-[320px] shrink-0 rounded-[24px] border p-4 ${meta.columnClassName} ${highlightedStage === column.stage ? 'ring-2 ring-accent/40' : ''}`}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">
                            {column.stage === 'baptised' ? '🎉 ' : ''}{column.label}
                          </p>
                          <p className="text-xs text-white/45">{column.items.length} prospects</p>
                        </div>
                        <Badge className={meta.badgeClassName}>{column.items.length}</Badge>
                      </div>
                      <div className="space-y-3">
                        {column.items.map((prospect, index) => (
                          <Draggable key={prospect.prospectId} draggableId={prospect.prospectId} index={index}>
                            {(draggableProvided) => (
                              <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} {...draggableProvided.dragHandleProps}>
                                <ProspectCard
                                  prospect={prospect}
                                  onView={() => window.location.assign(`/cbs/prospects/${prospect.prospectId}`)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </AppShell>
  );
}

export function CBSReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const statsQuery = useQuery({
    queryKey: ['cbs-reports-stats'],
    queryFn: getCBSStats,
  });
  const overviewQuery = useQuery({
    queryKey: ['cbs-reports-overview'],
    queryFn: getCBSOverviewReport,
  });
  const conversionQuery = useQuery({
    queryKey: ['cbs-reports-conversion'],
    queryFn: getCBSConversionReport,
  });
  const [leaderData, setLeaderData] = useState([]);

  useEffect(() => {
    const overview = overviewQuery.data || [];
    setLeaderData(
      overview.reduce((accumulator, item) => {
        const key = item.leaderName || 'Unassigned';
        accumulator[key] = accumulator[key] || {
          name: key,
          groups: 0,
          prospects: 0,
          converted: 0,
        };
        accumulator[key].groups += 1;
        accumulator[key].prospects += item.prospectCount || 0;
        accumulator[key].converted += item.convertedCount || 0;
        return accumulator;
      }, {}),
    );
  }, [overviewQuery.data]);

  const overview = overviewQuery.data || [];
  const stats = statsQuery.data || {};
  const conversion = conversionQuery.data || [];
  const leaderRows = Object.values(leaderData).map((item) => ({
    ...item,
    rate: item.prospects ? (item.converted / item.prospects) * 100 : 0,
  }));
  const pipeline = stats.studyPipeline || {};

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="CBS Reports" subtitle="Review KPIs, funnel progression, conversion analysis, and leader performance." />

        <div className="flex flex-wrap gap-2">
          {[
            ['overview', 'Overview'],
            ['pipeline', 'Pipeline Funnel'],
            ['conversion', 'Conversion Analysis'],
            ['leaders', 'Leader Reports'],
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

        {activeTab === 'overview' ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Groups" value={stats.totalGroups || 0} />
              <StatCard label="Prospects" value={stats.totalProspects || 0} />
              <StatCard label="Converted" value={stats.convertedCount || 0} />
              <StatCard label="Sessions This Month" value={stats.sessionsThisMonth || 0} />
            </div>
            <Card className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Group comparison</h2>
              <DataTable
                columns={[
                  { key: 'name', header: 'Group' },
                  { key: 'zone', header: 'Zone' },
                  { key: 'prospectCount', header: 'Prospects' },
                  { key: 'convertedCount', header: 'Converted' },
                  { key: 'avgAttendance', header: 'Avg Attendance' },
                ]}
                data={overview}
                emptyMessage="No group report data available."
              />
            </Card>
          </>
        ) : null}

        {activeTab === 'pipeline' ? (
          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Pipeline funnel</h2>
            <div className="space-y-4">
              {stageOrder.map((stage, index) => (
                <div key={stage}>
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{getStage(stage).label}</p>
                    <p className="text-sm text-white/60">{pipeline[stage] || 0}</p>
                  </div>
                  <div className="h-6 rounded-full bg-white/10">
                    <div
                      className="h-6 rounded-full bg-accent"
                      style={{ width: `${Math.max(((pipeline[stage] || 0) / Math.max(stats.totalProspects || 1, 1)) * (100 - index * 5), 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {activeTab === 'conversion' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">By group</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversion}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="conversionRate" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">By zone</h2>
              <DataTable
                columns={[
                  { key: 'zone', header: 'Zone' },
                  { key: 'prospectCount', header: 'Prospects' },
                  { key: 'convertedCount', header: 'Converted' },
                ]}
                data={overview}
                emptyMessage="No zone conversion data available."
              />
            </Card>
          </div>
        ) : null}

        {activeTab === 'leaders' ? (
          <Card className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Leader performance</h2>
            <DataTable
              columns={[
                { key: 'name', header: 'Leader' },
                { key: 'groups', header: 'Groups' },
                { key: 'prospects', header: 'Prospects' },
                { key: 'converted', header: 'Converted' },
                { key: 'rate', header: 'Rate', render: (row) => `${row.rate.toFixed(1)}%` },
              ]}
              data={leaderRows}
              emptyMessage="No leader performance rows available."
            />
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
