import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Input from '../../components/ui/Input';
import AmountDisplay from '../../components/finance/AmountDisplay';
import GivingProgressBar from '../../components/finance/GivingProgressBar';
import TransactionTypeBadge from '../../components/finance/TransactionTypeBadge';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import {
  getMemberGivingHistory,
  getPledgeById,
  getReceipt,
  getTransactionById,
  reverseTransaction,
  verifyTransaction,
} from '../../api/endpoints/finance';

export default function TransactionDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { canApproveFinance } = useFinanceAccess();
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reason, setReason] = useState('');

  const transactionQuery = useQuery({
    queryKey: ['finance-transaction-detail', id],
    queryFn: () => getTransactionById(id),
  });
  const transaction = transactionQuery.data;

  const pledgeQuery = useQuery({
    queryKey: ['finance-transaction-detail-pledge', transaction?.pledgeId],
    queryFn: () => getPledgeById(transaction.pledgeId),
    enabled: Boolean(transaction?.pledgeId),
  });
  const memberHistoryQuery = useQuery({
    queryKey: ['finance-transaction-member-history', transaction?.memberId],
    queryFn: () => getMemberGivingHistory(transaction.memberId),
    enabled: Boolean(transaction?.memberId),
  });

  const verifyMutation = useMutation({
    mutationFn: verifyTransaction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance-transaction-detail', id] }),
  });

  const reverseMutation = useMutation({
    mutationFn: ({ transactionId, reverseReason }) => reverseTransaction(transactionId, reverseReason),
    onSuccess: () => {
      setShowReverseModal(false);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['finance-transaction-detail', id] });
    },
  });

  const pledge = pledgeQuery.data;
  const memberHistory = memberHistoryQuery.data;

  return (
    <FinancePageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Transaction Detail"
          subtitle="Review the full giving record, verification state, and receipt details."
          action={
            <Link to="/finance/transactions">
              <Button variant="ghost">Back to Transactions</Button>
            </Link>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Transaction Card</p>
              <AmountDisplay amount={transaction?.amount} currency={transaction?.currency} size="xl" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Detail label="Transaction ID" value={transaction?.transactionId} />
              <Detail label="Receipt Number" value={transaction?.receiptNumber} />
              <Detail label="Date" value={transaction?.serviceDate ? new Date(transaction.serviceDate).toLocaleDateString() : '—'} />
              <Detail label="Payment Method" value={transaction?.paymentMethod?.replaceAll('_', ' ')} />
            </div>

            <div className="flex items-center gap-3">
              <TransactionTypeBadge type={transaction?.type} />
              {transaction?.isReversed ? (
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-sm font-semibold text-red-300">
                  Reversed
                </span>
              ) : transaction?.isVerified ? (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300">
                  Verified
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-300">
                  Pending
                </span>
              )}
            </div>

            {transaction?.paymentReference ? (
              <Detail label="Payment Reference" value={transaction.paymentReference} />
            ) : null}
            {transaction?.notes ? <Detail label="Notes" value={transaction.notes} /> : null}

            {transaction?.pledgeId ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/60">Pledge</p>
                    <Link
                      to={`/finance/pledges/${transaction.pledgeId}`}
                      className="mt-2 inline-block text-base font-semibold text-accent"
                    >
                      {transaction.pledgeId}
                    </Link>
                  </div>
                  {pledge ? (
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Balance</p>
                      <AmountDisplay
                        amount={pledge.balance}
                        currency={pledge.currency}
                        size="sm"
                        color="text-red-300"
                      />
                    </div>
                  ) : null}
                </div>
                {pledge ? (
                  <div className="mt-4">
                    <GivingProgressBar
                      current={pledge.amountPaid}
                      target={pledge.totalAmount}
                      label="Pledge progress"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Context</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Related details</h2>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/55">Member Info</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
                  {(transaction?.memberName || transaction?.memberId || 'A').slice(0, 1).toUpperCase()}
                </div>
                <div className="space-y-1">
                  {transaction?.memberId ? (
                    <Link
                      to={`/members?search=${encodeURIComponent(transaction.memberId)}`}
                      className="text-lg font-semibold text-white transition hover:text-accent"
                    >
                      {transaction?.memberName || transaction.memberId}
                    </Link>
                  ) : (
                    <p className="text-lg font-semibold text-white">Anonymous</p>
                  )}
                  <p className="text-sm text-white/55">{transaction?.memberId || 'No member linked'}</p>
                </div>
              </div>
            </div>
            <Detail label="Branch" value={transaction?.branch || 'Main'} />
            <Detail label="Department" value={transaction?.department || '—'} />
            <Detail label="Recorded By" value={transaction?.recordedBy} />
            <Detail label="Recorded At" value={transaction?.recordedDate ? new Date(transaction.recordedDate).toLocaleString() : '—'} />
            <Detail label="Verified By" value={transaction?.verifiedBy || 'Pending'} />
            <Detail label="Verified At" value={transaction?.verifiedAt ? new Date(transaction.verifiedAt).toLocaleString() : '—'} />

            {memberHistory ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/55">Giving History</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      ${Number(memberHistory.summary?.totalGiven || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right text-sm text-white/55">
                    <p>Consistency: {memberHistory.consistencyScore || 0}%</p>
                    <p>Streak: {memberHistory.givingStreak || 0}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Detail
                    label="First Giving"
                    value={
                      memberHistory.summary?.firstGivingDate
                        ? new Date(memberHistory.summary.firstGivingDate).toLocaleDateString()
                        : '—'
                    }
                  />
                  <Detail
                    label="Last Giving"
                    value={
                      memberHistory.summary?.lastGivingDate
                        ? new Date(memberHistory.summary.lastGivingDate).toLocaleDateString()
                        : '—'
                    }
                  />
                </div>
                <div className="mt-4 space-y-2">
                  {memberHistory.transactions?.slice(0, 4).map((historyTransaction) => (
                    <Link
                      key={historyTransaction.transactionId}
                      to={`/finance/transactions/${historyTransaction.transactionId}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75 transition hover:bg-white/5"
                    >
                      <span>{new Date(historyTransaction.serviceDate).toLocaleDateString()}</span>
                      <span>{historyTransaction.type.replaceAll('_', ' ')}</span>
                      <span>${Number(historyTransaction.amount || 0).toLocaleString()}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {canApproveFinance && !transaction?.isVerified ? (
                <Button variant="secondary" onClick={() => verifyMutation.mutate(transaction.transactionId)}>
                  Verify
                </Button>
              ) : null}
              {canApproveFinance && !transaction?.isReversed ? (
                <Button variant="ghost" onClick={() => setShowReverseModal(true)}>
                  Reverse Transaction
                </Button>
              ) : null}
              <a href={transaction ? getReceipt(transaction.transactionId) : '#'} target="_blank" rel="noreferrer">
                <Button variant="subtle">Download Receipt</Button>
              </a>
            </div>

            {transaction?.isReversed ? (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                <p className="text-sm font-semibold">Reversal Details</p>
                <p className="mt-2 text-sm">By: {transaction.reversedBy}</p>
                <p className="mt-1 text-sm">When: {transaction.reversedAt ? new Date(transaction.reversedAt).toLocaleString() : '—'}</p>
                <p className="mt-1 text-sm">Reason: {transaction.reversalReason || 'No reason provided'}</p>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <ConfirmModal
        isOpen={showReverseModal}
        title="Reverse transaction"
        message="Provide a short reason before reversing this transaction."
        onConfirm={() =>
          reverseMutation.mutate({
            transactionId: transaction?.transactionId,
            reverseReason: reason,
          })
        }
        onCancel={() => {
          setShowReverseModal(false);
          setReason('');
        }}
        confirmLabel="Reverse"
      >
        <Input label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
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
