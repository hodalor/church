import { useMemo } from 'react';
import { buildGroupingLevels, buildGroupingPathLabels } from '../../utils/groupings';

export default function GroupingPathSelector({
  groupings = [],
  value = [],
  onChange,
  label = 'Flexible Groupings',
  hint = 'Select each level in order from the main parent down to the last child.',
  disabled = false,
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

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="mt-1 text-sm text-white/45">{hint}</p>
      </div>

      {levels.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {levels.map((level) => (
            <label key={`${level.parentId || 'root'}-${level.depth}`} className="block space-y-2">
              <span className="text-sm font-medium text-white/75">
                {level.depth === 0 ? 'Main Parent' : `Level ${level.depth + 1}`}
              </span>
              <select
                value={level.selectedId}
                disabled={disabled}
                onChange={(event) => handleLevelChange(level.depth, event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
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
        <p className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4 text-sm text-white/45">
          No grouping levels have been added in settings yet.
        </p>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.22em] text-white/50">Selected Path</p>
        <p className="mt-2 text-sm text-white/80">
          {selectedLabels.length ? selectedLabels.join(' > ') : 'No grouping selected yet.'}
        </p>
      </div>
    </div>
  );
}
