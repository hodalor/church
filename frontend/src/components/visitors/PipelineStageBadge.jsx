import { CheckCircle2, CircleDot, Phone, TrendingUp, UserPlus, UserRoundCheck, UserRoundX, Users } from 'lucide-react';
import { getStageMeta } from '../../utils/visitors';

const icons = {
  new_visitor: UserPlus,
  contacted: Phone,
  second_visit: Users,
  connected: CircleDot,
  assimilated: TrendingUp,
  converted: CheckCircle2,
  inactive: UserRoundX,
  lost: UserRoundX,
};

export default function PipelineStageBadge({ stage, className = '', large = false }) {
  const meta = getStageMeta(stage);
  const Icon = icons[stage] || UserRoundCheck;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold uppercase tracking-[0.18em] ${large ? 'text-xs' : 'text-[11px]'} ${meta.badgeClassName} ${className}`}
    >
      <Icon className={large ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      {meta.label}
    </span>
  );
}
