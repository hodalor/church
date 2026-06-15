import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import { getUsers } from '../../api/endpoints/users';
import {
  activatePlan,
  autoRefreshKPIs,
  createKPI,
  createStrategicPlan,
  deactivateKPI,
  getAllKPIs,
  getBalancedScorecard,
  getScorecardReport,
  getStrategicDashboard,
  getStrategicPlan,
  recordKPIValue,
  updateStrategicPlan,
} from '../../api/endpoints/strategic';
import { downloadCsvFile, downloadJsonFile } from '../../utils/exportData';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const planSchema = z.object({
  title: z.string().min(2, 'Plan title is required.'),
  visionStatement: z.string().optional(),
  missionStatement: z.string().optional(),
  startYear: z.coerce.number().min(2000, 'Start year is required.'),
  endYear: z.coerce.number().min(2000, 'End year is required.'),
});

const kpiSchema = z.object({
  name: z.string().min(2, 'KPI name is required.'),
  description: z.string().optional(),
  pillar: z.string().min(1, 'Pillar is required.'),
  focusArea: z.string().optional(),
  objective: z.string().optional(),
  unit: z.string().min(1, 'Unit is required.'),
  annualTarget: z.coerce.number().min(0, 'Target is required.'),
  q1Target: z.coerce.number().optional(),
  q2Target: z.coerce.number().optional(),
  q3Target: z.coerce.number().optional(),
  q4Target: z.coerce.number().optional(),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  dataSource: z.string().optional(),
  frequency: z.string().optional(),
  autoSplitTargets: z.boolean().default(true),
});

const valueEntrySchema = z.object({
  value: z.coerce.number().min(0, 'Value is required.'),
  period: z.string().min(1, 'Period is required.'),
  notes: z.string().optional(),
});

const iconOptions = ['target', 'cross', 'heart', 'users', 'globe', 'book', 'star', 'shield'];
const pillarPalette = ['#C9A84C', '#1E2A4A', '#0F766E', '#7C3AED', '#BE123C', '#2563EB', '#0F766E', '#A16207'];
const emptyArray = [];

const statusMeta = {
  on_track: {
    label: 'On Track',
    className: 'bg-emerald-500/15 text-emerald-200',
    color: '#22C55E',
  },
  at_risk: {
    label: 'At Risk',
    className: 'bg-amber-500/15 text-amber-100',
    color: '#F59E0B',
  },
  off_track: {
    label: 'Off Track',
    className: 'bg-rose-500/15 text-rose-100',
    color: '#EF4444',
  },
  exceeded: {
    label: 'Exceeded',
    className: 'bg-amber-400/20 text-amber-100',
    color: '#C9A84C',
  },
};

const uid = () => Math.random().toString(36).slice(2, 10);

const createObjective = (value = '') => ({ id: uid(), value });
const createFocusArea = () => ({ id: uid(), name: '', objectives: [createObjective()] });
const createPillar = (index = 0) => ({
  id: uid(),
  name: '',
  description: '',
  color: pillarPalette[index % pillarPalette.length],
  icon: iconOptions[index % iconOptions.length],
  focusAreas: [createFocusArea()],
});

const formatLabel = (value) =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const formatDate = (value) => {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }
  return parsed.toLocaleDateString();
};

const getStatusMeta = (status, progress = 0) => {
  if (progress > 100) {
    return statusMeta.exceeded;
  }
  return statusMeta[status] || {
    label: formatLabel(status),
    className: 'bg-white/10 text-white/75',
    color: '#94A3B8',
  };
};

const encodeBlueprintEntry = (entry) => JSON.stringify(entry);

const decodeBlueprintEntry = (entry) => {
  try {
    return JSON.parse(entry);
  } catch {
    return null;
  }
};

const buildPillarBlueprint = (pillars = []) =>
  pillars.flatMap((pillar) =>
    (pillar.focusAreas || []).flatMap((area) =>
      (area.objectives || [])
        .map((objective) => objective.value?.trim())
        .filter(Boolean)
        .map((objective) =>
          encodeBlueprintEntry({
            pillarName: pillar.name?.trim(),
            pillarDescription: pillar.description?.trim(),
            pillarColor: pillar.color,
            pillarIcon: pillar.icon,
            focusAreaName: area.name?.trim(),
            objective,
          }),
        ),
    ),
  );

const parsePillarBlueprint = (focusAreas = []) => {
  const grouped = new Map();

  focusAreas
    .map((item) => decodeBlueprintEntry(item))
    .filter(Boolean)
    .forEach((entry) => {
      const pillarKey = entry.pillarName || 'Unassigned';
      if (!grouped.has(pillarKey)) {
        grouped.set(pillarKey, {
          id: uid(),
          name: entry.pillarName || '',
          description: entry.pillarDescription || '',
          color: entry.pillarColor || pillarPalette[grouped.size % pillarPalette.length],
          icon: entry.pillarIcon || iconOptions[grouped.size % iconOptions.length],
          focusAreas: [],
        });
      }

      const pillar = grouped.get(pillarKey);
      const areaKey = entry.focusAreaName || 'General';
      let area = pillar.focusAreas.find((item) => item.name === areaKey);
      if (!area) {
        area = { id: uid(), name: areaKey, objectives: [] };
        pillar.focusAreas.push(area);
      }

      if (!area.objectives.some((item) => item.value === entry.objective)) {
        area.objectives.push(createObjective(entry.objective));
      }
    });

  return grouped.size ? [...grouped.values()] : [createPillar(0)];
};

const getPlanYears = (plan) => {
  const start = plan?.periodStart ? new Date(plan.periodStart).getFullYear() : '';
  const end = plan?.periodEnd ? new Date(plan.periodEnd).getFullYear() : '';
  return start && end ? `${start} - ${end}` : 'Years pending';
};

const getProgress = (kpi) => {
  const target = Number(kpi?.targetValue || 0);
  const current = Number(kpi?.currentValue || 0);
  if (!target) {
    return 0;
  }
  return Math.max(0, (current / target) * 100);
};

const getScoreFromKpis = (kpis = []) => {
  if (!kpis.length) {
    return 0;
  }
  return (
    kpis.reduce((sum, item) => sum + Math.min(getProgress(item), 100), 0) / kpis.length
  );
};

