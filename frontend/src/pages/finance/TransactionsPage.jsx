import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import AmountDisplay from '../../components/finance/AmountDisplay';
import TransactionTypeBadge from '../../components/finance/TransactionTypeBadge';
import useCurrency from '../../hooks/useCurrency';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import { getAllTransactions, reverseTransaction, verifyTransaction } from '../../api/endpoints/finance';

const typeOptions = [
  'tithe',
  'offering',
  'pledge_payment',
  'donation',
  'special_seed',
  'welfare',
  'building_fund',
  'mission_fund',
  'thanksgiving',
  'other_income',
];

const paymentOptions = ['cash', 'mobile_money', 'bank_transfer', 'card', 'cheque', 'online', 'other'];

const downloadCsv = (rows) => {
  const header = ['Date', 'Receipt', 'Member', 'Type', 'Amount', 'Method', 'Branch', 'Verified'];
  const body = rows.map((item) => [
    new Date(item.serviceDate).toLocaleDateString(),
    item.receiptNumber,
    item.memberName || 'Anonymous',
    item.type,
    item.amount,
    item.paymentMethod,
    item.branch || 'Main',
    item.isVerified ? 'Yes' : 'No',
  ]);
  const csv = [header, ...body].map((row) => row.map((value) => `"${value ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'finance-transactions.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function TransactionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canApproveFinance, canExportReports, canRecordFinance } =
    useFinanceAccess();
  const { formatCurrency } = useCurrency();
  const [selectedRows, setSelectedRows] = useState([]);

  const page = Number(searchParams.get('page') || 1);
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const search = searchParams.get('search') || '';
  const branch = searchParams.get('branch') || '';
  const type = searchParams.get('type') || '';
  const paymentMethod = searchParams.get('paymentMethod') || '';
  const verified = searchParams.get('isVerified') || '';

  const transactionsQuery = useQuery({
    queryKey: ['finance-transactions', page, from, to, search, branch, type, paymentMethod, verified],
    queryFn: () =>
      getAllTransactions({
        page,
        limit: 12,
        from,
        to,
        search,
        branch,
        type,
        paymentMethod,
        isVerified: verified,
      }),
  });

  const verifyMutation = useMutation({
    mutationFn: verifyTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
    },
  });

  const reverseMutation = useMutation({
    mutationFn: ({ id, reason }) => reverseTransaction(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
    },
  });

  const transactions = transactionsQuery.data?.transactions || [];
  const selectedTransactionObjects = transactions.filter((item) =>
    selectedRows.includes(item.transactionId),
  );

  const summary = {
    total: transactionsQuery.data?.periodTotal || 0,
    count: transactions.length,
    average: transactions.length
      ? Number(((transactionsQuery.data?.periodTotal || 0) / transactions.length).toFixed(2))
      : 0,
    unverifiedCount: transactionsQuery.data?.unverifiedCount || 0,
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  return (
    <FinancePageLayout requireCapability="finance.transactions.view">
      <div className="space-y-6">
        <PageHeader
          title="Transactions"
          subtitle="Review giving records, verify receipts, and manage finance transactions."
          action={
            canRecordFinance ? (
              <Link to="/finance/transactions/new">
                <Button variant="secondary">+ Record Transaction</Button>
              </Link>
            ) : null
          }
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-white/55">Current Filter Total</p>
            <AmountDisplay amount={transactionsQuery.data?.periodTotal || 0} size="xl" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-white/70">From</span>
              <input
                type="date"
                value={from}
                onChange={(event) => updateParam('from', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/70">To</span>
              <input
                type="date"
                value={to}
                onChange={(event) => updateParam('to', event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </label>
          </div>
        </div>

        <Card className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-5">
            <label className="space-y-2">
              <span className="text-sm text-white/70">Type</span>
              <select
                value={type}
                onChange={(event) => updateParam('type', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
              >
                <option value="">All types</option>
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/70">Payment Method</span>
              <select
                value={paymentMethod}
                onChange={(event) => updateParam('paymentMethod', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
              >
                <option value="">All methods</option>
                {paymentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/70">Branch</span>
              <input
                value={branch}
                onChange={(event) => updateParam('branch', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
                placeholder="Main branch"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/70">Verified</span>
              <select
                value={verified}
                onChange={(event) => updateParam('isVerified', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </label>
            <div className="space-y-2">
              <span className="text-sm text-white/70">Search</span>
              <SearchInput
                value={search}
                onChange={(event) => updateParam('search', event.target.value)}
                placeholder="Member or transaction ID"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
            Total: <strong className="text-white">{formatCurrency(summary.total)}</strong> | Count:{' '}
            <strong className="text-white">{summary.count}</strong> | Avg per transaction:{' '}
            <strong className="text-white">{formatCurrency(summary.average)}</strong> | Unverified:{' '}
            <strong className="text-white">{summary.unverifiedCount}</strong>
          </div>

          <div className="flex flex-wrap gap-3">
            {canApproveFinance ? (
              <Button
                variant="secondary"
                disabled={!selectedRows.length}
                onClick={() => {
                  selectedRows.forEach((transactionId) => verifyMutation.mutate(transactionId));
                  setSelectedRows([]);
                }}
              >
                Bulk Verify Selected
              </Button>
            ) : null}
            <Button
              variant="ghost"
              disabled={!selectedRows.length || !canExportReports}
              onClick={() => downloadCsv(selectedTransactionObjects)}
            >
              Export Selected to CSV
            </Button>
          </div>

          <div className="overflow-x-auto rounded-[20px]">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.24em] text-white/35">
                <tr>
                  <th className="px-5 py-4 font-medium" />
                  {['Date', 'Receipt#', 'Member', 'Type', 'Amount', 'Method', 'Branch', 'Verified', 'Actions'].map((label) => (
                    <th key={label} className="px-5 py-4 font-medium">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-white/80">
                {transactions.map((transaction) => (
                  <tr
                    key={transaction.transactionId}
                    className="cursor-pointer hover:bg-white/[0.025]"
                    onClick={() => navigate(`/finance/transactions/${transaction.transactionId}`)}
                  >
                    <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(transaction.transactionId)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedRows((current) => [...current, transaction.transactionId]);
                          } else {
                            setSelectedRows((current) =>
                              current.filter((item) => item !== transaction.transactionId),
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="px-5 py-4">{new Date(transaction.serviceDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4">{transaction.receiptNumber}</td>
                    <td className="px-5 py-4">{transaction.memberName || 'Anonymous'}</td>
                    <td className="px-5 py-4"><TransactionTypeBadge type={transaction.type} /></td>
                    <td className="px-5 py-4 text-right">
                      <AmountDisplay amount={transaction.amount} currency={transaction.currency} size="sm" />
                    </td>
                    <td className="px-5 py-4">{String(transaction.paymentMethod).replaceAll('_', ' ')}</td>
                    <td className="px-5 py-4">{transaction.branch || 'Main'}</td>
                    <td className="px-5 py-4">
                      {transaction.isVerified ? (
                        <span className="inline-flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-amber-300">
                          <Clock3 className="h-4 w-4" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button variant="subtle" onClick={() => navigate(`/finance/transactions/${transaction.transactionId}`)}>
                          View
                        </Button>
                        {canApproveFinance && !transaction.isVerified ? (
                          <Button variant="secondary" onClick={() => verifyMutation.mutate(transaction.transactionId)}>
                            Verify
                          </Button>
                        ) : null}
                        {canApproveFinance && !transaction.isReversed ? (
                          <Button
                            variant="ghost"
                            onClick={() =>
                              reverseMutation.mutate({
                                id: transaction.transactionId,
                                reason: 'Reversed from transaction grid',
                              })
                            }
                          >
                            Reverse
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-white/55">
              Showing {(page - 1) * 12 + 1}-{Math.min(page * 12, transactionsQuery.data?.total || 0)} of{' '}
              {transactionsQuery.data?.total || 0} transactions, Total: {formatCurrency(summary.total)}
            </p>
            <Pagination
              currentPage={transactionsQuery.data?.page || page}
              totalPages={transactionsQuery.data?.totalPages || 1}
              onPageChange={(nextPage) => updateParam('page', String(nextPage))}
            />
          </div>
        </Card>
      </div>
    </FinancePageLayout>
  );
}
