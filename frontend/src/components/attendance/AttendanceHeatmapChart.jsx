import { buildDefaultHeatmap, heatmapHours, weekDays } from '../../utils/attendance';

const getFill = (value, maxValue) => {
  if (!value) {
    return 'rgba(255,255,255,0.06)';
  }

  const ratio = maxValue ? value / maxValue : 0;
  if (ratio > 0.75) {
    return '#1E2A4A';
  }
  if (ratio > 0.45) {
    return '#8d7441';
  }
  return '#C9A84C';
};

export default function AttendanceHeatmapChart({ data = [] }) {
  const points = data.length ? data : buildDefaultHeatmap();
  const maxValue = Math.max(...points.map((item) => Number(item.value || 0)), 0);
  const cellWidth = 42;
  const cellHeight = 28;
  const paddingLeft = 58;
  const paddingTop = 24;
  const width = paddingLeft + heatmapHours.length * cellWidth + 10;
  const height = paddingTop + weekDays.length * cellHeight + 10;

  return (
    <div className="overflow-x-auto rounded-[18px] border border-white/10 bg-[#0b1120] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[620px]">
        {heatmapHours.map((hour, index) => (
          <text
            key={hour}
            x={paddingLeft + index * cellWidth + 14}
            y={16}
            fontSize="11"
            fill="rgba(255,255,255,0.5)"
          >
            {hour}:00
          </text>
        ))}
        {weekDays.map((day, dayIndex) => (
          <text
            key={day}
            x={0}
            y={paddingTop + dayIndex * cellHeight + 18}
            fontSize="12"
            fill="rgba(255,255,255,0.65)"
          >
            {day}
          </text>
        ))}
        {points.map((point) => (
          <g key={`${point.dayIndex}-${point.hour}`}>
            <rect
              x={paddingLeft + heatmapHours.indexOf(point.hour) * cellWidth}
              y={paddingTop + point.dayIndex * cellHeight}
              width={32}
              height={20}
              rx={6}
              fill={getFill(Number(point.value || 0), maxValue)}
              opacity="0.95"
            />
            <title>{`${point.day} ${point.hour}:00 - ${point.value || 0} avg attendance`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
