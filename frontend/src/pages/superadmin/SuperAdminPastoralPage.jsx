import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getPlatformPastoralOverview } from '../../api/endpoints/pastoral';
import PastoralPageLayout from '../../components/pastoral/PastoralPageLayout';
import Card from '../../components/ui/Card';

const colors = ['#C9A84C', '#1E2A4A', '#10b981', '#f97316', '#8b5cf6'];

export default function SuperAdminPastoralPage() {
  const overviewQuery = useQuery({
    queryKey: ['platform-pastoral-overview'],
    queryFn: getPlatformPastoralOverview,
  });

  const tenants = overviewQuery.data?.tenants || [];
  const completionChart = tenants.map((tenant) => ({
    name: tenant.churchName,
    rate: tenant.activeDiscipships ? Math.min(100, Math.round((tenant.activeDiscipships / Math.max(tenant.openCases, 1)) * 100)) : 0,
  }));

  return (
    <PastoralPageLayout
      superAdminOnly
      title="Platform Pastoral"
      subtitle="Monitor care cases, critical follow-up, discipleship activity, and pastoral appointments across all churches."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Open Cases', value: overviewQuery.data?.totalOpenCases || 0 },
          { label: 'Critical Cases', value: overviewQuery.data?.totalCriticalCases || 0 },
          { label: 'Active Discipleships', value: overviewQuery.data?.totalActiveDiscipships || 0 },
          { label: 'Appointments Today', value: overviewQuery.data?.totalPendingAppointments || 0 },
        ].map((item) => (
          <Card
            key={item.label}
            className={`min-h-[112px] p-4 ${item.label === 'Critical Cases' && item.value > 0 ? 'border-rose-500/30 bg-rose-500/10' : ''}`}
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{item.label}</p>
            <p className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Per-Tenant Table</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Church pastoral overview</h2>
        </div>
        <div className="overflow-x-auto rounded-[18px]">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/[0.02]">
              <tr className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                {['Church', 'Open Cases', 'Critical', 'Discipleships', 'Appointments', 'Last Activity'].map((header) => (
                  <th key={header} className="px-4 py-3.5 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-white/80">
              {tenants.map((tenant) => (
                <tr key={tenant.tenantId}>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-white">{tenant.churchName}</p>
                    <p className="mt-1 text-xs text-white/45">{tenant.tenantId}</p>
                  </td>
                  <td className="px-4 py-3.5">{tenant.openCases}</td>
                  <td className="px-4 py-3.5 text-rose-200">{tenant.criticalCases}</td>
                  <td className="px-4 py-3.5">{tenant.activeDiscipships}</td>
                  <td className="px-4 py-3.5">{tenant.pendingAppointments}</td>
                  <td className="px-4 py-3.5 text-white/55">
                    {tenant.criticalCases > 0 ? 'Critical activity detected' : 'Monitoring active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Platform Charts</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Open cases per tenant</h2>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenants}>
                <XAxis dataKey="churchName" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="openCases" radius={[8, 8, 0, 0]}>
                  {tenants.map((tenant, index) => (
                    <Cell key={tenant.tenantId} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Platform Charts</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Discipleship completion rates per tenant</h2>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionChart}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="rate" fill="#C9A84C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </PastoralPageLayout>
  );
}