const derivePillars = (plan, kpis = []) => {
  const blueprint = parsePillarBlueprint(plan?.focusAreas || []);
  const usedNames = new Set();
  const pillars = blueprint.map((pillar, index) => {
    usedNames.add(pillar.name);
    const items = kpis.filter((kpi) => (kpi.category || 'Unassigned') === pillar.name);
    const score = getScoreFromKpis(items);
    return {
      ...pillar,
      score,
      kpis: items,
      onTrack: items.filter((item) => item.status === 'on_track').length,
      atRisk: items.filter((item) => item.status === 'at_risk').length,
      offTrack: items.filter((item) => item.status === 'off_track').length,
      index,
    };
  });

  kpis
    .filter((kpi) => !usedNames.has(kpi.category || ''))
    .reduce((accumulator, kpi) => {
      const key = kpi.category || 'Unassigned';
      if (!accumulator.has(key)) {
        accumulator.set(key, {
          id: uid(),
          name: key,
          description: '',
          color: pillarPalette[pillars.length % pillarPalette.length],
          icon: iconOptions[pillars.length % iconOptions.length],
          focusAreas: [],
          score: 0,
          kpis: [],
          onTrack: 0,
          atRisk: 0,
          offTrack: 0,
          index: pillars.length + accumulator.size,
        });
      }
      const pillar = accumulator.get(key);
      pillar.kpis.push(kpi);
      pillar.score = getScoreFromKpis(pillar.kpis);
      pillar.onTrack = pillar.kpis.filter((item) => item.status === 'on_track').length;
      pillar.atRisk = pillar.kpis.filter((item) => item.status === 'at_risk').length;
      pillar.offTrack = pillar.kpis.filter((item) => item.status === 'off_track').length;
      return accumulator;
    }, new Map())
    .forEach((value) => pillars.push(value));

  return pillars;
};

const exportKpis = (filename, kpis = []) => {
  downloadCsvFile(
    filename,
    [
      { key: 'title', label: 'KPI' },
      { key: 'category', label: 'Pillar' },
      { key: 'ownerName', label: 'Owner' },
      { key: 'targetValue', label: 'Target' },
      { key: 'currentValue', label: 'Current' },
      { key: 'progress', label: 'Progress %' },
      { key: 'statusLabel', label: 'Status' },
    ],
    kpis.map((item) => ({
      ...item,
      progress: getProgress(item).toFixed(1),
      statusLabel: getStatusMeta(item.status, getProgress(item)).label,
    })),
  );
};

function Badge({ children, className = 'bg-white/10 text-white/75' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}>
      {children}
    </span>
  );
}

function StatCard({ label, value, helper, action }) {
  return (
    <Card className="min-h-[116px] p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">{label}</p>
      <p className="mt-3 font-serif text-4xl font-semibold leading-none text-white">{value}</p>
      {helper ? <p className="mt-2 text-xs text-white/40">{helper}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </Card>
  );
}

function ProgressBar({ value, color = '#C9A84C' }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.max(0, Math.min(value, 100))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

function CircularGauge({ value }) {
  const score = Math.max(0, Math.min(Number(value || 0), 100));
  const fill = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';
  const label = score >= 75 ? 'On Track' : score >= 50 ? 'At Risk' : 'Needs Attention';

  return (
    <div className="relative h-52 w-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[
              { name: 'score', value: score },
              { name: 'rest', value: 100 - score },
            ]}
            dataKey="value"
            innerRadius={60}
            outerRadius={84}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={fill} />
            <Cell fill="rgba(255,255,255,0.08)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-5xl font-semibold text-white">{Math.round(score)}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/45">Overall Score</p>
        <p className="mt-2 text-sm font-medium text-white/75">{label}</p>
      </div>
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 4, placeholder = '' }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-white/75">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/28"
      />
    </label>
  );
}

function UserSelect({ value, onChange, users }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
    >
      <option value="">Select owner</option>
      {users.map((user) => (
        <option key={user.userId || user.id || user._id} value={user.userId || user.id || user._id}>
          {user.fullName || user.username}
        </option>
      ))}
    </select>
  );
}

