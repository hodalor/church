import { useEffect, useMemo, useState } from 'react';
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
import { useBrandingStore } from '../../stores/brandingStore';
import { getDescendantGroupingIds, getGroupingTreeRows } from '../../utils/groupings';
import { supabaseUpload } from '../../utils/supabaseUpload';

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

function BrandPreview({ name, logoUrl, caption }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-[#0f1524] p-5 text-white">
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

  const addItem = () => {
    const nextValue = draft.trim();
    if (!nextValue) {
      return;
    }

    onChange([...new Set([...values, nextValue])]);
    setDraft('');
  };

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-[#101827] p-4">
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/50">{hint}</p>
      </div>
      <div className="flex gap-3">
        <Input
          label=""
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
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
          <p className="text-sm text-white/35">Nothing added yet.</p>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { role } = useAuth();
  const { hasCapability } = useCapabilities();
  const { churchName } = useTenant();
  const {
    globalBranding,
    tenantBranding,
    updateGlobalBranding,
    setTenantBranding,
  } =
    useBrandingStore();
  const isSuperAdmin = role === 'super_admin';
  const tabs = isSuperAdmin ? [...platformTabs, ...workspaceTabs] : workspaceTabs;
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'config' : 'branding');
  const [globalForm, setGlobalForm] = useState(globalBranding);
  const [brandingForm, setBrandingForm] = useState({
    appName: tenantBranding.appName || churchName || '',
    logoUrl: tenantBranding.logoUrl || '',
    tagline: tenantBranding.tagline || 'Tenant workspace',
  });
  const [contentForm, setContentForm] = useState({
    branches: [],
    departments: [],
    ministries: [],
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
      branches: content.branches || [],
      departments: content.departments || [],
      ministries: content.ministries || [],
      groupings: content.groupings || [],
    });
    setTenantBranding(nextBranding);
  }, [churchName, setTenantBranding, tenantQuery.data]);

  const updateTenantMutation = useMutation({
    mutationFn: ({ tenantId, payload }) =>
      isSuperAdmin ? updateTenant(tenantId, payload) : updateCurrentTenant(payload),
    onSuccess: (data) => {
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

    updateGlobalBranding(globalForm);
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

    const extension = file.name.split('.').pop();
    const path = `branding/${mode}-${Date.now()}.${extension}`;
    const url = await supabaseUpload(file, 'church-media', path);

    if (mode === 'global') {
      setGlobalForm((current) => ({ ...current, logoUrl: url }));
    } else {
      setBrandingForm((current) => ({ ...current, logoUrl: url }));
    }

    event.target.value = '';
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
      payload: { content: contentForm },
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
            <Card className="border-white/10 bg-[#111827] p-5 text-white shadow-2xl shadow-black/20">
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
                    className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
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

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white/60">
                  <span>{canEditConfig ? 'Changes apply to all workspaces.' : 'Read only in tenant mode.'}</span>
                  <Button variant={canEditConfig ? 'secondary' : 'subtle'} onClick={handleSaveGlobal} disabled={!canEditConfig}>
                    Save config
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border-white/10 bg-[#111827] p-5 text-white shadow-2xl shadow-black/20">
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
              </div>
            </Card>
          </div>
        ) : activeTab === 'branding' ? (
          <div className="space-y-5">
            {isSuperAdmin ? (
              <Card className="border-white/10 bg-[#111827] p-5 text-white shadow-2xl shadow-black/20">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Church Tenant</span>
                  <select
                    value={selectedTenantId}
                    onChange={(event) => setSelectedTenantId(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent"
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
            <Card className="border-white/10 bg-[#111827] p-5 text-white shadow-2xl shadow-black/20">
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
                    className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white"
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

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white/60">
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

            <Card className="border-white/10 bg-[#111827] p-5 text-white shadow-2xl shadow-black/20">
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
              <Card className="border-white/10 bg-[#111827] p-5 text-white shadow-2xl shadow-black/20">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Church Tenant</span>
                  <select
                    value={selectedTenantId}
                    onChange={(event) => setSelectedTenantId(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent"
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
            <Card className="border-white/10 bg-[#111827] p-5 text-white shadow-2xl shadow-black/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">
                    Workspace Content
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Branches, ministries, departments, and flexible groupings
                  </h2>
                  <p className="mt-2 text-sm text-white/50">
                    Church and branch stay universal. Everything else can be modeled as a
                    parent-child grouping tree to match how each church is organized.
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
                  {updateTenantMutation.isPending ? 'Saving...' : 'Save content'}
                </Button>
              </div>
            </Card>

            <div className="grid gap-5 xl:grid-cols-3">
              <ArrayEditor
                title="Branches"
                hint="Main church branches used across members, users, services, and reports."
                values={contentForm.branches}
                onChange={(branches) => setContentForm((current) => ({ ...current, branches }))}
                placeholder="Main Branch"
              />
              <ArrayEditor
                title="Departments"
                hint="Static ministry departments like choir, ushers, protocol, media."
                values={contentForm.departments}
                onChange={(departments) =>
                  setContentForm((current) => ({ ...current, departments }))
                }
                placeholder="Choir"
              />
              <ArrayEditor
                title="Ministries"
                hint="Major ministry areas that can change from church to church."
                values={contentForm.ministries}
                onChange={(ministries) => setContentForm((current) => ({ ...current, ministries }))}
                placeholder="Youth Ministry"
              />
            </div>

            <Card className="space-y-5 border-white/10 bg-[#111827] p-5 text-white shadow-2xl shadow-black/20">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-accent/80">
                  Grouping Tree
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">Flexible hierarchy</h2>
                <p className="mt-2 text-sm text-white/50">
                  Example: Church {'>'} Branch {'>'} Regional Zone {'>'} Zone {'>'} Cell or
                  Church {'>'} Branch {'>'} Zone.
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
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Parent Grouping</span>
                  <select
                    value={groupingDraft.parentId}
                    onChange={(event) =>
                      setGroupingDraft((current) => ({ ...current, parentId: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none focus:border-accent"
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
                />
                <div className="flex items-end">
                  <Button type="button" variant="secondary" className="w-full" onClick={addGroupingNode}>
                    Add grouping
                  </Button>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-white/80">Description</span>
                <textarea
                  value={groupingDraft.description}
                  onChange={(event) =>
                    setGroupingDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full rounded-2xl border border-white/10 bg-[#101827] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-accent"
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
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101827] px-4 py-3"
                      >
                        <div className="min-w-0" style={{ paddingLeft: `${grouping.depth * 18}px` }}>
                          <p className="font-semibold text-white">{grouping.name}</p>
                          <p className="text-sm text-white/50">
                            Parent: {parentName} | Type: {grouping.kind || 'group'}
                          </p>
                          <p className="mt-1 text-xs text-white/35">{grouping.lineage.join(' > ')}</p>
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
                  <p className="text-sm text-white/35">
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
