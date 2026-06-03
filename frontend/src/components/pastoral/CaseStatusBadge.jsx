import { formatPastoralLabel, getStatusClasses } from '../../utils/pastoral';
import UrgencyIndicator from './UrgencyIndicator';

export default function CaseStatusBadge({ status = 'open', urgency = 'normal' }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusClasses(
          status,
        )}`}
      >
        {formatPastoralLabel(status)}
      </span>
      <UrgencyIndicator urgency={urgency} />
    </div>
  );
}
