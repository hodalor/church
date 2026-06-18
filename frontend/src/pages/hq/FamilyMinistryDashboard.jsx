import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, HeartHandshake, Home, Users } from 'lucide-react';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { getFamilyMinistryDashboard } from '../../api/endpoints/familyMinistry';
import { downloadCsvFile, downloadJsonFile } from '../../utils/exportData';

const riskColors = {
  new: '#94A3B8',
  healthy: '#22C55E',
  at_risk: '#F59E0B',
  inactive: '#EF4444',
  drifting: '#F97316',
};

const formatLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

function Badge({ children, className = 'bg-white/10 text-white/75' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, helper }) {
  const tones = {
    'Total Families': 'bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(14,22,36,0.98))]',
    'Total Members': 'bg-[linear-gradient(135deg,rgba(167,139,250,0.16),rgba(14,22,36,0.98))]',
    'Families With Children': 'bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(14,22,36,0.98))]',
    Couples: 'bg-[linear-gradient(135deg,rgba(244,201,93,0.18),rgba(14,22,36,0.98))]',
    'Single Parent Families': 'bg-[linear-gradient(135deg,rgba(251,146,60,0.16),rgba(14,22,36,0.98))]',
    'At-Risk Families': 'bg-[linear-gradient(135deg,rgba(251,113,133,0.16),rgba(14,22,36,0.98))]',
  };
  return (
    <Card className={`min-h-[102px] p-3.5 ${tones[label] || ''}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white/75">{label}</p>
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <p className="mt-3 font-serif text-[2rem] font-semibold leading-none text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}
    </Card>
  );
}

export default function FamilyMinistryDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ['family-ministry-dashboard'],
    queryFn: getFamilyMinistryDashboard,
  });

  const overview = dashboardQuery.data?.overview || {};
  const segments = useMemo(() => dashboardQuery.data?.segments || [], [dashboardQuery.data?.segments]);
  const atRiskFamilies = dashboardQuery.data?.atRisk || [];

  const segmentSizes = useMemo(
    () =>
      segments.map((item, index) => ({
        name: item.familyGroupId || `Family ${index + 1}`,
        memberCount: item.memberCount || 0,
        children: item.children || 0,
      })),
    [segments],
  );

  const statusMix = useMemo(() => {
    const counts = {};
    segments.forEach((segment) => {
      (segment.statuses || []).forEach((status) => {
        counts[status] = (counts[status] || 0) + 1;
      });
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: riskColors[name] || '#C9A84C',
    }));
  }, [segments]);

  const exportFamilies = () => {
    downloadCsvFile(
      'family-ministry-segments.csv',
      [
        { key: 'familyGroupId', label: 'Family Group' },
        { key: 'memberCount', label: 'Members' },
        { key: 'children', label: 'Children' },
        { key: 'statuses', label: 'Statuses' },
      ],
      segments.map((item) => ({
        ...item,
        statuses: (item.statuses || []).map((status) => formatLabel(status)).join(' | '),
      })),
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Family Ministry"
          subtitle="See household composition, identify at-risk families, and support care follow-up with family-level analytics."
          action={
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={exportFamilies}>
                Export CSV
              </Button>
              <Button variant="secondary" onClick={() => downloadJsonFile('family-ministry-dashboard.json', dashboardQuery.data || {})}>
                Export JSON
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Total Families" value={overview.totalFamilies || 0} icon={Home} />
          <StatCard label="Total Members" value={overview.totalMembers || 0} icon={Users} />
          <StatCard label="Families With Children" value={overview.familiesWithChildren || 0} icon={HeartHandshake} />
          <StatCard label="Couples" value={overview.couples || 0} icon={HeartHandshake} />
          <StatCard label="Single Parent Families" value={overview.singleParentFamilies || 0} icon={AlertTriangle} />
          <StatCard label="At-Risk Families" value={overview.atRiskFamilies || 0} icon={AlertTriangle} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Family Segments</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Household size and children mix</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentSizes}>
                  <XAxis dataKey="name" stroke="#94A3B8" hide />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip />
                  <Bar dataKey="memberCount" fill="#38BDF8" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="children" fill="#A78BFA" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Health Mix</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Status distribution</h2>
            </div>
            {statusMix.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusMix} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                      {statusMix.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon="FM"
                title="No health mix available"
                message="Family status distribution will appear once family records are analyzed."
              />
            )}
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">At-Risk Families</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Care escalation queue</h2>
              </div>
              <Badge className="bg-rose-500/15 text-rose-100">{atRiskFamilies.length} families</Badge>
            </div>
            {atRiskFamilies.length ? (
              <div className="space-y-3">
                {atRiskFamilies.map((family, index) => (
                  <div key={family.familyGroupId || `risk-${index}`} className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{family.familyGroupId || `Family ${index + 1}`}</p>
                        <p className="mt-1 text-sm text-white/60">{family.memberCount || 0} household members</p>
                      </div>
                      <Badge className="bg-rose-500/20 text-rose-100">Needs care</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(family.members || []).map((member) => (
                        <span key={member.memberId || member.name} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101827] px-3 py-1 text-xs text-white/75">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: riskColors[member.healthStatus] || '#C9A84C' }} />
                          {member.name} ({formatLabel(member.healthStatus)})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="OK"
                title="No families in the risk queue"
                message="At-risk households will appear here when the family analytics service detects concern signals."
              />
            )}
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Segment Snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Family list</h2>
            </div>
            {segments.length ? (
              <div className="space-y-3">
                {segments.slice(0, 8).map((segment, index) => (
                  <div key={segment.familyGroupId || `segment-${index}`} className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{segment.familyGroupId || `Family ${index + 1}`}</p>
                        <p className="mt-1 text-sm text-white/55">
                          {segment.memberCount || 0} members • {segment.children || 0} children
                        </p>
                      </div>
                      <Badge>{(segment.members || []).length} profiles</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(segment.members || []).slice(0, 4).map((member) => (
                        <span key={member.memberId || member.name} className="rounded-full border border-cyan-300/15 bg-cyan-900/30 px-3 py-1 text-xs text-white/70">
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="HM"
                title="No family segments available"
                message="Family segments will appear once members have household data to analyze."
              />
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
