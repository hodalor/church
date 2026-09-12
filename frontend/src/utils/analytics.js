import { format, formatDistanceToNowStrict } from 'date-fns';

export const PERIOD_OPTIONS = [
  { label: 'This Week', value: 'weekly' },
  { label: 'This Month', value: 'monthly' },
  { label: 'This Quarter', value: 'quarterly' },
  { label: 'This Year', value: 'yearly' },
];

export const HEALTH_GRADE_STYLES = {
  A: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  B: 'border-teal-200 bg-teal-50 text-teal-700',
  C: 'border-amber-200 bg-amber-50 text-amber-700',
  D: 'border-orange-200 bg-orange-50 text-orange-700',
  F: 'border-rose-200 bg-rose-50 text-rose-700',
};

export const SEVERITY_STYLES = {
  critical: {
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    icon: '🔴',
  },
  warning: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: '🟡',
  },
  info: {
    border: 'border-sky-200',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    icon: '🔵',
  },
};

export const TREND_STYLES = {
  up: { icon: '↑', color: 'text-emerald-300' },
  improving: { icon: '↑', color: 'text-emerald-300' },
  down: { icon: '↓', color: 'text-rose-300' },
  declining: { icon: '↓', color: 'text-rose-300' },
  stable: { icon: '→', color: 'text-slate-500' },
};

export const formatAnalyticsNumber = (value, options = {}) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  }).format(Number(value || 0));

export const formatAnalyticsPercent = (value, digits = 1) =>
  `${Number(value || 0).toFixed(digits)}%`;

export const formatAnalyticsCurrency = (value, currencyCode = 'USD', currencySymbol = '$') => {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencySymbol}${formatAnalyticsNumber(amount)}`;
  }
};

export const getTrendMeta = (trend = 'stable') => TREND_STYLES[trend] || TREND_STYLES.stable;
export const getSeverityMeta = (severity = 'info') => SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;
export const getHealthGradeClassName = (grade = 'C') =>
  HEALTH_GRADE_STYLES[grade] || HEALTH_GRADE_STYLES.C;

export const formatBranchHealthGrade = (grade = 'C') => String(grade || 'C').toUpperCase();

export const formatDateTime = (value, formatString = 'PPP p') => {
  if (!value) return 'N/A';
  try {
    return format(new Date(value), formatString);
  } catch {
    return 'N/A';
  }
};

export const formatTimeAgo = (value) => {
  if (!value) return 'just now';
  try {
    return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
  } catch {
    return 'just now';
  }
};

export const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildKpiChange = (metric = {}) => ({
  value: Number(metric.value || 0),
  percent: Number(metric.percent || 0),
  trend: metric.trend || 'stable',
});

export const clamp = (value, min = 0, max = 100) =>
  Math.min(Math.max(Number(value || 0), min), max);

export const buildSparklineSeries = (items = [], key) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    index: index + 1,
    value: Number(item?.[key] || 0),
    label: item?.month || item?.label || `P${index + 1}`,
  }));

export const toTitleCase = (value = '') =>
  String(value)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
