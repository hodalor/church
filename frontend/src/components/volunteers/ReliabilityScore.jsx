import { getReliabilityClasses } from '../../utils/volunteers';

export default function ReliabilityScore({ score = 0, size = 'md', showBar = true }) {
  const ringSize = size === 'lg' ? 'h-24 w-24 text-2xl' : 'h-14 w-14 text-sm';
  const percent = Math.max(0, Math.min(Number(score || 0), 100));

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center justify-center rounded-full border-4 ${getReliabilityClasses(
          percent,
        )} ${ringSize}`}
      >
        <span className="font-semibold">{Math.round(percent)}%</span>
      </div>
      {showBar ? (
        <div className="h-2 w-full rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-accent transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
