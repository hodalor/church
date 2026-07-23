import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderTree, Shield, Store } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import AppShell from '../../components/layout/AppShell';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import {
  getAllTenants,
  getCurrentTenant,
  getTenantById,
  updateTenant,
  updateCurrentTenant,
} from '../../api/endpoints/tenants';
import { useAuth } from '../../hooks/useAuth';
import { useCapabilities } from '../../hooks/useCapabilities';
import { useTenant } from '../../hooks/useTenant';
import { useTenantStore } from '../../stores/tenantStore';
import { useBrandingStore } from '../../stores/brandingStore';
import { getDescendantGroupingIds, getGroupingTreeRows } from '../../utils/groupings';
import { normalizeEligibleCountries } from '../../utils/platformConfig';
import { supabaseUpload } from '../../utils/supabaseUpload';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const platformTabs = [
  { id: 'config', label: 'Config', icon: Shield },
];

const workspaceTabs = [
  { id: 'branding', label: 'Client Branding', icon: Store },
  { id: 'content', label: 'Content', icon: FolderTree },
];

const emptyGroupingForm = {
  name: '',
  parentId: '',
  kind: 'group',
  description: '',
};

const emptyCountryDraft = {
  name: '',
  countryCode: '',
  currencyCode: '',
  currencySymbol: '',
};

const emptyPromotedApp = {
  id: '',
  title: '',
  description: '',
  href: '',
};

const shellPanelClass =
  'border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(8,13,24,0.98))] p-[18px] text-white shadow-[0_14px_30px_rgba(0,0,0,0.16)]';
const innerPanelClass =
  'rounded-[20px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(16,24,39,0.98))]';
const violetPanelClass =
  'rounded-[20px] border border-white/10 bg-[linear-gradient(135deg,rgba(167,139,250,0.12),rgba(16,24,39,0.98))]';
const inputClass =
  'w-full rounded-[16px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(16,24,39,0.98))] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35';
const contentShellPanelClass =
  'border-slate-200 bg-white p-[18px] text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.08)]';
const contentPanelClass = 'rounded-[20px] border border-slate-200 bg-slate-50';
const contentMutedPanelClass = 'rounded-[20px] border border-slate-200 bg-white';
const contentInputClass =
  'w-full rounded-[16px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-accent';

