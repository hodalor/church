import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppShell from '../../components/layout/AppShell';
import ReliabilityScore from '../../components/volunteers/ReliabilityScore';
import BadgeChip from '../../components/volunteers/BadgeChip';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { getUpcomingRosters } from '../../api/endpoints/rosters';
import { getVolunteerStats } from '../../api/endpoints/volunteers';
import useVolunteersAccess from '../../hooks/useVolunteersAccess';

const statTones = [
  'border-cyan-400/18 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(13,19,32,0.98))]',
  'border-emerald-400/18 bg-[linear-gradient(135deg,rgba(16,185,129,0.15),rgba(13,19,32,0.98))]',
  'border-violet-400/18 bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(13,19,32,0.98))]',
  'border-amber-300/20 bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(13,19,32,0.98))]',
];

const panelClass =
  'border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(8,13,24,0.98))]';

export default function VolunteersDashboard() {
  const { canViewVolunteers, canCreateVolunteers, canCreateRosters } = useVolunteersAccess();
  const statsQuery = useQuery({
    queryKey: ['volunteers-dashboard-stats'],
    queryFn: getVolunteerStats,
    enabled: canViewVolunteers,
  });
  const rostersQuery = useQuery({
    queryKey: ['volunteers-dashboard-upcoming-rosters'],
    queryFn: () => getUpcomingRosters({ limit: 3 }),
    enabled: canViewVolunteers,
  });

  if (!canViewVolunteers) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Volunteers</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to volunteer management.
          </p>
        </Card>
      </AppShell>
    );
  }

  const stats = statsQuery.data || {};
  const topVolunteers = stats.topVolunteers || [];
  const upcomingRosters = rostersQuery.data?.items || rostersQuery.data || [];
  const lowReliability = (stats.lowestReliability || []).filter(
    (item) => Number(item.performance?.reliabilityScore || item.reliabilityScore || 0) < 60,
  );
  const chartData = (stats.byDepartment || []).map((item) => ({
    ...item,
    fill:
      Number(item.avgReliability || 0) > 80
        ? '#22c55e'
        : Number(item.avgReliability || 0) >= 60
          ? '#f59e0b'
          : '#f43f5e',
  }));
  const kpis = [
    { label: 'Total Volunteers', value: stats.total || 0 },
    { label: 'Active', value: stats.active || 0 },
    { label: 'Avg Reliability Score', value: `${Math.round(stats.avgReliabilityScore || 0)}%` },
    { label: 'Services This Month', value: stats.servicesThisMonth || 0 },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Volunteers"
          subtitle="Track volunteer performance, rosters, and department staffing."
          action={
            <div className="flex flex-wrap gap-2">
              {canCreateVolunteers ? (
                <Link to="/volunteers/new">
                  <Button variant="secondary">Register Volunteer</Button>
                </Link>
              ) : null}
              {canCreateRosters ? (
                <Link to="/volunteers/rosters/new">
                  <Button variant="ghost">Create Roster</Button>
                </Link>
              ) : null}
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item, index) => (
            <Card key={item.label} className={`min-h-[102px] p-3.5 ${statTones[index] || ''}`}>
              <p className="inline-flex rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/72">
                {item.label}
              </p>
              <h2 className="mt-3 text-[1.95rem] font-semibold leading-none text-white">{item.value}</h2>
            </Card>
          ))}
        </div>

        {lowReliability.length ? (
          <Link
            to="/volunteers/list?reliability=low"
            className="block rounded-[20px] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
          >
            {lowReliability.length} volunteers have low reliability scores.
          </Link>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className={`space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/55">Department Breakdown</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Volunteer strength by department</h2>
              </div>
              <Link to="/volunteers/list">
                <Button variant="subtle">View All</Button>
              </Link>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="department" type="category" stroke="#94a3b8" width={90} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.department} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className={`space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/55">Top Volunteers</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Most reliable team members</h2>
              </div>
              <Link to="/volunteers/list">
                <Button variant="subtle">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {topVolunteers.map((volunteer) => (
                <div
                  key={volunteer._id || volunteer.id}
                  className="flex items-center justify-between rounded-[18px] border border-cyan-400/12 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(16,24,39,0.98))] px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{volunteer.memberName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(volunteer.performance?.badges || []).slice(0, 2).map((badge) => (
                        <BadgeChip key={badge} badge={badge} />
                      ))}
                    </div>
                  </div>
                  <div className="w-24">
                    <ReliabilityScore score={volunteer.performance?.reliabilityScore || 0} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className={`space-y-4 ${panelClass}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/55">Upcoming Rosters</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Next published and draft rosters</h2>
              </div>
              <Link to="/volunteers/rosters/new">
                <Button variant="secondary">Create Roster</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingRosters.map((roster) => (
                <Link
                  key={roster.rosterId || roster._id}
                  to={`/volunteers/rosters/${roster.rosterId || roster._id}`}
                  className="flex items-center justify-between rounded-[18px] border border-violet-400/14 bg-[linear-gradient(135deg,rgba(167,139,250,0.14),rgba(16,24,39,0.98))] px-3.5 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{roster.title}</p>
                    <p className="mt-1 text-sm text-white/45">
                      {new Date(roster.date).toLocaleDateString()} • {roster.assignments?.length || 0} assignments
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      roster.isPublished
                        ? 'border border-emerald-400/30 bg-emerald-500/15 text-emerald-300'
                        : 'border border-slate-400/30 bg-slate-500/15 text-slate-300'
                    }`}
                  >
                    {roster.isPublished ? 'Published' : 'Draft'}
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className={`space-y-4 ${panelClass}`}>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/55">Quick Actions</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Move faster</h2>
            </div>
            <div className="grid gap-3">
              <Link to="/volunteers/new">
                <Button variant="ghost" className="w-full justify-start">
                  Register Volunteer
                </Button>
              </Link>
              <Link to="/volunteers/rosters/new">
                <Button variant="ghost" className="w-full justify-start">
                  Create Roster
                </Button>
              </Link>
              <Link to="/volunteers/rosters?mode=auto">
                <Button variant="ghost" className="w-full justify-start">
                  Auto-Generate Roster
                </Button>
              </Link>
              <Link to="/volunteers/list">
                <Button variant="ghost" className="w-full justify-start">
                  View Attendance
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
