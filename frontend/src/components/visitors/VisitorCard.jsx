import { GripVertical, Phone, MoreHorizontal } from 'lucide-react';
import Button from '../ui/Button';
import PipelineStageBadge from './PipelineStageBadge';
import FollowUpStatusIndicator from './FollowUpStatusIndicator';

export default function VisitorCard({
  visitor,
  dragHandleProps = {},
  onView,
  onCompleteFollowUp,
  onConvert,
  canDrag = true,
  canOpenFollowUp = true,
  canConvert = true,
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0b1120] p-3 shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {visitor.photoUrl ? (
            <img src={visitor.photoUrl} alt={visitor.fullName} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
              {(visitor.fullName || 'V').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{visitor.fullName}</p>
            <p className="text-xs text-white/45">Day {visitor.daysInCurrentStage}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDrag ? (
            <button
              type="button"
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/55"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : null}
          <MoreHorizontal className="h-4 w-4 text-white/35" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PipelineStageBadge stage={visitor.stage} />
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
          {visitor.totalVisits} Visits
        </span>
      </div>

      <a href={visitor.phone ? `tel:${visitor.phone}` : '#'} className="inline-flex items-center gap-2 text-sm text-white/70">
        <Phone className="h-3.5 w-3.5 text-accent" />
        {visitor.phone || 'No phone'}
      </a>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/40">Assigned To</p>
          <p className="text-sm font-medium text-white/75">{visitor.assignedTo?.name || 'Unassigned'}</p>
        </div>
        <FollowUpStatusIndicator followUps={visitor.followUps} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="subtle" className="px-2 py-2 text-xs" onClick={() => onView?.(visitor)}>
          View
        </Button>
        {canOpenFollowUp ? (
          <Button variant="ghost" className="px-2 py-2 text-xs" onClick={() => onCompleteFollowUp?.(visitor)}>
            Follow-up
          </Button>
        ) : (
          <div />
        )}
        {canConvert ? (
          <Button variant="secondary" className="px-2 py-2 text-xs" onClick={() => onConvert?.(visitor)}>
            Convert
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
