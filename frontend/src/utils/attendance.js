export const serviceTitleSuggestions = [
  'Sunday Morning Service',
  'Midweek Service',
  'Youth Service',
  'Prayer Meeting',
];

export const serviceTypeOptions = [
  'Sunday Service',
  'Midweek Service',
  'Youth Service',
  'Prayer Meeting',
  'Special Event',
  'Online Service',
];

export const attendanceTypeOptions = ['member', 'visitor', 'child', 'online'];
export const attendanceMethodOptions = ['qr', 'manual', 'visitor_form', 'child_check_in', 'online'];
export const reportPeriodOptions = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
];

export const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const heatmapHours = Array.from({ length: 12 }, (_, index) => 6 + index);

export const formatDayDate = (value) => {
  if (!value) {
    return { day: '--', weekday: '' };
  }

  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat('en-US', { day: '2-digit' }).format(date),
    weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
  };
};

export const formatLongDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

export const formatShortDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
};

export const formatTime = (value) => {
  if (!value) {
    return '--:--';
  }

  const baseDate = value.includes('T') ? new Date(value) : new Date(`1970-01-01T${value}`);
  if (Number.isNaN(baseDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(baseDate);
};

export const formatTimeRange = (startTime, endTime) => `${formatTime(startTime)} - ${formatTime(endTime)}`;

export const getServiceStatus = ({ checkInOpen, date, status }) => {
  const now = new Date();
  const serviceDate = date ? new Date(date) : null;

  if (checkInOpen || status === 'open') {
    return {
      label: 'LIVE',
      tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
      dot: 'bg-emerald-400',
      pulse: true,
    };
  }

  if (serviceDate && serviceDate.getTime() > now.getTime()) {
    return {
      label: 'Upcoming',
      tone: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
      dot: 'bg-sky-300',
      pulse: false,
    };
  }

  return {
    label: 'Completed',
    tone: 'bg-white/10 text-white/65 border-white/15',
    dot: 'bg-white/45',
    pulse: false,
  };
};

export const getAttendanceTypeStyles = (type) => {
  switch (String(type || '').toLowerCase()) {
    case 'member':
      return 'bg-[#1E2A4A]/60 text-[#d4def8]';
    case 'visitor':
      return 'bg-[#C9A84C]/20 text-[#f3deb0]';
    case 'child':
      return 'bg-teal-500/15 text-teal-300';
    case 'online':
      return 'bg-white/10 text-white/65';
    default:
      return 'bg-white/10 text-white/65';
  }
};

export const getMethodLabel = (method) =>
  String(method || 'manual')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getInitials = (value) =>
  String(value || 'M')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export const downloadCsv = (filename, headers, rows) => {
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const buildDefaultHeatmap = () =>
  weekDays.flatMap((day, dayIndex) =>
    heatmapHours.map((hour) => ({
      day,
      dayIndex,
      hour,
      value: 0,
    })),
  );
