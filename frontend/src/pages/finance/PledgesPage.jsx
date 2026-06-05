import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import AmountDisplay from '../../components/finance/AmountDisplay';
import GivingProgressBar from '../../components/finance/GivingProgressBar';
import useCurrency from '../../hooks/useCurrency';
import { useFinanceAccess } from '../../hooks/useFinanceAccess';
import { getAllPledges } from '../../api/endpoints/finance';

export default function PledgesPage() {
  const { canRecordPledges } = useFinanceAccess();
  const [status, setStatus] = useState('');
  const [pledgeType, setPledgeType] = useState('');

  const pledgesQuery = useQuery({
    queryKey: ['finance-pledges', status, pledgeType],
    queryFn: () => getAllPledges({ status, pledgeType }),
  });

  const data = pledgesQuery.data || {};
  const pledges = data.pledges || [];

  const columns = [
    { key: 'memberName', header: 'Member' },
    {
      key: 'pledgeType',
      header: 'Pledge Type',
      render: (pledge) => String(pledge.pledgeType).replaceAll('_', ' '),
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (pledge) => <AmountDisplay amount={pledge.totalAmount} currency={pledge.currency} size="sm" />,
    },
    {
      key: 'amountPaid',
      header: 'Paid',
      render: (pledge) => <AmountDisplay amount={pledge.amountPaid} currency={pledge.currency} size="sm" />,
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (pledge) => <AmountDisplay amount={pledge.balance} currency={pledge.currency} size="sm" color="text-red-300" />,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (pledge) => <GivingProgressBar current={pledge.amountPaid} target={pledge.totalAmount} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (pledge) => (
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
          {pledge.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (pledge) => (
        <Link to={`/finance/pledges/${pledge.pledgeId}`}>
          <Button variant="subtle">View</Button>
        </Link>
      ),
    },
  ];

  return (
    <FinancePageLayout requireCapability="finance.pledges.view">
      <div className="space-y-6">
        <PageHeader
          title="Pledges"
          subtitle="Track church pledges, progress, and payment completion."
          action={
            canRecordPledges ? (
              <Link to="/finance/pledges/new">
                <Button variant="secondary">Create Pledge</Button>
              </Link>
            ) : null
          }
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Pledged" value={data.summary?.totalPledged || 0} />
          <StatCard label="Total Collected" value={data.summary?.totalCollected || 0} />
          <StatCard label="Outstanding" value={data.summary?.outstanding || 0} color="text-red-300" />
          <StatCard label="Completed Pledges" value={data.summary?.completedPledges || 0} raw />
        </div>

        <Card className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-white/70">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white">
                <option value="">All</option>
                {['active', 'completed', 'defaulted', 'cancelled'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/70">Pledge Type</span>
              <select value={pledgeType} onChange={(event) => setPledgeType(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white">
                <option value="">All</option>
                {['building_fund', 'missions', 'special_project', 'annual', 'other'].map((option) => (
                  <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </label>
          </div>

          <DataTable columns={columns} data={pledges} emptyMessage="No pledges found." />
        </Card>
      </div>
    </FinancePageLayout>
  );
}

function StatCard({ label, value, color = 'text-white', raw = false }) {
  const { formatCurrency } = useCurrency();

  return (
    <Card className="min-h-[104px] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{label}</p>
      <div className={`mt-3 font-serif text-4xl font-semibold leading-none ${color}`}>
        {raw ? value : formatCurrency(value || 0)}
      </div>
    </Card>
  );
}
