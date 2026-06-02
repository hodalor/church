import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import FinanceStatCard from '../../components/finance/FinanceStatCard';
import SmartInsightBanner from '../../components/finance/SmartInsightBanner';
import AmountDisplay from '../../components/finance/AmountDisplay';
import TransactionTypeBadge from '../../components/finance/TransactionTypeBadge';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import {
  approveExpense,
  getAllExpenses,
  getAllTransactions,
  getFinancialSummary,
  getSmartGivingIntelligence,
  getTransactionSummary,
  rejectExpense,
  verifyTransaction,
} from '../../api/endpoints/finance';

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

const pieColors = ['#C9A84C', '#1E2A4A', '#8B5CF6', '#10B981', '#F97316', '#06B6D4'];
const currencyTooltipFormatter = (value) => `$${Number(value || 0).toLocaleString()}`;

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canApproveFinance, canRecordFinance, canSeeSmartInsights } = useFinanceAccess();
  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dataTab, setDataTab] = useState('transactions');
  const [incomeTypeFilter, setIncomeTypeFilter] = useState('');

  const summaryQuery = useQuery({
    queryKey: ['finance-dashboard-summary', period, from, to, incomeTypeFilter],
    queryFn: () => getTransactionSummary({ period, from, to, type: incomeTypeFilter }),
  });

  const yearlySummaryQuery = useQuery({
    queryKey: ['finance-dashboard-yearly-summary'],
    queryFn: () => getFinancialSummary(new Date().getFullYear()),
  });

  const intelligenceQuery = useQuery({
    queryKey: ['finance-smart-intelligence'],
    queryFn: getSmartGivingIntelligence,
    enabled: canSeeSmartInsights,
  });

  const transactionsQuery = useQuery({
    queryKey: ['finance-dashboard-transactions', period, from, to, incomeTypeFilter],
    queryFn: () => getAllTransactions({ limit: 10, period, from, to, type: incomeTypeFilter }),
  });

  const pendingExpensesQuery = useQuery({
    queryKey: ['finance-dashboard-pending-expenses', from, to],
    queryFn: () => getAllExpenses({ status: 'pending', limit: 6, from, to }),
    enabled: canApproveFinance,
  });

  const verifyMutation = useMutation({
    mutationFn: verifyTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-summary'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-pending-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-yearly-summary'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ expenseId, reason }) => rejectExpense(expenseId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-pending-expenses'] });
    },
  });

  const summary = summaryQuery.data || {};
  const yearlySummary = yearlySummaryQuery.data || {};
  const recentTransactions = transactionsQuery.data?.transactions || [];
  const pendingExpenses = pendingExpensesQuery.data?.expenses || [];

  const monthlyChartData = useMemo(
    () => (yearlySummary.monthlyBreakdown || []).slice(-6),
    [yearlySummary.monthlyBreakdown],
  );

  const incomeTypeData = useMemo(
    () =>
      Object.entries(summary.byType || {}).map(([type, total]) => ({
        name: String(type).replaceAll('_', ' '),
        value: total,
      })),
    [summary.byType],
  );
  const incomeTypeOptions = incomeTypeData.map((item) => ({
    label: item.name,
    value: item.name.replaceAll(' ', '_'),
  }));

  return (
    <FinancePageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Finance Dashboard"
          subtitle="Track giving, review expense approvals, and monitor financial performance in real time."
          action={
            canRecordFinance ? (
              <Link to="/finance/transactions/new">
                <Button variant="secondary">Record Transaction</Button>
              </Link>
            ) : null
          }
        />

        <div className="grid gap-3 lg:grid-cols-[180px_160px_160px_1fr]">
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">Period</span>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
            >
              {periods.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">Income Type</span>
            <select
              value={incomeTypeFilter}
              onChange={(event) => setIncomeTypeFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
            >
              <option value="">All income types</option>
              {incomeTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          <FinanceStatCard
            label="Total Income"
            value={summary.totalIncome || 0}
            trend={summary.comparisonToPreviousPeriod?.trend}
            changePercent={summary.comparisonToPreviousPeriod?.changePercent}
            helper="Transactions in selected period"
          />
          <FinanceStatCard
            label="Total Expenses"
            value={summary.totalExpenses || 0}
            color="text-red-300"
            helper="Approved expenses in selected period"
          />
          <FinanceStatCard
            label="Net Balance"
            value={summary.netBalance || 0}
            color={(summary.netBalance || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'}
            helper={(summary.netBalance || 0) >= 0 ? 'Positive balance' : 'Negative balance'}
          />
          <FinanceStatCard
            label="Transactions"
            value={summary.totalTransactions || recentTransactions.length || 0}
            helper="Count in selected filter"
          />
          <Card
            className="cursor-pointer space-y-3"
            onClick={() => navigate('/finance/expenses?status=pending')}
          >
            <p className="text-sm uppercase tracking-[0.22em] text-white/55">Pending Approvals</p>
            <div className="flex items-center gap-3">
              <p className="text-5xl font-semibold text-white">{summary.pendingExpenseApprovals || 0}</p>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Pending
              </span>
            </div>
            <p className="text-sm text-white/55">Open pending expense requests</p>
          </Card>
        </div>

        {canSeeSmartInsights ? <SmartInsightBanner insights={intelligenceQuery.data} /> : null}

        <Card className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Performance', value: 'performance' },
                { label: 'Income Type', value: 'types' },
                { label: 'Latest Transactions', value: 'transactions' },
                ...(canApproveFinance ? [{ label: 'Approvals', value: 'approvals' }] : []),
              ].map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setDataTab(tab.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    dataTab === tab.value
                      ? 'bg-accent text-primary'
                      : 'border border-white/10 bg-[#101827] text-white/65'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {dataTab === 'transactions' ? (
              <Link to="/finance/transactions" className="text-sm font-semibold text-accent">
                View All
              </Link>
            ) : null}
          </div>

          {dataTab === 'performance' ? (
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={currencyTooltipFormatter} />
                  <Legend />
                  <Bar dataKey="income" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#1E2A4A" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {dataTab === 'types' ? (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomeTypeData} dataKey="value" nameKey="name" outerRadius={128} innerRadius={64}>
                      {incomeTypeData.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => {
                        const total = incomeTypeData.reduce((sum, item) => sum + Number(item.value || 0), 0);
                        const percentage = total ? ((Number(value || 0) / total) * 100).toFixed(1) : '0.0';
                        return [`$${Number(value || 0).toLocaleString()} (${percentage}%)`, 'Amount'];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {incomeTypeData.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: pieColors[index % pieColors.length] }}
                      />
                      <span className="text-sm text-white/70">{item.name}</span>
                    </div>
                    <AmountDisplay amount={item.value} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {dataTab === 'transactions' ? (
            <div className="overflow-x-auto rounded-[24px] border border-white/8 bg-[#0b101a]">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.24em] text-white/35">
                  <tr>
                    {['Date', 'Member', 'Type', 'Amount', 'Payment Method', 'Status', 'Actions'].map((label) => (
                      <th key={label} className="px-5 py-4 font-medium">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-white/80">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.transactionId} className="hover:bg-white/[0.025]">
                      <td className="px-5 py-4">{new Date(transaction.serviceDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4">{transaction.memberName || 'Anonymous'}</td>
                      <td className="px-5 py-4"><TransactionTypeBadge type={transaction.type} /></td>
                      <td className="px-5 py-4"><AmountDisplay amount={transaction.amount} currency={transaction.currency} size="sm" /></td>
                      <td className="px-5 py-4">{String(transaction.paymentMethod).replaceAll('_', ' ')}</td>
                      <td className="px-5 py-4">
                        {transaction.isReversed ? (
                          <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 line-through">
                            Reversed
                          </span>
                        ) : transaction.isVerified ? (
                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                            Verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <Button variant="subtle" onClick={() => navigate(`/finance/transactions/${transaction.transactionId}`)}>
                            View
                          </Button>
                          {!transaction.isVerified && canApproveFinance ? (
                            <Button
                              variant="secondary"
                              onClick={() => verifyMutation.mutate(transaction.transactionId)}
                            >
                              Verify
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {dataTab === 'approvals' && canApproveFinance ? (
            <div className="space-y-3">
              {pendingExpenses.map((expense) => (
                <div key={expense.expenseId} className="rounded-[24px] border border-white/8 bg-[#101827] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{expense.description}</p>
                      <p className="mt-1 text-sm text-white/55">
                        {expense.category.replaceAll('_', ' ')} • {new Date(expense.expenseDate).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-sm text-white/45">Submitted by {expense.recordedBy}</p>
                    </div>
                    <AmountDisplay amount={expense.amount} currency={expense.currency} size="sm" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" onClick={() => approveMutation.mutate(expense.expenseId)}>
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        rejectMutation.mutate({
                          expenseId: expense.expenseId,
                          reason: 'Rejected from dashboard workflow',
                        })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {!pendingExpenses.length ? (
                <p className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-6 text-sm text-white/55">
                  No pending approvals right now.
                </p>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>
    </FinancePageLayout>
  );
}
