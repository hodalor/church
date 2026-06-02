import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import Button from '../../components/ui/Button';
import RouteModal from '../../components/ui/RouteModal';
import { activateBudget, createBudget } from '../../api/endpoints/finance';

const createLine = () => ({
  category: 'utilities',
  label: '',
  allocated: '',
});

export default function CreateBudgetPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    year: new Date().getFullYear(),
    month: '',
    lines: [createLine()],
  });

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: async (budget) => {
      if (form.activateImmediately) {
        await activateBudget(budget.budgetId);
      }
      navigate('/finance/budgets');
    },
  });

  const updateLine = (index, key, value) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [key]: value } : line,
      ),
    }));
  };

  const totalAllocated = form.lines.reduce((sum, line) => sum + Number(line.allocated || 0), 0);

  const handleSubmit = (status) => (event) => {
    event.preventDefault();
    createMutation.mutate({
      title: form.title,
      year: Number(form.year),
      month: form.month ? Number(form.month) : undefined,
      status,
      lines: form.lines.map((line) => ({
        category: line.category,
        label: line.label,
        allocated: Number(line.allocated || 0),
        spent: 0,
      })),
    });
  };

  return (
    <FinancePageLayout requireApprove>
      <RouteModal
        title="Create Budget"
        description="Plan monthly or yearly allocations and activate the finance budget when ready."
        fallbackPath="/finance/budgets"
        size="lg"
      >
        <form className="space-y-5" onSubmit={handleSubmit('active')}>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm text-white/80">Title</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/80">Year</span>
              <input type="number" value={form.year} onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/80">Month (optional)</span>
              <input type="number" min="1" max="12" value={form.month} onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" />
            </label>
          </div>

          <div className="space-y-4">
            {form.lines.map((line, index) => (
              <div key={`${index}-${line.category}`} className="grid gap-3 border-b border-white/8 pb-4 last:border-b-0 last:pb-0 md:grid-cols-[1.1fr_1.2fr_1.1fr_auto]">
                <select value={line.category} onChange={(event) => updateLine(index, 'category', event.target.value)} className="rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white">
                  {['salaries', 'utilities', 'rent', 'maintenance', 'equipment', 'events', 'missions', 'welfare', 'stationery', 'transport', 'media', 'outreach', 'other'].map((option) => (
                    <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                  ))}
                </select>
                <input value={line.label} onChange={(event) => updateLine(index, 'label', event.target.value)} className="rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white" placeholder="Line label" />
                <input type="number" value={line.allocated} onChange={(event) => updateLine(index, 'allocated', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white" placeholder="Allocated" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setForm((current) => ({ ...current, lines: current.lines.filter((_, lineIndex) => lineIndex !== index) }))}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="subtle"
              onClick={() => setForm((current) => ({ ...current, lines: [...current.lines, createLine()] }))}
            >
              Add Line Item
            </Button>
            <div className="text-right">
              <p className="text-sm text-white/55">Running total</p>
              <p className="text-2xl font-semibold text-white">${totalAllocated.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={handleSubmit('draft')}>
              Save as Draft
            </Button>
            <Button type="submit" variant="secondary">
              Activate Budget
            </Button>
          </div>
        </form>
      </RouteModal>
    </FinancePageLayout>
  );
}
