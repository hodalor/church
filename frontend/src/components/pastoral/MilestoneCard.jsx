import Card from '../ui/Card';
import { formatPastoralLabel, formatShortDate } from '../../utils/pastoral';

export default function MilestoneCard({ milestone }) {
  return (
    <Card className="border-accent/20 bg-[linear-gradient(180deg,rgba(201,168,76,0.1),rgba(13,19,32,1))]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Milestone</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{milestone?.title || 'Untitled milestone'}</h3>
          <p className="mt-1 text-sm text-white/65">{formatPastoralLabel(milestone?.type || 'other')}</p>
        </div>
        <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {formatShortDate(milestone?.date)}
        </span>
      </div>
      {milestone?.notes ? <p className="mt-4 text-sm leading-6 text-white/75">{milestone.notes}</p> : null}
    </Card>
  );
}
