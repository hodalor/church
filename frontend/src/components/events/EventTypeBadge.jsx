import { formatEventType, getEventTypeClasses } from '../../utils/events';

export default function EventTypeBadge({ type }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getEventTypeClasses(
        type,
      )}`}
    >
      {formatEventType(type)}
    </span>
  );
}
