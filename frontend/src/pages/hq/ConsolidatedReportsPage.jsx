import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useMutation, useQuery } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { ChartSkeleton } from '../../components/ui/Skeleton';
import { AnalyticsPage, FilterTabs, KpiCard } from '../../components/analytics/AnalyticsWidgets';
import { getAllBranches } from '../../api/endpoints/branches';
import { generateGrowthAnalysis } from '../../api/endpoints/ai';
import { getConsolidatedReport } from '../../api/endpoints/hq';
import useAnalyticsAccess from '../../hooks/useAnalyticsAccess';
import { useTenant } from '../../hooks/useTenant';
import { formatAnalyticsCurrency, formatAnalyticsNumber } from '../../utils/analytics';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../utils/toast';

const sections = [
  { label: 'Membership', value: 'membership' },
  { label: 'Attendance', value: 'attendance' },
  { label: 'Finance', value: 'finance' },
  { label: 'Visitors', value: 'visitors' },
  { label: 'Pastoral', value: 'pastoralCare' },
  { label: 'Volunteers', value: 'volunteers' },
  { label: 'Events', value: 'events' },
];

export default function ConsolidatedReportsPage() {
  const reportRef = useRef(null);
  const { canViewReports } = useAnalyticsAccess();
  const { currencyCode, currencySymbol, churchName } = useTenant();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [branchId, setBranchId] = useState('');
  const [openSection, setOpenSection] = useState('membership');
  const [narrative, setNarrative] = useState('');
  const [streamingText, setStreamingText] = useState('');

  const branchesQuery = useQuery({
    queryKey: ['reports-branch-list'],
    queryFn: () => getAllBranches(),
    enabled: canViewReports,
  });
  const reportQuery = useQuery({
    queryKey: ['consolidated-report', month, year, branchId],
    queryFn: () => getConsolidatedReport({ month, year, branchId: branchId || undefined }),
    enabled: canViewReports,
  });

  const narrativeMutation = useMutation({
    mutationFn: () =>
      generateGrowthAnalysis({
        targetPeriod: `${month}/${year}`,
        analyticsSummary: JSON.stringify(reportQuery.data?.executiveSummary || {}),
      }),
    onSuccess: (result) => {
      const fullText = result.text || '';
      setNarrative(fullText);
      setStreamingText('');
      let index = 0;
      const interval = window.setInterval(() => {
        index += 1;
        setStreamingText(fullText.slice(0, index));
        if (index >= fullText.length) {
          window.clearInterval(interval);
        }
      }, 8);
      showSuccessToast('AI narrative generated.');
    },
    onError: (error) => showErrorToast(error.message || 'Unable to generate narrative.'),
  });

  const report = useMemo(() => reportQuery.data || {}, [reportQuery.data]);
  const branchBreakdown = report.branchBreakdown || [];

  const exportPdf = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { backgroundColor: '#060b14', scale: 2 });
    const link = document.createElement('a');
    link.download = `prynova-report-${year}-${month}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showSuccessToast('Report export downloaded.');
  };

  const activeSectionData = useMemo(() => report[openSection] || {}, [openSection, report]);

  if (!canViewReports) {
    return (
      <AppShell>
        <EmptyState
          icon="RP"
          title="Reports unavailable"
          message="Your role does not currently have access to consolidated BI reports."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AnalyticsPage
        title="Consolidated Reports"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => window.print()}>
              Print Report
            </Button>
            <Button variant="ghost" onClick={exportPdf}>
              Export PDF
            </Button>
            <Button variant="secondary" onClick={() => showInfoToast('Team sharing can route through your existing communication flows.')}>
              Share with Team
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-[22px] border border-white/8 bg-[#0d1320] p-4 text-white">
            <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="min-w-[170px] rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(year, index, 1).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
            <select value={year} onChange={(event) => setYear(Number(event.target.value))} className="min-w-[130px] rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
              {Array.from({ length: 5 }).map((_, index) => {
                const optionYear = new Date().getFullYear() - index;
                return (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}
                  </option>
                );
              })}
            </select>
            <select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="min-w-[190px] rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white">
              <option value="">All branches</option>
              {(branchesQuery.data?.items || []).map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => narrativeMutation.mutate()} disabled={narrativeMutation.isPending}>
              {narrativeMutation.isPending ? 'Generating...' : 'Generate AI Narrative'}
            </Button>
            <Button variant="ghost" onClick={() => navigator.clipboard.writeText(streamingText || narrative)} disabled={!streamingText && !narrative}>
              Copy
            </Button>
          </div>

          {reportQuery.isLoading ? (
            <ChartSkeleton />
          ) : (
            <div ref={reportRef} className="space-y-4">
              {narrativeMutation.isPending || streamingText ? (
                <div className="rounded-[18px] border border-white/8 bg-[#0d1320] px-4 py-3 text-sm text-white/75">
                  {streamingText || 'Writing your report narrative...'}
                </div>
              ) : null}

              <FilterTabs tabs={sections} value={openSection} onChange={setOpenSection} />
              <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4 text-white">
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(activeSectionData)
                    .filter(([, value]) => typeof value === 'number')
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <KpiCard
                        key={key}
                        label={key}
                        value={
                          key.toLowerCase().includes('income') ||
                          key.toLowerCase().includes('expense') ||
                          key.toLowerCase().includes('balance')
                            ? formatAnalyticsCurrency(value, currencyCode, currencySymbol)
                            : formatAnalyticsNumber(value)
                        }
                      />
                    ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/8 bg-[#0d1320] p-4 text-white">
                <h3 className="text-lg font-semibold text-white">{churchName || report.tenant?.churchName || 'Church'} Branch Breakdown</h3>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-white/75">
                    <thead className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                      <tr>
                        <th className="pb-3">Branch</th>
                        <th className="pb-3">Members</th>
                        <th className="pb-3">Attendance</th>
                        <th className="pb-3">Income</th>
                        <th className="pb-3">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branchBreakdown.map((branch) => (
                        <tr key={branch.branchId} className="border-t border-white/8">
                          <td className="py-3 font-medium text-white">{branch.branchName}</td>
                          <td>{formatAnalyticsNumber(branch.members?.total || 0)}</td>
                          <td>{formatAnalyticsNumber(branch.attendance?.avg || 0)}</td>
                          <td>{formatAnalyticsCurrency(branch.finance?.income || 0, currencyCode, currencySymbol)}</td>
                          <td>{formatAnalyticsNumber(branch.health?.score || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnalyticsPage>
    </AppShell>
  );
}
