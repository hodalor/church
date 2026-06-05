import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import ServiceStatusBadge from '../../components/attendance/ServiceStatusBadge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import {
  computeServiceStats,
  getServiceAttendance,
  getServiceById,
  removeCheckIn,
  toggleServiceCheckIn,
  updateOfflineCount,
} from '../../api/endpoints/attendance';
import {
  downloadCsv,
  formatLongDate,
  formatTimeRange,
  getAttendanceTypeStyles,
  getMethodLabel,
} from '../../utils/attendance';
import { useCapabilities } from '../../hooks/useCapabilities';
import useAttendanceAccess from '../../hooks/useAttendanceAccess';

const statCards = [
  ['Total', 'total'],
  ['Members', 'members'],
  ['Visitors', 'visitors'],
  ['Children', 'children'],
  ['Online', 'online'],
  ['First Timers', 'firstTimers'],
];

export default function ServiceDetailPage() {
  const queryClient = useQueryClient();
  const { serviceId } = useParams();
  const { hasAnyCapability } = useCapabilities();
  const { canViewServices, canCheckInServices, canModifyServices } = useAttendanceAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const [offlineForm, setOfflineForm] = useState({
    adults: '',
    children: '',
    visitors: '',
  });

  const type = searchParams.get('type') || '';
  const method = searchParams.get('method') || '';
  const page = Number(searchParams.get('page') || 1);

  const serviceQuery = useQuery({
    queryKey: ['attendance-service-detail', serviceId],
    queryFn: () => getServiceById(serviceId),
  });

  const attendanceQuery = useQuery({
    queryKey: ['attendance-service-checkins', serviceId, page, type, method],
    queryFn: () =>
      getServiceAttendance(serviceId, {
        page,
        limit: 12,
        type: type || undefined,
        method: method || undefined,
      }),
    enabled: Boolean(serviceId),
  });

  const toggleMutation = useMutation({
    mutationFn: (nextState) => toggleServiceCheckIn(serviceId, nextState),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-service-detail', serviceId] }),
  });

  const computeMutation = useMutation({
    mutationFn: () => computeServiceStats(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-service-detail', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['attendance-service-checkins', serviceId] });
    },
  });

  const offlineMutation = useMutation({
    mutationFn: (payload) => updateOfflineCount(serviceId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-service-detail', serviceId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (checkInId) => removeCheckIn(serviceId, checkInId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-service-checkins', serviceId] }),
  });

  const service = serviceQuery.data?.service || serviceQuery.data || {};
  const stats = service.stats || {};
  const genderData = [
    { name: 'Male', value: stats.male || 0, fill: '#1E2A4A' },
    { name: 'Female', value: stats.female || 0, fill: '#C9A84C' },
  ];
  const timelineData = service.checkInTimeline || attendanceQuery.data?.timeline || [];
  const checkIns = attendanceQuery.data?.items || attendanceQuery.data?.checkIns || [];

  const combinedTotal = useMemo(() => {
    const offline = service.offlineCount || {};
    return Number(stats.total || 0) + Number(offline.adults || 0) + Number(offline.children || 0) + Number(offline.visitors || 0);
  }, [service.offlineCount, stats.total]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const columns = [
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
          <div>
            <p className="font-semibold text-white">{row.name || row.memberName || 'Guest'}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">{row.memberId || row.attendeeId || 'Visitor'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getAttendanceTypeStyles(row.type)}`}>
          {row.type || 'member'}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (row) => getMethodLabel(row.method),
    },
    {
      key: 'time',
      header: 'Time',
      render: (row) => row.time || row.checkedInAt || row.createdAt || 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        hasAnyCapability(['attendance.delete', 'attendance.services.delete']) ? (
          <Button variant="ghost" onClick={() => removeMutation.mutate(row.checkInId || row._id)}>
            Remove
          </Button>
        ) : null,
    },
  ];

  if (!canViewServices) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Attendance</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to this service.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Service Detail"
          subtitle="Track the live service turnout and review attendance after the service closes."
          action={
            <div className="flex flex-wrap gap-2">
              {canCheckInServices ? (
                <Button
                  variant={service.checkInOpen ? 'ghost' : 'secondary'}
                  onClick={() => toggleMutation.mutate(!service.checkInOpen)}
                >
                  {service.checkInOpen ? 'Close Check-in' : 'Open Check-in'}
                </Button>
              ) : null}
              {canModifyServices ? (
                <Button variant="subtle" onClick={() => computeMutation.mutate()}>
                  Compute Stats
                </Button>
              ) : null}
              {canModifyServices ? (
                <Link to={`/attendance/services/new?serviceId=${serviceId}`}>
                  <Button variant="subtle">Edit Service</Button>
                </Link>
              ) : null}
            </div>
          }
        />

        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">{service.title || 'Service'}</h2>
              <p className="mt-2 text-sm text-white/55">
                {formatLongDate(service.date)} • {formatTimeRange(service.startTime, service.endTime)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-[#f3deb0]">
                  {service.type || 'General'}
                </span>
                <ServiceStatusBadge
                  checkInOpen={service.checkInOpen}
                  date={service.date}
                  status={service.status}
                />
              </div>
            </div>
            {canCheckInServices ? (
              <Link to={`/attendance/check-in/${serviceId}`}>
                <Button variant="secondary">Open Check-in Console</Button>
              </Link>
            ) : null}
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {statCards.map(([label, key]) => (
            <Card key={key} className="p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{stats[key] || 0}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Check-in Timeline</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Peak arrival periods</h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="attendanceTimeline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#C9A84C" fill="url(#attendanceTimeline)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Gender Split</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Male vs Female</h3>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={96}>
                    {genderData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/45">Attendance List</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Service attendees</h3>
              </div>
              <Button
                variant="subtle"
                onClick={() =>
                  downloadCsv(
                    `attendance-${serviceId}.csv`,
                    ['Name', 'Member ID', 'Type', 'Method', 'Time'],
                    checkIns.map((item) => [
                      item.name || item.memberName || 'Guest',
                      item.memberId || '',
                      item.type || 'member',
                      getMethodLabel(item.method),
                      item.time || item.checkedInAt || '',
                    ]),
                  )
                }
              >
                Export CSV
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[13px] font-medium text-white/75">Filter by Type</span>
                <select
                  value={type}
                  onChange={(event) => updateParam('type', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="">All</option>
                  <option value="member">Member</option>
                  <option value="visitor">Visitor</option>
                  <option value="child">Child</option>
                  <option value="online">Online</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[13px] font-medium text-white/75">Filter by Method</span>
                <select
                  value={method}
                  onChange={(event) => updateParam('method', event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="">All</option>
                  <option value="qr">QR</option>
                  <option value="manual">Manual</option>
                  <option value="visitor_form">Visitor Form</option>
                  <option value="child_check_in">Child Check-in</option>
                  <option value="online">Online</option>
                </select>
              </label>
            </div>

            <DataTable columns={columns} data={checkIns} emptyMessage="No attendance records found." />
            <Pagination
              currentPage={attendanceQuery.data?.page || 1}
              totalPages={attendanceQuery.data?.totalPages || 1}
              onPageChange={(nextPage) => updateParam('page', String(nextPage))}
            />
          </Card>

          <Card className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Offline Count</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Manual headcount</h3>
            </div>
            <div className="grid gap-3">
              <input
                type="number"
                min="0"
                placeholder="Adults"
                value={offlineForm.adults}
                onChange={(event) =>
                  setOfflineForm((current) => ({ ...current, adults: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              />
              <input
                type="number"
                min="0"
                placeholder="Children"
                value={offlineForm.children}
                onChange={(event) =>
                  setOfflineForm((current) => ({ ...current, children: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              />
              <input
                type="number"
                min="0"
                placeholder="Visitors"
                value={offlineForm.visitors}
                onChange={(event) =>
                  setOfflineForm((current) => ({ ...current, visitors: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              />
              <Button
                variant="secondary"
                onClick={() =>
                  offlineMutation.mutate({
                    adults: Number(offlineForm.adults || 0),
                    children: Number(offlineForm.children || 0),
                    visitors: Number(offlineForm.visitors || 0),
                  })
                }
              >
                Update Offline Count
              </Button>
            </div>

            <div className="rounded-[18px] border border-accent/20 bg-accent/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#f3deb0]/75">Combined Total</p>
              <p className="mt-2 text-4xl font-semibold text-white">{combinedTotal}</p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
