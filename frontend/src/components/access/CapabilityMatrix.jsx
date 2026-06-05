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
  const allKnownCapabilities = capabilitySections.flatMap((section) => [
    ...(section.actions || []).map(({ key }) => `${section.module}.${key}`),
    ...((section.groups || []).flatMap((group) =>
      (group.actions || []).map(({ key }) => `${section.module}.${group.key}.${key}`),
    )),
  ]);
  const allowed = new Set(normalizeCapabilities(allowedCapabilities, allKnownCapabilities));

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

  const renderCapabilityToggle = (capability, label, description) => {
    const isAllowed = allowed.has(capability);
    const isChecked = selectedCapabilities.includes(capability);

    return (
      <label
        key={capability}
        className={`flex items-start gap-3 rounded-xl px-2 py-2 text-sm ${
          isAllowed ? 'text-white' : 'cursor-not-allowed text-white/30'
        }`}
      >
        <input
          type="checkbox"
          checked={isChecked}
          disabled={disabled || !isAllowed}
          onChange={() => toggleCapability(capability)}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-accent focus:ring-accent"
        />
        <div className="min-w-0">
          <p className="font-medium">{label}</p>
          {description ? <p className="mt-0.5 text-xs leading-5 text-white/45">{description}</p> : null}
        </div>
      </label>
    );
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
        {capabilitySections.map((section) => {
          const topLevelCapabilities = (section.actions || []).map(
            ({ key }) => `${section.module}.${key}`,
          );
          const groupedCapabilities = (section.groups || []).flatMap((group) =>
            (group.actions || []).map(({ key }) => `${section.module}.${group.key}.${key}`),
          );
          const sectionCapabilities = [...topLevelCapabilities, ...groupedCapabilities];
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

              {section.actions?.length ? (
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                    Workspace Access
                  </p>
                  <div className="mt-2 grid gap-x-6 gap-y-1.5 md:grid-cols-2">
                    {section.actions.map((action) =>
                      renderCapabilityToggle(
                        `${section.module}.${action.key}`,
                        action.label,
                        null,
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              {section.groups?.length ? (
                <div className="mt-4 space-y-3">
                  {section.groups.map((group) => {
                    const groupCapabilities = (group.actions || []).map(
                      ({ key }) => `${section.module}.${group.key}.${key}`,
                    );
                    const enabledGroupCount = groupCapabilities.filter((capability) =>
                      selectedCapabilities.includes(capability),
                    ).length;

                    return (
                      <div
                        key={`${section.module}.${group.key}`}
                        className="rounded-2xl border border-white/8 bg-[#0f1726] px-4 py-3"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{group.label}</p>
                            <p className="mt-0.5 text-xs leading-5 text-white/45">
                              {group.description}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => setSection(groupCapabilities, true)}
                              disabled={disabled}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Enable All
                            </button>
                            <button
                              type="button"
                              onClick={() => setSection(groupCapabilities, false)}
                              disabled={disabled}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/70 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-x-6 gap-y-1.5 md:grid-cols-2">
                          {(group.actions || []).map((action) =>
                            renderCapabilityToggle(
                              `${section.module}.${group.key}.${action.key}`,
                              action.label,
                              null,
                            ),
                          )}
                        </div>

                        <p className="mt-3 text-[11px] text-white/35">
                          {enabledGroupCount} actions enabled in this submenu.
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <p className="mt-3 text-[11px] text-white/35">{enabledCount} actions enabled in this module.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
