import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import RouteModal from '../../components/ui/RouteModal';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import { useAuth } from '../../hooks/useAuth';
import useBranchOptions from '../../hooks/useBranchOptions';
import useCurrency from '../../hooks/useCurrency';
import { getReceipt, recordTransaction } from '../../api/endpoints/finance';

const schema = z.object({
  type: z.string().min(1, 'Transaction type is required.'),
  amount: z.coerce.number().positive('Amount must be greater than zero.'),
  currency: z.string().min(3),
  serviceDate: z
    .string()
    .min(1, 'Service date is required.')
    .refine((value) => {
      const selected = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return !Number.isNaN(selected.getTime()) && selected <= today;
    }, 'Service date cannot be in the future.'),
  paymentMethod: z.string().min(1),
  paymentReference: z.string().optional(),
  branch: z.string().optional(),
  notes: z.string().optional(),
  memberId: z.string().optional(),
  memberName: z.string().optional(),
  pledgeId: z.string().optional(),
  anonymous: z.boolean().optional(),
});

const transactionTypes = [
  { value: 'tithe', label: 'Tithe' },
  { value: 'offering', label: 'Offering' },
  { value: 'pledge_payment', label: 'Pledge Payment' },
  { value: 'donation', label: 'Donation' },
  { value: 'special_seed', label: 'Special Seed' },
  { value: 'building_fund', label: 'Building Fund' },
  { value: 'mission_fund', label: 'Missions' },
  { value: 'thanksgiving', label: 'Thanksgiving' },
  { value: 'other_income', label: 'Other Income' },
];

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online' },
];

