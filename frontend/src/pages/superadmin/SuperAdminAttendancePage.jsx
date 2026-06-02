import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import { getPlatformAttendanceOverview } from '../../api/endpoints/attendance';

export default function SuperAdminAttendancePage() {
  const navigate = useNavigate();
  const [country, setCountry] = useState('');
  const [planType, setPlanType] = useState('');
  const platformQuery = useQuery({
    queryKey: ['superadmin-attendance-platform', country, planType],
    queryFn: () =>
      getPlatformAttendanceOverview({
        country: country || undefined,
        planType: planType || undefined,
      }),
  });

  const overview = platformQuery.data || {};
  const stats = [
    ['Total Churches Reporting', overview.totalChurchesReporting || 0],
    ['Platform Avg Attendance', overview.platformAverageAttendance || 0],
    ['Most Active Church', overview.mostActiveChurch || 'N/A'],
    ['Fastest Growing Church', overview.fastestGrowingChurch || 'N/A'],
  ];

  const columns = [
    { key: 'churchName', header: 'Church Name' },
    { key: 'tenantId', header: 'Tenant ID' },
    { key: 'lastServiceDate', header: 'Last Service Date' },
    { key: 'lastCount', header: 'Last Count' },
    { key: 'monthlyAverage', header: 'Monthly Avg' },
    { key: 'trend', header: 'Trend Arrow' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          onClick={() => navigate(`/attendance/services?tenantId=${row.tenantId}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          title="Platform Attendance"
          subtitle="Compare attendance performance across all churches reporting on the platform."
        />

        <Card className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              placeholder="Filter by country"
            />
            <select
              value={planType}
              onChange={(event) => setPlanType(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
            >
              <option value="">All plans</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="mega">Mega</option>
            </select>
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Platform Trends</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Top churches over 6 months</h3>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overview.trends || []}>
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  {(overview.lines || []).map((line, index) => (
                    <Line
                      key={line.key || index}
                      type="monotone"
                      dataKey={line.key}
                      name={line.label}
                      stroke={line.color || ['#C9A84C', '#1E2A4A', '#14b8a6', '#8b5cf6', '#f97316'][index % 5]}
                      strokeWidth={3}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Monthly Comparison</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Top tenant attendance</h3>
            </div>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.table || []}>
                  <XAxis dataKey="churchName" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="monthlyAverage" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-white/45">All Tenants</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Attendance reporting table</h3>
          </div>
          <DataTable columns={columns} data={overview.table || []} emptyMessage="No tenant attendance data available." />
        </Card>
      </div>
    </SuperAdminShell>
  );
}
