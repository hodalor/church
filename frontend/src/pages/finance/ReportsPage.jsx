import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import AmountDisplay from '../../components/finance/AmountDisplay';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import {
  getFinancialSummary,
  getGivingGoals,
  getGivingTrends,
  getMemberAnnualStatement,
  getSmartGivingIntelligence,
  getTopGivers,
  setGivingGoal,
} from '../../api/endpoints/finance';
import { useMutation } from '@tanstack/react-query';

const tabs = ['summary', 'trends', 'givers', 'statement'];
const chartColors = ['#C9A84C', '#1E2A4A', '#10B981', '#8B5CF6', '#F97316'];

export default function ReportsPage() {
  const { canApproveFinance } = useFinanceAccess();
  const [tab, setTab] = useState('summary');
  const [year, setYear] = useState(new Date().getFullYear());
  const [topGiverPeriod, setTopGiverPeriod] = useState('year');
  const [anonymize, setAnonymize] = useState(false);
  const [statementMember, setStatementMember] = useState(null);
  const [requestedStatementMember, setRequestedStatementMember] = useState(null);
  const [goalForm, setGoalForm] = useState({
    year: new Date().getFullYear(),
    month: '',
    targetAmount: '',
    currency: 'USD',
    notes: '',
  });

  const summaryQuery = useQuery({
    queryKey: ['finance-report-summary', year],
    queryFn: () => getFinancialSummary(year),
  });

  const previousYearSummaryQuery = useQuery({
    queryKey: ['finance-report-summary', Number(year) - 1],
    queryFn: () => getFinancialSummary(Number(year) - 1),
  });

  const trendsQuery = useQuery({
    queryKey: ['finance-report-trends'],
    queryFn: () => getGivingTrends({ months: 12 }),
  });
  const goalsQuery = useQuery({
    queryKey: ['finance-giving-goals', year],
    queryFn: () => getGivingGoals({ year }),
  });
  const smartInsightsQuery = useQuery({
    queryKey: ['finance-smart-intelligence-report'],
    queryFn: getSmartGivingIntelligence,
  });

  const topGiversQuery = useQuery({
    queryKey: ['finance-report-top-givers', topGiverPeriod, anonymize],
    queryFn: () => getTopGivers({ period: topGiverPeriod, anonymize, limit: 10 }),
  });

  const statementQuery = useQuery({
    queryKey: ['finance-report-statement', requestedStatementMember?.memberId, year],
    queryFn: () => getMemberAnnualStatement(requestedStatementMember.memberId, year),
    enabled: Boolean(requestedStatementMember?.memberId),
  });

  const summary = summaryQuery.data || {};
  const previousSummary = previousYearSummaryQuery.data || {};
  const trends = trendsQuery.data || {};
  const statement = statementQuery.data;
  const incomeBreakdownData = Object.entries(summary.incomeByType || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const expenseBreakdownData = Object.entries(summary.expenseByCategory || {}).map(([name, value]) => ({
    name,
    value,
  }));
  const yoyLineData = (summary.monthlyBreakdown || []).map((item, index) => ({
    label: item.label,
    currentYear: item.income,
    previousYear: previousSummary.monthlyBreakdown?.[index]?.income || 0,
  }));
  const consistencyDivisor =
    topGiverPeriod === 'month' ? 4 : topGiverPeriod === 'year' ? 52 : 104;

  const goalMutation = useMutation({
    mutationFn: setGivingGoal,
    onSuccess: () => {
      goalsQuery.refetch();
      smartInsightsQuery.refetch();
      setGoalForm({
        year: new Date().getFullYear(),
        month: '',
        targetAmount: '',
        currency: 'USD',
        notes: '',
      });
    },
  });

  return (
    <FinancePageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          subtitle="Explore financial summaries, giving patterns, top givers, and printable statements."
          action={
            <Button variant="ghost" onClick={() => window.print()}>
              Export PDF
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                tab === item
                  ? 'bg-accent text-primary'
                  : 'border border-white/10 bg-white/5 text-white/70'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab === 'summary' ? (
          <div className="space-y-6">
            <label className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
              Year
              <input type="number" value={year} onChange={(event) => setYear(event.target.value)} className="bg-transparent outline-none" />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <ReportStat label="Income" amount={summary.totalIncome} />
              <ReportStat label="Expenses" amount={summary.totalExpenses} color="text-red-300" />
              <ReportStat label="Net" amount={summary.netBalance} color={(summary.netBalance || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="space-y-4">
                <h2 className="text-xl font-semibold text-white">12-Month Performance</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.monthlyBreakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="income" fill="#C9A84C" />
                      <Bar dataKey="expenses" fill="#1E2A4A" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Income Breakdown</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={incomeBreakdownData} dataKey="value" nameKey="name" outerRadius={110}>
                        {incomeBreakdownData.map(({ name }, index) => (
                          <Cell key={name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Expense Breakdown</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseBreakdownData} dataKey="value" nameKey="name" outerRadius={110}>
                        {expenseBreakdownData.map(({ name }, index) => (
                          <Cell key={name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-white">Giving Goals</h2>
                  <span className="text-sm text-white/45">{year}</span>
                </div>
                <div className="space-y-3">
                  {(goalsQuery.data || []).map((goal) => (
                    <div
                      key={`${goal.year}-${goal.month || 'annual'}`}
                      className="rounded-3xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">
                            {goal.month ? `Month ${goal.month}` : 'Annual Goal'}
                          </p>
                          <p className="mt-1 text-sm text-white/55">{goal.notes || 'No notes added'}</p>
                        </div>
                        <AmountDisplay amount={goal.targetAmount} currency={goal.currency} size="sm" />
                      </div>
                    </div>
                  ))}
                  {!goalsQuery.data?.length ? (
                    <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                      No giving goals configured for this year yet.
                    </p>
                  ) : null}
                </div>
              </Card>
              <Card className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Set Goal</h2>
                {canApproveFinance ? (
                  <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm text-white/75">Year</span>
                        <input
                          type="number"
                          value={goalForm.year}
                          onChange={(event) =>
                            setGoalForm((current) => ({ ...current, year: event.target.value }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm text-white/75">Month</span>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={goalForm.month}
                          onChange={(event) =>
                            setGoalForm((current) => ({ ...current, month: event.target.value }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                          placeholder="Leave blank for annual"
                        />
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm text-white/75">Target Amount</span>
                        <input
                          type="number"
                          value={goalForm.targetAmount}
                          onChange={(event) =>
                            setGoalForm((current) => ({ ...current, targetAmount: event.target.value }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm text-white/75">Currency</span>
                        <select
                          value={goalForm.currency}
                          onChange={(event) =>
                            setGoalForm((current) => ({ ...current, currency: event.target.value }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                        >
                          {['USD', 'GHS', 'NGN', 'KES', 'GBP'].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="space-y-2">
                      <span className="text-sm text-white/75">Notes</span>
                      <textarea
                        rows={3}
                        value={goalForm.notes}
                        onChange={(event) =>
                          setGoalForm((current) => ({ ...current, notes: event.target.value }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                      />
                    </label>
                    <Button
                      variant="secondary"
                      disabled={goalMutation.isPending || !goalForm.targetAmount}
                      onClick={() =>
                        goalMutation.mutate({
                          year: Number(goalForm.year),
                          month: goalForm.month ? Number(goalForm.month) : undefined,
                          targetAmount: Number(goalForm.targetAmount),
                          currency: goalForm.currency,
                          notes: goalForm.notes,
                        })
                      }
                    >
                      {goalMutation.isPending ? 'Saving...' : 'Save Giving Goal'}
                    </Button>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                    Goal management is limited to finance approvers.
                  </p>
                )}
                {smartInsightsQuery.data?.budgetRisk?.message ? (
                  <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                    {smartInsightsQuery.data.budgetRisk.message}
                  </div>
                ) : null}
              </Card>
            </div>
          </div>
        ) : null}

        {tab === 'trends' ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Weekly Giving Totals</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.weeklyTotals || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="week" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#C9A84C" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Monthly Giving</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends.monthlyTotals || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#1E2A4A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Year-over-Year Giving</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yoyLineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="currentYear"
                      stroke="#C9A84C"
                      strokeWidth={3}
                      name={`${year}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="previousYear"
                      stroke="#1E2A4A"
                      strokeWidth={3}
                      name={`${Number(year) - 1}`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Giving by Day of Week</h2>
              <div className="grid gap-3">
                {(trends.heatmap || []).map((item) => {
                  const maxValue = Math.max(...(trends.heatmap || []).map((entry) => entry.total), 1);
                  const opacity = item.total ? Math.max(item.total / maxValue, 0.15) : 0.08;
                  return (
                    <div
                      key={item.day}
                      className="grid grid-cols-[140px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 px-4 py-3"
                      style={{ backgroundColor: `rgba(201, 168, 76, ${opacity})` }}
                    >
                      <span className="text-sm font-medium text-white">{item.day}</span>
                      <div className="h-2 overflow-hidden rounded-full bg-black/20">
                        <div
                          className="h-full rounded-full bg-white/80"
                          style={{ width: `${Math.round((item.total / maxValue) * 100)}%` }}
                        />
                      </div>
                      <AmountDisplay amount={item.total} size="sm" />
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-white/45">
                Higher intensity highlights the services or weekdays with the strongest giving activity.
              </p>
            </Card>
          </div>
        ) : null}

        {tab === 'givers' ? (
          <Card className="space-y-5">
            <div className="flex flex-wrap gap-4">
              <select value={topGiverPeriod} onChange={(event) => setTopGiverPeriod(event.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
              <label className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                <input type="checkbox" checked={anonymize} onChange={(event) => setAnonymize(event.target.checked)} />
                Anonymize Names
              </label>
            </div>

            <div className="space-y-3">
              {(topGiversQuery.data || []).map((giver) => (
                <div key={`${giver.memberId}-${giver.rank}`} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
                      {anonymize ? giver.rank : (giver.memberName || 'A').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        #{giver.rank} {giver.memberName}
                      </p>
                      <p className="text-sm text-white/55">
                        {giver.givingCount} contributions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <AmountDisplay amount={giver.totalGiven} size="sm" />
                    <p className="mt-1 text-xs text-white/55">
                      Consistency:{' '}
                      {Math.min(
                        100,
                        Math.round((Number(giver.givingCount || 0) / consistencyDivisor) * 100),
                      )}
                      %
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {tab === 'statement' ? (
          <Card className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <MemberSearchInput
                value={statementMember || {}}
                onSelect={(member) => setStatementMember(member)}
                onClear={() => setStatementMember(null)}
              />
              <label className="space-y-2">
                <span className="text-sm text-white/80">Year</span>
                <input type="number" value={year} onChange={(event) => setYear(event.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                disabled={!statementMember?.memberId}
                onClick={() => setRequestedStatementMember(statementMember)}
              >
                Generate Statement
              </Button>
              <Button
                variant="ghost"
                disabled={!requestedStatementMember?.memberId}
                onClick={() => window.print()}
              >
                Print
              </Button>
              <Button
                variant="subtle"
                disabled={!requestedStatementMember?.memberId}
                onClick={() => window.print()}
              >
                Download PDF
              </Button>
            </div>

            {statement ? (
              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{statement.member?.name}</h2>
                  <p className="mt-1 text-sm text-white/55">{statement.member?.memberId}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <ReportStat label="Tithes" amount={statement.summary?.totalTithes} />
                  <ReportStat label="Offerings" amount={statement.summary?.totalOfferings} />
                  <ReportStat label="Pledges" amount={statement.summary?.totalPledges} />
                  <ReportStat label="Grand Total" amount={statement.summary?.grandTotal} />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statement.monthlyBreakdown || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="total" fill="#C9A84C" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => window.print()}>
                    Print
                  </Button>
                  <Link to={`/finance/reports/statement/${statement.member?.memberId}`}>
                    <Button variant="subtle">Open Full Statement</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                Search for a member to generate a statement.
              </p>
            )}
          </Card>
        ) : null}
      </div>
    </FinancePageLayout>
  );
}

function ReportStat({ label, amount, color = 'text-white' }) {
  return (
    <Card>
      <p className="text-sm uppercase tracking-[0.22em] text-white/55">{label}</p>
      <AmountDisplay amount={amount || 0} size="lg" color={color} />
    </Card>
  );
}
