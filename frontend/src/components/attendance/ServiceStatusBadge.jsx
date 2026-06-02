import { getServiceStatus } from '../../utils/attendance';

export default function ServiceStatusBadge({ checkInOpen, date, status }) {
  const state = getServiceStatus({ checkInOpen, date, status });

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${state.tone}`}
    >
      <span className={`h-2 w-2 rounded-full ${state.dot} ${state.pulse ? 'animate-pulse' : ''}`} />
      {state.label}
    </span>
  );
}
