import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import ServiceCard from '../../components/attendance/ServiceCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import { deleteService, getServices } from '../../api/endpoints/attendance';
import useAttendanceAccess from '../../hooks/useAttendanceAccess';

const tabs = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'All', value: 'all' },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canViewServices, canCreateServices, canCheckInServices, canModifyServices, canDeleteServices } =
    useAttendanceAccess();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') || 1);
  const tab = searchParams.get('tab') || 'upcoming';
  const type = searchParams.get('type') || '';
  const branch = searchParams.get('branch') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const tenantId = searchParams.get('tenantId') || '';

  const servicesQuery = useQuery({
    queryKey: ['attendance-services', page, tab, type, branch, from, to, tenantId],
    queryFn: () =>
      getServices({
        page,
        limit: 9,
        status: tab === 'all' ? undefined : tab,
        type: type || undefined,
        branch: branch || undefined,
        from: from || undefined,
        to: to || undefined,
        tenantId: tenantId || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-services'] }),
  });

  const services = servicesQuery.data?.items || servicesQuery.data?.services || [];

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

  if (!canViewServices) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm uppercase tracking-[0.22em] text-accent">Attendance</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm text-white/60">
            Your account does not currently have access to attendance services.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Services"
          subtitle="Create services, open check-in, and review attendance outcomes across branches."
          action={
            canCreateServices ? (
              <Link to="/attendance/services/new">
                <Button variant="secondary">+ Create Service</Button>
              </Link>
            ) : null
          }
        />

        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => updateParam('tab', item.value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                tab === item.value
                  ? 'bg-accent text-primary'
                  : 'border border-white/10 bg-white/5 text-white/65'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <Card className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Service Type</span>
              <input
                value={type}
                onChange={(event) => updateParam('type', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                placeholder="Sunday Service"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Branch</span>
              <input
                value={branch}
                onChange={(event) => updateParam('branch', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
                placeholder="Main branch"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">From</span>
              <input
                type="date"
                value={from}
                onChange={(event) => updateParam('from', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">To</span>
              <input
                type="date"
                value={to}
                onChange={(event) => updateParam('to', event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white"
              />
            </label>
          </div>
        </Card>

        {services.length ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.serviceId || service._id}
                service={service}
                onView={(serviceId) => navigate(`/attendance/services/${serviceId}`)}
                onOpenCheckIn={(serviceId) => navigate(`/attendance/check-in/${serviceId}`)}
                onEdit={(serviceId) => navigate(`/attendance/services/new?serviceId=${serviceId}`)}
                onDelete={(serviceId) => {
                  if (window.confirm('Delete this service?')) {
                    deleteMutation.mutate(serviceId);
                  }
                }}
                canOpenCheckIn={canCheckInServices}
                canEdit={canModifyServices}
                canDelete={canDeleteServices}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-lg font-semibold text-white">No services found</p>
            <p className="mt-2 text-sm text-white/55">
              Adjust your filters or create a new service to begin attendance tracking.
            </p>
          </Card>
        )}

        <Pagination
          currentPage={servicesQuery.data?.page || 1}
          totalPages={servicesQuery.data?.totalPages || 1}
          onPageChange={(nextPage) => updateParam('page', String(nextPage))}
        />
      </div>
    </AppShell>
  );
}
