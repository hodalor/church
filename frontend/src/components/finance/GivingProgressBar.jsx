export default function GivingProgressBar({ current = 0, target = 0, label }) {
  const safeTarget = Number(target || 0);
  const percentage = safeTarget > 0 ? Math.round((Number(current || 0) / safeTarget) * 100) : 0;
  const toneClass =
    percentage > 100
      ? 'bg-red-500'
      : percentage >= 80
        ? 'bg-accent'
        : 'bg-emerald-500';

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium text-white/75">{label}</p> : null}
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-white/55">
        <span>{Number(current || 0).toLocaleString()}</span>
        <span>{percentage}%</span>
        <span>{Number(target || 0).toLocaleString()}</span>
      </div>
    </div>
  );
}