function BrandPreview({ name, logoUrl, caption }) {
  return (
    <div className={`flex items-center gap-4 p-4 text-white ${violetPanelClass}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-14 w-14 rounded-2xl object-cover" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-lg font-semibold text-accent">
          {(name || 'A').slice(0, 1).toUpperCase()}
        </div>
      )}
      <div>
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-sm text-white/55">{caption}</p>
      </div>
    </div>
  );
}

function ArrayEditor({ title, hint, values, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const lightInputProps = { labelClassName: 'text-slate-700' };

  const addItem = () => {
    const nextValue = draft.trim();
    if (!nextValue) {
      return;
    }

    onChange([...new Set([...values, nextValue])]);
    setDraft('');
  };

  return (
    <div className={`space-y-3 p-4 ${contentPanelClass}`}>
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{hint}</p>
      </div>
      <div className="flex gap-3">
        <Input
          label=""
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          {...lightInputProps}
        />
        <Button type="button" variant="secondary" className="self-end" onClick={addItem}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.length ? (
          values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-sm text-accent"
            >
              {value} x
            </button>
          ))
        ) : (
          <p className="text-sm text-slate-400">Nothing added yet.</p>
        )}
      </div>
    </div>
  );
}

function CountryConfigEditor({ countries, draft, onDraftChange, onAdd, onRemove }) {
  return (
    <div className={`space-y-4 p-4 ${innerPanelClass}`}>
      <div>
        <h3 className="text-base font-semibold text-white">Eligible Countries</h3>
        <p className="mt-1 text-sm text-white/50">
          These are the countries available when registering a church tenant. Each one carries the default currency used across finance screens for that tenant.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Country"
          value={draft.name}
          onChange={(event) => onDraftChange('name', event.target.value)}
          placeholder="Ghana"
        />
        <Input
          label="Country Code"
          value={draft.countryCode}
          onChange={(event) => onDraftChange('countryCode', event.target.value.toUpperCase())}
          placeholder="GH"
        />
        <Input
          label="Currency Code"
          value={draft.currencyCode}
          onChange={(event) => onDraftChange('currencyCode', event.target.value.toUpperCase())}
          placeholder="GHS"
        />
        <div className="flex gap-3">
          <Input
            label="Currency Symbol"
            value={draft.currencySymbol}
            onChange={(event) => onDraftChange('currencySymbol', event.target.value)}
            placeholder="GHs"
          />
          <Button type="button" variant="secondary" className="self-end" onClick={onAdd}>
            Add
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.24em] text-white/40">
            <tr>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {countries.map((country) => (
              <tr key={country.name}>
                <td className="px-4 py-3 text-white">{country.name}</td>
                <td className="px-4 py-3 text-white/70">{country.countryCode}</td>
                <td className="px-4 py-3 text-white/70">{country.currencyCode}</td>
                <td className="px-4 py-3 text-accent">{country.currencySymbol}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onRemove(country.name)}
                    className="text-sm font-semibold text-rose-300"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SourceOfTruthCard({ eyebrow, title, description, tags = [], to, actionLabel }) {
  return (
    <div className={`space-y-4 p-4 ${contentPanelClass}`}>
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent/80">{eyebrow}</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>
      {tags.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-accent"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {to ? (
        <Link to={to} className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/50 hover:text-slate-900">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function PromotedAppsEditor({ apps, onChange, disabled }) {
  const updateApp = (index, key, value) => {
    onChange(
      apps.map((app, appIndex) =>
        appIndex === index
          ? {
              ...app,
              [key]: value,
            }
          : app,
      ),
    );
  };

  const addApp = () => {
    onChange([
      ...apps,
      {
        ...emptyPromotedApp,
        id: `app-${Date.now()}`,
      },
    ]);
  };

  const removeApp = (index) => {
    onChange(apps.filter((_, appIndex) => appIndex !== index));
  };

  return (
    <div className={`space-y-4 p-4 ${innerPanelClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Promoted Apps</h3>
          <p className="mt-1 text-sm text-white/55">
            Add other products to advertise on the login screen. Clicking a card opens its link.
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={disabled} onClick={addApp}>
          Add app
        </Button>
      </div>

      {apps.length ? (
        <div className="space-y-4">
          {apps.map((app, index) => (
            <div key={app.id || index} className="space-y-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="App title"
                  value={app.title || ''}
                  disabled={disabled}
                  onChange={(event) => updateApp(index, 'title', event.target.value)}
                  placeholder="EduPrynova"
                />
                <Input
                  label="Link"
                  value={app.href || ''}
                  disabled={disabled}
                  onChange={(event) => updateApp(index, 'href', event.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/75">Description</span>
                <textarea
                  rows={3}
                  value={app.description || ''}
                  disabled={disabled}
                  onChange={(event) => updateApp(index, 'description', event.target.value)}
                  className={inputClass}
                  placeholder="Short message that explains the app."
                />
              </label>
              <div className="flex justify-end">
                <Button type="button" variant="ghost" disabled={disabled} onClick={() => removeApp(index)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-5 text-sm text-white/55">
          No promoted apps added yet.
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { role, tenantId } = useAuth();
  const { hasCapability } = useCapabilities();
  const { churchName } = useTenant();
  const setTenant = useTenantStore((state) => state.setTenant);
  const {
    globalBranding,
    tenantBranding,
    platformConfig,
    updateGlobalBranding,
    setTenantBranding,
    setPlatformConfig,
  } =
    useBrandingStore();
  const isSuperAdmin = role === 'super_admin';
  const tabs = isSuperAdmin ? [...platformTabs, ...workspaceTabs] : workspaceTabs;
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'config' : 'branding');
  const [globalForm, setGlobalForm] = useState(globalBranding);
  const [platformConfigForm, setPlatformConfigForm] = useState({
    eligibleCountries: normalizeEligibleCountries(platformConfig.eligibleCountries),
  });
  const [countryDraft, setCountryDraft] = useState(emptyCountryDraft);
  const [brandingForm, setBrandingForm] = useState({
    appName: tenantBranding.appName || churchName || '',
    logoUrl: tenantBranding.logoUrl || '',
    tagline: tenantBranding.tagline || 'Tenant workspace',
  });
  const [contentForm, setContentForm] = useState({
    departments: [],
    groupings: [],
  });
  const [groupingDraft, setGroupingDraft] = useState(emptyGroupingForm);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const Shell = isSuperAdmin ? SuperAdminShell : AppShell;
  const pageTitle = isSuperAdmin ? 'Platform Settings' : 'Workspace Settings';
  const canEditConfig = isSuperAdmin;
  const canViewSettings = isSuperAdmin || hasCapability('settings.view');
  const canEditTenantBranding = isSuperAdmin || hasCapability('settings.modify');
  const canEditWorkspaceContent = isSuperAdmin || hasCapability('settings.modify');

  const tenantsQuery = useQuery({
    queryKey: ['settings-tenant-options'],
    queryFn: () => getAllTenants({ page: 1, limit: 100 }),
    enabled: isSuperAdmin,
  });

  const targetTenantId = isSuperAdmin ? selectedTenantId : null;
  const tenantQuery = useQuery({
    queryKey: ['current-tenant-settings', targetTenantId],
    queryFn: () => (isSuperAdmin ? getTenantById(targetTenantId) : getCurrentTenant()),
    enabled: canViewSettings && (!isSuperAdmin || Boolean(targetTenantId)),
  });
  const platformConfigQuery = useQuery({
    queryKey: ['platform-config', tenantId],
    queryFn: () => getTenantById(tenantId),
    enabled: isSuperAdmin && Boolean(tenantId),
  });

  useEffect(() => {
    if (!tenantQuery.data) {
      return;
    }

    const branding = tenantQuery.data.branding || {};
    const content = tenantQuery.data.content || {};

    const nextBranding = {
      appName: branding.appName || tenantQuery.data.churchName || churchName || '',
      logoUrl: branding.logoUrl || '',
      tagline: branding.tagline || 'Tenant workspace',
    };

    setBrandingForm(nextBranding);
    setContentForm({
      departments: content.departments || [],
      groupings: content.groupings || [],
    });

    if (!isSuperAdmin) {
      setTenantBranding(nextBranding);
      setTenant({
        tenantId: tenantQuery.data.tenantId || tenantId,
        churchName: tenantQuery.data.churchName || churchName || '',
        country: tenantQuery.data.country || null,
        countryCode: tenantQuery.data.countryCode || null,
        currencyCode: tenantQuery.data.financial?.currencyCode || 'USD',
        currencySymbol: tenantQuery.data.financial?.currencySymbol || '$',
      });
    }
  }, [churchName, isSuperAdmin, setTenant, setTenantBranding, tenantId, tenantQuery.data]);

  useEffect(() => {
    if (!isSuperAdmin) {
      return;
    }

    const configSource = platformConfigQuery.data;
    if (!configSource) {
      return;
    }

    setGlobalForm({
      appName: configSource.branding?.appName || globalBranding.appName,
      logoUrl: configSource.branding?.logoUrl || globalBranding.logoUrl,
      tagline: configSource.branding?.tagline || globalBranding.tagline,
      heroTitle:
        configSource.branding?.heroTitle ||
        globalBranding.heroTitle ||
        'Secure church operations in one elegant workspace.',
      heroSubtitle:
        configSource.branding?.heroSubtitle ||
        globalBranding.heroSubtitle ||
        'Sign in to the master console or your church tenant dashboard.',
      backgroundImageUrl:
        configSource.branding?.backgroundImageUrl || globalBranding.backgroundImageUrl || '',
      promotedApps: Array.isArray(configSource.branding?.promotedApps)
        ? configSource.branding.promotedApps
        : Array.isArray(globalBranding.promotedApps)
          ? globalBranding.promotedApps
          : [],
    });
    setPlatformConfig({
      eligibleCountries: normalizeEligibleCountries(
        configSource.platformConfig?.eligibleCountries,
      ),
    });
    setPlatformConfigForm({
      eligibleCountries: normalizeEligibleCountries(
        configSource.platformConfig?.eligibleCountries,
      ),
    });
  }, [globalBranding.appName, globalBranding.backgroundImageUrl, globalBranding.heroSubtitle, globalBranding.heroTitle, globalBranding.logoUrl, globalBranding.promotedApps, globalBranding.tagline, isSuperAdmin, platformConfigQuery.data, setPlatformConfig]);

  const updateTenantMutation = useMutation({
    mutationFn: ({ tenantId, payload }) =>
      isSuperAdmin ? updateTenant(tenantId, payload) : updateCurrentTenant(payload),
    onSuccess: (data) => {
      if (data?.platformConfig) {
        setPlatformConfig({
          eligibleCountries: normalizeEligibleCountries(data.platformConfig.eligibleCountries),
        });
        setPlatformConfigForm({
          eligibleCountries: normalizeEligibleCountries(data.platformConfig.eligibleCountries),
        });
      }

      if (isSuperAdmin && data?.branding) {
        updateGlobalBranding({
          appName: data.branding.appName || data.churchName || '',
          logoUrl: data.branding.logoUrl || '',
          tagline: data.branding.tagline || 'Church OS',
          heroTitle: data.branding.heroTitle || 'Secure church operations in one elegant workspace.',
          heroSubtitle:
            data.branding.heroSubtitle || 'Sign in to the master console or your church tenant dashboard.',
          backgroundImageUrl: data.branding.backgroundImageUrl || '',
          promotedApps: Array.isArray(data.branding.promotedApps) ? data.branding.promotedApps : [],
        });
      }

      if (data?.branding) {
        const nextBranding = {
          appName: data.branding.appName || data.churchName || '',
          logoUrl: data.branding.logoUrl || '',
          tagline: data.branding.tagline || 'Tenant workspace',
        };

        if (!isSuperAdmin) {
          setTenantBranding(nextBranding);
        }

        setBrandingForm(nextBranding);
      }

      if (!isSuperAdmin) {
        setTenant({
          tenantId: data?.tenantId || tenantId,
          churchName: data?.churchName || churchName || '',
          country: data?.country || null,
          countryCode: data?.countryCode || null,
          currencyCode: data?.financial?.currencyCode || 'USD',
          currencySymbol: data?.financial?.currencySymbol || '$',
        });
      }
    },
  });

  const previewBrandName = useMemo(
    () => brandingForm.appName || churchName || 'Grace Assembly International',
    [brandingForm.appName, churchName],
  );
  const groupingTreeRows = useMemo(
    () => getGroupingTreeRows(contentForm.groupings),
    [contentForm.groupings],
  );

  const handleSaveGlobal = () => {
    if (!canEditConfig) {
      return;
    }

    if (isSuperAdmin) {
      updateTenantMutation.mutate({
        tenantId,
        payload: {
          branding: globalForm,
          platformConfig: platformConfigForm,
        },
      });
      return;
    }

    updateGlobalBranding(globalForm);
  };

  const updateCountryDraft = (key, value) => {
    setCountryDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const addEligibleCountry = () => {
    if (!countryDraft.name.trim()) {
      return;
    }

    const nextCountries = normalizeEligibleCountries([
      ...platformConfigForm.eligibleCountries,
      countryDraft,
    ]);

    setPlatformConfigForm({ eligibleCountries: nextCountries });
    setCountryDraft(emptyCountryDraft);
  };

  const removeEligibleCountry = (name) => {
    setPlatformConfigForm((current) => ({
      eligibleCountries: current.eligibleCountries.filter((item) => item.name !== name),
    }));
  };

  const handleSaveTenant = () => {
    if (!canEditTenantBranding) {
      return;
    }

    if (isSuperAdmin && !selectedTenantId) {
      return;
    }

    updateTenantMutation.mutate({
      tenantId: selectedTenantId,
      payload: { branding: brandingForm },
    });
  };

  const handleBrandUpload = async (event, mode) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const extension = file.name.split('.').pop();
      const path = `branding/${mode}-${Date.now()}.${extension}`;
      const url = await supabaseUpload(file, 'church-media', path);

      if (mode === 'global') {
        setGlobalForm((current) => ({ ...current, logoUrl: url }));
      } else if (mode === 'background') {
        setGlobalForm((current) => ({ ...current, backgroundImageUrl: url }));
      } else {
        setBrandingForm((current) => ({ ...current, logoUrl: url }));
      }

      showSuccessToast(
        mode === 'global'
          ? 'Global logo uploaded.'
          : mode === 'background'
            ? 'Login background uploaded.'
            : 'Tenant logo uploaded.',
      );
    } catch (error) {
      showErrorToast(error.message || 'Logo upload failed.');
    } finally {
      event.target.value = '';
    }
  };

  const handleSaveContent = () => {
    if (!canEditWorkspaceContent) {
      return;
    }

    if (isSuperAdmin && !selectedTenantId) {
      return;
    }

    updateTenantMutation.mutate({
      tenantId: selectedTenantId,
      payload: {
        content: {
          branches: tenantQuery.data?.content?.branches || [],
          ministries: tenantQuery.data?.content?.ministries || [],
          departments: contentForm.departments,
          groupings: contentForm.groupings,
        },
      },
    });
  };

  const addGroupingNode = () => {
    if (!groupingDraft.name.trim()) {
      return;
    }

    setContentForm((current) => ({
      ...current,
      groupings: [
        ...current.groupings,
        {
          id: `grp-${Date.now()}`,
          name: groupingDraft.name.trim(),
          parentId: groupingDraft.parentId || null,
          kind: groupingDraft.kind || 'group',
          description: groupingDraft.description.trim(),
        },
      ],
    }));
    setGroupingDraft(emptyGroupingForm);
  };

  if (!canViewSettings) {
    return (
      <Shell>
        <Card>
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Settings</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Access limited</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Your account does not have permission to open workspace settings.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <PageHeader title={pageTitle} />

        <div className="flex flex-wrap gap-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeTab === id
                  ? 'border-accent/40 bg-accent/15 text-accent'
                  : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'config' ? (
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={shellPanelClass}>
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">Universal Identity</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Global app branding</h2>
                  <p className="mt-2 text-sm text-white/50">
                    Only super admin can update the main app name and logo used across the platform.
                  </p>
                </div>

                <Input
                  label="App name"
                  value={globalForm.appName}
                  disabled={!canEditConfig}
                  onChange={(event) =>
                    setGlobalForm((current) => ({ ...current, appName: event.target.value }))
                  }
                />
                <Input
                  label="Logo URL"
                  value={globalForm.logoUrl}
                  disabled={!canEditConfig}
                  onChange={(event) =>
                    setGlobalForm((current) => ({ ...current, logoUrl: event.target.value }))
                  }
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/75">Upload Global Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!canEditConfig}
                    onChange={(event) => handleBrandUpload(event, 'global')}
                    className={inputClass}
                  />
                </label>
                <Input
                  label="Tagline"
                  value={globalForm.tagline}
                  disabled={!canEditConfig}
                  onChange={(event) =>
                    setGlobalForm((current) => ({ ...current, tagline: event.target.value }))
                  }
                />
                <Input
                  label="Login hero title"
                  value={globalForm.heroTitle || ''}
                  disabled={!canEditConfig}
                  onChange={(event) =>
                    setGlobalForm((current) => ({ ...current, heroTitle: event.target.value }))
                  }
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/75">Login hero subtitle</span>
                  <textarea
                    value={globalForm.heroSubtitle || ''}
                    disabled={!canEditConfig}
                    onChange={(event) =>
                      setGlobalForm((current) => ({ ...current, heroSubtitle: event.target.value }))
                    }
                    rows={3}
                    className={inputClass}
                    placeholder="Sign in to the master console or your church tenant dashboard."
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/75">Login background image</span>
                  <input
                    value={globalForm.backgroundImageUrl || 'No background uploaded yet.'}
                    readOnly
                    disabled
                    className={inputClass}
                  />
                  <p className="text-xs text-white/50">
                    Upload an image file below. The system saves the file and fills the background automatically.
                  </p>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/75">Upload Login Background</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!canEditConfig}
                    onChange={(event) => handleBrandUpload(event, 'background')}
                    className={inputClass}
                  />
                </label>
                {globalForm.backgroundImageUrl ? (
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={globalForm.backgroundImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-accent/35 hover:text-white"
                    >
                      Open uploaded background
                    </a>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        setGlobalForm((current) => ({
                          ...current,
                          backgroundImageUrl: '',
                        }))
                      }
                      disabled={!canEditConfig}
                    >
                      Remove background
                    </Button>
                  </div>
                ) : null}
                <PromotedAppsEditor
                  apps={globalForm.promotedApps || []}
                  disabled={!canEditConfig}
                  onChange={(nextApps) =>
                    setGlobalForm((current) => ({
                      ...current,
                      promotedApps: nextApps,
                    }))
                  }
                />

                <div className={`flex items-center justify-between px-4 py-3 text-sm text-white/60 ${innerPanelClass}`}>
                  <span>{canEditConfig ? 'Changes apply to all workspaces.' : 'Read only in tenant mode.'}</span>
                  <Button variant={canEditConfig ? 'secondary' : 'subtle'} onClick={handleSaveGlobal} disabled={!canEditConfig}>
                    Save config
                  </Button>
                </div>

                <CountryConfigEditor
                  countries={platformConfigForm.eligibleCountries}
                  draft={countryDraft}
                  onDraftChange={updateCountryDraft}
                  onAdd={addEligibleCountry}
                  onRemove={removeEligibleCountry}
                />
              </div>
            </Card>

            <Card className={shellPanelClass}>
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">Preview</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Universal brand</h2>
                </div>
                <BrandPreview
                  name={globalForm.appName || 'Ecclesia'}
                  logoUrl={globalForm.logoUrl}
                  caption={globalForm.tagline || 'Church OS'}
                />
                <div className={`space-y-4 overflow-hidden p-4 ${violetPanelClass}`}>
                  <div
                    className="min-h-[180px] rounded-[18px] border border-white/10 bg-cover bg-center"
                    style={{
                      backgroundImage: globalForm.backgroundImageUrl
                        ? `linear-gradient(135deg, rgba(6, 10, 22, 0.84), rgba(8, 16, 36, 0.72)), url(${globalForm.backgroundImageUrl})`
                        : 'linear-gradient(135deg, rgba(6, 10, 22, 0.98), rgba(16, 28, 56, 0.92))',
                    }}
                  >
                    <div className="flex h-full flex-col justify-end p-5">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-accent/85">Auth Preview</p>
                      <h3 className="mt-3 text-2xl font-semibold text-white">
                        {globalForm.heroTitle || 'Secure church operations in one elegant workspace.'}
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-white/72">
                        {globalForm.heroSubtitle || 'Sign in to the master console or your church tenant dashboard.'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Promoted Apps</p>
                    {(globalForm.promotedApps || []).length ? (
                      <div className="space-y-2">
                        {(globalForm.promotedApps || []).slice(0, 3).map((app) => (
                          <div key={app.id || app.href} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                            <p className="font-semibold text-white">{app.title}</p>
                            <p className="mt-1 text-sm text-white/60">{app.description || app.href}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/55">No promoted apps yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : activeTab === 'branding' ? (
          <div className="space-y-5">
            {isSuperAdmin ? (
              <Card className={shellPanelClass}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Church Tenant</span>
                  <select
                    value={selectedTenantId}
                    onChange={(event) => setSelectedTenantId(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a church tenant</option>
                    {(tenantsQuery.data?.tenants || []).map((tenant) => (
                      <option key={tenant.tenantId} value={tenant.tenantId}>
                        {tenant.churchName} ({tenant.tenantId})
                      </option>
                    ))}
                  </select>
                </label>
              </Card>
            ) : null}
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className={shellPanelClass}>
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">Tenant Identity</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Client app branding</h2>
                  <p className="mt-2 text-sm text-white/50">
                    This branding is what shows inside the client workspace and top bar. Super admin can also manage it.
                  </p>
                </div>

                <Input
                  label="Client app name"
                  value={brandingForm.appName}
                  disabled={!canEditTenantBranding}
                  onChange={(event) =>
                    setBrandingForm((current) => ({ ...current, appName: event.target.value }))
                  }
                />
                <Input
                  label="Client logo URL"
                  value={brandingForm.logoUrl}
                  disabled={!canEditTenantBranding}
                  onChange={(event) =>
                    setBrandingForm((current) => ({ ...current, logoUrl: event.target.value }))
                  }
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/75">Upload Client Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!canEditTenantBranding}
                    onChange={(event) => handleBrandUpload(event, 'tenant')}
                    className={inputClass}
                  />
                </label>
                <Input
                  label="Top bar subtitle"
                  value={brandingForm.tagline}
                  disabled={!canEditTenantBranding}
                  onChange={(event) =>
                    setBrandingForm((current) => ({ ...current, tagline: event.target.value }))
                  }
                />

                <div className={`flex items-center justify-between px-4 py-3 text-sm text-white/60 ${innerPanelClass}`}>
                  <span>
                    {isSuperAdmin && !selectedTenantId
                      ? 'Select a church tenant to manage client branding.'
                      : canEditTenantBranding
                      ? 'These changes only affect this tenant workspace.'
                      : 'Tenant branding is read only in this workspace.'}
                  </span>
                  <Button
                    variant={canEditTenantBranding ? 'secondary' : 'subtle'}
                    onClick={handleSaveTenant}
                    disabled={
                      !canEditTenantBranding ||
                      updateTenantMutation.isPending ||
                      (isSuperAdmin && !selectedTenantId)
                    }
                  >
                    {updateTenantMutation.isPending ? 'Saving...' : 'Save branding'}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className={shellPanelClass}>
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">Preview</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Tenant top bar brand</h2>
                </div>
                <BrandPreview
                  name={previewBrandName}
                  logoUrl={brandingForm.logoUrl}
                  caption={brandingForm.tagline || 'Tenant workspace'}
                />
              </div>
            </Card>
          </div>
          </div>
        ) : (
          <div className="space-y-5">
            {isSuperAdmin ? (
              <Card className={contentShellPanelClass}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Church Tenant</span>
                  <select
                    value={selectedTenantId}
                    onChange={(event) => setSelectedTenantId(event.target.value)}
                    className={contentInputClass}
                  >
                    <option value="">Select a church tenant</option>
                    {(tenantsQuery.data?.tenants || []).map((tenant) => (
                      <option key={tenant.tenantId} value={tenant.tenantId}>
                        {tenant.churchName} ({tenant.tenantId})
                      </option>
                    ))}
                  </select>
                </label>
              </Card>
            ) : null}
            <Card className={contentShellPanelClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">
                    Master Data
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Keep one source of truth for church structure
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Branches, ministries, and CBS groups are now created from their live workspaces.
                    This page is for tenant branding support data, departments, and grouping hierarchy.
                  </p>
                </div>
                <Button
                  variant={canEditWorkspaceContent ? 'secondary' : 'subtle'}
                  disabled={
                    !canEditWorkspaceContent ||
                    updateTenantMutation.isPending ||
                    (isSuperAdmin && !selectedTenantId)
                  }
                  onClick={handleSaveContent}
                >
                  {updateTenantMutation.isPending ? 'Saving...' : 'Save master data'}
                </Button>
              </div>
            </Card>

            <div className="grid items-start gap-5 xl:grid-cols-2">
              <SourceOfTruthCard
                eyebrow="Operational Setup"
                title="Where to create real records"
                description="Use the live workspaces below so staff do not create the same thing twice in Settings and again in the operational modules."
                tags={[
                  'Branches -> HQ > Branches',
                  'Ministries -> Ministry workspace',
                  'CBS Groups -> CBS Groups workspace',
                  'Departments + Groupings -> Maintain here',
                ]}
              />
              <SourceOfTruthCard
                eyebrow="Settings Scope"
                title="Only keep support structure here"
                description="Settings now maintains only departments and grouping hierarchy. Branches, ministries, and CBS records live in their own menus so the data stays unified everywhere."
                tags={[
                  `${contentForm.departments.length} departments`,
                  `${contentForm.groupings.length} grouping levels`,
                ]}
              />
            </div>

            <div className="grid items-start gap-5 xl:grid-cols-2">
              <ArrayEditor
                title="Departments"
                hint="Use departments for volunteer teams and service departments such as choir, ushers, protocol, media, or hospitality."
                values={contentForm.departments}
                onChange={(departments) =>
                  setContentForm((current) => ({ ...current, departments }))
                }
                placeholder="Choir"
              />
              <SourceOfTruthCard
                eyebrow="CBS Groups"
                title="Manage Bible study groups in CBS"
                description="CBS groups, prospects, sessions, and pipeline stages belong in the CBS workspace. They are operational discipleship records, not Settings content."
                to="/cbs/groups"
                actionLabel="Open CBS Groups"
              />
            </div>

            <Card className={`space-y-5 ${contentShellPanelClass}`}>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">
                  Grouping Tree
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Flexible hierarchy</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Use this for the structure under a branch, such as Region, Zone, District,
                  Cell, Cluster, Sector, or any custom discipleship hierarchy.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  label="Grouping Name"
                  value={groupingDraft.name}
                  onChange={(event) =>
                    setGroupingDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Regional Zone"
                  labelClassName="text-slate-700"
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Parent Grouping</span>
                  <select
                    value={groupingDraft.parentId}
                    onChange={(event) =>
                      setGroupingDraft((current) => ({ ...current, parentId: event.target.value }))
                    }
                    className={contentInputClass}
                  >
                    <option value="">Top level after branch</option>
                    {groupingTreeRows.map((grouping) => (
                      <option key={grouping.id} value={grouping.id}>
                        {`${'-- '.repeat(grouping.depth)}${grouping.name}`}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  label="Type"
                  value={groupingDraft.kind}
                  onChange={(event) =>
                    setGroupingDraft((current) => ({ ...current, kind: event.target.value }))
                  }
                  placeholder="zone"
                  labelClassName="text-slate-700"
                />
                <div className="flex items-end">
                  <Button type="button" variant="secondary" className="w-full" onClick={addGroupingNode}>
                    Add grouping
                  </Button>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={groupingDraft.description}
                  onChange={(event) =>
                    setGroupingDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={2}
                  className={contentInputClass}
                  placeholder="Optional note for this grouping level"
                />
              </label>

              <div className="space-y-3">
                {groupingTreeRows.length ? (
                  groupingTreeRows.map((grouping) => {
                    const parentName = groupingTreeRows.find((item) => item.id === grouping.parentId)?.name || 'Branch';

                    return (
                      <div
                        key={grouping.id}
                        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${contentMutedPanelClass}`}
                      >
                        <div className="min-w-0" style={{ paddingLeft: `${grouping.depth * 18}px` }}>
                          <p className="font-semibold text-slate-900">{grouping.name}</p>
                          <p className="text-sm text-slate-600">
                            Parent: {parentName} | Type: {grouping.kind || 'group'}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{grouping.lineage.join(' > ')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone="primary">{grouping.kind || 'group'}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              const descendantIds = getDescendantGroupingIds(contentForm.groupings, grouping.id);
                              const blockedIds = new Set([grouping.id, ...descendantIds]);

                              setContentForm((current) => ({
                                ...current,
                                groupings: current.groupings.filter((item) => !blockedIds.has(item.id)),
                              }));
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-400">
                    No grouping levels added yet. Add your first grouping after branch.
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Shell>
  );
}
