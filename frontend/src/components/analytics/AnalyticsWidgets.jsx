import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import {
  formatAnalyticsCurrency,
  formatAnalyticsNumber,
  formatAnalyticsPercent,
  formatBranchHealthGrade,
  formatTimeAgo,
  getHealthGradeClassName,
  getSeverityMeta,
  getTrendMeta,
  toTitleCase,
} from '../../utils/analytics';

const KPI_CARD_THEMES = {
  default: {
    shell:
      'border-white/8 bg-[linear-gradient(135deg,rgba(17,26,42,0.98),rgba(10,15,26,0.94))] hover:border-accent/25 hover:bg-[linear-gradient(135deg,rgba(22,33,55,0.98),rgba(12,18,30,0.94))]',
    glow: 'bg-accent/20',
    chip: 'border-white/10 bg-white/6 text-white/65',
    value: 'text-white',
  },
  gold: {
    shell:
      'border-[#f0c96a]/30 bg-[linear-gradient(135deg,rgba(201,168,76,0.22),rgba(17,24,39,0.96))] hover:border-[#f0c96a]/55',
    glow: 'bg-[#f0c96a]/30',
    chip: 'border-[#f0c96a]/30 bg-[#f0c96a]/12 text-[#f4d98c]',
    value: 'text-[#fff0bf]',
  },
  blue: {
    shell:
      'border-sky-400/25 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(12,20,36,0.96))] hover:border-sky-300/50',
    glow: 'bg-sky-400/30',
    chip: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
    value: 'text-sky-100',
  },
  emerald: {
    shell:
      'border-emerald-400/25 bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(10,22,24,0.96))] hover:border-emerald-300/50',
    glow: 'bg-emerald-400/30',
    chip: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
    value: 'text-emerald-100',
  },
  violet: {
    shell:
      'border-violet-400/25 bg-[linear-gradient(135deg,rgba(167,139,250,0.18),rgba(18,14,32,0.96))] hover:border-violet-300/50',
    glow: 'bg-violet-400/30',
    chip: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
    value: 'text-violet-100',
  },
  rose: {
    shell:
      'border-rose-400/25 bg-[linear-gradient(135deg,rgba(251,113,133,0.16),rgba(28,12,20,0.96))] hover:border-rose-300/50',
    glow: 'bg-rose-400/30',
    chip: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
    value: 'text-rose-100',
  },
  cyan: {
    shell:
      'border-cyan-400/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.15),rgba(8,22,28,0.96))] hover:border-cyan-300/50',
    glow: 'bg-cyan-400/30',
    chip: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200',
    value: 'text-cyan-100',
  },
};

