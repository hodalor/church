import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import { getAbsentees } from '../../api/endpoints/attendance';
import { downloadCsv } from '../../utils/attendance';

export default function AbsenteesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const [department, setDepartment] = useState('');
  const [missedCount, setMissedCount] = useState('2');
  const [selectedIds, setSelectedIds] = useState([]);

  const absenteesQuery = useQuery({
    queryKey: ['attendance-absentees', search, branch, department, missedCount],
    queryFn: () =>
      getAbsentees({
        search: search || undefined,
        branch: branch || undefined,
        department: department || undefined,
        missedCount,
      }),
  });

  const items = useMemo(() => absenteesQuery.data?.items || [], [absenteesQuery.data?.items]);

  const selectedRows = useMemo(
    () => items.filter((item) => selectedIds.includes(item.memberId || item._id)),
    [items, selectedIds],
  );

  const openFollowUp = (rows) => {
    const memberIds = rows.map((item) => item.memberId || item._id).filter(Boolean);
    const params = new URLSearchParams();
    params.set('template', 'follow_up');
    params.set('audienceType', 'specific_members');
    params.set('memberIds', memberIds.join(','));
    navigate(`/communication/broadcasts/new?${params.toString()}`);
  };

  const toggleRow = (memberId) => {
    setSelectedIds((current) =>
      current.includes(memberId) ? current.filter((item) => item !== memberId) : [...current, memberId],
    );
  };

  const columns = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.memberId || row._id)}
          onChange={() => toggleRow(row.memberId || row._id)}
        />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.photoUrl ? (
            <img src={row.photoUrl} alt={row.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {String(row.name || 'M').slice(0, 1).toUpperCase()}
            </div>
          )}
          <p className="font-semibold text-white">{row.name || row.fullName || 'Member'}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone' },
    { key: 'lastAttended', header: 'Last Attended' },
    { key: 'missedCount', header: 'Missed Count' },
    { key: 'department', header: 'Department' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="subtle" onClick={() => navigate(`/members/${row.memberId || row._id}`)}>
            View Profile
          </Button>
          <Button variant="secondary" onClick={() => openFollowUp([row])}>
            Send Message
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Absentees"
          subtitle="Members who attended 3+ of the last 8 services but missed the most recent services."
          action={
            <div className="flex flex-wrap gap-2">
              {selectedRows.length ? (
                <Button variant="secondary" onClick={() => openFollowUp(selectedRows)}>
                  Send Bulk Follow-up Message
                </Button>
              ) : null}
              <Button
                variant="subtle"
                onClick={() =>
                  downloadCsv(
                    'absentees.csv',
                    ['Name', 'Phone', 'Last Attended', 'Missed Count', 'Department'],
                    items.map((item) => [
                      item.name || item.fullName || '',
                      item.phone || '',
                      item.lastAttended || '',
                      item.missedCount || '',
                      item.department || '',
                    ]),
                  )
                }
              >
                Export List
              </Button>
            </div>
          }
        />

        <Card className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member" />
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              placeholder="Branch"
            />
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              placeholder="Department"
            />
            <select
              value={missedCount}
              onChange={(event) => setMissedCount(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
            >
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <DataTable columns={columns} data={items} emptyMessage="No recently absent regular members found." />
        </Card>
      </div>
    </AppShell>
  );
}
