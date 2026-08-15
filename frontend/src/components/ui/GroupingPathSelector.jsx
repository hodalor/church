import { useMemo } from 'react';
import { buildGroupingLevels, buildGroupingPathLabels } from '../../utils/groupings';

export default function GroupingPathSelector({
  groupings = [],
  value = [],
  onChange,
  label = 'Flexible Groupings',
  hint = 'Select each level in order from the main parent down to the last child.',
  disabled = false,
  variant = 'dark',
}) {
  const levels = useMemo(() => buildGroupingLevels(groupings, value), [groupings, value]);
  const selectedLabels = useMemo(() => buildGroupingPathLabels(groupings, value), [groupings, value]);

  const handleLevelChange = (levelIndex, selectedId) => {
    const nextPath = levels
      .slice(0, levelIndex)
      .map((level) => level.selectedId)
      .filter(Boolean);

    if (selectedId) {
      nextPath.push(selectedId);
    }

    onChange(nextPath);
  };

  const isLight = variant === 'light';
  const wrapper = isLight
    ? 'space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4'
    : 'space-y-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4';
  const labelText = isLight ? 'text-sm font-medium text-[#1E2A4A]' : 'text-sm font-medium text-white/80';
  const hintText = isLight ? 'mt-1 text-sm text-slate-500' : 'mt-1 text-sm text-white/45';
  const selectLabel = isLight
    ? 'text-sm font-medium text-slate-700'
    : 'text-sm font-medium text-white/75';
  const selectField = isLight
    ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1E2A4A] outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-60'
    : 'w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-60';
  const emptyBanner = isLight
    ? 'rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600'
    : 'rounded-2xl border border-white/10 bg-[#101827] px-4 py-4 text-sm text-white/85';
  const pathCard = isLight
    ? 'rounded-2xl border border-slate-200 bg-white px-4 py-4'
    : 'rounded-2xl border border-white/10 bg-[#101827] px-4 py-4';
  const pathTitle = isLight
    ? 'text-xs uppercase tracking-[0.22em] text-slate-500'
    : 'text-xs uppercase tracking-[0.22em] text-white/50';
  const pathText = isLight
    ? 'mt-2 text-sm text-slate-700'
    : 'mt-2 text-sm text-white/80';

  return (
    <div className={wrapper}>
      <div>
        <p className={labelText}>{label}</p>
        <p className={hintText}>{hint}</p>
      </div>

      {levels.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {levels.map((level) => (
            <label key={`${level.parentId || 'root'}-${level.depth}`} className="block space-y-2">
              <span className={selectLabel}>
                {level.depth === 0 ? 'Main Parent' : `Level ${level.depth + 1}`}
              </span>
              <select
                value={level.selectedId}
                disabled={disabled}
                onChange={(event) => handleLevelChange(level.depth, event.target.value)}
                className={selectField}
              >
                <option value="">
                  {level.depth === 0 ? 'Select main parent' : `Select level ${level.depth + 1}`}
                </option>
                {level.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : (
        <p className={emptyBanner}>No grouping levels have been added in settings yet.</p>
      )}

      <div className={pathCard}>
        <p className={pathTitle}>Selected Path</p>
        <p className={pathText}>
          {selectedLabels.length ? selectedLabels.join(' > ') : 'No grouping selected yet.'}
        </p>
      </div>
    </div>
  );
}