function PlanBlueprintBuilder({ pillars, setPillars }) {
  const updatePillar = (pillarId, patch) => {
    setPillars((current) => current.map((pillar) => (pillar.id === pillarId ? { ...pillar, ...patch } : pillar)));
  };

  const removePillar = (pillarId) => {
    setPillars((current) => (current.length > 1 ? current.filter((pillar) => pillar.id !== pillarId) : current));
  };

  const addFocusArea = (pillarId) => {
    setPillars((current) =>
      current.map((pillar) =>
        pillar.id === pillarId
          ? { ...pillar, focusAreas: [...(pillar.focusAreas || []), createFocusArea()] }
          : pillar,
      ),
    );
  };

  const updateFocusArea = (pillarId, focusAreaId, patch) => {
    setPillars((current) =>
      current.map((pillar) =>
        pillar.id === pillarId
          ? {
              ...pillar,
              focusAreas: pillar.focusAreas.map((area) => (area.id === focusAreaId ? { ...area, ...patch } : area)),
            }
          : pillar,
      ),
    );
  };

  const removeFocusArea = (pillarId, focusAreaId) => {
    setPillars((current) =>
      current.map((pillar) =>
        pillar.id === pillarId && pillar.focusAreas.length > 1
          ? { ...pillar, focusAreas: pillar.focusAreas.filter((area) => area.id !== focusAreaId) }
          : pillar,
      ),
    );
  };

  const addObjective = (pillarId, focusAreaId) => {
    setPillars((current) =>
      current.map((pillar) =>
        pillar.id === pillarId
          ? {
              ...pillar,
              focusAreas: pillar.focusAreas.map((area) =>
                area.id === focusAreaId
                  ? { ...area, objectives: [...(area.objectives || []), createObjective()] }
                  : area,
              ),
            }
          : pillar,
      ),
    );
  };

  const updateObjective = (pillarId, focusAreaId, objectiveId, value) => {
    setPillars((current) =>
      current.map((pillar) =>
        pillar.id === pillarId
          ? {
              ...pillar,
              focusAreas: pillar.focusAreas.map((area) =>
                area.id === focusAreaId
                  ? {
                      ...area,
                      objectives: area.objectives.map((objective) =>
                        objective.id === objectiveId ? { ...objective, value } : objective,
                      ),
                    }
                  : area,
              ),
            }
          : pillar,
      ),
    );
  };

  const removeObjective = (pillarId, focusAreaId, objectiveId) => {
    setPillars((current) =>
      current.map((pillar) =>
        pillar.id === pillarId
          ? {
              ...pillar,
              focusAreas: pillar.focusAreas.map((area) =>
                area.id === focusAreaId && area.objectives.length > 1
                  ? { ...area, objectives: area.objectives.filter((objective) => objective.id !== objectiveId) }
                  : area,
              ),
            }
          : pillar,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Pillars</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Balanced scorecard structure</h3>
        </div>
        <Button variant="ghost" onClick={() => setPillars((current) => [...current, createPillar(current.length)])}>
          <Plus className="mr-2 h-4 w-4" />
          Add Pillar
        </Button>
      </div>

      {pillars.map((pillar, pillarIndex) => (
        <Card key={pillar.id} className="space-y-4 border-white/10 bg-[#101827]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: pillar.color }} />
              <p className="text-sm font-semibold text-white">Pillar {pillarIndex + 1}</p>
            </div>
            <Button variant="ghost" className="text-rose-200" onClick={() => removePillar(pillar.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Name"
              value={pillar.name}
              onChange={(event) => updatePillar(pillar.id, { name: event.target.value })}
              placeholder="Spiritual Growth"
            />
            <label className="block space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Color</span>
              <input
                type="color"
                value={pillar.color}
                onChange={(event) => updatePillar(pillar.id, { color: event.target.value })}
                className="h-11 w-full rounded-xl border border-white/10 bg-[#101827] px-2 py-1"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-[13px] font-medium text-white/75">Icon</span>
              <select
                value={pillar.icon}
                onChange={(event) => updatePillar(pillar.id, { icon: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
              >
                {iconOptions.map((icon) => (
                  <option key={icon} value={icon}>
                    {formatLabel(icon)}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Description"
              value={pillar.description}
              onChange={(event) => updatePillar(pillar.id, { description: event.target.value })}
              placeholder="Describe the pillar"
            />
          </div>

          <div className="space-y-4">
            {(pillar.focusAreas || []).map((area, areaIndex) => (
              <div key={area.id} className="rounded-2xl border border-white/10 bg-[#0D1320] p-4">
                <div className="flex items-center justify-between gap-3">
                  <Input
                    label={`Focus Area ${areaIndex + 1}`}
                    value={area.name}
                    onChange={(event) => updateFocusArea(pillar.id, area.id, { name: event.target.value })}
                    placeholder="Discipleship tracks"
                  />
                  <Button variant="ghost" className="mt-7 text-rose-200" onClick={() => removeFocusArea(pillar.id, area.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {area.objectives.map((objective, objectiveIndex) => (
                    <div key={objective.id} className="flex items-center gap-3">
                      <Input
                        label={`Objective ${objectiveIndex + 1}`}
                        value={objective.value}
                        onChange={(event) =>
                          updateObjective(pillar.id, area.id, objective.id, event.target.value)
                        }
                        placeholder="Launch quarterly leadership clinics"
                      />
                      <Button
                        variant="ghost"
                        className="mt-7 text-rose-200"
                        onClick={() => removeObjective(pillar.id, area.id, objective.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" onClick={() => addObjective(pillar.id, area.id)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Objective
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="ghost" onClick={() => addFocusArea(pillar.id)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Focus Area
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function KpiValueModal({ kpi, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: zodResolver(valueEntrySchema),
    defaultValues: {
      value: kpi?.currentValue || 0,
      period: '',
      notes: '',
    },
  });

  useEffect(() => {
    form.reset({
      value: kpi?.currentValue || 0,
      period: '',
      notes: '',
    });
  }, [form, kpi]);

  const mutation = useMutation({
    mutationFn: (payload) => recordKPIValue(kpi.kpiId, payload),
    onSuccess: () => {
      showSuccessToast('KPI value recorded.');
      queryClient.invalidateQueries({ queryKey: ['strategic-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-scorecard'] });
      onClose();
    },
    onError: (error) => showErrorToast(error.response?.data?.message || 'Unable to record KPI value.'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update ${kpi?.title || 'KPI'}`} size="md">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          mutation.mutate(values);
        })}
      >
        <Input label="Value" type="number" step="0.01" error={form.formState.errors.value?.message} {...form.register('value')} />
        <Input label="Period" placeholder="2026-Q2" error={form.formState.errors.period?.message} {...form.register('period')} />
        <TextareaField label="Notes" value={form.watch('notes')} onChange={(value) => form.setValue('notes', value)} rows={4} />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" disabled={mutation.isPending}>
            Save Value
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function StrategicDashboard() {
  const [valueModalKpi, setValueModalKpi] = useState(null);
  const planQuery = useQuery({
    queryKey: ['strategic-plan'],
    queryFn: getStrategicPlan,
  });
  const dashboardQuery = useQuery({
    queryKey: ['strategic-dashboard'],
    queryFn: getStrategicDashboard,
  });
  const kpisQuery = useQuery({
    queryKey: ['strategic-kpis'],
    queryFn: getAllKPIs,
  });
  const queryClient = useQueryClient();

  const plan = planQuery.data;
  const dashboard = dashboardQuery.data || {};
  const kpis = useMemo(
    () => (Array.isArray(kpisQuery.data) ? kpisQuery.data : kpisQuery.data?.kpis || kpisQuery.data?.items || emptyArray),
    [kpisQuery.data],
  );
  const pillars = useMemo(() => derivePillars(plan, kpis), [plan, kpis]);
  const overallScore = getScoreFromKpis(kpis);
  const offTrackKpis = kpis
    .filter((item) => item.status === 'off_track')
    .sort((left, right) => getProgress(left) - getProgress(right));

  const statusSummary = {
    onTrack: kpis.filter((item) => item.status === 'on_track' && getProgress(item) <= 100).length,
    atRisk: kpis.filter((item) => item.status === 'at_risk').length,
    offTrack: kpis.filter((item) => item.status === 'off_track').length,
    exceeded: kpis.filter((item) => getProgress(item) > 100).length,
  };

  const refreshMutation = useMutation({
    mutationFn: autoRefreshKPIs,
    onSuccess: () => {
      showSuccessToast('KPI refresh completed.');
      queryClient.invalidateQueries({ queryKey: ['strategic-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-scorecard'] });
    },
    onError: () => showErrorToast('Unable to refresh KPIs right now.'),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Strategic Planning"
          subtitle="Measure balanced scorecard momentum, review off-track priorities, and keep KPI execution visible to leadership."
          action={
            <div className="flex flex-wrap gap-3">
              <Link to="/strategic/plan">
                <Button variant="ghost">Open Plan</Button>
              </Link>
              <Link to="/strategic/scorecard">
                <Button variant="secondary">View Full Scorecard</Button>
              </Link>
            </div>
          }
        />

        {!plan ? (
          <EmptyState
            icon="SP"
            title="Your church has no strategic plan configured"
            message="Set up a strategic plan to start tracking pillars, scorecards, and KPI execution."
            actionLabel="Set Up Strategic Plan"
            onAction={() => {
              window.location.href = '/strategic/plan';
            }}
          />
        ) : (
          <>
            <Card className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Current Plan</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{plan.title}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Badge>{getPlanYears(plan)}</Badge>
                  <Badge className="bg-white/10 text-white/75">{formatLabel(plan.status || 'draft')}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Auto-Refresh KPIs
                </Button>
                <p className="text-xs text-white/45">
                  Last refresh {formatDate(refreshMutation.data?.refreshedAt || dashboard.updatedAt)}
                </p>
              </div>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <Card className="flex items-center justify-center">
                <CircularGauge value={overallScore} />
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard label="On Track" value={statusSummary.onTrack} />
                <StatCard label="At Risk" value={statusSummary.atRisk} />
                <StatCard label="Off Track" value={statusSummary.offTrack} />
                <StatCard label="Exceeded" value={statusSummary.exceeded} />
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              {pillars.map((pillar) => (
                <Card key={pillar.id} className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: pillar.color }} />
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{pillar.icon}</p>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-white">{pillar.name || 'Unassigned'}</h3>
                    </div>
                    <Badge className={getStatusMeta(pillar.score >= 75 ? 'on_track' : pillar.score >= 50 ? 'at_risk' : 'off_track').className}>
                      {pillar.score.toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-white/55">{pillar.description || 'Pillar alignment and KPI execution view.'}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{pillar.onTrack} on track</span>
                      <span>{pillar.atRisk} at risk</span>
                      <span>{pillar.offTrack} off track</span>
                    </div>
                    <ProgressBar value={pillar.score} color={pillar.color} />
                  </div>
                  <Link to="/strategic/scorecard">
                    <Button variant="ghost" className="w-full">
                      View Pillar
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-rose-200">Priority Alerts</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Off-track KPIs</h2>
                </div>
                <Link to="/strategic/kpis">
                  <Button variant="ghost">Open KPI Workspace</Button>
                </Link>
              </div>
              {offTrackKpis.length ? (
                <div className="space-y-3">
                  {offTrackKpis.slice(0, 6).map((kpi) => (
                    <div key={kpi.kpiId} className="flex flex-col gap-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-white/10 text-white/75">{kpi.category || 'Unassigned'}</Badge>
                          <p className="font-semibold text-white">{kpi.title}</p>
                        </div>
                        <p className="mt-2 text-sm text-white/65">
                          Current {Number(kpi.currentValue || 0).toLocaleString()} vs target {Number(kpi.targetValue || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setValueModalKpi(kpi)}>
                          Update Value
                        </Button>
                        <Link to="/strategic/kpis">
                          <Button variant="secondary">View KPI</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="OK"
                  title="No off-track KPIs"
                  message="The scorecard does not have any KPIs in the alert zone right now."
                />
              )}
            </Card>
          </>
        )}
      </div>
      {valueModalKpi ? <KpiValueModal kpi={valueModalKpi} isOpen={Boolean(valueModalKpi)} onClose={() => setValueModalKpi(null)} /> : null}
    </AppShell>
  );
}

export function StrategicPlanPage() {
  const planQuery = useQuery({
    queryKey: ['strategic-plan'],
    queryFn: getStrategicPlan,
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pillars, setPillars] = useState([createPillar(0)]);
  const [editMode, setEditMode] = useState(false);

  const form = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      title: '',
      visionStatement: '',
      missionStatement: '',
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 3,
    },
  });

  useEffect(() => {
    if (!planQuery.data) {
      return;
    }

    const plan = planQuery.data;
    const vision = String(plan.vision || '');
    const missionPrefix = '\n\nMission:\n';
    const [visionStatement, missionStatement] = vision.includes(missionPrefix)
      ? vision.split(missionPrefix)
      : [vision, ''];

    form.reset({
      title: plan.title || '',
      visionStatement: visionStatement || '',
      missionStatement: missionStatement || '',
      startYear: plan.periodStart ? new Date(plan.periodStart).getFullYear() : new Date().getFullYear(),
      endYear: plan.periodEnd ? new Date(plan.periodEnd).getFullYear() : new Date().getFullYear() + 3,
    });
    setPillars(parsePillarBlueprint(plan.focusAreas || []));
  }, [form, planQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async ({ values, activate }) => {
      const payload = {
        title: values.title,
        vision: `${values.visionStatement || ''}${values.missionStatement ? `\n\nMission:\n${values.missionStatement}` : ''}`.trim(),
        periodStart: `${values.startYear}-01-01`,
        periodEnd: `${values.endYear}-12-31`,
        status: activate ? 'active' : 'draft',
        focusAreas: buildPillarBlueprint(pillars),
      };

      if (planQuery.data?.planId) {
        const updated = await updateStrategicPlan(planQuery.data.planId, payload);
        if (activate && planQuery.data.status !== 'active') {
          await activatePlan(updated.planId || planQuery.data.planId);
        }
        return updated;
      }

      return createStrategicPlan(payload);
    },
    onSuccess: () => {
      showSuccessToast('Strategic plan saved.');
      queryClient.invalidateQueries({ queryKey: ['strategic-plan'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-scorecard'] });
      setEditMode(false);
      navigate('/strategic');
    },
    onError: (error) => showErrorToast(error.response?.data?.message || 'Unable to save strategic plan.'),
  });

  const plan = planQuery.data;
  const blueprint = useMemo(() => parsePillarBlueprint(plan?.focusAreas || []), [plan]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Strategic Plan Builder"
          subtitle="Design pillars, focus areas, and objectives for your strategic cycle, then activate the plan for KPI tracking."
          action={
            plan ? (
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setEditMode((current) => !current)}>
                  {editMode ? 'Cancel Edit' : 'Edit Plan'}
                </Button>
                <Link to="/strategic/kpis/new">
                  <Button variant="secondary">+ Create KPI</Button>
                </Link>
              </div>
            ) : null
          }
        />

        {!plan || editMode ? (
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit((values) => saveMutation.mutate({ values, activate: false }))}
          >
            <Card className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Title" error={form.formState.errors.title?.message} {...form.register('title')} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Start Year" type="number" error={form.formState.errors.startYear?.message} {...form.register('startYear')} />
                  <Input label="End Year" type="number" error={form.formState.errors.endYear?.message} {...form.register('endYear')} />
                </div>
              </div>
              <TextareaField
                label="Vision Statement"
                value={form.watch('visionStatement')}
                onChange={(value) => form.setValue('visionStatement', value)}
                rows={4}
              />
              <TextareaField
                label="Mission Statement"
                value={form.watch('missionStatement')}
                onChange={(value) => form.setValue('missionStatement', value)}
                rows={4}
              />
            </Card>

            <PlanBlueprintBuilder pillars={pillars} setPillars={setPillars} />

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="ghost"
                onClick={form.handleSubmit((values) => saveMutation.mutate({ values, activate: false }))}
                disabled={saveMutation.isPending}
              >
                Save as Draft
              </Button>
              <Button
                variant="secondary"
                onClick={form.handleSubmit((values) => saveMutation.mutate({ values, activate: true }))}
                disabled={saveMutation.isPending}
              >
                Save & Activate
              </Button>
            </div>
          </form>
        ) : (
          <>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Active Plan</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{plan.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Badge>{getPlanYears(plan)}</Badge>
                    <Badge className="bg-white/10 text-white/75">{formatLabel(plan.status || 'draft')}</Badge>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setEditMode(true)}>
                  Edit Sections
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-white/10 bg-[#101827]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Vision</p>
                  <p className="mt-3 text-sm leading-6 text-white/70">{String(plan.vision || '').split('\n\nMission:\n')[0] || 'Not provided'}</p>
                </Card>
                <Card className="border-white/10 bg-[#101827]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Mission</p>
                  <p className="mt-3 text-sm leading-6 text-white/70">{String(plan.vision || '').split('\n\nMission:\n')[1] || 'Not provided'}</p>
                </Card>
              </div>
            </Card>

            <div className="space-y-4">
              {blueprint.map((pillar) => (
                <Card key={pillar.id} className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: pillar.color }} />
                      <div>
                        <h3 className="text-xl font-semibold text-white">{pillar.name}</h3>
                        <p className="text-sm text-white/55">{pillar.description || 'Pillar definition recorded in this plan.'}</p>
                      </div>
                    </div>
                    <Link to="/strategic/kpis/new">
                      <Button variant="ghost">Add KPI to this Objective</Button>
                    </Link>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {pillar.focusAreas.map((area) => (
                      <div key={area.id} className="rounded-2xl border border-white/10 bg-[#101827] p-4">
                        <p className="text-sm font-semibold text-white">{area.name}</p>
                        <div className="mt-3 space-y-2">
                          {area.objectives.map((objective) => (
                            <div key={objective.id} className="rounded-xl border border-white/8 bg-[#0D1320] px-3 py-2 text-sm text-white/70">
                              {objective.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export function KPIsPage() {
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [dataSourceFilter, setDataSourceFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [valueModalKpi, setValueModalKpi] = useState(null);

  const planQuery = useQuery({
    queryKey: ['strategic-plan'],
    queryFn: getStrategicPlan,
  });
  const kpisQuery = useQuery({
    queryKey: ['strategic-kpis'],
    queryFn: getAllKPIs,
  });
  const queryClient = useQueryClient();

  const plan = planQuery.data;
  const kpis = useMemo(
    () => (Array.isArray(kpisQuery.data) ? kpisQuery.data : kpisQuery.data?.kpis || kpisQuery.data?.items || emptyArray),
    [kpisQuery.data],
  );
  const pillarOptions = useMemo(() => derivePillars(plan, kpis).map((pillar) => pillar.name), [plan, kpis]);
  const ownerOptions = [...new Set(kpis.map((item) => item.ownerName).filter(Boolean))];

  const filtered = kpis.filter((item) => {
    const matchesSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase()) || item.category?.toLowerCase().includes(search.toLowerCase());
    const matchesPillar = pillarFilter === 'all' || (item.category || 'Unassigned') === pillarFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesOwner = ownerFilter === 'all' || item.ownerName === ownerFilter;
    const matchesDataSource = dataSourceFilter === 'all' || (item.dataSource || 'manual') === dataSourceFilter;
    const matchesFrequency = frequencyFilter === 'all' || (item.frequency || 'monthly') === frequencyFilter;
    return matchesSearch && matchesPillar && matchesStatus && matchesOwner && matchesDataSource && matchesFrequency;
  });

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((kpi) => {
      const key = kpi.category || 'Unassigned';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(kpi);
    });
    return [...map.entries()];
  }, [filtered]);

  const deactivateMutation = useMutation({
    mutationFn: (kpiId) => deactivateKPI(kpiId),
    onSuccess: () => {
      showSuccessToast('KPI marked as off track.');
      queryClient.invalidateQueries({ queryKey: ['strategic-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-scorecard'] });
    },
    onError: () => showErrorToast('Unable to update KPI status.'),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Strategic KPIs"
          subtitle="Review KPI performance by pillar and record fresh values without leaving the scorecard workflow."
          action={
            <Link to="/strategic/kpis/new">
              <Button variant="secondary">+ Create KPI</Button>
            </Link>
          }
        />

        <Card className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search KPIs or pillars"
            />
            <select value={pillarFilter} onChange={(event) => setPillarFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none">
              <option value="all">All pillars</option>
              {pillarOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none">
              <option value="all">All status</option>
              <option value="on_track">On track</option>
              <option value="at_risk">At risk</option>
              <option value="off_track">Off track</option>
            </select>
            <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none">
              <option value="all">All owners</option>
              {ownerOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select value={dataSourceFilter} onChange={(event) => setDataSourceFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none">
              <option value="all">All sources</option>
              <option value="manual">Manual</option>
              <option value="auto_attendance">Auto Attendance</option>
              <option value="auto_finance">Auto Finance</option>
            </select>
            <select value={frequencyFilter} onChange={(event) => setFrequencyFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none">
              <option value="all">All frequency</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </Card>

        {grouped.length ? (
          <div className="space-y-5">
            {grouped.map(([pillarName, items]) => (
              <Card key={pillarName} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Pillar</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{pillarName}</h2>
                  </div>
                  <Button variant="ghost" onClick={() => exportKpis(`${pillarName.replaceAll(/\s+/g, '-').toLowerCase()}-kpis.csv`, items)}>
                    Export CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-white/75">
                    <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                      <tr>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Target</th>
                        <th className="pb-3">Current</th>
                        <th className="pb-3">Progress</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Owner</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((kpi) => {
                        const progress = getProgress(kpi);
                        const meta = getStatusMeta(kpi.status, progress);
                        return (
                          <tr key={kpi.kpiId} className="border-t border-white/8">
                            <td className="py-3 font-medium text-white">{kpi.title}</td>
                            <td>{Number(kpi.targetValue || 0).toLocaleString()}</td>
                            <td>{Number(kpi.currentValue || 0).toLocaleString()}</td>
                            <td className="min-w-[180px]">
                              <div className="space-y-2">
                                <ProgressBar value={Math.min(progress, 100)} color={meta.color} />
                                <p className="text-xs text-white/45">{progress.toFixed(1)}%</p>
                              </div>
                            </td>
                            <td>
                              <Badge className={meta.className}>{meta.label}</Badge>
                            </td>
                            <td>{kpi.ownerName || '—'}</td>
                            <td>
                              <div className="flex flex-wrap gap-2">
                                <Button variant="ghost" className="text-xs" onClick={() => setValueModalKpi(kpi)}>
                                  Update
                                </Button>
                                <Button variant="ghost" className="text-xs text-rose-200" onClick={() => deactivateMutation.mutate(kpi.kpiId)}>
                                  Mark Off Track
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="KPI"
            title="No KPIs match the current filters"
            message="Create a KPI or loosen one of the filters to review scorecard performance."
          />
        )}
      </div>
      {valueModalKpi ? <KpiValueModal kpi={valueModalKpi} isOpen={Boolean(valueModalKpi)} onClose={() => setValueModalKpi(null)} /> : null}
    </AppShell>
  );
}

export function CreateKPIPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const planQuery = useQuery({
    queryKey: ['strategic-plan'],
    queryFn: getStrategicPlan,
  });
  const usersQuery = useQuery({
    queryKey: ['strategic-users'],
    queryFn: () => getUsers({ page: 1, limit: 100 }),
  });

  const plan = planQuery.data;
  const blueprint = useMemo(() => parsePillarBlueprint(plan?.focusAreas || []), [plan]);
  const users = usersQuery.data?.users || usersQuery.data?.items || [];
  const form = useForm({
    resolver: zodResolver(kpiSchema),
    defaultValues: {
      name: '',
      description: '',
      pillar: blueprint[0]?.name || '',
      focusArea: blueprint[0]?.focusAreas?.[0]?.name || '',
      objective: blueprint[0]?.focusAreas?.[0]?.objectives?.[0]?.value || '',
      unit: 'number',
      annualTarget: 0,
      q1Target: 0,
      q2Target: 0,
      q3Target: 0,
      q4Target: 0,
      ownerId: '',
      ownerName: '',
      dataSource: 'manual',
      frequency: 'monthly',
      autoSplitTargets: true,
    },
  });

  const selectedPillarName = form.watch('pillar');
  const selectedFocusAreaName = form.watch('focusArea');
  const annualTarget = form.watch('annualTarget');
  const autoSplitTargets = form.watch('autoSplitTargets');
  const selectedPillar = blueprint.find((pillar) => pillar.name === selectedPillarName) || blueprint[0];
  const selectedFocusArea =
    selectedPillar?.focusAreas?.find((area) => area.name === selectedFocusAreaName) ||
    selectedPillar?.focusAreas?.[0];

  useEffect(() => {
    if (!selectedPillar) {
      return;
    }
    if (!selectedPillarName) {
      form.setValue('pillar', selectedPillar.name || '');
    }
    if (!selectedFocusAreaName) {
      form.setValue('focusArea', selectedPillar.focusAreas?.[0]?.name || '');
      form.setValue('objective', selectedPillar.focusAreas?.[0]?.objectives?.[0]?.value || '');
    }
  }, [form, selectedFocusAreaName, selectedPillar, selectedPillarName]);

  useEffect(() => {
    if (autoSplitTargets) {
      const annual = Number(annualTarget || 0);
      const split = annual ? annual / 4 : 0;
      form.setValue('q1Target', split);
      form.setValue('q2Target', split);
      form.setValue('q3Target', split);
      form.setValue('q4Target', split);
    }
  }, [annualTarget, autoSplitTargets, form]);

  const mutation = useMutation({
    mutationFn: async (values) => {
      const owner = users.find((item) => (item.userId || item.id || item._id) === values.ownerId);
      return createKPI({
        title: values.name,
        category: values.pillar,
        ownerId: values.ownerId || undefined,
        ownerName: owner?.fullName || owner?.username || values.ownerName || undefined,
        unit: values.unit,
        targetValue: Number(values.annualTarget || 0),
        currentValue: 0,
        status: 'on_track',
      });
    },
    onSuccess: () => {
      showSuccessToast('Strategic KPI created.');
      queryClient.invalidateQueries({ queryKey: ['strategic-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['strategic-scorecard'] });
      navigate('/strategic/kpis');
    },
    onError: (error) => showErrorToast(error.response?.data?.message || 'Unable to create KPI.'),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Create Strategic KPI"
          subtitle="Attach a measurable objective to your strategic pillar and set a target that leadership can track through the year."
        />

        {!plan ? (
          <EmptyState
            icon="SP"
            title="Set up a strategic plan first"
            message="KPI definitions rely on pillar structure from the active strategic plan."
            actionLabel="Open Plan Builder"
            onAction={() => navigate('/strategic/plan')}
          />
        ) : (
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit((values) => {
              mutation.mutate(values);
            })}
          >
            <Card className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Name" error={form.formState.errors.name?.message} {...form.register('name')} />
                <Input label="Description" error={form.formState.errors.description?.message} {...form.register('description')} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-1.5">
                  <span className="text-[13px] font-medium text-white/75">Pillar</span>
                  <select
                    value={form.watch('pillar')}
                    onChange={(event) => form.setValue('pillar', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    {blueprint.map((pillar) => (
                      <option key={pillar.id} value={pillar.name}>
                        {pillar.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[13px] font-medium text-white/75">Focus Area</span>
                  <select
                    value={form.watch('focusArea')}
                    onChange={(event) => form.setValue('focusArea', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    {(selectedPillar?.focusAreas || []).map((area) => (
                      <option key={area.id} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[13px] font-medium text-white/75">Objective</span>
                  <select
                    value={form.watch('objective')}
                    onChange={(event) => form.setValue('objective', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    {(selectedFocusArea?.objectives || []).map((objective) => (
                      <option key={objective.id} value={objective.value}>
                        {objective.value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <label className="block space-y-1.5">
                  <span className="text-[13px] font-medium text-white/75">Unit</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['number', 'percentage', 'currency', 'boolean'].map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => form.setValue('unit', unit)}
                        className={`rounded-xl border px-3 py-2 text-sm ${form.watch('unit') === unit ? 'border-accent bg-accent/10 text-accent' : 'border-white/10 bg-[#101827] text-white/75'}`}
                      >
                        {formatLabel(unit)}
                      </button>
                    ))}
                  </div>
                </label>
                <Input label="Annual Target" type="number" error={form.formState.errors.annualTarget?.message} {...form.register('annualTarget')} />
                <label className="block space-y-1.5">
                  <span className="text-[13px] font-medium text-white/75">Data Source</span>
                  <select
                    value={form.watch('dataSource')}
                    onChange={(event) => form.setValue('dataSource', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="manual">Manual</option>
                    <option value="auto_attendance">Auto Attendance</option>
                    <option value="auto_finance">Auto Finance</option>
                    <option value="auto_members">Auto Members</option>
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[13px] font-medium text-white/75">Frequency</span>
                  <select
                    value={form.watch('frequency')}
                    onChange={(event) => form.setValue('frequency', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#101827] px-3.5 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#101827] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Quarter Targets</p>
                    <p className="mt-1 text-xs text-white/45">Auto-split distributes annual target evenly across Q1-Q4.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => form.setValue('autoSplitTargets', !form.watch('autoSplitTargets'))}
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${form.watch('autoSplitTargets') ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/60'}`}
                  >
                    {form.watch('autoSplitTargets') ? 'Auto Split On' : 'Auto Split Off'}
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <Input label="Q1" type="number" {...form.register('q1Target')} />
                  <Input label="Q2" type="number" {...form.register('q2Target')} />
                  <Input label="Q3" type="number" {...form.register('q3Target')} />
                  <Input label="Q4" type="number" {...form.register('q4Target')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-[13px] font-medium text-white/75">Owner</span>
                  <UserSelect value={form.watch('ownerId')} onChange={(value) => form.setValue('ownerId', value)} users={users} />
                </label>
                <Card className="border-white/10 bg-[#101827]">
                  <p className="text-sm font-semibold text-white">Data source note</p>
                  <p className="mt-2 text-sm text-white/60">
                    Manual entry is fully supported today. Auto-connected sources can be configured progressively as backend integrations expand.
                  </p>
                </Card>
              </div>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => navigate('/strategic/kpis')}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={mutation.isPending}>
                Create KPI
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}

export function BalancedScorecardPage() {
  const [valueModalKpi, setValueModalKpi] = useState(null);
  const planQuery = useQuery({
    queryKey: ['strategic-plan'],
    queryFn: getStrategicPlan,
  });
  const scorecardQuery = useQuery({
    queryKey: ['strategic-scorecard'],
    queryFn: getBalancedScorecard,
  });

  const plan = planQuery.data;
  const scorecard = scorecardQuery.data || {};
  const kpis = useMemo(() => (Array.isArray(scorecard.kpis) ? scorecard.kpis : emptyArray), [scorecard.kpis]);
  const pillars = useMemo(() => derivePillars(plan, kpis), [plan, kpis]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Balanced Scorecard"
          subtitle="See every pillar, KPI, and progress trend in one consolidated scorecard view."
          action={
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => exportKpis('balanced-scorecard.csv', kpis)}>
                Export CSV
              </Button>
              <Button variant="secondary" onClick={() => downloadJsonFile('balanced-scorecard.json', scorecard)}>
                Export JSON
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Plans" value={scorecard.summary?.totalPlans || 0} />
          <StatCard label="Active Plans" value={scorecard.summary?.activePlans || 0} />
          <StatCard label="Total KPIs" value={scorecard.summary?.totalKpis || 0} />
          <StatCard label="Off Track" value={scorecard.summary?.offTrackKpis || 0} />
          <StatCard label="Blocked Initiatives" value={scorecard.summary?.blockedInitiatives || 0} />
        </div>

        {pillars.length ? (
          <div className="space-y-5">
            {pillars.map((pillar) => (
              <Card key={pillar.id} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: pillar.color }} />
                    <div>
                      <h2 className="text-2xl font-semibold text-white">{pillar.name || 'Unassigned'}</h2>
                      <p className="text-sm text-white/55">{pillar.description || 'Pillar execution overview.'}</p>
                    </div>
                  </div>
                  <div className="min-w-[240px] space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/45">
                      <span>Pillar Score</span>
                      <span>{pillar.score.toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={pillar.score} color={pillar.color} />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-white/75">
                    <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                      <tr>
                        <th className="pb-3">KPI</th>
                        <th className="pb-3">Target</th>
                        <th className="pb-3">Current</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Owner</th>
                        <th className="pb-3">Progress</th>
                        <th className="pb-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pillar.kpis.map((kpi) => {
                        const progress = getProgress(kpi);
                        const meta = getStatusMeta(kpi.status, progress);
                        return (
                          <tr key={kpi.kpiId} className="border-t border-white/8">
                            <td className="py-3 font-medium text-white">{kpi.title}</td>
                            <td>{Number(kpi.targetValue || 0).toLocaleString()}</td>
                            <td>{Number(kpi.currentValue || 0).toLocaleString()}</td>
                            <td>
                              <Badge className={meta.className}>{meta.label}</Badge>
                            </td>
                            <td>{kpi.ownerName || '—'}</td>
                            <td className="min-w-[180px]">
                              <div className="space-y-2">
                                <ProgressBar value={Math.min(progress, 100)} color={meta.color} />
                                <p className="text-xs text-white/45">{progress.toFixed(1)}%</p>
                              </div>
                            </td>
                            <td>
                              <Button variant="ghost" className="text-xs" onClick={() => setValueModalKpi(kpi)}>
                                Update Value
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="SC"
            title="Scorecard is empty"
            message="Create a plan and at least one KPI to populate the balanced scorecard."
          />
        )}
      </div>
      {valueModalKpi ? <KpiValueModal kpi={valueModalKpi} isOpen={Boolean(valueModalKpi)} onClose={() => setValueModalKpi(null)} /> : null}
    </AppShell>
  );
}

export function StrategicReportsPage() {
  const [tab, setTab] = useState('overview');
  const dashboardQuery = useQuery({
    queryKey: ['strategic-dashboard'],
    queryFn: getStrategicDashboard,
  });
  const reportQuery = useQuery({
    queryKey: ['strategic-report-scorecard'],
    queryFn: getScorecardReport,
  });
  const kpisQuery = useQuery({
    queryKey: ['strategic-kpis'],
    queryFn: getAllKPIs,
  });
  const planQuery = useQuery({
    queryKey: ['strategic-plan'],
    queryFn: getStrategicPlan,
  });

  const dashboard = dashboardQuery.data || {};
  const scorecard = reportQuery.data || {};
  const kpis = useMemo(
    () => (Array.isArray(kpisQuery.data) ? kpisQuery.data : kpisQuery.data?.kpis || kpisQuery.data?.items || emptyArray),
    [kpisQuery.data],
  );
  const plan = planQuery.data;
  const pillars = useMemo(() => derivePillars(plan, kpis), [plan, kpis]);

  const trendRows = kpis
    .map((item) => ({
      name: item.title,
      target: Number(item.targetValue || 0),
      current: Number(item.currentValue || 0),
    }))
    .slice(0, 8);

  const pillarRows = pillars.map((pillar) => ({
    name: pillar.name,
    score: Number(pillar.score.toFixed(1)),
    offTrack: pillar.offTrack,
  }));

  const dueRows = (dashboard.upcomingDeadlines || []).map((item) => ({
    name: item.title,
    dueDate: formatDate(item.dueDate),
    owner: item.ownerName || '—',
    status: formatLabel(item.status),
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Strategic Reports"
          subtitle="Export scorecard insight, compare pillar performance, and review current execution pressure points."
          action={
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => exportKpis('strategic-reports-kpis.csv', kpis)}>
                Export CSV
              </Button>
              <Button variant="secondary" onClick={() => downloadJsonFile('strategic-reports.json', { dashboard, scorecard, kpis })}>
                Export JSON
              </Button>
            </div>
          }
        />

        <div className="flex flex-wrap gap-3">
          {[
            ['overview', 'Overview'],
            ['quarterly', 'Quarterly'],
            ['annual', 'Annual'],
          ].map(([value, label]) => (
            <Button key={value} variant={tab === value ? 'secondary' : 'ghost'} onClick={() => setTab(value)}>
              {label}
            </Button>
          ))}
        </div>

        {tab === 'overview' ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total KPIs" value={scorecard.summary?.totalKpis || 0} />
              <StatCard label="Off Track KPIs" value={scorecard.summary?.offTrackKpis || 0} />
              <StatCard label="Initiatives" value={scorecard.summary?.totalInitiatives || 0} />
              <StatCard label="Active Plans" value={scorecard.summary?.activePlans || 0} />
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Performance</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Current vs target</h2>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendRows}>
                      <XAxis dataKey="name" stroke="#94A3B8" hide />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip />
                      <Bar dataKey="target" fill="#445A8B" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="current" fill="#C9A84C" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Pillar Mix</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Score distribution</h2>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pillarRows} dataKey="score" nameKey="name" innerRadius={60} outerRadius={90}>
                        {pillarRows.map((item, index) => (
                          <Cell key={item.name} fill={pillarPalette[index % pillarPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        ) : null}

        {tab === 'quarterly' ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Quarterly View</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Pillar score trend</h2>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pillarRows}>
                    <XAxis dataKey="name" stroke="#94A3B8" />
                    <YAxis stroke="#94A3B8" />
                    <Tooltip />
                    <Line dataKey="score" stroke="#C9A84C" strokeWidth={3} />
                    <Line dataKey="offTrack" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Upcoming Deadlines</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Execution queue</h2>
              </div>
              {dueRows.length ? (
                <div className="space-y-3">
                  {dueRows.map((item) => (
                    <div key={`${item.name}-${item.dueDate}`} className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-3">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-white/55">
                        Due {item.dueDate} • Owner {item.owner}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">{item.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="Q"
                  title="No deadlines loaded"
                  message="Initiative due dates will appear here as they are defined in the strategic workspace."
                />
              )}
            </Card>
          </div>
        ) : null}

        {tab === 'annual' ? (
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Annual Review</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Pillar performance table</h2>
              </div>
              <Button variant="ghost" onClick={() => downloadJsonFile('strategic-annual-review.json', pillarRows)}>
                Export Annual Snapshot
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-white/75">
                <thead className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                  <tr>
                    <th className="pb-3">Pillar</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">On Track</th>
                    <th className="pb-3">At Risk</th>
                    <th className="pb-3">Off Track</th>
                  </tr>
                </thead>
                <tbody>
                  {pillars.map((pillar) => (
                    <tr key={pillar.id} className="border-t border-white/8">
                      <td className="py-3 font-medium text-white">{pillar.name}</td>
                      <td>{pillar.score.toFixed(1)}%</td>
                      <td>{pillar.onTrack}</td>
                      <td>{pillar.atRisk}</td>
                      <td>{pillar.offTrack}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
