import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AmountDisplay from '../../components/finance/AmountDisplay';
import { getMemberAnnualStatement } from '../../api/endpoints/finance';

export default function MemberStatementPage() {
  const { memberId } = useParams();
  const [year, setYear] = useState(new Date().getFullYear());

  const statementQuery = useQuery({
    queryKey: ['finance-member-statement-page', memberId, year],
    queryFn: () => getMemberAnnualStatement(memberId, year),
  });

  const statement = statementQuery.data;

  return (
    <FinancePageLayout>
      <div className="space-y-6">
        <PageHeader
          title="Member Statement"
          subtitle="Print-friendly annual giving statement for the selected member."
          action={
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              />
              <Button variant="secondary" onClick={() => window.print()}>
                Print
              </Button>
            </div>
          }
        />

        <Card className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-white">{statement?.member?.name}</h2>
            <p className="mt-1 text-sm text-white/55">{statement?.member?.memberId}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Summary label="Tithes" amount={statement?.summary?.totalTithes} />
            <Summary label="Offerings" amount={statement?.summary?.totalOfferings} />
            <Summary label="Pledges" amount={statement?.summary?.totalPledges} />
            <Summary label="Grand Total" amount={statement?.summary?.grandTotal} />
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0b1120]">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-white/45">
                <tr>
                  {['Date', 'Receipt#', 'Type', 'Amount', 'Method'].map((label) => (
                    <th key={label} className="px-5 py-4 font-medium">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {(statement?.transactions || []).map((transaction) => (
                  <tr key={transaction.transactionId}>
                    <td className="px-5 py-4">{new Date(transaction.serviceDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4">{transaction.receiptNumber}</td>
                    <td className="px-5 py-4">{transaction.type.replaceAll('_', ' ')}</td>
                    <td className="px-5 py-4"><AmountDisplay amount={transaction.amount} currency={transaction.currency} size="sm" /></td>
                    <td className="px-5 py-4">{transaction.paymentMethod.replaceAll('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </FinancePageLayout>
  );
}

function Summary({ label, amount }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/55">{label}</p>
      <AmountDisplay amount={amount || 0} size="md" />
    </div>
  );
}
