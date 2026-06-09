import { badgeMeta, formatVolunteerBadge } from '../../utils/volunteers';

export default function BadgeChip({ badge, dateLabel }) {
  const meta = badgeMeta[badge] || { label: formatVolunteerBadge(badge), icon: 'BG' };

  return (
    <span
      title={dateLabel ? `${meta.label} • ${dateLabel}` : meta.label}
      className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[10px]">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}
