const STATUS_COLORS = {
  active: '#C9A84C',
  completed: '#10b981',
  paused: '#94a3b8',
  dropped: '#f43f5e',
};

export default function DiscipleshipProgressRing({ percent = 0, status = 'active', size = 84 }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));
  const dashOffset = circumference - (safePercent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={STATUS_COLORS[status] || STATUS_COLORS.active}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-semibold text-white">{safePercent}%</p>
      </div>
    </div>
  );
}
