import { formatPastoralLabel, getUrgencyClasses } from '../../utils/pastoral';

export default function UrgencyIndicator({ urgency = 'normal', showLabel = true }) {
  const dotClasses = {
    critical: 'bg-rose-400 animate-pulse',
    urgent: 'bg-orange-400',
    normal: 'bg-sky-400',
    low: 'bg-slate-400',
  }[String(urgency || 'normal').toLowerCase()] || 'bg-slate-400';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getUrgencyClasses(
        urgency,
      )}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotClasses}`} />
      {showLabel ? formatPastoralLabel(urgency) : null}
    </span>
  );
}
