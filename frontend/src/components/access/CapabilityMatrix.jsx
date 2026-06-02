import { capabilitySections, normalizeCapabilities } from '../../constants/capabilities';

export default function CapabilityMatrix({
  title,
  description,
  value,
  onChange,
  allowedCapabilities,
  disabled = false,
}) {
  const selectedCapabilities = normalizeCapabilities(value);
  const allowed = new Set(
    normalizeCapabilities(
      allowedCapabilities,
      capabilitySections.flatMap(({ module, actions }) =>
        actions.map(({ key }) => `${module}.${key}`),
      ),
    ),
  );
  const visibleSections = capabilitySections.filter(
    (section, index, sections) => sections.findIndex((item) => item.module === section.module) === index,
  );

  const toggleCapability = (capability) => {
    if (disabled || !allowed.has(capability)) {
      return;
    }

    if (selectedCapabilities.includes(capability)) {
      onChange(selectedCapabilities.filter((item) => item !== capability));
      return;
    }

    onChange([...selectedCapabilities, capability]);
  };

  const setSection = (sectionCapabilities, shouldEnable) => {
    if (disabled) {
      return;
    }

    const filteredSection = sectionCapabilities.filter((capability) => allowed.has(capability));
    const nextSelection = shouldEnable
      ? [...new Set([...selectedCapabilities, ...filteredSection])]
      : selectedCapabilities.filter((capability) => !filteredSection.includes(capability));

    onChange(nextSelection);
  };

  return (
    <div className="space-y-4 rounded-[24px] border border-white/10 bg-[#101827] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent/90">Feature Access</p>
          <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
          {description ? <p className="mt-1 text-sm text-white/55">{description}</p> : null}
        </div>
        <div className="rounded-full border border-white/10 bg-[#0b1120] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
          {selectedCapabilities.length} enabled
        </div>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {visibleSections.map((section) => {
          const sectionCapabilities = section.actions.map(
            ({ key }) => `${section.module}.${key}`,
          );
          const enabledCount = sectionCapabilities.filter((capability) =>
            selectedCapabilities.includes(capability),
          ).length;

          return (
            <div key={section.module} className="rounded-[20px] border border-white/8 bg-[#0b1120] px-4 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{section.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-white/45">{section.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setSection(sectionCapabilities, true)}
                    disabled={disabled}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection(sectionCapabilities, false)}
                    disabled={disabled}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-x-6 gap-y-1.5 md:grid-cols-2">
                {section.actions.map((action) => {
                  const capability = `${section.module}.${action.key}`;
                  const isAllowed = allowed.has(capability);
                  const isChecked = selectedCapabilities.includes(capability);

                  return (
                    <label
                      key={capability}
                      className={`flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm ${
                        isAllowed
                          ? 'text-white'
                          : 'cursor-not-allowed text-white/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={disabled || !isAllowed}
                        onChange={() => toggleCapability(capability)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-accent focus:ring-accent"
                      />
                      <p className="min-w-0 font-medium">{action.label}</p>
                    </label>
                  );
                })}
              </div>

              <p className="mt-3 text-[11px] text-white/35">{enabledCount} actions enabled in this module.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
