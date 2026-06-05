import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AmountDisplay from '../../components/finance/AmountDisplay';
import GivingProgressBar from '../../components/finance/GivingProgressBar';
import useCurrency from '../../hooks/useCurrency';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import { activateBudget, getBudgetById, updateBudget } from '../../api/endpoints/finance';

const createLine = () => ({
  category: 'utilities',
  label: '',
  allocated: '',
  spent: 0,
});

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

export default function BudgetDetailPage() {
  const { budgetId } = useParams();
  const queryClient = useQueryClient();
  const { canModifyBudgets } = useFinanceAccess();
  const { formatCurrency } = useCurrency();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: '',
    year: new Date().getFullYear(),
    month: '',
    status: 'draft',
    lines: [createLine()],
  });

  const budgetQuery = useQuery({
    queryKey: ['finance-budget-detail', budgetId],
    queryFn: () => getBudgetById(budgetId),
  });

  useEffect(() => {
    const budget = budgetQuery.data;
    if (!budget) {
      return;
    }

    setForm({
      title: budget.title || '',
      year: budget.year || new Date().getFullYear(),
      month: budget.month || '',
      status: budget.status || 'draft',
      lines:
        budget.lines?.length
          ? budget.lines.map((line) => ({
              category: line.category || 'utilities',
              label: line.label || '',
              allocated: line.allocated || '',
              spent: line.spent || 0,
            }))
          : [createLine()],
    });
  }, [budgetQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (payload) => updateBudget(budgetId, payload),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['finance-budget-detail', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['finance-budgets'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => activateBudget(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-budget-detail', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['finance-budgets'] });
    },
  });

  const totalAllocated = useMemo(
    () => form.lines.reduce((sum, line) => sum + Number(line.allocated || 0), 0),
    [form.lines],
  );

  const budget = budgetQuery.data;

  const saveBudget = () => {
    updateMutation.mutate({
      title: form.title,
      year: Number(form.year),
      month: form.month ? Number(form.month) : undefined,
      status: form.status,
      lines: form.lines.map((line) => ({
        category: line.category,
        label: line.label,
        allocated: Number(line.allocated || 0),
        spent: Number(line.spent || 0),
      })),
    });
  };

  const updateLine = (index, key, value) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [key]: value } : line,
      ),
    }));
  };

  return (
    <FinancePageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Budget Detail"
          subtitle="Review line allocations, utilization, and activate or refine the budget plan."
          action={
            <div className="flex flex-wrap gap-3">
              <Link to="/finance/budgets">
                <Button variant="ghost">Back to Budgets</Button>
              </Link>
              {canModifyBudgets ? (
                <Button variant={isEditing ? 'ghost' : 'secondary'} onClick={() => setIsEditing((current) => !current)}>
                  {isEditing ? 'Cancel Edit' : 'Edit Budget'}
                </Button>
              ) : null}
            </div>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-accent">Budget Overview</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{budget?.title || budget?.budgetId}</h2>
                <p className="mt-2 text-sm text-white/55">{budget?.budgetId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Status</p>
                <p className="mt-2 text-lg font-semibold text-white">{budget?.status || 'draft'}</p>
              </div>
            </div>

            <GivingProgressBar
              current={budget?.totalSpent}
              target={budget?.totalAllocated}
              label="Overall utilization"
            />

            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard label="Allocated" amount={budget?.totalAllocated} />
              <SummaryCard label="Spent" amount={budget?.totalSpent} color="text-red-300" />
              <SummaryCard
                label="Remaining"
                amount={Number(budget?.totalAllocated || 0) - Number(budget?.totalSpent || 0)}
                color={Number(budget?.totalAllocated || 0) - Number(budget?.totalSpent || 0) < 0 ? 'text-red-300' : 'text-emerald-300'}
              />
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm text-white/75">Title</span>
                    <input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-white/75">Year</span>
                    <input
                      type="number"
                      value={form.year}
                      onChange={(event) => setForm((current) => ({ ...current, year: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-white/75">Month</span>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={form.month}
                      onChange={(event) => setForm((current) => ({ ...current, month: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  {form.lines.map((line, index) => (
                    <div
                      key={`${index}-${line.category}`}
                      className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-4"
                    >
                      <select
                        value={line.category}
                        onChange={(event) => updateLine(index, 'category', event.target.value)}
                        className="rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white"
                      >
                        {categoryOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.replaceAll('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <input
                        value={line.label}
                        onChange={(event) => updateLine(index, 'label', event.target.value)}
                        className="rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white"
                        placeholder="Line label"
                      />
                      <input
                        type="number"
                        value={line.allocated}
                        onChange={(event) => updateLine(index, 'allocated', event.target.value)}
                        className="rounded-xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white"
                        placeholder="Allocated"
                      />
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-white/45">Spent: {formatCurrency(line.spent || 0)}</span>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="subtle"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        lines: [...current.lines, createLine()],
                      }))
                    }
                  >
                    Add Line Item
                  </Button>
                  <div className="text-right">
                    <p className="text-sm text-white/55">Running total</p>
                    <p className="text-2xl font-semibold text-white">{formatCurrency(totalAllocated)}</p>
                  </div>
                </div>

                <Button variant="secondary" onClick={saveBudget} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {(budget?.lines || []).map((line) => (
                  <div key={`${line.category}-${line.label}`} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold text-white">{line.label || line.category}</p>
                        <p className="mt-1 text-sm text-white/55">{line.category.replaceAll('_', ' ')}</p>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        <AmountDisplay amount={line.allocated} size="sm" />
                        <AmountDisplay amount={line.spent} size="sm" color="text-red-300" />
                        <AmountDisplay
                          amount={line.remaining}
                          size="sm"
                          color={Number(line.remaining || 0) < 0 ? 'text-red-300' : 'text-emerald-300'}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <GivingProgressBar current={line.spent} target={line.allocated} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Planning Context</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Budget metadata</h2>
            </div>
            <Detail label="Year" value={budget?.year} />
            <Detail label="Month" value={budget?.month || 'Annual Budget'} />
            <Detail label="Created By" value={budget?.createdByName || budget?.createdBy || '—'} />
            <Detail
              label="Created At"
              value={budget?.createdAt ? new Date(budget.createdAt).toLocaleString() : '—'}
            />

            {canModifyBudgets && budget?.status !== 'active' ? (
              <Button
                variant="secondary"
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
              >
                {activateMutation.isPending ? 'Activating...' : 'Activate Budget'}
              </Button>
            ) : null}
          </Card>
        </div>
      </div>
    </FinancePageLayout>
  );
}

function SummaryCard({ label, amount, color = 'text-white' }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/55">{label}</p>
      <AmountDisplay amount={amount || 0} size="md" color={color} />
    </div>
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