export default function RecordTransactionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currencyCode, currencySymbol, currencyOptions } = useCurrency();
  const [searchParams] = useSearchParams();
  const [successData, setSuccessData] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const { branchOptions } = useBranchOptions({ includeCurrent: user?.branch || '' });
  const defaultCurrency = user?.currency || currencyCode || 'USD';
  const defaultBranch = user?.branch || branchOptions[0] || '';
  const queryPrefill = useMemo(
    () => ({
      type: searchParams.get('type') || 'tithe',
      pledgeId: searchParams.get('pledgeId') || '',
      memberId: searchParams.get('memberId') || '',
      memberName: searchParams.get('memberName') || '',
    }),
    [searchParams],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: queryPrefill.type,
      amount: '',
      currency: defaultCurrency,
      serviceDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
      paymentReference: '',
      branch: defaultBranch,
      notes: '',
      memberId: queryPrefill.memberId,
      memberName: queryPrefill.memberName,
      pledgeId: queryPrefill.pledgeId,
      anonymous: false,
    },
  });

  const type = form.watch('type');
  const paymentMethod = form.watch('paymentMethod');
  const anonymous = form.watch('anonymous');

  useEffect(() => {
    form.reset({
      type: queryPrefill.type,
      amount: '',
      currency: defaultCurrency,
      serviceDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
      paymentReference: '',
      branch: defaultBranch,
      notes: '',
      memberId: queryPrefill.memberId,
      memberName: queryPrefill.memberName,
      pledgeId: queryPrefill.pledgeId,
      anonymous: false,
    });

    if (queryPrefill.memberId || queryPrefill.memberName) {
      setSelectedMember({
        memberId: queryPrefill.memberId,
        memberName: queryPrefill.memberName,
      });
    }
  }, [defaultBranch, defaultCurrency, form, queryPrefill]);

  const mutation = useMutation({
    mutationFn: recordTransaction,
    onSuccess: (data) => {
      setSuccessData(data);
      form.reset({
        type: queryPrefill.type === 'pledge_payment' ? 'pledge_payment' : 'tithe',
        amount: '',
        currency: defaultCurrency,
        serviceDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'cash',
        paymentReference: '',
        branch: defaultBranch,
        notes: '',
        memberId: queryPrefill.type === 'pledge_payment' ? queryPrefill.memberId : '',
        memberName: queryPrefill.type === 'pledge_payment' ? queryPrefill.memberName : '',
        pledgeId: queryPrefill.type === 'pledge_payment' ? queryPrefill.pledgeId : '',
        anonymous: false,
      });
      setSelectedMember(
        queryPrefill.type === 'pledge_payment' && (queryPrefill.memberId || queryPrefill.memberName)
          ? {
              memberId: queryPrefill.memberId,
              memberName: queryPrefill.memberName,
            }
          : null,
      );
    },
  });

  const onSubmit = (values) => {
    mutation.mutate({
      ...values,
      memberId: values.anonymous ? undefined : values.memberId,
      memberName: values.anonymous ? 'Anonymous' : values.memberName,
      paymentReference: values.paymentMethod === 'cash' ? undefined : values.paymentReference,
      pledgeId: values.type === 'pledge_payment' ? values.pledgeId : undefined,
    });
  };

  return (
    <FinancePageLayout requireRecord>
      <RouteModal
        title="Record Transaction"
        description="Capture church giving, generate a receipt, and keep member giving history up to date."
        fallbackPath="/finance/transactions"
        size="xl"
      >
        <form className="grid gap-6 xl:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Transaction</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Giving details</h2>
            </div>

            <label className="space-y-2">
              <span className="text-sm text-white/80">Transaction Type</span>
              <select
                {...form.register('type')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                {transactionTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.type ? (
                <p className="text-sm text-red-400">{form.formState.errors.type.message}</p>
              ) : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm text-white/80">Amount</span>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-lg font-semibold text-accent">{currencySymbol}</span>
                <input
                  type="number"
                  step="0.01"
                  {...form.register('amount')}
                  className="w-full bg-transparent text-2xl font-semibold text-white outline-none"
                  placeholder="0.00"
                />
              </div>
              {form.formState.errors.amount ? (
                <p className="text-sm text-red-400">{form.formState.errors.amount.message}</p>
              ) : null}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-white/80">Currency</span>
                <select
                  {...form.register('currency')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code} ({option.symbol})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Service Date</span>
                <input
                  type="date"
                  {...form.register('serviceDate')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
                {form.formState.errors.serviceDate ? (
                  <p className="text-sm text-red-400">{form.formState.errors.serviceDate.message}</p>
                ) : null}
              </label>
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Source</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Member and payment</h2>
            </div>

            {!anonymous ? (
              <MemberSearchInput
                value={selectedMember || {}}
                onSelect={(member) => {
                  setSelectedMember(member);
                  form.setValue('memberId', member.memberId);
                  form.setValue('memberName', member.memberName);
                }}
                onClear={() => {
                  setSelectedMember(null);
                  form.setValue('memberId', '');
                  form.setValue('memberName', '');
                }}
              />
            ) : null}

            <label className="flex items-center gap-3 text-sm text-white/75">
              <input
                type="checkbox"
                {...form.register('anonymous')}
              />
              Anonymous
            </label>

            <div className="grid gap-3">
              <span className="text-sm text-white/80">Payment Method</span>
              <select
                {...form.register('paymentMethod')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {paymentMethod !== 'cash' ? (
              <label className="space-y-2">
                <span className="text-sm text-white/80">Payment Reference</span>
                <input
                  {...form.register('paymentReference')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  placeholder="Mobile money transaction ID"
                />
              </label>
            ) : null}

            <label className="space-y-2">
              <span className="text-sm text-white/80">Branch</span>
              <select
                {...form.register('branch')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              >
                <option value="">Select branch</option>
                {branchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </label>

            {type === 'pledge_payment' ? (
              <label className="space-y-2">
                <span className="text-sm text-white/80">Pledge ID</span>
                <input
                  {...form.register('pledgeId')}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  placeholder="PLG-TENANT-00001"
                />
                <p className="text-xs text-white/45">
                  Use the existing pledge reference for this member. If you opened this form from a
                  pledge, it is already pre-filled.
                </p>
              </label>
            ) : null}

            <label className="space-y-2">
              <span className="text-sm text-white/80">Notes</span>
              <textarea
                rows={4}
                {...form.register('notes')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                placeholder="Optional notes"
              />
            </label>
          </Card>

          <div className="xl:col-span-2">
            <Button type="submit" variant="secondary" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Recording...' : 'Record Transaction'}
            </Button>
          </div>
        </form>
      </RouteModal>

      <Modal
        isOpen={Boolean(successData)}
        onClose={() => setSuccessData(null)}
        title="Transaction recorded"
        description="The giving record was saved successfully."
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/60">Transaction ID</p>
            <p className="mt-1 text-lg font-semibold text-white">{successData?.transactionId}</p>
            <p className="mt-4 text-sm text-white/60">Receipt Number</p>
            <p className="mt-1 text-lg font-semibold text-white">{successData?.receiptNumber}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={successData ? getReceipt(successData.transactionId) : '#'} target="_blank" rel="noreferrer">
              <Button variant="secondary">View Receipt</Button>
            </a>
            <Button variant="ghost" onClick={() => setSuccessData(null)}>
              Record Another
            </Button>
            <Button variant="subtle" onClick={() => navigate('/finance/transactions')}>
              View Transactions
            </Button>
          </div>
        </div>
      </Modal>
    </FinancePageLayout>
  );
}
