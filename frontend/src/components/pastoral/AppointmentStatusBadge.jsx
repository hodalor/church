import { formatPastoralLabel, getStatusClasses } from '../../utils/pastoral';

export default function AppointmentStatusBadge({ status = 'scheduled' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusClasses(
        status,
      )}`}
    >
      {formatPastoralLabel(status)}
    </span>
  );
}
