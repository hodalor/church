import { formatRelativeTime, formatShortDateTime, formatPastoralLabel } from '../../utils/pastoral';
import ConfidentialNotesBox from './ConfidentialNotesBox';

export default function InteractionTimelineItem({ interaction, hasConfidentialAccess, onEdit }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">{formatPastoralLabel(interaction?.type)}</p>
          <h4 className="mt-2 text-sm font-semibold text-white">{interaction?.conductedByName || 'Pastoral Team'}</h4>
          <p className="mt-1 text-xs text-white/45">
            {formatShortDateTime(interaction?.date)}
            {interaction?.duration ? ` | ${interaction.duration} mins` : ''}
            {interaction?.location ? ` | ${interaction.location}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/45">
          <span>{formatRelativeTime(interaction?.date)}</span>
          {onEdit ? (
            <button type="button" onClick={onEdit} className="font-semibold text-accent hover:text-white">
              Edit
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/80">
        {interaction?.summary || 'No summary recorded.'}
      </p>

      <div className="mt-4">
        <ConfidentialNotesBox notes={interaction?.confidentialNotes} hasAccess={hasConfidentialAccess} />
      </div>

      {interaction?.nextSteps || interaction?.nextFollowUpDate ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Next Steps</p>
            <p className="mt-2 text-sm text-white/75">{interaction?.nextSteps || 'No next steps recorded.'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Next Follow-up</p>
            <p className="mt-2 text-sm text-white/75">
              {formatShortDateTime(interaction?.nextFollowUpDate, 'Not scheduled')}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
