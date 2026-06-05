import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Input from '../../components/ui/Input';
import AmountDisplay from '../../components/finance/AmountDisplay';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import { approveExpense, getAllExpenses, rejectExpense } from '../../api/endpoints/finance';

const tabs = [
  { label: 'All', value: '' },
  { label: 'Pending Approval', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { canApproveFinance, canRecordFinance } = useFinanceAccess();
  const [status, setStatus] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');

  const expensesQuery = useQuery({
    queryKey: ['finance-expenses', status],
    queryFn: () => getAllExpenses({ status }),
  });

  const approveMutation = useMutation({
    mutationFn: approveExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance-expenses'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ expenseId, rejectReason }) => rejectExpense(expenseId, rejectReason),
    onSuccess: () => {
      setRejectTarget(null);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
    },
  });

  const columns = [
    {
      key: 'expenseDate',
      header: 'Date',
      render: (expense) => new Date(expense.expenseDate).toLocaleDateString(),
    },
    { key: 'description', header: 'Description' },
    {
      key: 'category',
      header: 'Category',
      render: (expense) => String(expense.category).replaceAll('_', ' '),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (expense) => <AmountDisplay amount={expense.amount} currency={expense.currency} size="sm" />,
    },
    { key: 'recordedBy', header: 'Submitted By' },
    {
      key: 'approvalStatus',
      header: 'Status',
      render: (expense) => (
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
          {expense.approvalStatus}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (expense) =>
        canApproveFinance && expense.approvalStatus === 'pending' ? (
          <div className="flex gap-2">
            <Link to={`/finance/expenses/${expense.expenseId}`}>
              <Button variant="subtle">View</Button>
            </Link>
            <Button variant="secondary" onClick={() => approveMutation.mutate(expense.expenseId)}>
              Approve
            </Button>
            <Button variant="ghost" onClick={() => setRejectTarget(expense)}>
              Reject
            </Button>
          </div>
        ) : (
          <Link to={`/finance/expenses/${expense.expenseId}`} className="font-semibold text-accent">
            View
          </Link>
        ),
    },
  ];

  return (
    <FinancePageLayout requireCapability="finance.expenses.view">
      <div className="space-y-6">
        <PageHeader
          title="Expenses"
          subtitle="Review recorded expenses, approval states, and pending requests."
          action={
            canRecordFinance ? (
              <Link to="/finance/expenses/new">
                <Button variant="secondary">Record Expense</Button>
              </Link>
            ) : null
          }
        />

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                status === tab.value
                  ? 'bg-accent text-primary'
                  : 'border border-white/10 bg-white/5 text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <DataTable
            columns={columns}
            data={expensesQuery.data?.expenses || []}
            emptyMessage="No expenses found."
          />
        </Card>
      </div>

      <ConfirmModal
        isOpen={Boolean(rejectTarget)}
        title="Reject Expense"
        message="Provide a short reason before rejecting this expense request."
        onConfirm={() =>
          rejectMutation.mutate({
            expenseId: rejectTarget?.expenseId,
            rejectReason: reason,
          })
        }
        onCancel={() => {
          setRejectTarget(null);
          setReason('');
        }}
        confirmLabel="Reject"
      >
        <Input label="Rejection reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      </ConfirmModal>
    </FinancePageLayout>
  );
}
