export default function FunnelChart({ stages = [] }) {
  const width = 620;
  const height = Math.max(240, stages.length * 66);
  const maxWidth = width - 40;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0b1120] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px]">
        {stages.map((stage, index) => {
          const topWidth = maxWidth - index * 54;
          const bottomWidth = maxWidth - (index + 1) * 54;
          const safeBottomWidth = Math.max(bottomWidth, 180);
          const y = 20 + index * 60;
          const xTop = (width - topWidth) / 2;
          const xBottom = (width - safeBottomWidth) / 2;
          const fill = ['#94A3B8', '#60A5FA', '#2DD4BF', '#A78BFA', '#F6C453', '#34D399', '#FB7185', '#EF4444'][index % 8];

          const path = [
            `M ${xTop} ${y}`,
            `L ${xTop + topWidth} ${y}`,
            `L ${xBottom + safeBottomWidth} ${y + 42}`,
            `L ${xBottom} ${y + 42}`,
            'Z',
          ].join(' ');

          return (
            <g key={stage.label}>
              <path d={path} fill={fill} opacity="0.88" />
              <text x={width / 2} y={y + 17} fill="#08101b" textAnchor="middle" fontSize="13" fontWeight="700">
                {stage.label}
              </text>
              <text x={width / 2} y={y + 31} fill="#08101b" textAnchor="middle" fontSize="12">
                {stage.count} visitors • {stage.percentage}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
