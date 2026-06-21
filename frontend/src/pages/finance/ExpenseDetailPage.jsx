import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Input from '../../components/ui/Input';
import AmountDisplay from '../../components/finance/AmountDisplay';
import { getCurrentTenant } from '../../api/endpoints/tenants';
import useCurrency from '../../hooks/useCurrency';
import useBranchOptions from '../../hooks/useBranchOptions';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import {
  approveExpense,
  getExpenseById,
  rejectExpense,
  updateExpense,
} from '../../api/endpoints/finance';
import { supabaseUpload } from '../../utils/supabaseUpload';

const categoryOptions = [
  'salaries',
  'utilities',
  'rent',
  'maintenance',
  'equipment',
  'events',
  'missions',
  'welfare',
  'stationery',
  'transport',
  'media',
  'outreach',
  'other',
];

const paymentMethods = ['cash', 'mobile_money', 'bank_transfer', 'card', 'cheque', 'other'];

export default function ExpenseDetailPage() {
  const { expenseId } = useParams();
  const queryClient = useQueryClient();
  const { currencyCode, currencyOptions } = useCurrency();
  const { canApproveFinance } = useFinanceAccess();
  const [form, setForm] = useState({
    category: 'utilities',
    description: '',
    amount: '',
    currency: currencyCode,
    expenseDate: '',
    paymentMethod: 'cash',
    paymentReference: '',
    vendor: '',
    receiptUrl: '',
    branch: '',
    department: '',
    budgetId: '',
    notes: '',
  });
  const { branchOptions, isLoading: isBranchesLoading, selectPlaceholder: branchSelectPlaceholder } = useBranchOptions({ includeCurrent: form.branch });
  const tenantQuery = useQuery({
    queryKey: ['finance-expense-detail-tenant'],
    queryFn: getCurrentTenant,
  });
  const departmentOptions = tenantQuery.data?.content?.departments || [];
  const [isEditing, setIsEditing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const expenseQuery = useQuery({
    queryKey: ['finance-expense-detail', expenseId],
    queryFn: () => getExpenseById(expenseId),
  });

  useEffect(() => {
    const expense = expenseQuery.data;
    if (!expense) {
      return;
    }

    setForm({
      category: expense.category || 'utilities',
      description: expense.description || '',
      amount: expense.amount || '',
      currency: expense.currency || currencyCode,
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().slice(0, 10) : '',
      paymentMethod: expense.paymentMethod || 'cash',
      paymentReference: expense.paymentReference || '',
      vendor: expense.vendor || '',
      receiptUrl: expense.receiptUrl || '',
      branch: expense.branch || '',
      department: expense.department || '',
      budgetId: expense.budgetId || '',
      notes: expense.notes || '',
    });
  }, [currencyCode, expenseQuery.data]);

  const refreshExpense = () => {
    queryClient.invalidateQueries({ queryKey: ['finance-expense-detail', expenseId] });
    queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
    queryClient.invalidateQueries({ queryKey: ['finance-dashboard-pending-expenses'] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => updateExpense(expenseId, payload),
    onSuccess: () => {
      setIsEditing(false);
      refreshExpense();
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => approveExpense(expenseId),
    onSuccess: refreshExpense,
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectExpense(expenseId, rejectReason),
    onSuccess: () => {
      setShowRejectModal(false);
      setRejectReason('');
      refreshExpense();
    },
  });

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const extension = file.name.split('.').pop();
    const url = await supabaseUpload(
      file,
      'church-media',
      `documents/expenses/${expenseId}-${Date.now()}.${extension}`,
    );
    setForm((current) => ({ ...current, receiptUrl: url }));
  };

  const saveChanges = () => {
    updateMutation.mutate({
      ...form,
      amount: Number(form.amount || 0),
    });
  };

  const expense = expenseQuery.data;

  return (
    <FinancePageLayout requireCapability="finance.expenses.view">
      <div className="space-y-6">
        <PageHeader
          title="Expense Detail"
          subtitle="Review expense workflow, vendor details, receipt evidence, and approval state."
          action={
            <div className="flex flex-wrap gap-3">
              <Link to="/finance/expenses">
                <Button variant="ghost">Back to Expenses</Button>
              </Link>
              {canApproveFinance ? (
                <Button variant={isEditing ? 'ghost' : 'secondary'} onClick={() => setIsEditing((current) => !current)}>
                  {isEditing ? 'Cancel Edit' : 'Edit Expense'}
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Expense Card</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{expense?.description}</h2>
                <p className="mt-2 text-sm text-white/55">{expense?.expenseId}</p>
              </div>
              <AmountDisplay amount={expense?.amount} currency={expense?.currency} size="xl" color="text-red-300" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Detail label="Category" value={expense?.category?.replaceAll('_', ' ')} />
              <Detail label="Payment Method" value={expense?.paymentMethod?.replaceAll('_', ' ')} />
              <Detail
                label="Expense Date"
                value={expense?.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : '—'}
              />
              <Detail label="Reference" value={expense?.paymentReference || '—'} />
            </div>

            {isEditing ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Category</span>
                  <select
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Amount</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Currency</span>
                  <select
                    value={form.currency}
                    onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.code} ({option.symbol})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm text-white/75">Description</span>
                  <input
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Expense Date</span>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(event) => setForm((current) => ({ ...current, expenseDate: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Payment Method</span>
                  <select
                    value={form.paymentMethod}
                    onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    {paymentMethods.map((option) => (
                      <option key={option} value={option}>
                        {option.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Payment Reference</span>
                  <input
                    value={form.paymentReference}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, paymentReference: event.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Vendor</span>
                  <input
                    value={form.vendor}
                    onChange={(event) => setForm((current) => ({ ...current, vendor: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Branch</span>
                  <select
                    value={form.branch}
                    onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))}
                    disabled={isBranchesLoading || !branchOptions.length}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    <option value="">{branchSelectPlaceholder}</option>
                    {branchOptions.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Department</span>
                  <select
                    value={form.department}
                    onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                    disabled={!departmentOptions.length}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    <option value="">{departmentOptions.length ? 'Select department' : 'No departments configured yet'}</option>
                    {departmentOptions.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/75">Budget ID</span>
                  <input
                    value={form.budgetId}
                    onChange={(event) => setForm((current) => ({ ...current, budgetId: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm text-white/75">Notes</span>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm text-white/75">Replace Receipt</span>
                  <input
                    type="file"
                    onChange={handleUpload}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  />
                </label>
                <div className="md:col-span-2">
                  <Button variant="secondary" onClick={saveChanges} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {expense?.notes ? <Detail label="Notes" value={expense.notes} /> : null}
                {expense?.receiptUrl ? (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-semibold text-accent"
                  >
                    Open Uploaded Receipt
                  </a>
                ) : null}
              </div>
            )}
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Workflow</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Approval and ownership</h2>
            </div>

            <Detail label="Status" value={expense?.approvalStatus} />
            <Detail label="Recorded By" value={expense?.recordedBy} />
            <Detail label="Approved By" value={expense?.approvedBy || 'Pending'} />
            <Detail
              label="Approved At"
              value={expense?.approvedAt ? new Date(expense.approvedAt).toLocaleString() : '—'}
            />
            <Detail label="Vendor" value={expense?.vendor || '—'} />
            <Detail label="Branch" value={expense?.branch || 'Main'} />
            <Detail label="Department" value={expense?.department || '—'} />
            <Detail label="Budget ID" value={expense?.budgetId || '—'} />

            {expense?.approvalStatus === 'rejected' ? (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                <p className="text-sm font-semibold">Rejection Reason</p>
                <p className="mt-2 text-sm">{expense.rejectionReason || 'No reason provided'}</p>
              </div>
            ) : null}

            {canApproveFinance && expense?.approvalStatus === 'pending' ? (
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                </Button>
                <Button variant="ghost" onClick={() => setShowRejectModal(true)}>
                  Reject
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={showRejectModal}
        title="Reject expense"
        message="Provide a short reason before rejecting this expense."
        onConfirm={() => rejectMutation.mutate()}
        onCancel={() => {
          setShowRejectModal(false);
          setRejectReason('');
        }}
        confirmLabel="Reject"
      >
        <Input label="Reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
      </ConfirmModal>
    </FinancePageLayout>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/55">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value || '—'}</p>
    </div>
  );
}