export function AnalyticsPage({ title, subtitle, action, children }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Prynova Intelligence</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function AnalyticsSection({ title, subtitle, action, children, className = '' }) {
  return (
    <Card className={className}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-white/58">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function TrendPill({ trend = 'stable', value = 0 }) {
  const meta = getTrendMeta(trend);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-xs font-semibold ${meta.color}`}
    >
      <span>{meta.icon}</span>
      <span>{formatAnalyticsPercent(Math.abs(value || 0))}</span>
    </span>
  );
}

export function KpiCard({ label, value, change, helper, to, tone = 'default', compact = false }) {
  const theme = KPI_CARD_THEMES[tone] || KPI_CARD_THEMES.default;
  const content = (
    <div
      className={`relative overflow-hidden rounded-[20px] border transition ${compact ? 'p-3.5' : 'p-4'} ${theme.shell}`}
    >
      <div className={`absolute right-[-20px] top-[-26px] h-20 w-20 rounded-full blur-2xl ${theme.glow}`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <p className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${theme.chip}`}>
            {label}
          </p>
          {change ? <TrendPill trend={change.trend} value={change.percent} /> : null}
        </div>
        <div className={`${compact ? 'mt-3' : 'mt-4'} flex items-end justify-between gap-3`}>
          <h3 className={`${compact ? 'text-[1.6rem]' : 'text-3xl'} font-semibold ${theme.value}`}>{value}</h3>
        </div>
      </div>
      {helper ? <p className={`${compact ? 'mt-2.5' : 'mt-3'} text-sm text-white/62`}>{helper}</p> : null}
    </div>
  );

  return to ? (
    <Link to={to} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export function HealthBadge({ grade = 'C', score }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${getHealthGradeClassName(
        grade,
      )}`}
    >
      <span>{formatBranchHealthGrade(grade)}</span>
      {score !== undefined ? <span className="text-white/65">{formatAnalyticsNumber(score)}</span> : null}
    </span>
  );
}

export function FilterTabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            value === tab.value
              ? 'border-accent bg-accent/15 text-accent'
              : 'border-white/10 bg-white/[0.03] text-white/62 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function ChartPanel({ title, subtitle, children, className = '' }) {
  return (
    <Card className={className}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {subtitle ? <p className="mt-2 text-sm text-white/58">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function InsightCard({ insight, onRead, onAction, readLabel = 'Mark as Read', actionLabel = 'Action Taken' }) {
  const [expanded, setExpanded] = useState(false);
  const severity = getSeverityMeta(insight?.severity);
  const message = String(insight?.message || '');

  return (
    <div className={`rounded-[22px] border-l-4 border px-4 py-4 ${severity.border} ${severity.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/55">
            <span>{severity.icon}</span>
            <span>{toTitleCase(insight?.type || 'insight')}</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-white">{insight?.title || 'Untitled insight'}</h3>
          <p className="mt-2 text-sm leading-6 text-white/72">
            {expanded ? message : `${message.slice(0, 120)}${message.length > 120 ? '...' : ''}`}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-white/55 transition hover:text-white"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && insight?.recommendations?.length ? (
        <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-[#09101c] p-3">
          {insight.recommendations.map((item, index) => (
            <p key={`${item}-${index}`} className="text-sm text-white/70">
              {index + 1}. {item}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/45">{formatTimeAgo(insight?.createdAt)}</p>
        <div className="flex flex-wrap gap-2">
          {onRead ? (
            <Button variant="ghost" className="text-xs" onClick={() => onRead(insight)}>
              {readLabel}
            </Button>
          ) : null}
          {onAction ? (
            <Button variant="secondary" className="text-xs" onClick={() => onAction(insight)}>
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MiniLine({ data, dataKey = 'value', stroke = '#C9A84C', heightClass = 'h-20' }) {
  if (!Array.isArray(data) || !data.length) {
    return <EmptyState className="py-6" icon="~" title="No trend yet" message="Trend data will appear here when records are available." />;
  }

  return (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }} />
          <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniBar({ data, dataKey = 'value', color = '#1E2A4A', heightClass = 'h-24' }) {
  if (!Array.isArray(data) || !data.length) {
    return <EmptyState className="py-6" icon="~" title="No distribution yet" message="Data will render here once enough records are available." />;
  }

  return (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis hide dataKey="label" />
          <YAxis hide />
          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }} />
          <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SummaryList({ items = [], formatter = (item) => item }) {
  if (!items.length) {
    return <EmptyState className="py-8" icon="i" title="No records yet" message="There is nothing to show for this section right now." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item?.id || item?._id || index}>{formatter(item, index)}</div>
      ))}
    </div>
  );
}

export function RefreshPill({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65 transition hover:text-white"
    >
      <RefreshCcw className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

export function MetricGrid({ items, currencyCode = 'USD', currencySymbol = '$' }) {
  const prepared = useMemo(() => items || [], [items]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {prepared.map((item) => {
        const value =
          item.type === 'currency'
            ? formatAnalyticsCurrency(item.value, currencyCode, currencySymbol)
            : item.type === 'percent'
              ? formatAnalyticsPercent(item.value)
              : formatAnalyticsNumber(item.value);

        return (
          <KpiCard
            key={item.label}
            label={item.label}
            value={value}
            change={item.change}
            helper={item.helper}
            to={item.to}
          />
        );
      })}
    </div>
  );
}

export function ActionLink({ to, label = 'Open' }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 text-sm font-medium text-accent transition hover:text-[#e3c77f]">
      <span>{label}</span>
      <ExternalLink className="h-4 w-4" />
    </Link>
  );
}
