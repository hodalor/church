import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AppShell from '../../components/layout/AppShell';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import AttendanceHeatmapChart from '../../components/attendance/AttendanceHeatmapChart';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import {
  getAttendanceHeatmap,
  getAttendanceRetention,
  getAttendanceSummary,
  getAttendanceTrends,
  getBranchAttendanceComparison,
  getMemberAttendanceReport,
} from '../../api/endpoints/attendance';
import { downloadCsv, reportPeriodOptions } from '../../utils/attendance';

const tabs = ['summary', 'trends', 'heatmap', 'retention', 'branches', 'member'];

export default function AttendanceReportsPage() {
  const printRef = useRef(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [period, setPeriod] = useState('month');
  const [branch, setBranch] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showYoY, setShowYoY] = useState(false);

  const filters = useMemo(
    () => ({
      period,
      branch: branch || undefined,
      from: period === 'custom' ? customFrom || undefined : undefined,
      to: period === 'custom' ? customTo || undefined : undefined,
    }),
    [branch, customFrom, customTo, period],
  );

  const summaryQuery = useQuery({
    queryKey: ['attendance-report-summary', filters],
    queryFn: () => getAttendanceSummary(filters),
  });

  const trendsQuery = useQuery({
    queryKey: ['attendance-report-trends', filters],
    queryFn: () => getAttendanceTrends(filters),
  });

  const heatmapQuery = useQuery({
    queryKey: ['attendance-report-heatmap', filters],
    queryFn: () => getAttendanceHeatmap(filters),
  });

  const retentionQuery = useQuery({
    queryKey: ['attendance-report-retention', filters],
    queryFn: () => getAttendanceRetention(filters),
  });

  const branchQuery = useQuery({
    queryKey: ['attendance-report-branches', filters],
    queryFn: () => getBranchAttendanceComparison(filters),
  });

  const memberQuery = useQuery({
    queryKey: ['attendance-report-member', selectedMember?.memberId, filters],
    queryFn: () => getMemberAttendanceReport(selectedMember.memberId, filters),
    enabled: Boolean(selectedMember?.memberId),
  });

  const summary = summaryQuery.data || {};
  const trends = trendsQuery.data || {};
  const heatmap = heatmapQuery.data || {};
  const retention = retentionQuery.data || {};
  const branches = branchQuery.data || {};
  const memberReport = memberQuery.data || {};

  const exportAsPdf = async () => {
    if (!printRef.current) {
      return;
    }

    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(printRef.current);
    const url = canvas.toDataURL('image/png');
    const popup = window.open('', '_blank', 'width=1200,height=900');
    if (!popup) {
      return;
    }
    popup.document.write(
      `<html><body style="margin:0;background:#fff;"><img src="${url}" style="width:100%;display:block;" /></body></html>`,
    );
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <AppShell>
      <div className="space-y-6" ref={printRef}>
        <PageHeader
          title="Attendance Reports"
          subtitle="Monitor attendance trends, retention, and branch performance across the ministry."
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="subtle" onClick={exportAsPdf}>
                Export PDF
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadCsv(
                    'attendance-summary.csv',
                    ['Metric', 'Value'],
                    [
                      ['Total Headcount', summary.kpis?.totalHeadcount || 0],
                      ['Average Per Service', summary.kpis?.averagePerService || 0],
                      ['Growth Rate', summary.kpis?.growthRate || 0],
                      ['Retention Rate', summary.kpis?.memberRetentionRate || 0],
                      ['First Timer Conversion', summary.kpis?.firstTimerConversionRate || 0],
                    ],
                  )
                }
              >
                Export CSV
              </Button>
            </div>
          }
        />

        <Card className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                  activeTab === tab
                    ? 'bg-accent text-primary'
                    : 'border border-white/10 bg-white/5 text-white/65'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Period</span>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              >
                {reportPeriodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Branch</span>
              <input
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                placeholder="All branches"
              />
            </label>
            {period === 'custom' ? (
              <>
                <label className="space-y-1.5">
                  <span className="text-[13px] font-medium text-white/75">From</span>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[13px] font-medium text-white/75">To</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                  />
                </label>
              </>
            ) : null}
          </div>
        </Card>

        {activeTab === 'summary' ? (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {[
                ['Total Headcount', summary.kpis?.totalHeadcount || 0],
                ['Avg Per Service', summary.kpis?.averagePerService || 0],
                ['Growth Rate', summary.kpis?.growthRate || '0%'],
                ['Retention Rate', summary.kpis?.memberRetentionRate || '0%'],
                ['First Timer Conversion', summary.kpis?.firstTimerConversionRate || '0%'],
              ].map(([label, value]) => (
                <Card key={label} className="p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
                </Card>
              ))}
            </div>
            <Card className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">Attendance Per Service</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Last 20 services</h3>
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.services || []}>
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'trends' ? (
          <div className="space-y-6">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-white/45">Monthly Trends</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Members, visitors, and totals</h3>
                </div>
                <label className="flex items-center gap-2 text-sm text-white/70">
                  <input type="checkbox" checked={showYoY} onChange={(event) => setShowYoY(event.target.checked)} />
                  YoY comparison
                </label>
              </div>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.monthly || []}>
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="members" stroke="#1E2A4A" strokeWidth={3} />
                    <Line type="monotone" dataKey="visitors" stroke="#C9A84C" strokeWidth={3} />
                    <Line type="monotone" dataKey="total" stroke="#14b8a6" strokeDasharray="6 4" strokeWidth={3} />
                    {showYoY ? (
                      <>
                        <Line type="monotone" dataKey="membersLastYear" stroke="#64748b" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="visitorsLastYear" stroke="#fcd34d" strokeDasharray="4 4" />
                      </>
                    ) : null}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-white/45">Weekly Trend</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Last 12 weeks</h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends.weekly || []}>
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="total" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">Growth Indicator</p>
                <p className="mt-4 text-5xl font-semibold text-white">{trends.growthRate || '0%'}</p>
                <p className="mt-3 text-sm text-white/55">
                  Attendance growth compared with the previous reporting window.
                </p>
              </Card>
            </div>
          </div>
        ) : null}

        {activeTab === 'heatmap' ? (
          <div className="space-y-6">
            <AttendanceHeatmapChart data={heatmap.cells || []} />
            <Card className="p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Insight</p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {heatmap.busiestSlot || 'Busiest: Sunday 10am'}
              </p>
              <p className="mt-2 text-sm text-white/55">
                Attendance intensity shows the average turnout by day and service hour.
              </p>
            </Card>
          </div>
        ) : null}

        {activeTab === 'retention' ? (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">Retention Matrix</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Cohort performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-white/35">
                      <th className="px-4 py-3">Cohort</th>
                      <th className="px-4 py-3">Month 1</th>
                      <th className="px-4 py-3">Month 3</th>
                      <th className="px-4 py-3">Month 6</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {(retention.matrix || []).map((row) => (
                      <tr key={row.cohort}>
                        <td className="px-4 py-3 font-semibold text-white">{row.cohort}</td>
                        {['month1', 'month3', 'month6'].map((key) => {
                          const value = Number(row[key] || 0);
                          const tone =
                            value > 70 ? 'bg-emerald-500/20 text-emerald-300' : value >= 40 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300';
                          return (
                            <td key={key} className="px-4 py-3">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
                                {value}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card className="p-5">
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Explanation</p>
              <p className="mt-3 text-lg font-semibold text-white">
                Retention shows how many new members stayed active.
              </p>
              <p className="mt-2 text-sm text-white/55">
                Green cohorts are staying connected, amber needs attention, and red requires follow-up.
              </p>
            </Card>
          </div>
        ) : null}

        {activeTab === 'branches' ? (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-white/45">Branch Comparison</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Side by side attendance</h3>
                </div>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branches.items || []}>
                      <XAxis dataKey="branch" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="averageAttendance" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5">
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">Best Performing Branch</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {branches.bestPerformer?.branch || 'N/A'}
                </p>
                <p className="mt-2 text-sm text-white/55">
                  {branches.bestPerformer?.summary || 'No branch comparison insight yet.'}
                </p>
              </Card>
            </div>

            <Card className="space-y-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">Branch Table</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Performance by branch</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-white/35">
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">Avg Attendance</th>
                      <th className="px-4 py-3">Last Service</th>
                      <th className="px-4 py-3">Growth</th>
                      <th className="px-4 py-3">Top Service</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {(branches.items || []).map((row) => (
                      <tr key={row.branch}>
                        <td className="px-4 py-3 font-semibold text-white">{row.branch}</td>
                        <td className="px-4 py-3 text-white/75">{row.averageAttendance || 0}</td>
                        <td className="px-4 py-3 text-white/75">{row.lastService || 'N/A'}</td>
                        <td className="px-4 py-3 text-white/75">{row.growth || '0%'}</td>
                        <td className="px-4 py-3 text-white/75">{row.topService || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : null}

        {activeTab === 'member' ? (
          <div className="space-y-6">
            <Card className="space-y-4">
              <MemberSearchInput
                value={selectedMember}
                onSelect={(selection) => setSelectedMember(selection)}
                onClear={() => setSelectedMember(null)}
                placeholder="Search member"
              />
            </Card>

            {selectedMember ? (
              <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-6">
                  <Card className="space-y-4 p-5">
                    <p className="text-sm uppercase tracking-[0.22em] text-white/45">Attendance Rate</p>
                    <p className="text-5xl font-semibold text-white">{memberReport.attendanceRate || '0%'}</p>
                    <p className="text-sm text-white/55">Current streak: {memberReport.streak || 0}</p>
                  </Card>
                  <AttendanceCalendar data={memberReport.calendar || []} months={6} />
                </div>

                <Card className="space-y-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-white/45">Service History</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Attendance history</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10 text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-white/35">
                          <th className="px-4 py-3">Service</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/6">
                        {(memberReport.history || []).map((item, index) => (
                          <tr key={`${item.serviceId || item.date}-${index}`}>
                            <td className="px-4 py-3 font-semibold text-white">{item.title || 'Service'}</td>
                            <td className="px-4 py-3 text-white/75">{item.date || 'N/A'}</td>
                            <td className="px-4 py-3 text-white/75">{item.status || 'Attended'}</td>
                            <td className="px-4 py-3 text-white/75">{item.method || 'QR'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
