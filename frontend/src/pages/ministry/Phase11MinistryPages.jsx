import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { WandSparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import useBranchOptions from '../../hooks/useBranchOptions';
import {
  addMemberToMinistry,
  bulkAddMembers,
  createMeeting,
  createMinistry,
  getAllMinistries,
  getMeetingById,
  getMinistryById,
  getMinistryMembers,
  getMinistryMeetings,
  getMinistryOverviewReport,
  getMinistryReport,
  getMinistryStats,
  recordMeetingAttendance,
  removeMemberFromMinistry,
  updateMeeting,
  updateMemberRole,
  updateMinistry,
} from '../../api/endpoints/ministry';
import { searchMembers } from '../../api/endpoints/members';
import { getUsers } from '../../api/endpoints/users';
import { downloadCsvFile, downloadJsonFile } from '../../utils/exportData';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const ministryTypes = [
  { value: 'worship', label: 'Worship' },
  { value: 'youth', label: 'Youth' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'children', label: 'Children' },
  { value: 'elders', label: 'Elders' },
  { value: 'deacons', label: 'Deacons' },
  { value: 'evangelism', label: 'Evangelism' },
  { value: 'media', label: 'Media' },
  { value: 'ushers', label: 'Ushers' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'bible_study', label: 'Bible Study' },
  { value: 'family', label: 'Family' },
  { value: 'other', label: 'Other' },
];

const healthMeta = {
  active: {
    label: 'Healthy',
    dotClassName: 'bg-emerald-400',
    badgeClassName: 'bg-emerald-500/15 text-emerald-200',
  },
  low: {
    label: 'Watch',
    dotClassName: 'bg-amber-400',
    badgeClassName: 'bg-amber-500/15 text-amber-100',
  },
  inactive: {
    label: 'Inactive',
    dotClassName: 'bg-rose-400',
    badgeClassName: 'bg-rose-500/15 text-rose-100',
  },
};

const ministrySchema = z.object({
  name: z.string().min(2, 'Ministry name is required.'),
  type: z.string().min(1, 'Ministry type is required.'),
  code: z.string().optional(),
  description: z.string().optional(),
  vision: z.string().optional(),
  branch: z.string().optional(),
  establishedDate: z.string().optional(),
  leaderId: z.string().optional(),
  deputyLeaderId: z.string().optional(),
  frequency: z.string().optional(),
  dayOfWeek: z.coerce.number().optional(),
  time: z.string().optional(),
  venue: z.string().optional(),
  annualGoals: z.string().optional(),
  currentFocus: z.string().optional(),
  logoUrl: z.string().optional(),
  maxMembers: z.coerce.number().optional(),
  requiresApproval: z.boolean().default(false),
});

const meetingSchema = z.object({
  title: z.string().min(2, 'Meeting title is required.'),
  date: z.string().min(1, 'Meeting date is required.'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  agenda: z.string().optional(),
  minutes: z.string().optional(),
  actionPointsRaw: z.string().optional(),
  status: z.string().optional(),
});

const buildCodeFromName = (value) =>
  String(value || '')
    .trim()
    .split(/\s+/)
    .map((item) => item.slice(0, 3).toUpperCase())
    .join('-')
    .slice(0, 12);

const formatLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

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

const getHealth = (value) =>
  healthMeta[value] || {
    label: formatLabel(value),
    dotClassName: 'bg-white/40',
    badgeClassName: 'bg-white/10 text-white/75',
  };

const exportMembers = (ministry, members) => {
  downloadCsvFile(
    `${ministry.name.replaceAll(/\s+/g, '-').toLowerCase()}-members.csv`,
    [
      { key: 'memberName', label: 'Member' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
      { key: 'joinedAt', label: 'Joined' },
      { key: 'memberId', label: 'Member ID' },
    ],
    members.map((item) => ({
      ...item,
      joinedAt: formatDate(item.joinedAt),
      status: formatLabel(item.status),
    })),
  );
};

function StatCard({ label, value, helper }) {
  const tones = {
    'Total Ministries': 'bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(14,22,36,0.98))]',
    Active: 'bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(14,22,36,0.98))]',
    'Members in Ministries': 'bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(14,22,36,0.98))]',
    'Members in No Ministry': 'bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(14,22,36,0.98))]',
    'Meetings This Month': 'bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(14,22,36,0.98))]',
    Leader: 'bg-[linear-gradient(135deg,rgba(34,211,238,0.16),rgba(14,22,36,0.98))]',
    'Member Count': 'bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(14,22,36,0.98))]',
    'Avg Attendance': 'bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(14,22,36,0.98))]',
    'Action Points': 'bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(14,22,36,0.98))]',
    'Total Meetings': 'bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(14,22,36,0.98))]',
    Completed: 'bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(14,22,36,0.98))]',
    'Top Attendees': 'bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(14,22,36,0.98))]',
  };
  return (
    <Card className={`min-h-[102px] p-3.5 ${tones[label] || ''}`}>
      <p className="inline-flex rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/75">{label}</p>
      <p className="mt-3 font-serif text-[2rem] font-semibold leading-none text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}
    </Card>
  );
}

function Badge({ children, className = 'bg-white/10 text-white/75' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}>
      {children}
    </span>
  );
}

function UserSelect({ label, value, onChange, options }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-white/75">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3.5 py-2.5 text-sm text-white outline-none"
      >
        <option value="">Select user</option>
        {options.map((user) => (
          <option key={user.userId || user.id || user._id} value={user.userId || user.id || user._id}>
            {user.fullName || user.username}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MinistryDashboard() {
  const statsQuery = useQuery({
    queryKey: ['ministry-stats'],
    queryFn: getMinistryStats,
  });
  const overviewQuery = useQuery({
    queryKey: ['ministry-overview-report'],
    queryFn: getMinistryOverviewReport,
  });

  const stats = statsQuery.data || {};
  const overview = overviewQuery.data || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Ministry Management"
          subtitle="Track ministry health, membership assignment coverage, and upcoming ministry activity from one workspace."
          action={
            <div className="flex gap-3">
              <Link to="/ministry/list">
                <Button variant="ghost">Open List</Button>
              </Link>
              <Link to="/ministry/new">
                <Button variant="secondary">+ Create Ministry</Button>
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Ministries" value={stats.total || 0} />
          <StatCard label="Active" value={stats.active || 0} />
          <StatCard label="Members in Ministries" value={stats.totalMinistryMembers || 0} />
          <StatCard label="Members in No Ministry" value={stats.membersInNoMinistry || 0} />
          <StatCard label="Meetings This Month" value={stats.meetingsThisMonth || 0} />
        </div>

        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Health Grid</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Ministry momentum</h2>
            </div>
            <Link to="/ministry/list">
              <Button variant="ghost">View all</Button>
            </Link>
          </div>
          {overview.length ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {overview.map((item) => {
                const health = getHealth(item.health);
                return (
                  <Link key={item.ministryId} to={`/ministry/${item.ministryId}`}>
                    <div className="rounded-3xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(13,19,32,0.98))] p-4 transition hover:border-accent/30">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-white/45">{formatLabel(item.type)}</p>
                          <h3 className="mt-2 text-xl font-semibold text-white">{item.name}</h3>
                        </div>
                        <span className={`mt-1 h-3 w-3 rounded-full ${health.dotClassName}`} />
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-white/70">
                        <p>{item.memberCount || 0} members</p>
                        <p>Last meeting: {formatDate(item.lastMeetingDate)}</p>
                        <div>
                          <Badge className={health.badgeClassName}>{health.label}</Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="MN"
              title="No ministries yet"
              message="Create the first ministry to start tracking health and meetings."
            />
          )}
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Upcoming</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Next meetings</h2>
            </div>
            <div className="space-y-3">
              {(stats.upcomingMeetings || []).map((meeting) => (
                <div key={meeting.meetingId} className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{meeting.ministryName || meeting.title}</p>
                      <p className="mt-1 text-sm text-white/55">
                        {formatDate(meeting.date)} • {meeting.startTime || 'TBD'} • {meeting.venue || 'Venue TBD'}
                      </p>
                    </div>
                    <Link to={`/ministry/${meeting.ministryId}`}>
                      <Button variant="ghost">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
              {!stats.upcomingMeetings?.length ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/45">
                  No upcoming ministry meetings are scheduled.
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Coverage Alert</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Unassigned members</h2>
            </div>
            <div className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-5">
              <p className="text-4xl font-semibold text-white">{stats.membersInNoMinistry || 0}</p>
              <p className="mt-2 text-sm text-white/75">
                members are not assigned to any ministry.
              </p>
              <Link to="/members?ministry=none">
                <Button variant="secondary" className="mt-4">
                  View List
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export function MinistriesListPage() {
  const [type, setType] = useState('');
  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState('all');
  const listQuery = useQuery({
    queryKey: ['ministries-list'],
    queryFn: () => getAllMinistries({ limit: 200 }),
  });
  const overviewQuery = useQuery({
    queryKey: ['ministries-list-overview'],
    queryFn: getMinistryOverviewReport,
  });

  const ministries = listQuery.data?.ministries || listQuery.data?.items || [];
  const overviewMap = useMemo(
    () => new Map((overviewQuery.data || []).map((item) => [item.ministryId, item])),
    [overviewQuery.data],
  );

  const rows = ministries
    .map((item) => ({
      ...item,
      ...overviewMap.get(item.ministryId),
    }))
    .filter((item) => (type ? item.type === type : true))
    .filter((item) => (branch ? item.branch === branch : true))
    .filter((item) => {
      if (status === 'all') {
        return true;
      }
      return status === 'active' ? item.isActive !== false : item.isActive === false;
    });

  const branchOptions = [...new Set(ministries.map((item) => item.branch).filter(Boolean))];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Ministries"
          subtitle="Filter ministry cards by type, branch, and activity status."
          action={
            <Link to="/ministry/new">
              <Button variant="secondary">+ Create Ministry</Button>
            </Link>
          }
        />

        <Card className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-[13px] font-medium text-white/75">Type</span>
              <select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3.5 py-2.5 text-sm text-white">
              <option value="">All types</option>
              {ministryTypes.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[13px] font-medium text-white/75">Branch</span>
              <select value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3.5 py-2.5 text-sm text-white">
              <option value="">All branches</option>
              {branchOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[13px] font-medium text-white/75">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3.5 py-2.5 text-sm text-white">
              <option value="all">Active & inactive</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </Card>

        {rows.length ? (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {rows.map((item) => {
              const health = getHealth(item.health);
              return (
                <Link key={item.ministryId} to={`/ministry/${item.ministryId}`}>
                  <div className="rounded-3xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(13,19,32,0.98))] p-4 transition hover:border-accent/30">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">{formatLabel(item.type)}</p>
                        <h2 className="mt-2 text-xl font-semibold text-white">{item.name}</h2>
                      </div>
                      <Badge className={health.badgeClassName}>{health.label}</Badge>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-white/70">
                      <p>{item.memberCount || 0} members</p>
                      <p>Leader: {item.leaderName || 'Unassigned'}</p>
                      <p>Last meeting: {formatDate(item.lastMeetingDate)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="MN" title="No ministries match these filters" message="Try widening the filter set or create a new ministry." />
        )}
      </div>
    </AppShell>
  );
}

export function CreateMinistryPage() {
  const navigate = useNavigate();
  const usersQuery = useQuery({
    queryKey: ['ministry-create-users'],
    queryFn: () => getUsers({ limit: 100 }),
  });

  const form = useForm({
    resolver: zodResolver(ministrySchema),
    defaultValues: {
      name: '',
      type: 'worship',
      code: '',
      description: '',
      vision: '',
      branch: '',
      establishedDate: '',
      leaderId: '',
      deputyLeaderId: '',
      frequency: 'weekly',
      dayOfWeek: 0,
      time: '',
      venue: '',
      annualGoals: '',
      currentFocus: '',
      logoUrl: '',
      maxMembers: '',
      requiresApproval: false,
    },
  });
  const { branchOptions } = useBranchOptions({ includeCurrent: form.watch('branch') });

  const name = form.watch('name');
  useEffect(() => {
    if (name && !form.getValues('code')) {
      form.setValue('code', buildCodeFromName(name));
    }
  }, [form, name]);

  const users = usersQuery.data?.users || usersQuery.data?.items || [];

  const mutation = useMutation({
    mutationFn: createMinistry,
    onSuccess: (data) => {
      showSuccessToast('Ministry created successfully.');
      navigate(`/ministry/${data.ministryId}`);
    },
    onError: (error) => showErrorToast(error.message || 'Unable to create ministry.'),
  });

  const onSubmit = form.handleSubmit((values) => {
    const leader = users.find((item) => String(item.userId || item.id || item._id) === values.leaderId);
    const deputy = users.find((item) => String(item.userId || item.id || item._id) === values.deputyLeaderId);
    mutation.mutate({
      name: values.name,
      type: values.type,
      code: values.code || buildCodeFromName(values.name),
      description: values.description,
      vision: values.vision,
      branch: values.branch,
      establishedDate: values.establishedDate || undefined,
      leaderId: values.leaderId || undefined,
      leaderName: leader?.fullName || leader?.username,
      deputyLeaderId: values.deputyLeaderId || undefined,
      deputyLeaderName: deputy?.fullName || deputy?.username,
      meetingSchedule: {
        frequency: values.frequency,
        dayOfWeek: Number(values.dayOfWeek || 0),
        time: values.time,
        venue: values.venue,
      },
      annualGoals: String(values.annualGoals || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      currentFocus: values.currentFocus,
      logoUrl: values.logoUrl,
      maxMembers: values.maxMembers || undefined,
      requiresApproval: values.requiresApproval,
    });
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Create Ministry"
          subtitle="Set up the ministry profile, leadership, cadence, and goals."
        />
        <Card>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
            <Input label="Name" error={form.formState.errors.name?.message} {...form.register('name')} />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Type</span>
              <select {...form.register('type')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                {ministryTypes.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <Input label="Code" {...form.register('code')} />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Branch</span>
              <select {...form.register('branch')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                <option value="">Select branch</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </label>
            <Input label="Established Date" type="date" {...form.register('establishedDate')} />
            <Input label="Logo URL" placeholder="https://..." {...form.register('logoUrl')} />
            <UserSelect label="Leader" value={form.watch('leaderId')} onChange={(value) => form.setValue('leaderId', value)} options={users} />
            <UserSelect label="Deputy Leader" value={form.watch('deputyLeaderId')} onChange={(value) => form.setValue('deputyLeaderId', value)} options={users} />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Frequency</span>
              <select {...form.register('frequency')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="as_needed">As Needed</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Day Of Week</span>
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
            <Input label="Venue" {...form.register('venue')} />
            <Input label="Max Members" type="number" {...form.register('maxMembers')} />
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
              <input type="checkbox" {...form.register('requiresApproval')} />
              Requires approval before assigning new members
            </label>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-[13px] font-medium text-white/75">Description</span>
              <textarea rows={3} {...form.register('description')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
            </label>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-[13px] font-medium text-white/75">Vision</span>
              <textarea rows={3} {...form.register('vision')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
            </label>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-[13px] font-medium text-white/75">Annual Goals</span>
              <textarea rows={4} {...form.register('annualGoals')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" placeholder="One goal per line" />
            </label>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-[13px] font-medium text-white/75">Current Focus</span>
              <textarea rows={3} {...form.register('currentFocus')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
            </label>
            <div className="flex justify-end gap-3 lg:col-span-2">
              <Button variant="ghost" onClick={() => navigate('/ministry/list')}>Cancel</Button>
              <Button type="submit" variant="secondary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Creating...' : 'Create Ministry'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

export function CreateMeetingPage() {
  const navigate = useNavigate();
  const { ministryId } = useParams();
  const mutation = useMutation({
    mutationFn: (payload) => createMeeting(ministryId, payload),
    onSuccess: () => {
      showSuccessToast('Meeting scheduled successfully.');
      navigate(`/ministry/${ministryId}?tab=meetings`);
    },
    onError: (error) => showErrorToast(error.message || 'Unable to schedule meeting.'),
  });

  const form = useForm({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      venue: '',
      agenda: '',
      minutes: '',
      actionPointsRaw: '',
      status: 'scheduled',
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate({
      title: values.title,
      date: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      venue: values.venue,
      agenda: values.agenda,
      minutes: values.minutes,
      status: values.status,
      actionPoints: String(values.actionPointsRaw || '')
        .split('\n')
        .map((task) => task.trim())
        .filter(Boolean)
        .map((task) => ({ task })),
    });
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="Schedule Meeting" subtitle="Create the next ministry meeting and optional action points." />
        <Card>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
            <Input label="Title" error={form.formState.errors.title?.message} {...form.register('title')} />
            <Input label="Date" type="date" error={form.formState.errors.date?.message} {...form.register('date')} />
            <Input label="Start Time" type="time" {...form.register('startTime')} />
            <Input label="End Time" type="time" {...form.register('endTime')} />
            <Input label="Venue" {...form.register('venue')} />
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Status</span>
              <select {...form.register('status')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-[13px] font-medium text-white/75">Agenda</span>
              <textarea rows={4} {...form.register('agenda')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
            </label>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-[13px] font-medium text-white/75">Minutes</span>
              <textarea rows={4} {...form.register('minutes')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
            </label>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-[13px] font-medium text-white/75">Action Points</span>
              <textarea rows={4} {...form.register('actionPointsRaw')} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" placeholder="One action point per line" />
            </label>
            <div className="flex justify-end gap-3 lg:col-span-2">
              <Button variant="ghost" onClick={() => navigate(`/ministry/${ministryId}`)}>Cancel</Button>
              <Button type="submit" variant="secondary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Meeting'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

export function MinistryDetailPage() {
  const { ministryId } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('members');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [meetingModalId, setMeetingModalId] = useState(null);
  const [attendanceModalId, setAttendanceModalId] = useState(null);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [goalsText, setGoalsText] = useState('');
  const [focusText, setFocusText] = useState('');
  const [attendanceSelection, setAttendanceSelection] = useState([]);

  const ministryQuery = useQuery({
    queryKey: ['ministry-detail', ministryId],
    queryFn: () => getMinistryById(ministryId),
  });
  const membersQuery = useQuery({
    queryKey: ['ministry-members', ministryId],
    queryFn: () => getMinistryMembers(ministryId, { limit: 500 }),
  });
  const meetingsQuery = useQuery({
    queryKey: ['ministry-meetings', ministryId],
    queryFn: () => getMinistryMeetings(ministryId, { limit: 200 }),
  });
  const reportQuery = useQuery({
    queryKey: ['ministry-report', ministryId],
    queryFn: () => getMinistryReport(ministryId),
  });
  const searchQuery = useQuery({
    queryKey: ['ministry-member-search', memberSearch],
    queryFn: () => searchMembers({ search: memberSearch, limit: 10 }),
    enabled: memberSearch.trim().length >= 2,
  });
  const meetingDetailQuery = useQuery({
    queryKey: ['ministry-meeting-detail', ministryId, meetingModalId],
    queryFn: () => getMeetingById(ministryId, meetingModalId),
    enabled: Boolean(meetingModalId),
  });

  const ministry = ministryQuery.data || {};
  const members = membersQuery.data?.members || membersQuery.data?.items || [];
  const meetings = (meetingsQuery.data?.meetings || meetingsQuery.data?.items || []).slice().sort(
    (left, right) => new Date(right.date) - new Date(left.date),
  );
  const report = reportQuery.data || {};

  useEffect(() => {
    setGoalsText((ministry.annualGoals || []).join('\n'));
    setFocusText(ministry.currentFocus || '');
  }, [ministry.annualGoals, ministry.currentFocus]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ministry-detail', ministryId] });
    queryClient.invalidateQueries({ queryKey: ['ministry-members', ministryId] });
    queryClient.invalidateQueries({ queryKey: ['ministry-meetings', ministryId] });
    queryClient.invalidateQueries({ queryKey: ['ministry-report', ministryId] });
    queryClient.invalidateQueries({ queryKey: ['ministry-stats'] });
    queryClient.invalidateQueries({ queryKey: ['ministry-overview-report'] });
  };

  const addMemberMutation = useMutation({
    mutationFn: (payload) => addMemberToMinistry(ministryId, payload),
    onSuccess: () => {
      showSuccessToast('Member added to ministry.');
      setSelectedMember(null);
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to add member.'),
  });

  const bulkAddMutation = useMutation({
    mutationFn: () =>
      bulkAddMembers(ministryId, {
        members: bulkSelection.map((item) => ({ memberId: item.memberId, role: 'member' })),
      }),
    onSuccess: () => {
      showSuccessToast('Members added in bulk.');
      setBulkSelection([]);
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Bulk add failed.'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }) => updateMemberRole(ministryId, memberId, { role }),
    onSuccess: refresh,
    onError: (error) => showErrorToast(error.message || 'Unable to update role.'),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => removeMemberFromMinistry(ministryId, memberId),
    onSuccess: () => {
      showSuccessToast('Member removed from ministry.');
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to remove member.'),
  });

  const attendanceMutation = useMutation({
    mutationFn: () =>
      recordMeetingAttendance(ministryId, attendanceModalId, {
        attendeeIds: attendanceSelection,
      }),
    onSuccess: () => {
      showSuccessToast('Attendance recorded.');
      setAttendanceModalId(null);
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to save attendance.'),
  });

  const goalMutation = useMutation({
    mutationFn: () =>
      updateMinistry(ministryId, {
        annualGoals: goalsText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        currentFocus: focusText,
      }),
    onSuccess: () => {
      showSuccessToast('Goals updated.');
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to update goals.'),
  });

  const actionPointMutation = useMutation({
    mutationFn: async ({ meeting, index }) => {
      const actionPoints = [...(meeting.actionPoints || [])];
      actionPoints[index] = {
        ...actionPoints[index],
        isCompleted: true,
      };
      return updateMeeting(ministryId, meeting.meetingId, { actionPoints });
    },
    onSuccess: () => {
      showSuccessToast('Action marked complete.');
      refresh();
    },
    onError: (error) => showErrorToast(error.message || 'Unable to update action point.'),
  });

  const filteredMembers = members
    .filter((item) => (memberFilter ? item.role === memberFilter : true))
    .filter((item) => (statusFilter ? item.status === statusFilter : true));

  const attendanceTrend = (report.meetings?.attendanceTrend || []).map((item, index) => ({
    label: `M${index + 1}`,
    attendance: item.attendanceCount || 0,
  }));

  const memberGrowth = [
    {
      label: 'Members',
      count: report.members?.total || 0,
    },
    {
      label: 'Active',
      count: report.members?.active || 0,
    },
    {
      label: 'Joined This Month',
      count: report.members?.joinedThisMonth || 0,
    },
  ];

  const meetingDetail = meetingDetailQuery.data;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            {ministry.logoUrl ? (
              <img src={ministry.logoUrl} alt={ministry.name} className="h-20 w-20 rounded-3xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/15 text-accent">
                <WandSparkles className="h-7 w-7" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-white">{ministry.name || 'Ministry Detail'}</h1>
                <Badge>{formatLabel(ministry.type)}</Badge>
                {(() => {
                  const health = getHealth((report.meetings?.total || 0) > 0 ? (meetings[0]?.status === 'completed' ? 'active' : 'low') : 'inactive');
                  return <Badge className={health.badgeClassName}>{health.label}</Badge>;
                })()}
              </div>
              <p className="mt-2 text-sm text-white/60">{ministry.description || ministry.vision || 'Manage members, meetings, reports, and goals for this ministry.'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/ministry/${ministryId}/meetings/new`}>
              <Button variant="secondary">+ Schedule Meeting</Button>
            </Link>
            <Button variant="ghost" onClick={() => exportMembers(ministry, members)}>
              Export Members
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Leader" value={ministry.leaderName || 'Unassigned'} helper={ministry.deputyLeaderName ? `Deputy: ${ministry.deputyLeaderName}` : 'No deputy leader'} />
          <StatCard label="Member Count" value={ministry.memberCount || members.length || 0} />
          <StatCard label="Avg Attendance" value={report.meetings?.avgAttendance || 0} />
          <StatCard label="Action Points" value={report.actionPoints?.pending || 0} helper={`${report.actionPoints?.overdue || 0} overdue`} />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['members', 'Members'],
            ['meetings', 'Meetings'],
            ['reports', 'Reports'],
            ['goals', 'Goals'],
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

        {activeTab === 'members' ? (
          <Card className="space-y-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-3">
                <SearchInput value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Search member for quick add or bulk add" />
                <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                  <option value="">All roles</option>
                  {[...new Set(members.map((item) => item.role).filter(Boolean))].map((role) => (
                    <option key={role} value={role}>{formatLabel(role)}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
                  <option value="">All status</option>
                  {[...new Set(members.map((item) => item.status).filter(Boolean))].map((status) => (
                    <option key={status} value={status}>{formatLabel(status)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" onClick={() => exportMembers(ministry, members)}>Export Member List</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const found = searchQuery.data?.members?.[0];
                    if (!found) {
                      showErrorToast('Search for a member first.');
                      return;
                    }
                    addMemberMutation.mutate({
                      memberId: found.memberId,
                      role: 'member',
                    });
                  }}
                >
                  + Add Member
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const matches = searchQuery.data?.members || [];
                    setBulkSelection(matches.slice(0, 5));
                  }}
                >
                  Bulk Add
                </Button>
              </div>
            </div>

            {(searchQuery.data?.members || []).length ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-sm text-white/60">Quick add candidates</p>
                <div className="flex flex-wrap gap-2">
                  {searchQuery.data.members.map((member) => (
                    <button
                      key={member.memberId}
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="rounded-full border border-white/10 bg-[#101827] px-3 py-2 text-sm text-white/75"
                    >
                      {[member.firstName, member.lastName].filter(Boolean).join(' ') || member.memberId}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <DataTable
              columns={[
                {
                  key: 'member',
                  header: 'Member',
                  render: (row) => (
                    <div>
                      <p className="font-medium text-white">{row.memberName}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{row.memberId}</p>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  header: 'Role',
                  render: (row) => (
                    <select
                      value={row.role || 'member'}
                      onChange={(event) => roleMutation.mutate({ memberId: row.memberId, role: event.target.value })}
                      className="rounded-lg border border-white/10 bg-[#101827] px-2.5 py-2 text-sm text-white"
                    >
                      <option value="member">Member</option>
                      <option value="leader">Leader</option>
                      <option value="deputy_leader">Deputy Leader</option>
                      <option value="coordinator">Coordinator</option>
                    </select>
                  ),
                },
                { key: 'joinedAt', header: 'Joined', render: (row) => formatDate(row.joinedAt) },
                { key: 'status', header: 'Status', render: (row) => formatLabel(row.status) },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Button variant="ghost" onClick={() => removeMutation.mutate(row.memberId)}>
                      Remove
                    </Button>
                  ),
                },
              ]}
              data={filteredMembers}
              emptyMessage="No ministry members found."
            />
          </Card>
        ) : null}

        {activeTab === 'meetings' ? (
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Meetings</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Recent ministry meetings</h2>
              </div>
              <Link to={`/ministry/${ministryId}/meetings/new`}>
                <Button variant="secondary">+ Schedule Meeting</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <div key={meeting.meetingId} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{meeting.title}</p>
                      <p className="mt-1 text-sm text-white/55">
                        {formatDate(meeting.date)} • {meeting.startTime || 'TBD'} • {meeting.venue || 'Venue TBD'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{formatLabel(meeting.status)}</Badge>
                      <Button variant="ghost" onClick={() => setMeetingModalId(meeting.meetingId)}>View</Button>
                      {meeting.status === 'completed' ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setAttendanceModalId(meeting.meetingId);
                            setAttendanceSelection(meeting.attendeeIds || []);
                          }}
                        >
                          Record Attendance
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-white/65">Attendance: {meeting.attendanceCount || 0}</p>
                </div>
              ))}
              {!meetings.length ? (
                <EmptyState icon="MT" title="No meetings yet" message="Schedule the first ministry meeting from this workspace." />
              ) : null}
            </div>
          </Card>
        ) : null}

        {activeTab === 'reports' ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Total Meetings" value={report.meetings?.total || 0} />
              <StatCard label="Completed" value={report.meetings?.completed || 0} />
              <StatCard label="Top Attendees" value={report.topAttendees?.length || 0} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Attendance Trend</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Last meetings</h2>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      downloadJsonFile(`ministry-${ministryId}-report.json`, report)
                    }
                  >
                    Export Report
                  </Button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceTrend}>
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Line type="monotone" dataKey="attendance" stroke="#C9A84C" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Member Growth</p>
                <h2 className="text-2xl font-semibold text-white">Current snapshot</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberGrowth}>
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#1E2A4A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        ) : null}

        {activeTab === 'goals' ? (
          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Goals</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Annual goals and current focus</h2>
            </div>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Annual Goals</span>
              <textarea rows={6} value={goalsText} onChange={(event) => setGoalsText(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Current Focus</span>
              <textarea rows={4} value={focusText} onChange={(event) => setFocusText(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none" />
            </label>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => goalMutation.mutate()} disabled={goalMutation.isPending}>
                {goalMutation.isPending ? 'Saving...' : 'Save Goals'}
              </Button>
            </div>
          </Card>
        ) : null}
      </div>

      <Modal
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title="Add Member"
        description="Confirm the member assignment into this ministry."
      >
        {selectedMember ? (
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              Add {[selectedMember.firstName, selectedMember.lastName].filter(Boolean).join(' ') || selectedMember.memberId} to {ministry.name}?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setSelectedMember(null)}>Cancel</Button>
              <Button
                variant="secondary"
                onClick={() =>
                  addMemberMutation.mutate({
                    memberId: selectedMember.memberId,
                    role: 'member',
                  })
                }
              >
                Add Member
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={bulkSelection.length > 0}
        onClose={() => setBulkSelection([])}
        title="Bulk Add Members"
        description="The first five search results are preloaded here for quick assignment."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {bulkSelection.map((member) => (
              <span key={member.memberId} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75">
                {[member.firstName, member.lastName].filter(Boolean).join(' ') || member.memberId}
              </span>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setBulkSelection([])}>Cancel</Button>
            <Button variant="secondary" onClick={() => bulkAddMutation.mutate()} disabled={bulkAddMutation.isPending}>
              {bulkAddMutation.isPending ? 'Adding...' : 'Bulk Add'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(meetingModalId)}
        onClose={() => setMeetingModalId(null)}
        title={meetingDetail?.title || 'Meeting Detail'}
        description={`${formatDate(meetingDetail?.date)} • ${meetingDetail?.venue || 'Venue TBD'}`}
        size="lg"
      >
        {meetingDetail ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Agenda</p>
                <p className="mt-2 text-sm text-white/75">{meetingDetail.agenda || 'No agenda recorded.'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Minutes</p>
                <p className="mt-2 text-sm text-white/75">{meetingDetail.minutes || 'No minutes recorded.'}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Action Points</p>
              <div className="mt-3 space-y-2">
                {(meetingDetail.actionPoints || []).map((item, index) => (
                  <div key={`${item.task}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101827] px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{item.task}</p>
                      <p className="text-sm text-white/55">{item.assignedTo || 'Unassigned'} • {formatDate(item.dueDate)}</p>
                    </div>
                    {!item.isCompleted ? (
                      <Button variant="ghost" onClick={() => actionPointMutation.mutate({ meeting: meetingDetail, index })}>
                        Mark Action Complete
                      </Button>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-200">Completed</Badge>
                    )}
                  </div>
                ))}
                {!meetingDetail.actionPoints?.length ? <p className="text-sm text-white/45">No action points recorded.</p> : null}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Attendance</p>
              <p className="mt-2 text-sm text-white/75">{meetingDetail.attendanceCount || 0} attendees recorded.</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(attendanceModalId)}
        onClose={() => setAttendanceModalId(null)}
        title="Record Meeting Attendance"
        description="Select all ministry members who attended this meeting."
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setAttendanceSelection(members.map((item) => item.memberId))}>Select All</Button>
            <Button variant="ghost" onClick={() => setAttendanceSelection([])}>Deselect All</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {members.map((member) => (
              <label key={member.memberId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={attendanceSelection.includes(member.memberId)}
                  onChange={(event) =>
                    setAttendanceSelection((current) =>
                      event.target.checked
                        ? [...current, member.memberId]
                        : current.filter((item) => item !== member.memberId),
                    )
                  }
                />
                <span>{member.memberName}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setAttendanceModalId(null)}>Cancel</Button>
            <Button variant="secondary" onClick={() => attendanceMutation.mutate()} disabled={attendanceMutation.isPending}>
              {attendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
