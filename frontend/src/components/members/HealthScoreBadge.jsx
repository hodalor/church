const statusLabels = {
  active: 'Active',
  at_risk: 'At Risk',
  drifting: 'Drifting',
  inactive: 'Inactive',
  new: 'New',
};

const toneClasses = {
  active: 'bg-emerald-100 text-emerald-700',
  at_risk: 'bg-rose-100 text-rose-700',
  drifting: 'bg-amber-100 text-amber-700',
  inactive: 'bg-slate-100 text-slate-700',
  new: 'bg-sky-100 text-sky-700',
};

export default function HealthScoreBadge({ status = 'new', score = 0 }) {
  const normalizedStatus = statusLabels[status] ? status : 'new';
  const label = statusLabels[normalizedStatus];
  const toneClass = toneClasses[normalizedStatus];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}
      title={`Health score: ${score}`}
    >
      {label}
    </span>
  );
}
