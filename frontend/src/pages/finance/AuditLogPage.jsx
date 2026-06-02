import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import FinancePageLayout from '../../components/finance/FinancePageLayout';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { getAuditLog } from '../../api/endpoints/finance';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const auditQuery = useQuery({
    queryKey: ['finance-audit-log', page, entityType, action],
    queryFn: () => getAuditLog({ page, entityType, action }),
  });

  const columns = [
    {
      key: 'performedAt',
      header: 'Date',
      render: (log) => new Date(log.performedAt).toLocaleString(),
    },
    { key: 'action', header: 'Action' },
    { key: 'entityType', header: 'Entity Type' },
    { key: 'entityId', header: 'Entity ID' },
    { key: 'performedBy', header: 'Performed By' },
    { key: 'notes', header: 'Notes' },
  ];

  return (
    <FinancePageLayout requireApprove>
      <div className="space-y-6">
        <PageHeader
          title="Audit Log"
          subtitle="Review financial audit activity across transactions, expenses, and pledges."
        />

        <Card className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-white/70">Entity Type</span>
              <select value={entityType} onChange={(event) => setEntityType(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                <option value="">All</option>
                {['Transaction', 'Expense', 'Pledge'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/70">Action</span>
              <input value={action} onChange={(event) => setAction(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white" placeholder="EXPENSE_APPROVED" />
            </label>
          </div>

          <DataTable columns={columns} data={auditQuery.data?.logs || []} emptyMessage="No audit log entries found." />

          <Pagination
            currentPage={auditQuery.data?.page || page}
            totalPages={auditQuery.data?.totalPages || 1}
            onPageChange={setPage}
          />
        </Card>
      </div>
    </FinancePageLayout>
  );
}
