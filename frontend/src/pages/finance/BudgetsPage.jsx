import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import GivingProgressBar from '../../components/finance/GivingProgressBar';
import AmountDisplay from '../../components/finance/AmountDisplay';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import { getAllBudgets } from '../../api/endpoints/finance';

export default function BudgetsPage() {
  const { canModifyBudgets } = useFinanceAccess();

  const budgetsQuery = useQuery({
    queryKey: ['finance-budgets'],
    queryFn: () => getAllBudgets(),
  });

  const budgets = budgetsQuery.data || [];
  const activeBudget = budgets.find((budget) => budget.status === 'active');

  return (
    <FinancePageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Budgets"
          subtitle="Review active budget utilization and manage yearly or monthly finance planning."
          action={
            canModifyBudgets ? (
              <Link to="/finance/budgets/new">
                <Button variant="secondary">+ Create Budget</Button>
              </Link>
            ) : null
          }
        />

        {activeBudget ? (
          <Card className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-accent">Active Budget</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{activeBudget.title || activeBudget.budgetId}</h2>
            </div>
            <GivingProgressBar
              current={activeBudget.totalSpent}
              target={activeBudget.totalAllocated}
              label="Overall budget utilization"
            />
            <div className="space-y-4">
              {(activeBudget.lines || []).map((line) => (
                <div key={`${line.category}-${line.label}`} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-white">{line.label || line.category}</p>
                      <p className="mt-1 text-sm text-white/55">{line.category}</p>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <AmountDisplay amount={line.allocated} size="sm" />
                      <AmountDisplay amount={line.spent} size="sm" color="text-red-300" />
                      <AmountDisplay amount={line.remaining} size="sm" color={Number(line.remaining || 0) < 0 ? 'text-red-300' : 'text-emerald-300'} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <GivingProgressBar current={line.spent} target={line.allocated} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Budget History</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">All budgets</h2>
          </div>
          <div className="space-y-3">
            {budgets.map((budget) => (
              <div key={budget.budgetId} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-white">{budget.title || budget.budgetId}</p>
                    <p className="mt-1 text-sm text-white/55">
                      {budget.year}{budget.month ? ` • Month ${budget.month}` : ' • Annual'}
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[repeat(3,auto)_auto] md:items-center">
                    <AmountDisplay amount={budget.totalAllocated} size="sm" />
                    <AmountDisplay amount={budget.totalSpent} size="sm" color="text-red-300" />
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
                      {budget.status}
                    </span>
                    <Link to={`/finance/budgets/${budget.budgetId}`} className="text-sm font-semibold text-accent">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {!budgets.length ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/55">
                No budgets found yet.
              </p>
            ) : null}
          </div>
        </Card>
      </div>
    </FinancePageLayout>
  );
}
