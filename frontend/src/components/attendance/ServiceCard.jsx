import Button from '../ui/Button';
import Card from '../ui/Card';
import ServiceStatusBadge from './ServiceStatusBadge';
import { formatDayDate, formatTimeRange } from '../../utils/attendance';

export default function ServiceCard({
  service,
  onOpenCheckIn,
  onView,
  onEdit,
  onDelete,
  canOpenCheckIn = true,
  canEdit = true,
  canDelete = true,
}) {
  const serviceId = service.serviceId || service._id;
  const dateBits = formatDayDate(service.date || service.serviceDate);
  const stats = service.stats || {};

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold leading-none text-white">{dateBits.day}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">
            {dateBits.weekday}
          </p>
        </div>
        <ServiceStatusBadge
          checkInOpen={service.checkInOpen}
          date={service.date || service.serviceDate}
          status={service.status}
        />
      </div>

      <div>
        <p className="text-lg font-semibold text-white">{service.title || 'Service'}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f3deb0]">
            {service.type || 'General'}
          </span>
          <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
            {service.branch || 'Main Branch'}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm text-white/60">
        <p>{formatTimeRange(service.startTime, service.endTime)}</p>
        <p>{service.location || 'Main Auditorium'}</p>
      </div>

      {stats.total || stats.firstTimers ? (
        <div className="grid grid-cols-2 gap-3 rounded-[18px] border border-white/8 bg-[#101827] p-3 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Count</p>
            <p className="mt-1 text-xl font-semibold text-white">{stats.total || 0}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">First Timers</p>
            <p className="mt-1 text-xl font-semibold text-[#f3deb0]">{stats.firstTimers || 0}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="subtle" onClick={() => onView?.(serviceId)}>
          View
        </Button>
        {canOpenCheckIn ? (
          <Button variant="secondary" onClick={() => onOpenCheckIn?.(serviceId)}>
            Check-in
          </Button>
        ) : null}
        {canEdit ? (
          <Button variant="ghost" onClick={() => onEdit?.(serviceId)}>
            Edit
          </Button>
        ) : null}
        {canDelete ? (
          <Button variant="ghost" onClick={() => onDelete?.(serviceId)}>
            Delete
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
