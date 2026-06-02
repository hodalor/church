import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  activateTenant,
  deleteTenant,
  getTenantById,
  suspendTenant,
  updateTenant,
} from '../../api/endpoints/tenants';
import SuperAdminShell from '../../components/layout/SuperAdminShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import { capabilitySections } from '../../constants/capabilities';

export default function TenantDetailPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [reason, setReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    churchName: '',
    email: '',
    phone: '',
    country: '',
    logoUrl: '',
    subscriptionPlan: 'small',
  });

  const tenantQuery = useQuery({
    queryKey: ['tenant-detail', tenantId],
    queryFn: () => getTenantById(tenantId),
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendTenant(tenantId, reason),
    onSuccess: () => {
      setShowSuspendModal(false);
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['tenant-detail', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => activateTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-detail', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateTenant(tenantId, payload),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['tenant-detail', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTenant(tenantId),
    onSuccess: () => {
      navigate('/superadmin/tenants');
    },
  });

  const tenant = tenantQuery.data;

  useEffect(() => {
    if (!tenant || isEditing) {
      return;
    }

    setForm({
      churchName: tenant.churchName || '',
      email: tenant.email || '',
      phone: tenant.phone || '',
      country: tenant.country || '',
      logoUrl: tenant.logoUrl || '',
      subscriptionPlan: tenant.subscriptionPlan || 'small',
    });
  }, [isEditing, tenant]);

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <PageHeader
          title={tenant?.churchName || 'Tenant Detail'}
          subtitle="Review church profile, status, and lifecycle controls."
          action={
            <Button variant={isEditing ? 'ghost' : 'secondary'} onClick={() => setIsEditing((current) => !current)}>
              {isEditing ? 'Cancel Edit' : 'Edit Tenant'}
            </Button>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white/5">
                {tenant?.logoUrl ? (
                  <img src={tenant.logoUrl} alt={tenant.churchName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold text-white/40">No Logo</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">{tenant?.churchName}</h2>
                <p className="mt-2 text-sm text-white/55">@{tenant?.tenantId}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Detail label="Plan" value={tenant?.subscriptionPlan} />
              <Detail label="Country" value={tenant?.country} />
              <Detail label="Phone" value={tenant?.phone} />
              <Detail label="Email" value={tenant?.email} />
              <Detail label="Created" value={tenant?.createdAt ? formatDate(tenant.createdAt) : '—'} />
            </div>

            {isEditing ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Church Name" value={form.churchName} onChange={(event) => setForm((current) => ({ ...current, churchName: event.target.value }))} />
                <Input label="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                <Input label="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
                <Input label="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
                <Input label="Logo URL" value={form.logoUrl} onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))} />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white/80">Subscription Plan</span>
                  <select
                    value={form.subscriptionPlan}
                    onChange={(event) => setForm((current) => ({ ...current, subscriptionPlan: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                  >
                    {['small', 'medium', 'mega'].map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <div className="md:col-span-2">
                  <Button variant="secondary" onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Tenant Changes'}
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/55">Status</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Tenant lifecycle</h3>
              </div>
              <StatusBadge status={tenant?.isSuspended ? 'Suspended' : 'Active'} />
            </div>

            <p className="text-sm text-white/60">
              {tenant?.isSuspended
                ? tenant.suspendedReason || 'This tenant is currently suspended.'
                : 'This church tenant is active and can access the platform.'}
            </p>

            {tenant?.isSuspended ? (
              <Button variant="secondary" onClick={() => activateMutation.mutate()}>
                Activate Tenant
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setShowSuspendModal(true)}>
                Suspend Tenant
              </Button>
            )}
          </Card>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {['Members', 'Attendance', 'Finance'].map((label) => (
            <Card key={label} className="min-h-[104px] p-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">{label}</p>
              <p className="mt-3 font-serif text-4xl font-semibold leading-none text-white">—</p>
            </Card>
          ))}
        </div>

        <Card className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/55">Capabilities</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Enabled tenant access</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {capabilitySections.map((section) => {
              const enabledCount = section.actions.filter((action) =>
                tenant?.capabilities?.includes(`${section.module}.${action.key}`),
              ).length;

              return (
                <div key={section.module} className="rounded-2xl border border-white/10 bg-[#101827] px-4 py-3.5">
                  <p className="text-sm font-semibold text-white">{section.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{enabledCount}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/45">
                    enabled actions
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border border-red-500/30 bg-red-500/10">
          <p className="text-sm uppercase tracking-[0.25em] text-red-500">Danger Zone</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Soft delete this tenant</h3>
          <p className="mt-3 text-sm text-white/70">
            This action sets the tenant inactive and removes platform access while preserving records.
          </p>
          <div className="mt-5">
            <Button variant="secondary" onClick={() => setShowDeleteModal(true)}>
              Soft Delete Tenant
            </Button>
          </div>
        </Card>

        <ConfirmModal
          isOpen={showSuspendModal}
          title="Suspend tenant"
          message="Provide a short reason before suspending this church tenant."
          onConfirm={() => suspendMutation.mutate()}
          onCancel={() => {
            setReason('');
            setShowSuspendModal(false);
          }}
          confirmLabel="Confirm Suspension"
        >
          <div>
            <Input label="Suspension Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
        </ConfirmModal>

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Soft delete tenant"
          message={`Type "${tenant?.churchName || ''}" to confirm the soft delete for this tenant.`}
          confirmText={tenant?.churchName || ''}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDeleteModal(false)}
          confirmLabel="Delete Tenant"
        />
      </div>
    </SuperAdminShell>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/55">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value || '—'}</p>
    </div>
  );
}
