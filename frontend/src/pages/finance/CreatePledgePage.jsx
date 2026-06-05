import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import RouteModal from '../../components/ui/RouteModal';
import MemberSearchInput from '../../components/finance/MemberSearchInput';
import useCurrency from '../../hooks/useCurrency';
import { createPledge } from '../../api/endpoints/finance';

export default function CreatePledgePage() {
  const navigate = useNavigate();
  const { currencyCode, currencyOptions } = useCurrency();
  const [selectedMember, setSelectedMember] = useState(null);
  const [form, setForm] = useState({
    memberId: '',
    memberName: '',
    pledgeType: 'building_fund',
    description: '',
    totalAmount: '',
    currency: currencyCode,
    startDate: '',
    expectedEndDate: '',
    installmentFrequency: '',
    installmentAmount: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: createPledge,
    onSuccess: (data) => navigate(`/finance/pledges/${data.pledgeId}`),
  });

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate({
      memberId: form.memberId,
      pledgeType: form.pledgeType,
      description: form.description,
      totalAmount: Number(form.totalAmount),
      currency: form.currency,
      startDate: form.startDate,
      expectedEndDate: form.expectedEndDate,
      installmentPlan: form.installmentFrequency
        ? {
            frequency: form.installmentFrequency,
            installmentAmount: Number(form.installmentAmount || 0),
          }
        : undefined,
      notes: form.notes,
    });
  };

  return (
    <FinancePageLayout requireRecord>
      <RouteModal
        title="Create Pledge"
        description="Create a giving pledge and track future payments against the commitment."
        fallbackPath="/finance/pledges"
        size="lg"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Member</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Pledge owner</h2>
            </div>
            <MemberSearchInput
              value={selectedMember || {}}
              onSelect={(member) => {
                setSelectedMember(member);
                updateField('memberId', member.memberId);
                updateField('memberName', member.memberName);
              }}
              onClear={() => {
                setSelectedMember(null);
                updateField('memberId', '');
                updateField('memberName', '');
              }}
            />
          </Card>

          <Card className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-white/80">Pledge Type</span>
                <select value={form.pledgeType} onChange={(event) => updateField('pledgeType', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                  {['building_fund', 'missions', 'special_project', 'annual', 'other'].map((option) => (
                    <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Description</span>
                <input value={form.description} onChange={(event) => updateField('description', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Total Amount</span>
                <input type="number" value={form.totalAmount} onChange={(event) => updateField('totalAmount', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Currency</span>
                <select value={form.currency} onChange={(event) => updateField('currency', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>{option.code} ({option.symbol})</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Start Date</span>
                <input type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Expected End Date</span>
                <input type="date" value={form.expectedEndDate} onChange={(event) => updateField('expectedEndDate', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Installment Frequency</span>
                <select value={form.installmentFrequency} onChange={(event) => updateField('installmentFrequency', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                  <option value="">None</option>
                  {['weekly', 'monthly', 'quarterly', 'once'].map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Installment Amount</span>
                <input type="number" value={form.installmentAmount} onChange={(event) => updateField('installmentAmount', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm text-white/80">Notes</span>
              <textarea rows={4} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
            </label>

            <Button type="submit" variant="secondary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Create Pledge'}
            </Button>
          </Card>
        </form>
      </RouteModal>
    </FinancePageLayout>
  );
}
