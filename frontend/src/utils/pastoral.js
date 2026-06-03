import { format as formatDateFns, formatDistanceToNowStrict } from 'date-fns';

export const PASTORAL_VISIBLE_ROLES = [
  'super_admin',
  'head_pastor',
  'associate_pastor',
  'branch_pastor',
  'care_leader',
];

export const CONFIDENTIAL_ACCESS_ROLES = ['super_admin', 'head_pastor', 'associate_pastor'];

export const CARE_CASE_TYPES = [
  'counseling',
  'bereavement',
  'hospital_visit',
  'home_visit',
  'welfare_support',
  'marriage_counseling',
  'addiction_support',
  'spiritual_guidance',
  'discipleship',
  'deliverance',
  'youth_care',
  'family_crisis',
  'other',
];

export const CASE_URGENCY_OPTIONS = ['low', 'normal', 'urgent', 'critical'];
export const CASE_STATUS_OPTIONS = ['open', 'in_progress', 'on_hold', 'resolved', 'closed'];
export const INTERACTION_TYPES = [
  'visit',
  'call',
  'prayer',
  'counseling_session',
  'message',
  'hospital_visit',
  'group_session',
];
export const APPOINTMENT_TYPES = [
  'counseling',
  'pastoral_visit',
  'prayer',
  'discipleship',
  'group_session',
  'other',
];
export const APPOINTMENT_STATUS_OPTIONS = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];
export const DISCIPLESHIP_TARGET_GROUPS = ['new_convert', 'member', 'worker', 'leader', 'all'];
export const DISCIPLESHIP_STEP_TYPES = ['class', 'reading', 'assignment', 'milestone', 'counseling', 'test'];
export const DISCIPLESHIP_STATUS_OPTIONS = ['active', 'completed', 'paused', 'dropped'];
export const WELFARE_SUPPORT_OPTIONS = ['food', 'medical', 'financial', 'clothing', 'housing'];

export const canAccessPastoralUI = (role, hasCapability) => {
  if (role === 'super_admin') {
    return true;
  }

  return PASTORAL_VISIBLE_ROLES.includes(role) && hasCapability?.('pastoral.view');
};

export const canAccessConfidentialNotes = (role) => CONFIDENTIAL_ACCESS_ROLES.includes(role);

export const canCreatePastoralRecords = (role, hasCapability) => {
  if (role === 'super_admin') {
    return true;
  }

  return PASTORAL_VISIBLE_ROLES.includes(role) && hasCapability?.('pastoral.create');
};

export const canManagePastoralRecords = (role, hasCapability) => {
  if (role === 'super_admin') {
    return true;
  }

  return PASTORAL_VISIBLE_ROLES.includes(role) && hasCapability?.('pastoral.modify');
};

export const canSeeTenantWidePastoralData = (role) =>
  ['super_admin', 'head_pastor', 'associate_pastor'].includes(role);

export const formatPastoralLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getUrgencyClasses = (urgency = 'normal') => {
  const normalized = String(urgency || 'normal').toLowerCase();

  return {
    critical: 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
    urgent: 'bg-orange-500/15 text-orange-200 border border-orange-500/30',
    normal: 'bg-sky-500/15 text-sky-200 border border-sky-500/30',
    low: 'bg-slate-500/15 text-slate-200 border border-slate-500/30',
  }[normalized] || 'bg-slate-500/15 text-slate-200 border border-slate-500/30';
};

export const getStatusClasses = (status = 'open') => {
  const normalized = String(status || 'open').toLowerCase();

  return {
    open: 'bg-sky-500/15 text-sky-200 border border-sky-500/30',
    in_progress: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
    on_hold: 'bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/30',
    resolved: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
    closed: 'bg-slate-500/15 text-slate-200 border border-slate-500/30',
    scheduled: 'bg-sky-500/15 text-sky-200 border border-sky-500/30',
    confirmed: 'bg-teal-500/15 text-teal-200 border border-teal-500/30',
    completed: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
    cancelled: 'bg-slate-500/15 text-slate-200 border border-slate-500/30 line-through',
    no_show: 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
    active: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
    paused: 'bg-slate-500/15 text-slate-200 border border-slate-500/30',
    dropped: 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
  }[normalized] || 'bg-slate-500/15 text-slate-200 border border-slate-500/30';
};

export const getDaysOpen = (value) => {
  if (!value) {
    return 0;
  }

  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
};

export const getDaysOpenClasses = (daysOpen) => {
  if (daysOpen > 30) {
    return 'text-rose-300';
  }
  if (daysOpen >= 7) {
    return 'text-amber-300';
  }
  return 'text-emerald-300';
};

export const formatRelativeTime = (value) => {
  if (!value) {
    return 'No recent update';
  }

  try {
    return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
  } catch {
    return 'No recent update';
  }
};

export const formatShortDate = (value, fallback = 'N/A') => {
  if (!value) {
    return fallback;
  }

  try {
    return formatDateFns(new Date(value), 'dd MMM yyyy');
  } catch {
    return fallback;
  }
};

export const formatShortDateTime = (value, fallback = 'N/A') => {
  if (!value) {
    return fallback;
  }

  try {
    return formatDateFns(new Date(value), 'dd MMM yyyy, HH:mm');
  } catch {
    return fallback;
  }
};

export const getLastInteraction = (careCase) => {
  const interactions = Array.isArray(careCase?.interactions) ? [...careCase.interactions] : [];
  return interactions.sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))[0] || null;
};

export const getCaseSearchText = (careCase) =>
  [careCase?.memberName, careCase?.caseId, careCase?.title, careCase?.type, careCase?.assignedToName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

export const getAppointmentTypeColor = (type) => {
  const normalized = String(type || '').toLowerCase();

  return {
    counseling: '#1E2A4A',
    pastoral_visit: '#C9A84C',
    prayer: '#14b8a6',
    discipleship: '#8b5cf6',
    group_session: '#2563eb',
    other: '#64748b',
  }[normalized] || '#64748b';
};

export const normalizeCaseStats = (stats = {}, appointments = {}) => ({
  openCases: stats.open || 0,
  urgentCases: (stats.byUrgency?.urgent || 0) + (stats.byUrgency?.critical || 0),
  todaysAppointments: Array.isArray(appointments.items) ? appointments.items.length : 0,
  activeDiscipleships: stats.discipleshipActive || 0,
});

export const buildMonthlyCaseTrend = (cases = []) => {
  const bucket = new Map();

  cases.forEach((careCase) => {
    const createdAt = new Date(careCase.createdAt || Date.now());
    const key = formatDateFns(createdAt, 'MMM yyyy');
    bucket.set(key, (bucket.get(key) || 0) + 1);
  });

  return [...bucket.entries()].map(([month, total]) => ({ month, total }));
};

export const buildResolutionDistribution = (cases = []) => {
  const ranges = [
    { label: '< 7d', min: 0, max: 6 },
    { label: '7-14d', min: 7, max: 14 },
    { label: '15-30d', min: 15, max: 30 },
    { label: '31+d', min: 31, max: Infinity },
  ];

  return ranges.map((range) => ({
    label: range.label,
    total: cases.filter((careCase) => {
      const resolvedAt = careCase.resolvedAt || careCase.closedAt;
      if (!resolvedAt) {
        return false;
      }

      const age = Math.max(
        0,
        Math.floor((new Date(resolvedAt) - new Date(careCase.createdAt || resolvedAt)) / (1000 * 60 * 60 * 24)),
      );
      return age >= range.min && age <= range.max;
    }).length,
  }));
};
