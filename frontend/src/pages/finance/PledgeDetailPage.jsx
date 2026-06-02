import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AmountDisplay from '../../components/finance/AmountDisplay';
import GivingProgressBar from '../../components/finance/GivingProgressBar';
import TransactionTypeBadge from '../../components/finance/TransactionTypeBadge';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import { useAuth } from '../../hooks/useAuth';
import { getPledgeById, recordPledgePayment } from '../../api/endpoints/finance';

export default function PledgeDetailPage() {
  const { pledgeId } = useParams();
  const queryClient = useQueryClient();
  const { canRecordFinance } = useFinanceAccess();
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    serviceDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'cash',
    paymentReference: '',
    branch: user?.branch || '',
    notes: '',
  });

  const pledgeQuery = useQuery({
    queryKey: ['finance-pledge-detail', pledgeId],
    queryFn: () => getPledgeById(pledgeId),
  });

  const paymentMutation = useMutation({
    mutationFn: (payload) => recordPledgePayment(pledgeId, payload),
    onSuccess: () => {
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        serviceDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'cash',
        paymentReference: '',
        branch: user?.branch || '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['finance-pledge-detail', pledgeId] });
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard-summary'] });
    },
  });

  const pledge = pledgeQuery.data;
  const progressPercentage =
    pledge?.totalAmount > 0
      ? Math.min(Math.round((Number(pledge.amountPaid || 0) / Number(pledge.totalAmount || 0)) * 100), 100)
      : 0;
  const ringCircumference = 2 * Math.PI * 44;
  const ringOffset = ringCircumference - (progressPercentage / 100) * ringCircumference;

  return (
    <FinancePageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Pledge Detail"
          subtitle="Review pledge commitment, completion progress, and linked payment history."
          action={
            <Link to="/finance/pledges">
              <Button variant="ghost">Back to Pledges</Button>
            </Link>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="space-y-5">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Summary</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{pledge?.memberName}</h2>
                <p className="mt-2 text-sm text-white/55">{pledge?.pledgeId}</p>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-32 w-32">
                  <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="44" fill="none" stroke="#1f2937" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="44"
                      fill="none"
                      stroke="#C9A84C"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-semibold text-white">{progressPercentage}%</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/45">Collected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Total</p>
                <AmountDisplay amount={pledge?.totalAmount} currency={pledge?.currency} size="lg" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Paid</p>
                <AmountDisplay amount={pledge?.amountPaid} currency={pledge?.currency} size="lg" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">Balance</p>
                <AmountDisplay amount={pledge?.balance} currency={pledge?.currency} size="lg" color="text-red-300" />
              </div>
            </div>

            <GivingProgressBar current={pledge?.amountPaid} target={pledge?.totalAmount} label="Progress" />
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/55">Progress</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                ${(Number(pledge?.amountPaid || 0)).toLocaleString()} of $
                {(Number(pledge?.totalAmount || 0)).toLocaleString()}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Detail label="Pledge Type" value={pledge?.pledgeType?.replaceAll('_', ' ')} />
              <Detail label="Status" value={pledge?.status} />
              <Detail label="Start Date" value={pledge?.startDate ? new Date(pledge.startDate).toLocaleDateString() : '—'} />
              <Detail label="Expected End Date" value={pledge?.expectedEndDate ? new Date(pledge.expectedEndDate).toLocaleDateString() : '—'} />
            </div>

            {canRecordFinance ? (
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setShowPaymentModal(true)}>
                  Record Payment
                </Button>
                <Link
                  to={`/finance/transactions/new?type=pledge_payment&pledgeId=${pledge?.pledgeId || ''}&memberId=${pledge?.memberId || ''}&memberName=${encodeURIComponent(pledge?.memberName || '')}`}
                >
                  <Button variant="ghost">Open Full Form</Button>
                </Link>
              </div>
            ) : null}
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Payment History</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Linked transactions</h2>
            </div>
            {pledge?.payments?.length ? (
              <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0b1120]">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead className="bg-white/5 text-white/45">
                    <tr>
                      {['Date', 'Receipt#', 'Type', 'Amount', 'Status', 'Action'].map((label) => (
                        <th key={label} className="px-5 py-4 font-medium">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {pledge.payments.map((payment) => (
                      <tr key={payment.transactionId || payment._id}>
                        <td className="px-5 py-4">{new Date(payment.serviceDate).toLocaleDateString()}</td>
                        <td className="px-5 py-4">{payment.receiptNumber || 'Pending'}</td>
                        <td className="px-5 py-4"><TransactionTypeBadge type={payment.type} /></td>
                        <td className="px-5 py-4">
                          <AmountDisplay amount={payment.amount} currency={payment.currency} size="sm" />
                        </td>
                        <td className="px-5 py-4">
                          {payment.isReversed ? (
                            <span className="text-red-400">Reversed</span>
                          ) : payment.isVerified ? (
                            <span className="text-emerald-400">Verified</span>
                          ) : (
                            <span className="text-amber-300">Pending</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            to={`/finance/transactions/${payment.transactionId}`}
                            className="font-semibold text-accent"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                No payments recorded for this pledge yet.
              </p>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Pledge Payment"
        description="Submit a payment directly against this pledge."
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-white/75">Amount</span>
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/75">Service Date</span>
              <input
                type="date"
                value={paymentForm.serviceDate}
                onChange={(event) => setPaymentForm((current) => ({ ...current, serviceDate: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/75">Payment Method</span>
              <select
                value={paymentForm.paymentMethod}
                onChange={(event) =>
                  setPaymentForm((current) => ({ ...current, paymentMethod: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                {['cash', 'mobile_money', 'bank_transfer', 'card', 'cheque', 'online'].map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/75">Branch</span>
              <input
                value={paymentForm.branch}
                onChange={(event) => setPaymentForm((current) => ({ ...current, branch: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </label>
            {paymentForm.paymentMethod !== 'cash' ? (
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm text-white/75">Payment Reference</span>
                <input
                  value={paymentForm.paymentReference}
                  onChange={(event) =>
                    setPaymentForm((current) => ({ ...current, paymentReference: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
              </label>
            ) : null}
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm text-white/75">Notes</span>
              <textarea
                rows={4}
                value={paymentForm.notes}
                onChange={(event) => setPaymentForm((current) => ({ ...current, notes: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
            </label>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            disabled={paymentMutation.isPending || !paymentForm.amount}
            onClick={() =>
              paymentMutation.mutate({
                ...paymentForm,
                amount: Number(paymentForm.amount || 0),
                paymentReference:
                  paymentForm.paymentMethod === 'cash' ? undefined : paymentForm.paymentReference,
              })
            }
          >
            {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </Modal>
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
