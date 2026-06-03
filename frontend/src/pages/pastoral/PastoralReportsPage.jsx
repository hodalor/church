import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  getAllCases,
  getDiscipleshipReport,
  getPastorWorkloadReport,
  getPastoralCareReport,
  getWelfareReport,
} from '../../api/endpoints/pastoral';
import PastoralPageLayout from '../../components/pastoral/PastoralPageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { buildMonthlyCaseTrend, buildResolutionDistribution, formatPastoralLabel } from '../../utils/pastoral';

const donutColors = ['#C9A84C', '#1E2A4A', '#10b981', '#f97316', '#64748b'];

function ChartCard({ eyebrow, title, children }) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-accent">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

export default function PastoralReportsPage() {
  const [activeTab, setActiveTab] = useState('care');

  const careQuery = useQuery({
    queryKey: ['pastoral-care-report'],
    queryFn: getPastoralCareReport,
  });
  const workloadQuery = useQuery({
    queryKey: ['pastoral-workload-report'],
    queryFn: getPastorWorkloadReport,
  });
  const welfareQuery = useQuery({
    queryKey: ['pastoral-welfare-report'],
    queryFn: getWelfareReport,
  });
  const discipleshipQuery = useQuery({
    queryKey: ['pastoral-discipleship-report'],
    queryFn: getDiscipleshipReport,
  });
  const casesQuery = useQuery({
    queryKey: ['pastoral-report-cases-source'],
    queryFn: () => getAllCases({ limit: 100 }),
  });

  const statusChart = useMemo(
    () => [
      { name: 'Open', value: careQuery.data?.open || 0 },
      { name: 'In Progress', value: careQuery.data?.inProgress || 0 },
      { name: 'Resolved', value: careQuery.data?.resolved || 0 },
      { name: 'Closed', value: careQuery.data?.closed || 0 },
    ],
    [careQuery.data],
  );

  const monthlyTrend = useMemo(
    () => buildMonthlyCaseTrend(casesQuery.data?.items || []),
    [casesQuery.data?.items],
  );
  const resolutionDistribution = useMemo(
    () => buildResolutionDistribution(casesQuery.data?.items || []),
    [casesQuery.data?.items],
  );
  const workloadAlert = (workloadQuery.data || []).filter((person) => person.openCases > 10);

  return (
    <PastoralPageLayout
      title="Pastoral Reports"
      subtitle="Review care performance, pastor workload, welfare activity, and discipleship progress."
      action={
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'care', label: 'Care Summary' },
            { key: 'workload', label: 'Pastor Workload' },
            { key: 'welfare', label: 'Welfare' },
            { key: 'discipleship', label: 'Discipleship' },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      }
    >
      {activeTab === 'care' ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total Cases', value: careQuery.data?.total || 0 },
              { label: 'Avg Resolution Days', value: careQuery.data?.avgResolutionDays || 0 },
              { label: 'Welfare Members', value: careQuery.data?.welfareSupported || 0 },
              { label: 'Milestones', value: careQuery.data?.recentMilestones?.length || 0 },
            ].map((item) => (
              <Card key={item.label} className="min-h-[110px] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{item.label}</p>
                <p className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{item.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard eyebrow="Care Summary" title="Cases by Type">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={careQuery.data?.byType || []} layout="vertical">
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis type="category" dataKey="type" stroke="#94a3b8" tickFormatter={formatPastoralLabel} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#C9A84C" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard eyebrow="Care Summary" title="Cases by Status">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                      {statusChart.map((entry, index) => (
                        <Cell key={entry.name} fill={donutColors[index % donutColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard eyebrow="Care Summary" title="Monthly New Cases Trend">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#C9A84C" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard eyebrow="Care Summary" title="Resolution Time Distribution">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resolutionDistribution}>
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#1E2A4A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </>
      ) : null}

      {activeTab === 'workload' ? (
        <>
          {workloadAlert.length ? (
            <Card className="border-rose-500/30 bg-rose-500/10">
              <p className="font-semibold text-rose-100">
                At capacity: {workloadAlert.map((person) => person.name).join(', ')} currently have more than 10 open cases.
              </p>
            </Card>
          ) : null}
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <ChartCard eyebrow="Workload" title="Pastor Capacity">
              <div className="overflow-x-auto rounded-[18px]">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead className="bg-white/[0.02]">
                    <tr className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                      {['Pastor or Leader', 'Open Cases', 'Resolved This Month', 'Interactions', 'Avg Case Age', 'Appointments'].map(
                        (header) => (
                          <th key={header} className="px-4 py-3.5 font-medium">
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-white/80">
                    {(workloadQuery.data || []).map((person) => (
                      <tr key={person.userId}>
                        <td className="px-4 py-3.5">{person.name}</td>
                        <td className="px-4 py-3.5">{person.openCases}</td>
                        <td className="px-4 py-3.5">{person.resolvedThisMonth}</td>
                        <td className="px-4 py-3.5">{person.totalInteractions}</td>
                        <td className="px-4 py-3.5">{person.avgCaseAge} days</td>
                        <td className="px-4 py-3.5">{person.upcomingAppointments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>

            <ChartCard eyebrow="Workload" title="Cases Per Pastor">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...(workloadQuery.data || [])].sort((a, b) => b.openCases - a.openCases)}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="openCases" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </>
      ) : null}

      {activeTab === 'welfare' ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: 'Members Receiving Support', value: welfareQuery.data?.totalSupportedCases || 0 },
              { label: 'Total Support Value', value: welfareQuery.data?.totalSupportValue || 0 },
              { label: 'Recent Support Cases', value: welfareQuery.data?.recentSupportCases?.length || 0 },
            ].map((item) => (
              <Card key={item.label} className="min-h-[110px] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{item.label}</p>
                <p className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{item.value}</p>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard eyebrow="Welfare" title="Support Type Breakdown">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={welfareQuery.data?.bySupportType || []} layout="vertical">
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis type="category" dataKey="type" stroke="#94a3b8" tickFormatter={formatPastoralLabel} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#C9A84C" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            <ChartCard eyebrow="Welfare" title="Monthly Welfare Activity">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={buildMonthlyCaseTrend(welfareQuery.data?.recentSupportCases || [])}>
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </>
      ) : null}

      {activeTab === 'discipleship' ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: 'Active Enrollments', value: discipleshipQuery.data?.active || 0 },
              { label: 'Completed', value: discipleshipQuery.data?.completed || 0 },
              { label: 'Avg Progress', value: `${discipleshipQuery.data?.avgCompletionPercent || 0}%` },
            ].map((item) => (
              <Card key={item.label} className="min-h-[110px] p-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{item.label}</p>
                <p className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{item.value}</p>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartCard eyebrow="Discipleship" title="Per Track Performance">
              <div className="space-y-3">
                {(discipleshipQuery.data?.byTrack || []).map((track) => (
                  <div key={track.trackName} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/75">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-white">{track.trackName}</p>
                      <p>{track.avgProgress}% avg completion</p>
                    </div>
                    <p className="mt-2 text-white/55">
                      {track.enrolled} enrolled - {track.completed} completed
                    </p>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard eyebrow="Discipleship" title="Top Disciplers">
              <div className="overflow-x-auto rounded-[18px]">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead className="bg-white/[0.02]">
                    <tr className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                      {['Discipler', 'Assigned', 'Completed'].map((header) => (
                        <th key={header} className="px-4 py-3.5 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-white/80">
                    {(discipleshipQuery.data?.topDisciplers || []).map((person) => (
                      <tr key={person.name}>
                        <td className="px-4 py-3.5">{person.name}</td>
                        <td className="px-4 py-3.5">{person.assigned}</td>
                        <td className="px-4 py-3.5">{person.completed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </>
      ) : null}
    </PastoralPageLayout>
  );
}
