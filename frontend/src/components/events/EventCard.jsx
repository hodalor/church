import { Link } from 'react-router-dom';
import CountdownTimer from './CountdownTimer';
import EventTypeBadge from './EventTypeBadge';
import { getEventStatusClasses } from '../../utils/events';

export default function EventCard({ event, to }) {
  const registeredCount = Number(event.registeredCount || 0);
  const maxAttendees = Number(event.maxAttendees || 0);
  const fill = maxAttendees > 0 ? Math.min((registeredCount / maxAttendees) * 100, 100) : 0;

  return (
    <Link
      to={to || `/events/${event.eventId || event._id}`}
      className="block overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(13,19,32,0.98))] shadow-[0_14px_32px_rgba(0,0,0,0.16)] transition hover:border-cyan-300/25"
    >
      {event.bannerUrl ? (
        <img src={event.bannerUrl} alt={event.title} className="h-44 w-full object-cover" />
      ) : (
        <div className="h-44 bg-[linear-gradient(135deg,#1E2A4A_0%,rgba(201,168,76,0.7)_100%)]" />
      )}
      <div className="space-y-3.5 p-3.5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold">{event.title}</p>
            <p className="mt-1 text-sm text-white/55">
              {new Date(event.startDate).toLocaleDateString()} • {event.venue || event.branch || 'Venue TBD'}
            </p>
          </div>
          <EventTypeBadge type={event.type} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getEventStatusClasses(
              event.status,
            )}`}
          >
            {String(event.status || 'draft').replaceAll('_', ' ')}
          </span>
          <CountdownTimer targetDate={event.startDate} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>Registered</span>
            <span>
              {registeredCount}
              {maxAttendees > 0 ? ` / ${maxAttendees}` : ''}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${fill}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
