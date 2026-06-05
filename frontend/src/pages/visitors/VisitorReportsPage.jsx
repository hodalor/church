import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppShell from '../../components/layout/AppShell';
import FunnelChart from '../../components/visitors/FunnelChart';
import Card from '../../components/ui/Card';
import { getVisitorReports } from '../../api/endpoints/visitors';
import useVisitorsAccess from '../../hooks/useVisitorsAccess';

const tabs = ['funnel', 'analysis', 'satisfaction', 'referrals'];

export default function VisitorReportsPage() {
  const { canOpenReports } = useVisitorsAccess();
  const [activeTab, setActiveTab] = useState('funnel');
  const reportsQuery = useQuery({
    queryKey: ['visitor-reports'],
    queryFn: getVisitorReports,
  });

  const reports = reportsQuery.data;

  if (!canOpenReports) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Visitors</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to visitor reports.
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
          <h1 className="mt-2 text-2xl font-semibold text-white">Visitor Reports</h1>
        </div>

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
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'funnel' ? (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Conversion Funnel</h2>
              <FunnelChart stages={reports?.funnel || []} />
            </Card>
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Drop-off Points</h2>
              <div className="space-y-3">
                {(reports?.dropOff || []).map((item) => (
                  <div key={`${item.from}-${item.to}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <p className="font-semibold text-white">
                      {item.from} → {item.to}
                    </p>
                    <p className="mt-1 text-sm text-white/55">
                      Drop-off {item.dropOffPercentage}% • Avg days stuck {item.averageDaysStuck}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4 xl:col-span-2">
              <h2 className="text-xl font-semibold text-white">Conversion Rate Trend</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reports?.conversionTrend || []}>
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#d1aa47" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'analysis' ? (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Visitors" value={reports?.totalVisitors || 0} />
              <StatCard label="Converted" value={reports?.converted || 0} />
              <StatCard label="Conversion Rate" value={`${reports?.conversionRate || 0}%`} />
              <StatCard label="Avg Days To Convert" value={reports?.averageDaysToConvert || 0} />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <ChartCard title="By How They Heard About Us" data={reports?.heardAbout || []} dataKey="value" />
              <ChartCard title="By Branch" data={reports?.branchBreakdown || []} dataKey="value" />
            </div>
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Top Referrers</h2>
              <div className="space-y-3">
                {(reports?.topReferrers || []).map((item) => (
                  <div key={item.memberId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-sm text-white/55">{item.memberId}</p>
                    </div>
                    <div className="text-right text-sm text-white/65">
                      <p>{item.referrals} referrals</p>
                      <p>{item.successRate}% success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'satisfaction' ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Overall Score</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="65%"
                    outerRadius="100%"
                    data={[{ name: 'Score', value: reports?.satisfaction?.score || 0, fill: '#d1aa47' }]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <PolarAngleAxis type="number" domain={[0, 5]} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={12} />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Dimension Scores</h2>
              <div className="space-y-4">
                {[
                  ['Experience', reports?.satisfaction?.experience || 0],
                  ['Service Quality', reports?.satisfaction?.serviceQuality || 0],
                  ['Welcome Feeling', reports?.satisfaction?.welcomeFeeling || 0],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>{label}</span>
                      <span>{value}/5</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-white/10">
                      <div className="h-3 rounded-full bg-accent" style={{ width: `${(value / 5) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard label="Would Return" value={`${reports?.satisfaction?.wouldReturn || 0}%`} />
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Top Words</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(reports?.satisfaction?.topWords || []).map((word) => (
                      <span key={word} className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm text-accent">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'referrals' ? (
          <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Top Referring Members</h2>
              <div className="space-y-3">
                {(reports?.topReferrers || []).map((item) => (
                  <div key={item.memberId} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-sm text-white/55">{item.referrals} referrals</p>
                    </div>
                    <div className="text-right text-sm text-white/60">
                      <p>{item.converted} converted</p>
                      <p>{item.successRate}% success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <ChartCard title="Referral Trend" data={reports?.referralTrend || []} dataKey="referrals" xKey="period" />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }) {
  return (
    <Card className="min-h-[110px] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{label}</p>
      <h2 className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{value}</h2>
    </Card>
  );
}

function ChartCard({ title, data, dataKey, xKey = 'label' }) {
  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey={xKey} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey={dataKey} fill="#d1aa47" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
