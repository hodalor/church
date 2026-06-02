import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RouteModal from '../../components/ui/RouteModal';
import { recordExpense } from '../../api/endpoints/finance';
import { supabaseUpload } from '../../utils/supabaseUpload';

export default function RecordExpensePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: 'utilities',
    description: '',
    amount: '',
    currency: 'USD',
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'cash',
    paymentReference: '',
    vendor: '',
    receiptUrl: '',
    branch: '',
    department: '',
    notes: '',
  });

  const mutation = useMutation({
    mutationFn: recordExpense,
    onSuccess: () => navigate('/finance/expenses'),
  });

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const extension = file.name.split('.').pop();
    const url = await supabaseUpload(
      file,
      'church-media',
      `documents/expenses/${Date.now()}.${extension}`,
    );
    updateField('receiptUrl', url);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate({
      ...form,
      amount: Number(form.amount),
    });
  };

  return (
    <FinancePageLayout requireRecord>
      <RouteModal
        title="Record Expense"
        description="Submit an expense record, attach a receipt, and send it through the approval flow."
        fallbackPath="/finance/expenses"
        size="lg"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-white/80">Category</span>
                <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                  {['salaries', 'utilities', 'rent', 'maintenance', 'equipment', 'events', 'missions', 'welfare', 'stationery', 'transport', 'media', 'outreach', 'other'].map((option) => (
                    <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Description</span>
                <input value={form.description} onChange={(event) => updateField('description', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Amount</span>
                <input type="number" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Expense Date</span>
                <input type="date" value={form.expenseDate} onChange={(event) => updateField('expenseDate', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Payment Method</span>
                <select value={form.paymentMethod} onChange={(event) => updateField('paymentMethod', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                  {['cash', 'mobile_money', 'bank_transfer', 'card', 'cheque', 'other'].map((option) => (
                    <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Reference</span>
                <input value={form.paymentReference} onChange={(event) => updateField('paymentReference', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Vendor</span>
                <input value={form.vendor} onChange={(event) => updateField('vendor', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Branch</span>
                <input value={form.branch} onChange={(event) => updateField('branch', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Department</span>
                <input value={form.department} onChange={(event) => updateField('department', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-white/80">Receipt Upload</span>
                <input type="file" onChange={handleUpload} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm text-white/80">Notes</span>
              <textarea rows={4} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
            </label>

            <Button type="submit" variant="secondary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Record Expense'}
            </Button>
          </Card>
        </form>
      </RouteModal>
    </FinancePageLayout>
  );
}
