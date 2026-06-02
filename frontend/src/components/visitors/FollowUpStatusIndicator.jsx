import { Clock3, Dot, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { getFollowUpStatus, getNextPendingFollowUp, getLastCompletedFollowUp } from '../../utils/visitors';

export default function FollowUpStatusIndicator({ followUps = [], className = '' }) {
  const status = getFollowUpStatus(followUps);
  const nextFollowUp = getNextPendingFollowUp(followUps);
  const lastCompleted = getLastCompletedFollowUp(followUps);

  const meta = {
    upcoming: {
      dotClassName: 'bg-emerald-400 shadow-[0_0_0_4px_rgba(74,222,128,0.12)]',
      label: nextFollowUp ? `Next ${formatDate(nextFollowUp.scheduledDate)}` : 'Upcoming follow-up',
      Icon: Clock3,
    },
    overdue: {
      dotClassName: 'bg-rose-400 shadow-[0_0_0_4px_rgba(251,113,133,0.12)]',
      label: nextFollowUp ? `Overdue since ${formatDate(nextFollowUp.scheduledDate)}` : 'Overdue follow-up',
      Icon: AlertCircle,
    },
    none: {
      dotClassName: 'bg-white/30',
      label: lastCompleted ? `Last completed ${formatDate(lastCompleted.completedAt || lastCompleted.scheduledDate)}` : 'No follow-up yet',
      Icon: Dot,
    },
  }[status];

  const Icon = meta.Icon;

  return (
    <div className={`inline-flex items-center gap-2 text-xs text-white/65 ${className}`} title={meta.label}>
      <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClassName}`} />
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}
